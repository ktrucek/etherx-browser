#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
# EtherX Browser — LAN Mobile Install Server
# Serves PWA over HTTPS on local network so mobile can install without domain
# Copyright (c) 2025–2026 Kriptoentuzijasti.io
# ══════════════════════════════════════════════════════════════════════════════
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVE_DIR="${SERVE_DIR:-$SCRIPT_DIR/src}"
PORT="${PORT:-8443}"

# ── Get local IP ──────────────────────────────────────────────────────────────
LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || ip route get 1.1.1.1 2>/dev/null | awk '{print $7}' | head -1 || echo "127.0.0.1")

echo "╔═══════════════════════════════════════════════════╗"
echo "║        EtherX LAN Mobile Install Server           ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

# ── Generate self-signed cert if needed ──────────────────────────────────────
CERT_DIR="/tmp/etherx-lan-certs"
mkdir -p "$CERT_DIR"

if [ ! -f "$CERT_DIR/server.key" ]; then
  echo "🔐 Generating self-signed certificate for $LAN_IP..."
  openssl req -x509 -nodes -newkey rsa:2048 \
    -keyout "$CERT_DIR/server.key" \
    -out "$CERT_DIR/server.crt" \
    -days 365 \
    -subj "/C=HR/O=Kriptoentuzijasti.io/CN=$LAN_IP" \
    -addext "subjectAltName=IP:$LAN_IP,IP:127.0.0.1,DNS:localhost" \
    2>/dev/null
  echo "✅ Certificate created"
fi

# ── Check for Node.js ─────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "❌ Node.js not found. Install it: sudo apt install nodejs"
  exit 1
fi

# ── Create HTTPS server ───────────────────────────────────────────────────────
cat > /tmp/etherx-lan-server.js << 'JSEOF'
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const CERT_DIR  = '/tmp/etherx-lan-certs';
const SERVE_DIR = process.env.SERVE_DIR || path.join(__dirname, 'src');
const PORT      = parseInt(process.env.PORT || '8443');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.svg':  'image/svg+xml',
  '.woff2':'font/woff2',
};

const server = https.createServer({
  key:  fs.readFileSync(path.join(CERT_DIR, 'server.key')),
  cert: fs.readFileSync(path.join(CERT_DIR, 'server.crt')),
}, (req, res) => {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  // Remove query string
  filePath = filePath.split('?')[0];
  const fullPath = path.join(SERVE_DIR, filePath);

  // Security: prevent path traversal
  if(!fullPath.startsWith(SERVE_DIR)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  // CORS headers for PWA
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Service-Worker-Allowed', '/');

  fs.readFile(fullPath, (err, data) => {
    if(err) {
      // Fallback to index.html for SPA routing
      fs.readFile(path.join(SERVE_DIR, 'index.html'), (err2, data2) => {
        if(err2) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data2);
      });
      return;
    }
    const ext  = path.extname(fullPath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const interfaces = require('os').networkInterfaces();
  let lanIP = '127.0.0.1';
  Object.values(interfaces).forEach(iface => {
    iface.forEach(addr => {
      if(addr.family === 'IPv4' && !addr.internal) lanIP = addr.address;
    });
  });
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║        EtherX LAN Mobile Install Server           ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');
  console.log(`📱 Open on your phone: https://${lanIP}:${PORT}`);
  console.log(`💻 Or on this machine: https://localhost:${PORT}\n`);
  console.log('📋 Installation steps:');
  console.log('   1. Connect your phone to the SAME Wi-Fi network');
  console.log(`   2. Open: https://${lanIP}:${PORT}`);
  console.log('   3. Accept the "untrusted certificate" warning (self-signed)');
  console.log('   4. Android: tap ⋮ → "Add to Home Screen"');
  console.log('   5. iOS: tap Share → "Add to Home Screen"');
  console.log('\n🔴 Press Ctrl+C to stop\n');
});
JSEOF

echo "🚀 Starting server on https://$LAN_IP:$PORT ..."
echo ""
echo "📱 Open this URL on your phone: https://$LAN_IP:$PORT"
echo ""
echo "Steps:"
echo "  1. Connect phone to same Wi-Fi as this server"
echo "  2. Open: https://$LAN_IP:$PORT"
echo "  3. Accept certificate warning (tap Advanced → Proceed)"
echo "  4. Android: menu → Add to Home Screen"
echo "  5. iOS Safari: Share → Add to Home Screen"
echo ""

SERVE_DIR="$SERVE_DIR" PORT="$PORT" node /tmp/etherx-lan-server.js
