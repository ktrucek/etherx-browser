/**
 * EtherX Browser — AI Manager
 * Copyright © 2024–2026 kriptoentuzijasti.io. All Rights Reserved.
 * PROPRIETARY AND CONFIDENTIAL — See LICENSE file.
 *
 * Provides:
 *  1. Smart Search Bar (AI answers in Omnibox) — via WebLLM (renderer-side)
 *  2. AI Tab Auto-Grouping — clusters tabs by topic
 *  3. AI Reading Mode — extracts clean content from HTML
 *  4. Phishing Detection — URL + content analysis heuristics + AI
 *  5. Translation — via local AI or public API
 *
 * WebLLM runs IN THE RENDERER via Web Worker (GPU-accelerated WASM/WebGPU).
 * This main-process module handles CPU-side tasks and fallback logic.
 */

'use strict';

const { net } = require('electron');
const { URL } = require('url');

// Known phishing indicators
const PHISHING_PATTERNS = [
  /payp[a4]l/i, /[a4]m[a4]z[o0]n/i, /g[o0]{2}gle/i, /micros[o0]ft/i,
  /[a4]pple\..*\.(?!com$)/i, /bank.*login/i, /secure.*login/i,
  /verify.*account/i, /confirm.*identity/i, /update.*payment/i,
  /suspended.*account/i, /unusual.*activity/i,
];

const SUSPICIOUS_TLDS = ['.xyz', '.top', '.tk', '.ml', '.ga', '.cf', '.gq', '.buzz', '.click'];

const TRUSTED_DOMAINS = new Set([
  'google.com', 'youtube.com', 'facebook.com', 'amazon.com', 'wikipedia.org',
  'github.com', 'microsoft.com', 'apple.com', 'netflix.com', 'twitter.com',
  'instagram.com', 'linkedin.com', 'reddit.com', 'medium.com', 'stackoverflow.com',
]);

class AIManager {
  constructor() {
    this.webllmReady = false;
  }

  // ─── Smart Search ───────────────────────────────────────────────────────────

  /**
   * Determine if input is a URL or a natural language query.
   * Returns suggestions + query type.
   */
  async smartSearch(input) {
    const trimmed = input.trim();

    // URL detection
    if (this._isUrl(trimmed)) {
      const url = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
      return { type: 'url', url, query: null };
    }

    // Crypto address detection
    if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
      return { type: 'crypto', url: `https://etherscan.io/address/${trimmed}`, query: null };
    }

    // Question → suggest search engines + AI answer prompt
    const suggestions = [
      { type: 'search', engine: 'Google', url: `https://www.google.com/search?q=${encodeURIComponent(trimmed)}` },
      { type: 'search', engine: 'DuckDuckGo', url: `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}` },
      { type: 'search', engine: 'Brave', url: `https://search.brave.com/search?q=${encodeURIComponent(trimmed)}` },
      { type: 'ai', label: 'Ask AI (WebLLM)', prompt: trimmed },
    ];

    return { type: 'query', query: trimmed, suggestions };
  }

  _isUrl(s) {
    if (/^https?:\/\//i.test(s)) return true;
    if (/^localhost(:\d+)?/.test(s)) return true;
    if (/^(\d{1,3}\.){3}\d{1,3}(:\d+)?/.test(s)) return true;
    // domain-like: has dot, no spaces
    if (!s.includes(' ') && s.includes('.') && s.split('.').pop().length >= 2) return true;
    return false;
  }

  // ─── Phishing Detection ─────────────────────────────────────────────────────

  /**
   * Analyze URL and page content for phishing indicators.
   * Returns risk score 0-100 and reasons.
   */
  async checkPhishing(url, pageContent = '') {
    const result = { url, score: 0, reasons: [], isSafe: true };

    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();
      const fullUrl = url.toLowerCase();

      // 1. Check if domain is well-known trusted
      const baseDomain = hostname.split('.').slice(-2).join('.');
      if (TRUSTED_DOMAINS.has(baseDomain)) {
        result.score = 0;
        result.isSafe = true;
        result.reasons.push('Trusted domain');
        return result;
      }

      // 2. Suspicious TLDs
      if (SUSPICIOUS_TLDS.some(tld => hostname.endsWith(tld))) {
        result.score += 25;
        result.reasons.push(`Suspicious TLD: .${hostname.split('.').pop()}`);
      }

      // 3. Brand impersonation patterns in URL
      for (const pattern of PHISHING_PATTERNS) {
        if (pattern.test(hostname) && !TRUSTED_DOMAINS.has(baseDomain)) {
          result.score += 35;
          result.reasons.push(`Brand impersonation detected in hostname`);
          break;
        }
      }

      // 4. Excessive subdomains
      const parts = hostname.split('.');
      if (parts.length > 4) {
        result.score += 15;
        result.reasons.push('Excessive subdomains');
      }

      // 5. IP address in URL
      if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
        result.score += 20;
        result.reasons.push('IP address instead of domain name');
      }

      // 6. Lookalike characters (homograph)
      if (/[а-яёА-ЯЁ]/.test(hostname) || /[αβγδεζηθ]/.test(hostname)) {
        result.score += 40;
        result.reasons.push('Punycode/homograph attack detected');
      }

      // 7. Very long URL
      if (url.length > 100) {
        result.score += 10;
        result.reasons.push('Unusually long URL');
      }

      // 8. Content analysis (if provided)
      if (pageContent) {
        const lc = pageContent.toLowerCase();
        const contentPatterns = [
          'enter your password', 'verify your account', 'login to continue',
          'your account has been suspended', 'click here to verify',
          'confirm your identity', 'update your payment method',
        ];
        const matched = contentPatterns.filter(p => lc.includes(p));
        if (matched.length >= 2) {
          result.score += matched.length * 10;
          result.reasons.push(`Phishing content patterns: ${matched.slice(0, 2).join(', ')}`);
        }

        // Form targeting credential fields
        if (/<input[^>]+type=["']?password["']?/i.test(pageContent) &&
            /<input[^>]+type=["']?email["']?/i.test(pageContent) &&
            result.score > 15) {
          result.score += 15;
          result.reasons.push('Login form on suspicious page');
        }
      }

      result.score = Math.min(result.score, 100);
      result.isSafe = result.score < 40;
      result.level = result.score < 20 ? 'safe'
                   : result.score < 50 ? 'warning'
                   : 'danger';

    } catch (err) {
      result.reasons.push('URL parse error');
    }

    return result;
  }

  // ─── Reading Mode ────────────────────────────────────────────────────────────

  /**
   * Extract clean readable content from raw HTML.
   * Removes ads, nav, scripts, styles — returns only article text.
   */
  extractReadingContent(html) {
    if (!html) return { ok: false, error: 'No HTML provided' };

    try {
      // Remove scripts, styles, iframes, ads
      let clean = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
        .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
        .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
        .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<[^>]+class="[^"]*(?:ad|banner|promo|sponsor|cookie|popup|overlay)[^"]*"[^>]*>[\s\S]*?<\/[a-z]+>/gi, '');

      // Extract title
      const titleMatch = clean.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim() : '';

      // Try to find main content
      const articleMatch = clean.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
        || clean.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
      const content = articleMatch ? articleMatch[1] : clean;

      // Strip remaining tags
      const text = content
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/h[1-6]>/gi, '\n\n')
        .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, text) => `${'#'.repeat(parseInt(level))} ${text}\n\n`)
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      return { ok: true, title, text, wordCount: text.split(/\s+/).length };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  // ─── AI Tab Grouping ─────────────────────────────────────────────────────────

  /**
   * Auto-group tabs by topic using simple keyword clustering.
   * WebLLM is invoked in renderer for advanced grouping.
   */
  async groupTabs(tabs) {
    const GROUPS = {
      'Social Media':   ['facebook', 'instagram', 'twitter', 'linkedin', 'reddit', 'tiktok'],
      'Video':          ['youtube', 'netflix', 'twitch', 'vimeo', 'dailymotion'],
      'Shopping':       ['amazon', 'ebay', 'aliexpress', 'etsy', 'shopify', 'shop'],
      'News':           ['cnn', 'bbc', 'reuters', 'theguardian', 'nytimes', 'news'],
      'Development':    ['github', 'stackoverflow', 'developer', 'docs.', 'api.', 'localhost'],
      'Crypto / Web3':  ['binance', 'coinbase', 'etherscan', 'opensea', 'crypto', 'defi', 'nft', 'bitcoin'],
      'Finance':        ['bank', 'finance', 'invest', 'trading', 'stock', 'forex'],
      'Work / Productivity': ['docs.google', 'office', 'notion', 'trello', 'jira', 'slack', 'teams'],
      'AI & Tech':      ['openai', 'anthropic', 'hugging', 'arxiv', 'techcrunch', 'verge'],
      'Education':      ['coursera', 'udemy', 'khan', 'edu', 'wikipedia', 'learn'],
    };

    const grouped = tabs.map(tab => {
      const url   = (tab.url || '').toLowerCase();
      const title = (tab.title || '').toLowerCase();
      let matchedGroup = 'Other';
      let bestScore = 0;

      for (const [group, keywords] of Object.entries(GROUPS)) {
        const score = keywords.filter(k => url.includes(k) || title.includes(k)).length;
        if (score > bestScore) {
          bestScore = score;
          matchedGroup = group;
        }
      }

      return { ...tab, groupName: matchedGroup };
    });

    return { ok: true, tabs: grouped };
  }

  // ─── Translation (fallback, WebLLM handles full AI translation) ─────────────

  async translate(text, targetLang) {
    // Primary: WebLLM in renderer handles this
    // Fallback here just returns the text with a notice
    return {
      ok: true,
      translated: text,
      note: 'AI translation runs via WebLLM in renderer. Enable AI in Settings for full translation.',
      targetLang,
    };
  }
}

module.exports = AIManager;
