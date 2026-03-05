<div align="center">

# ⬡ EtherX Browser

**Web3-nativni preglednik sa SQLite, AI, TLS 1.3, blokadom oglasa i menadžerom lozinki**

[![Release](https://img.shields.io/github/v/release/ktrucek/etherx-browser?color=7c3aed&label=verzija&style=flat-square)](https://github.com/ktrucek/etherx-browser/releases/latest)
[![License](https://img.shields.io/badge/licenca-MIT-blue?style=flat-square)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-33.4.11-47848f?style=flat-square&logo=electron)](https://electronjs.org)
[![Platform](https://img.shields.io/badge/platforma-Linux%20%7C%20Windows-success?style=flat-square)](https://github.com/ktrucek/etherx-browser/releases/latest)

</div>

---

## ⬇️ Preuzmi EtherX Browser

<div align="center">

| Platforma | Format | Veličina | Preuzimi |
|:---:|:---:|:---:|:---:|
| 🐧 **Linux** | AppImage (sve distribucije) | ~117 MB | [**Preuzmi AppImage**](https://github.com/ktrucek/etherx-browser/releases/download/v2.0.0/EtherX.Browser-2.0.0.AppImage) |
| 🐧 **Linux** | .deb (Ubuntu / Debian) | ~80 MB | [**Preuzmi .deb**](https://github.com/ktrucek/etherx-browser/releases/download/v2.0.0/etherx-browser_2.0.0_amd64.deb) |
| 🪟 **Windows** | Portable .exe (bez instalacije) | ~78 MB | [**Preuzmi .exe**](https://github.com/ktrucek/etherx-browser/releases/download/v2.0.0/EtherX.Browser.2.0.0.exe) |
| 🪟 **Windows** | ZIP arhiva | ~119 MB | [**Preuzmi .zip**](https://github.com/ktrucek/etherx-browser/releases/download/v2.0.0/EtherX.Browser-2.0.0-win.zip) |

→ [**Sve verzije i changelog**](https://github.com/ktrucek/etherx-browser/releases)

</div>

---

## 🚀 Instalacija i pokretanje

### 🐧 Linux — AppImage (preporučeno, radi na svim distribucijama)

```bash
# 1. Preuzmi AppImage
wget "https://github.com/ktrucek/etherx-browser/releases/download/v2.0.0/EtherX Browser-2.0.0.AppImage"

# 2. Daj izvršne dozvole
chmod +x "EtherX Browser-2.0.0.AppImage"

# 3. Pokreni
./"EtherX Browser-2.0.0.AppImage" --no-sandbox
```

### 🐧 Linux — Debian / Ubuntu (.deb)

```bash
# 1. Preuzmi .deb
wget "https://github.com/ktrucek/etherx-browser/releases/download/v2.0.0/etherx-browser_2.0.0_amd64.deb"

# 2. Instaliraj
sudo dpkg -i etherx-browser_2.0.0_amd64.deb

# 3. Pokreni iz menija ili:
etherx-browser --no-sandbox
```

### 🪟 Windows — Portable (bez instalacije)

1. Preuzmi `EtherX Browser 2.0.0.exe`
2. Dvostruki klik i pokreni — instalacija **nije** potrebna
3. Ako Windows SmartScreen upozori: klikni **"Više informacija" → "Svejedno pokreni"**
   *(upozorenje se pojavljuje jer exe nije potpisanim certifikatom — aplikacija je sigurna)*

### 🪟 Windows — ZIP

```
1. Preuzmi EtherX Browser-2.0.0-win.zip
2. Raspakiraj negdje (npr. C:\Programs\EtherX)
3. Pokreni EtherX Browser.exe
```

---

## ✨ Funkcionalnosti

### 🌐 Pretraživanje i tabovi
| Funkcija | Opis |
|---|---|
| WebView tabovi | Svaki tab izoliran u zasebnom WebView procesu |
| SQLite persistencija | Tabovi, povijest i zabilješke preživljavaju restart |
| Incognito mod | Privatni tabovi — ništa se ne zapisuje na disk |
| ENS `.eth` domene | `uniswap.eth` automatski otvara Web3 stranicu |
| `0x` adrese | Automatski otvara Etherscan za Ethereum adrese |
| Smart URL | Google search fallback za sve što nije URL |

### 🔒 Sigurnost
| Funkcija | Opis |
|---|---|
| **TLS 1.3** | Minimalna verzija TLS-a — blokirani TLS 1.0/1.1/1.2 |
| Cipher blacklist | Blokirani slabi šifrarnici (RC4, 3DES) |
| **Detekcija phishinga** | AI analizira URL i sadržaj stranice u realnom vremenu |
| **HTTPS enforcer** | Navigacija na ne-HTTPS protokole blokirana |
| Certifikat inspekcija | Detalji TLS certifikata za svaku stranicu |
| Sigurni storage | Lozinke enkriptirane AES-256-GCM, nikad plaintext |

### 🤖 AI funkcije
| Funkcija | Opis |
|---|---|
| Phishing detekcija | Analiza URL-a i sadržaja — upozorenje pri susumnjivim stranicama |
| Smart search | Predlaže relevantne Web3 resurse pri pretraživanju |
| Tab grupiranje | Automatski grupira tabove po tematici (AI analiza naslova/URL-a) |
| Reading mode | Izvlači čitljiv tekst iz bilo koje stranice |
| Prevođenje | AI prijevod teksta na odabrani jezik |

### 🛡️ Blokada oglasa
| Funkcija | Opis |
|---|---|
| @cliqz/adblocker-electron | Visoko-performantni adblocker direktno u glavnom procesu |
| EasyList pravila | Standardna pravila za blokiranje oglasa i trackera |
| Statistike | Prikazuje koliko je oglasa/trackera blokirano po sesiji |
| Toggle | Uključi/isključi u postavkama bez restarta |

### 🔑 Menadžer lozinki
| Funkcija | Opis |
|---|---|
| AES-256-GCM enkripcija | Sve lozinke enkriptirane, ključ nikad napušta uređaj |
| Per-site storage | Lozinke grupirane po domeni |
| Import/Export | QR kod za sigurni prijenos na drugi uređaj |

### ⬡ Web3 integracija
| Funkcija | Opis |
|---|---|
| Ethers.js v6 | Kompletan Ethereum JavaScript API |
| ENS rezolucija | `.eth` domene → pravim Ethereum adresama |
| Wallet sidebar | ETH balans, token lista, akcije (Send/Receive) |
| dApp podrška | Standardne Ethereum dApp stranice rade nativno |
| Mrežni switch | Mainnet, Testnet, custom RPC |

### 🌍 Internacionalizacija
| Funkcija | Opis |
|---|---|
| 13 jezika | HR, EN, DE, FR, IT, ES, PT, RU, ZH, JA, KO, AR, TR |
| i18next | Profesionalna i18n biblioteka |
| RTL podrška | Arapski jezik s desna-lijevo formatiranjem |

### 📱 QR Sync
Izvozi cijeli profil (tabovi, zabilješke, postavke) kao QR kod i uvezi na drugom uređaju.

### 🎨 Postavke
Detaljna stranica postavki s navigacijom:
- 👤 Profil
- 🔒 Privatnost i sigurnost
- 🛡️ Ad-blocker konfiguracija
- 🔑 Menadžer lozinki
- 🌍 Jezik i regija
- 🖼️ Ikona preglednika (presets, upload, URL)
- 📱 QR Sync
- ⚙️ Napredno

---

## 🖥️ Sistemski zahtjevi

### Linux
- Ubuntu 20.04+ / Debian 10+ / Fedora 33+ ili ekvivalent
- 64-bit procesor (x86_64)
- 4 GB RAM (preporučeno 8 GB)
- 500 MB slobodnog prostora
- Display server: X11 ili Wayland

### Windows
- Windows 10 (64-bit) ili noviji
- 4 GB RAM
- 500 MB slobodnog prostora
- DirectX 11

---

## 🔧 Build iz izvornog koda

### Preduvjeti
- Node.js 20+ 
- npm 10+
- Python 3.x (za native module kompilaciju)
- Build alati: `build-essential` (Linux) / Visual Studio Build Tools (Windows)

### Instalacija

```bash
# Kloniraj repozitorij
git clone https://github.com/ktrucek/etherx-browser.git
cd etherx-browser

# Instaliraj ovisnosti (automatski kompilira native module)
npm install

# Pokreni u dev modu
npm start
```

### Buildanje

```bash
# Linux (AppImage + .deb)
npm run dist:linux

# Windows (portable .exe + .zip)
npm run dist:win

# macOS (potrebna macOS mašina)
npm run dist:mac
```

Output se nalazi u `dist/` folderu.

---

## 📁 Struktura projekta

```
etherx-browser/
├── main.js                    # Electron glavni proces
├── preload.js                 # Sigurni IPC bridge (contextBridge)
├── package.json               # Ovisnosti i build konfiguracija
│
├── src/
│   ├── index.html             # Glavno sučelje (tabovi, URL bar, Web3)
│   ├── browser.js             # Tab logika, ENS/0x URL normalizacija
│   ├── settings.html          # Stranica postavki
│   │
│   └── main/                  # Moduli glavnog procesa
│       ├── database.js        # SQLite CRUD (tabovi, povijest, zabilješke)
│       ├── adBlocker.js       # Blokada oglasa (@cliqz)
│       ├── security.js        # TLS 1.3, certifikat inspekcija
│       ├── ai.js              # Phishing, grupiranje, reading mode
│       ├── passwordManager.js # AES-256-GCM enkripcija
│       ├── qrSync.js          # QR export/import profila
│       ├── i18n.js            # 13 jezika (i18next)
│       ├── userAgent.js       # Chrome 122 UA masking
│       └── defaultBrowser.js  # Postavi kao defaultni preglednik
│
└── assets/
    └── filters/
        └── filters.txt        # EasyList ad-blocking pravila
```

---

## 🛠️ Korištene tehnologije

| Paket | Verzija | Svrha |
|---|---|---|
| [Electron](https://electronjs.org) | 33.4.11 | Desktop framework |
| [Ethers.js](https://ethers.org) | 6.13.0 | Web3 / Ethereum integracija |
| [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | 12.6.2 | Brza SQLite baza podataka |
| [@cliqz/adblocker-electron](https://github.com/cliqz-oss/adblocker) | 1.26.8 | Ad-blocker engine |
| [i18next](https://www.i18next.com) | 23.11.5 | Internacionalizacija |
| [qrcode](https://github.com/soldair/node-qrcode) | 1.5.3 | QR kod generacija |
| [crypto-js](https://github.com/brix/crypto-js) | 4.2.0 | AES-256-GCM enkripcija |
| [bcrypt](https://github.com/kelektiv/node.bcrypt.js) | 5.1.1 | Password hashing |
| [uuid](https://github.com/uuidjs/uuid) | 9.0.0 | Jedinstveni ID-ovi |
| [electron-builder](https://www.electron.build) | 24.13.3 | Packaging i distribucija |

---

## ⚠️ Poznata ograničenja

- **macOS build** nije dostupan — Apple zabrana cross-compile, potrebna macOS mašina
- **Mobitel** nije podržan — Electron je desktop-only framework
- **Windows SmartScreen** upozorenje — exe nije potpisan certifikatom (skupo), ali je siguran
- **Linux Wayland** — potreban `--no-sandbox` flag u nekim konfiguracijama

---

## 📄 Licenca

MIT © 2024–2026 [kriptoentuzijasti.io](https://kriptoentuzijasti.io)

---

<div align="center">

Napravljeno s ❤️ za Web3 zajednicu · [kriptoentuzijasti.io](https://kriptoentuzijasti.io)

</div>
