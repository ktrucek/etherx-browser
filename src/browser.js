// ─────────────────────────────────────────────────────────────
//  EtherX Browser — browser.js
//  Tab management + navigation + UI logic
// ─────────────────────────────────────────────────────────────

const NTP_URL = 'etherx://newtab';

// ── State ─────────────────────────────────────────────────────
let tabs = [];   // { id, url, title, favicon, wv, tabEl, wvWrap, isNTP }
let activeTabId = null;
let tabCounter = 0;
let zoomLevel = 1.0;

// ── DOM refs ──────────────────────────────────────────────────
const tabBar = document.getElementById('tabBar');
const newTabBtn = document.getElementById('newTabBtn');
const contentArea = document.getElementById('contentArea');
const urlInput = document.getElementById('urlInput');
const urlIcon = document.getElementById('urlIcon');
const btnBack = document.getElementById('btnBack');
const btnFwd = document.getElementById('btnFwd');
const btnReload = document.getElementById('btnReload');
const btnHome = document.getElementById('btnHome');
const loadingBar = document.getElementById('loadingBar');
const statusUrl = document.getElementById('statusUrl');
const walletSidebar = document.getElementById('walletSidebar');
const devtoolsPanel = document.getElementById('devtoolsPanel');
const consoleOut = document.getElementById('consoleOut');

// ── Helpers ───────────────────────────────────────────────────
function normalizeUrl(raw) {
    raw = raw.trim();
    if (!raw) return NTP_URL;
    if (raw === NTP_URL) return NTP_URL;
    // Crypto address search
    if (/^0x[0-9a-fA-F]{40}$/.test(raw)) {
        return `https://etherscan.io/address/${raw}`;
    }
    // ENS domain
    if (/\.eth$/.test(raw)) {
        return `https://app.ens.domains/name/${raw}`;
    }
    // Already a URL?
    if (/^[a-z][a-z0-9+\-.]*:\/\//i.test(raw)) return raw;
    // Looks like a domain?
    if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(raw) && !raw.includes(' ')) {
        return 'https://' + raw;
    }
    // Otherwise: Google search
    return `https://www.google.com/search?q=${encodeURIComponent(raw)}`;
}

function getFavicon(url) {
    if (!url || url === NTP_URL) return '🌐';
    try {
        const u = new URL(url);
        return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=16`;
    } catch { return '🌐'; }
}

function log(type, msg) {
    const el = document.createElement('div');
    el.className = 'cl ' + type;
    const t = new Date().toLocaleTimeString();
    el.innerHTML = `<span class="pre">[${t}]</span> ${msg}`;
    consoleOut.appendChild(el);
    consoleOut.scrollTop = consoleOut.scrollHeight;
}

function setLoading(pct) {
    loadingBar.style.width = pct + '%';
    if (pct >= 100) setTimeout(() => { loadingBar.style.width = '0%'; }, 400);
}

// ── Tab Create ────────────────────────────────────────────────
function createTab(url = NTP_URL, activate = true) {
    const id = ++tabCounter;
    const isNTP = url === NTP_URL;

    // Tab element
    const tabEl = document.createElement('div');
    tabEl.className = 'tab' + (activate ? ' active' : '');
    tabEl.dataset.tabId = id;
    tabEl.innerHTML = `
        <span class="tab-favicon">${isNTP ? '🌐' : '⟳'}</span>
        <span class="tab-title">${isNTP ? 'New Tab' : url}</span>
        <span class="tab-close">×</span>
    `;
    tabBar.insertBefore(tabEl, newTabBtn);

    // Content wrapper
    const wvWrap = document.createElement('div');
    wvWrap.className = 'wv-wrapper' + (activate ? ' active' : '');
    wvWrap.dataset.tabId = id;

    let wv = null;

    if (isNTP) {
        // New Tab Page (pure HTML, no webview)
        const ntpEl = document.createElement('div');
        ntpEl.className = 'new-tab-page active';
        ntpEl.innerHTML = `
            <div class="ntp-logo">E</div>
            <div class="ntp-title">EtherX Browser</div>
            <div class="ntp-sub">The Web3-Native Browser Experience</div>
            <div class="ntp-search-wrap">
                <span class="ntp-search-icon">🔍</span>
                <input class="ntp-search" placeholder="Search the web or enter a crypto address…" id="ntp-input-${id}"/>
            </div>
            <div class="ntp-features">
                <div class="feature-card" onclick="navigateActive('https://app.uniswap.org')">
                    <div class="feature-icon">🔐</div>
                    <div class="feature-title">Built-in Wallet</div>
                    <div class="feature-desc">Secure crypto wallet integrated directly</div>
                </div>
                <div class="feature-card" onclick="navigateActive('https://etherscan.io')">
                    <div class="feature-icon">⚡</div>
                    <div class="feature-title">Lightning Fast</div>
                    <div class="feature-desc">Chromium-powered performance</div>
                </div>
                <div class="feature-card" onclick="navigateActive('https://metamask.io')">
                    <div class="feature-icon">🛡️</div>
                    <div class="feature-title">Privacy First</div>
                    <div class="feature-desc">Enhanced tracking protection</div>
                </div>
            </div>
        `;
        wvWrap.appendChild(ntpEl);

        // NTP search
        setTimeout(() => {
            const inp = document.getElementById('ntp-input-' + id);
            if (inp) inp.addEventListener('keypress', e => {
                if (e.key === 'Enter') navigateActive(e.target.value);
            });
        }, 50);
    } else {
        // Real webview
        wv = document.createElement('webview');
        wv.src = url;
        wv.setAttribute('allowpopups', '');

        wv.addEventListener('did-start-loading', () => {
            const t = getTab(id);
            if (!t) return;
            setFavicon(tabEl, '⟳');
            tabEl.querySelector('.tab-title').textContent = 'Loading…';
            if (id === activeTabId) setLoading(30);
        });
        wv.addEventListener('did-stop-loading', () => {
            const t = getTab(id);
            if (!t) return;
            const currentUrl = wv.getURL();
            const title = wv.getTitle() || currentUrl;
            tabEl.querySelector('.tab-title').textContent = title;
            setFaviconImg(tabEl, getFavicon(currentUrl));
            if (id === activeTabId) {
                urlInput.value = currentUrl;
                updateUrlIcon(currentUrl);
                setLoading(100);
                updateNavButtons();
                statusUrl.textContent = '';
            }
            t.url = currentUrl;
            t.title = title;
            log('log', `Loaded: ${title}`);
        });
        wv.addEventListener('did-fail-load', (e) => {
            if (e.errorCode === -3) return; // Aborted (normal)
            tabEl.querySelector('.tab-title').textContent = 'Error';
            if (id === activeTabId) setLoading(100);
            log('error', `Failed to load: ${e.validatedURL} (${e.errorDescription})`);
        });
        wv.addEventListener('page-title-updated', (e) => {
            tabEl.querySelector('.tab-title').textContent = e.title;
            if (id === activeTabId) document.title = e.title + ' — EtherX';
        });
        wv.addEventListener('page-favicon-updated', (e) => {
            if (e.favicons && e.favicons.length > 0) setFaviconImg(tabEl, e.favicons[0]);
        });
        wv.addEventListener('update-target-url', (e) => {
            if (id === activeTabId) statusUrl.textContent = e.url;
        });
        wv.addEventListener('did-navigate', (e) => {
            if (id === activeTabId) {
                urlInput.value = e.url;
                updateUrlIcon(e.url);
                updateNavButtons();
            }
            t && (t.url = e.url);
        });
        wv.addEventListener('did-navigate-in-page', (e) => {
            if (id === activeTabId) {
                urlInput.value = e.url;
                updateNavButtons();
            }
        });
        wv.addEventListener('new-window', (e) => {
            createTab(e.url, true);
        });

        wvWrap.appendChild(wv);
    }

    contentArea.appendChild(wvWrap);

    const tabObj = { id, url, title: isNTP ? 'New Tab' : url, wv, tabEl, wvWrap, isNTP };
    tabs.push(tabObj);

    // Tab click
    tabEl.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-close')) {
            closeTab(id);
        } else {
            activateTab(id);
        }
    });

    if (activate) activateTab(id);
    return id;
}

function getTab(id) { return tabs.find(t => t.id === id); }

function setFavicon(tabEl, emoji) {
    const fav = tabEl.querySelector('.tab-favicon');
    fav.textContent = emoji;
    fav.style.backgroundImage = '';
}
function setFaviconImg(tabEl, url) {
    const fav = tabEl.querySelector('.tab-favicon');
    if (url && url.startsWith('http')) {
        fav.innerHTML = `<img src="${url}" width="14" height="14" onerror="this.parentNode.textContent='🌐'" style="border-radius:2px">`;
    } else {
        fav.textContent = url || '🌐';
    }
}

// ── Tab Activate ──────────────────────────────────────────────
function activateTab(id) {
    tabs.forEach(t => {
        t.tabEl.classList.toggle('active', t.id === id);
        t.wvWrap.classList.toggle('active', t.id === id);
    });
    activeTabId = id;
    const t = getTab(id);
    if (!t) return;

    if (t.isNTP) {
        urlInput.value = '';
        urlInput.placeholder = 'Search or enter web address…';
        updateUrlIcon('');
        btnBack.disabled = true;
        btnFwd.disabled = true;
        document.title = 'New Tab — EtherX';
    } else {
        const url = t.wv ? t.wv.getURL() : t.url;
        urlInput.value = url;
        updateUrlIcon(url);
        updateNavButtons();
        document.title = (t.title || 'EtherX Browser') + ' — EtherX';
    }
}

// ── Tab Close ─────────────────────────────────────────────────
function closeTab(id) {
    const idx = tabs.findIndex(t => t.id === id);
    if (idx === -1) return;
    const t = tabs[idx];
    t.tabEl.remove();
    t.wvWrap.remove();
    tabs.splice(idx, 1);

    if (tabs.length === 0) {
        createTab(NTP_URL);
        return;
    }
    if (activeTabId === id) {
        const newIdx = Math.min(idx, tabs.length - 1);
        activateTab(tabs[newIdx].id);
    }
}

// ── Navigation ────────────────────────────────────────────────
function navigateActive(url) {
    closeAllMenus();
    const t = getTab(activeTabId);
    const normalized = normalizeUrl(url);

    if (normalized === NTP_URL) {
        if (t && t.isNTP) return;
        // Replace current tab content with NTP
        closeTab(activeTabId);
        createTab(NTP_URL);
        return;
    }

    if (t && !t.isNTP && t.wv) {
        t.wv.src = normalized;
        t.url = normalized;
        t.isNTP = false;
        urlInput.value = normalized;
    } else if (t && t.isNTP) {
        // Replace NTP with real page
        const id = t.id;
        t.wvWrap.innerHTML = '';
        t.isNTP = false;

        const wv = document.createElement('webview');
        wv.src = normalized;
        wv.setAttribute('allowpopups', '');
        t.wv = wv;

        wv.addEventListener('did-stop-loading', () => {
            const currentUrl = wv.getURL();
            const title = wv.getTitle() || currentUrl;
            t.tabEl.querySelector('.tab-title').textContent = title;
            setFaviconImg(t.tabEl, getFavicon(currentUrl));
            if (id === activeTabId) {
                urlInput.value = currentUrl;
                updateUrlIcon(currentUrl);
                setLoading(100);
                updateNavButtons();
            }
            t.url = currentUrl;
            t.title = title;
        });
        wv.addEventListener('did-start-loading', () => {
            if (id === activeTabId) setLoading(30);
        });
        wv.addEventListener('page-title-updated', e => {
            t.tabEl.querySelector('.tab-title').textContent = e.title;
        });
        wv.addEventListener('page-favicon-updated', e => {
            if (e.favicons?.length) setFaviconImg(t.tabEl, e.favicons[0]);
        });
        wv.addEventListener('did-navigate', e => {
            if (id === activeTabId) { urlInput.value = e.url; updateUrlIcon(e.url); updateNavButtons(); }
            t.url = e.url;
        });
        wv.addEventListener('new-window', e => createTab(e.url, true));

        t.wvWrap.appendChild(wv);
        urlInput.value = normalized;
        updateUrlIcon(normalized);
    }
}

function updateNavButtons() {
    const t = getTab(activeTabId);
    if (!t || !t.wv) {
        btnBack.disabled = true;
        btnFwd.disabled = true;
        return;
    }
    btnBack.disabled = !t.wv.canGoBack();
    btnFwd.disabled = !t.wv.canGoForward();
}

function updateUrlIcon(url) {
    if (!url || url === NTP_URL) {
        urlIcon.textContent = '🌐';
        urlIcon.className = 'url-icon';
    } else if (url.startsWith('https://')) {
        urlIcon.textContent = '🔒';
        urlIcon.className = 'url-icon secure';
    } else {
        urlIcon.textContent = '⚠️';
        urlIcon.className = 'url-icon insecure';
    }
}

// ── Event Wiring ──────────────────────────────────────────────

// URL bar
urlInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') navigateActive(urlInput.value);
    if (e.key === 'Escape') {
        const t = getTab(activeTabId);
        urlInput.value = t && !t.isNTP ? (t.wv?.getURL() || '') : '';
        urlInput.blur();
    }
});
urlInput.addEventListener('focus', () => urlInput.select());

// Nav buttons
btnBack.addEventListener('click', () => {
    const t = getTab(activeTabId);
    if (t?.wv?.canGoBack()) t.wv.goBack();
});
btnFwd.addEventListener('click', () => {
    const t = getTab(activeTabId);
    if (t?.wv?.canGoForward()) t.wv.goForward();
});
btnReload.addEventListener('click', () => {
    const t = getTab(activeTabId);
    if (t?.wv) t.wv.reload();
});
btnHome.addEventListener('click', () => createTab(NTP_URL));
document.getElementById('btnWallet').addEventListener('click', () => walletSidebar.classList.toggle('open'));
document.getElementById('walletClose').addEventListener('click', () => walletSidebar.classList.remove('open'));

// DevTools panel
document.getElementById('btnDevtools').addEventListener('click', () => devtoolsPanel.classList.toggle('open'));
document.getElementById('dtClose').addEventListener('click', () => devtoolsPanel.classList.remove('open'));

document.querySelectorAll('.dt-tab').forEach(t => {
    t.addEventListener('click', () => {
        document.querySelectorAll('.dt-tab').forEach(x => x.classList.remove('active'));
        document.querySelectorAll('.dt-pane').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        document.getElementById('pane-' + t.dataset.pane).classList.add('active');
    });
});

// Console input
document.getElementById('ciInput').addEventListener('keypress', e => {
    if (e.key !== 'Enter' || !e.target.value.trim()) return;
    const cmd = e.target.value;
    log('log', '<span style="color:#667eea">› ' + cmd + '</span>');
    try {
        const r = eval(cmd);
        if (r !== undefined) log('info', '← ' + JSON.stringify(r));
    } catch (err) { log('error', err.message); }
    e.target.value = '';
});

// New tab
newTabBtn.addEventListener('click', () => createTab(NTP_URL));

// ── Menu Bar ──────────────────────────────────────────────────
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', e => {
        e.stopPropagation();
        const wasOpen = item.classList.contains('open');
        closeAllMenus();
        if (!wasOpen) item.classList.add('open');
    });
});
document.addEventListener('click', closeAllMenus);

function closeAllMenus() {
    document.querySelectorAll('.menu-item.open').forEach(i => i.classList.remove('open'));
}

// File menu
document.getElementById('mi-new-tab').addEventListener('click', () => { closeAllMenus(); createTab(NTP_URL); });
document.getElementById('mi-new-private').addEventListener('click', () => { closeAllMenus(); log('info', '🕶️ Private Window (incognito mode)'); createTab(NTP_URL); });
document.getElementById('mi-close-tab').addEventListener('click', () => { closeAllMenus(); closeTab(activeTabId); });
document.getElementById('mi-open-loc').addEventListener('click', () => { closeAllMenus(); urlInput.focus(); urlInput.select(); });
document.getElementById('mi-reload').addEventListener('click', () => { closeAllMenus(); const t = getTab(activeTabId); if (t?.wv) t.wv.reload(); });
document.getElementById('mi-hard-reload').addEventListener('click', () => { closeAllMenus(); const t = getTab(activeTabId); if (t?.wv) t.wv.reloadIgnoringCache(); });
document.getElementById('mi-back').addEventListener('click', () => { closeAllMenus(); const t = getTab(activeTabId); if (t?.wv?.canGoBack()) t.wv.goBack(); });
document.getElementById('mi-fwd').addEventListener('click', () => { closeAllMenus(); const t = getTab(activeTabId); if (t?.wv?.canGoForward()) t.wv.goForward(); });
document.getElementById('mi-console').addEventListener('click', () => { closeAllMenus(); devtoolsPanel.classList.add('open'); });
document.getElementById('mi-devtools').addEventListener('click', () => { closeAllMenus(); devtoolsPanel.classList.toggle('open'); });
document.getElementById('mi-wallet-open').addEventListener('click', () => { closeAllMenus(); walletSidebar.classList.toggle('open'); });
document.getElementById('mi-show-hist').addEventListener('click', () => { closeAllMenus(); log('info', '🕒 History: Ctrl+H'); });
document.getElementById('mi-clear-hist').addEventListener('click', () => { closeAllMenus(); log('warn', '🗑️ History cleared'); });
document.getElementById('mi-caches').addEventListener('click', () => { closeAllMenus(); log('warn', 'Clearing caches…'); setTimeout(() => log('success', '✓ Caches cleared'), 600); });
document.getElementById('mi-zoom-in').addEventListener('click', () => { closeAllMenus(); zoomLevel = Math.min(3, zoomLevel + 0.1); const t = getTab(activeTabId); if (t?.wv) t.wv.setZoomFactor(zoomLevel); log('info', `Zoom: ${Math.round(zoomLevel * 100)}%`); });
document.getElementById('mi-zoom-out').addEventListener('click', () => { closeAllMenus(); zoomLevel = Math.max(0.3, zoomLevel - 0.1); const t = getTab(activeTabId); if (t?.wv) t.wv.setZoomFactor(zoomLevel); log('info', `Zoom: ${Math.round(zoomLevel * 100)}%`); });
document.getElementById('mi-zoom-reset').addEventListener('click', () => { closeAllMenus(); zoomLevel = 1; const t = getTab(activeTabId); if (t?.wv) t.wv.setZoomFactor(1); log('info', 'Zoom: 100%'); });

// ── Keyboard shortcuts ────────────────────────────────────────
document.addEventListener('keydown', e => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.key === 't') { e.preventDefault(); createTab(NTP_URL); }
    if (ctrl && e.key === 'w') { e.preventDefault(); closeTab(activeTabId); }
    if (ctrl && e.key === 'r') { e.preventDefault(); const t = getTab(activeTabId); if (t?.wv) t.wv.reload(); }
    if (ctrl && e.key === 'l') { e.preventDefault(); urlInput.focus(); urlInput.select(); }
    if (e.key === 'F12') { devtoolsPanel.classList.toggle('open'); }
    if (e.altKey && e.key === 'ArrowLeft') { const t = getTab(activeTabId); if (t?.wv?.canGoBack()) t.wv.goBack(); }
    if (e.altKey && e.key === 'ArrowRight') { const t = getTab(activeTabId); if (t?.wv?.canGoForward()) t.wv.goForward(); }
    // Tab switching
    if (ctrl && e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key) - 1;
        if (tabs[idx]) activateTab(tabs[idx].id);
    }
});

// Additional menu items
const safeMenu = (id, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
};

safeMenu('mi-open-file', () => { closeAllMenus(); log('info', '📄 File open dialog (Ctrl+O)'); });
safeMenu('mi-save-as', () => {
    closeAllMenus();
    const t = getTab(activeTabId);
    if (t?.wv) {
        const url = t.wv.getURL();
        log('info', '💾 Saving page: ' + url);
        t.wv.downloadURL(url);
    }
});
safeMenu('mi-print', () => { closeAllMenus(); const t = getTab(activeTabId); if (t?.wv) t.wv.print(); });
safeMenu('mi-undo', () => { closeAllMenus(); document.execCommand('undo'); });
safeMenu('mi-copy', () => { closeAllMenus(); document.execCommand('copy'); });
safeMenu('mi-paste', () => { closeAllMenus(); urlInput.focus(); });
safeMenu('mi-find', () => { closeAllMenus(); const t = getTab(activeTabId); if (t?.wv) t.wv.findInPage(prompt('Find on page:') || ''); });
safeMenu('mi-selectall', () => { closeAllMenus(); document.execCommand('selectAll'); });
safeMenu('mi-page-src', () => {
    closeAllMenus();
    const t = getTab(activeTabId);
    if (t?.wv) createTab('view-source:' + t.wv.getURL());
});
safeMenu('mi-fullscreen', () => {
    closeAllMenus();
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
});
safeMenu('mi-inspect', () => { closeAllMenus(); devtoolsPanel.classList.add('open'); log('info', '📱 Inspect Apps & Devices'); });
safeMenu('mi-sw', () => { closeAllMenus(); devtoolsPanel.classList.add('open'); log('info', '⚙️ Service Workers'); });
safeMenu('mi-ext-bg', () => { closeAllMenus(); log('info', '🧩 Web Extension Background Content'); });
safeMenu('mi-responsive', () => { closeAllMenus(); log('info', '📐 Responsive Design Mode (Ctrl+Shift+M)'); });
safeMenu('mi-resources', () => {
    closeAllMenus();
    devtoolsPanel.classList.add('open');
    document.querySelector('[data-pane="sources"]')?.click();
});
safeMenu('mi-timeline', () => {
    closeAllMenus();
    devtoolsPanel.classList.add('open');
    document.querySelector('[data-pane="timeline"]')?.click();
});
safeMenu('mi-element-sel', () => { closeAllMenus(); const t = getTab(activeTabId); if (t?.wv) t.wv.inspectElement(0, 0); });
safeMenu('mi-wallet-connect', () => { closeAllMenus(); walletSidebar.classList.add('open'); log('info', '🔗 Connecting to dApp…'); });
safeMenu('mi-wallet-network', () => { closeAllMenus(); walletSidebar.classList.add('open'); log('info', '🌐 Switch Network'); });
safeMenu('mi-wallet-tx', () => { closeAllMenus(); walletSidebar.classList.add('open'); log('info', '📊 Transaction History'); });

// Settings button — opens full settings window via IPC
safeMenu('btnSettings', () => {
    if (window.etherx?.app?.openSettings) {
        window.etherx.app.openSettings();
    } else {
        createTab('etherx://settings');
    }
    log('info', '⚙️ Settings');
});

// ── Init ─────────────────────────────────────────────────────
createTab(NTP_URL);
log('success', '⬡ EtherX Browser started — Web3 ready');
