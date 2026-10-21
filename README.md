# LoliSnatcher PC (Danbooru & Anime Booru Viewer)

A modern, fast, and feature-rich PC desktop client for **Danbooru** (and Safebooru, Gelbooru, Yande.re, Konachan), inspired by the beloved Android app **LoliSnatcher**.

Built with **Electron**, **React 19**, **TypeScript**, **Tailwind CSS**, and **Framer Motion**.

---

## ✨ Key Features

- 🌸 **Beautiful Anime UI & Smooth Animations**: Dark AMOLED anime aesthetic with Sakurai pink and cyberpunk violet accents, fluid Framer Motion transitions, and staggered masonry grid.
- ⚡ **Full Danbooru API Authentication**:
  - Connect your Danbooru Username & API Key in Settings.
  - Live API connection testing against Danbooru profile.
  - Unlimited searches, bypass rate limits, and access unrestricted original resolutions.
- 🚀 **High-Speed API Image Downloader**:
  - Native streaming download with custom `Referer` and `User-Agent` headers (zero CORS / 403 Forbidden errors).
  - Choice between **Original full-resolution** or **Sample** preview.
  - Custom filename templates using tokens: `{id}`, `{artist}`, `{character}`, `{copyright}`, `{rating}`, `{score}`.
  - Live Download Manager drawer showing real-time progress, speed, downloaded bytes, "Show in Folder", and "Retry".
- 📦 **Batch Selection Mode**:
  - Select multiple posts with one-click checkboxes.
  - "Download All Selected (X)" with concurrent queue processing.
- 🔍 **Real-Time Tag Autocomplete**:
  - Auto-suggests Danbooru tags as you type with live post counts.
  - Color-coded categories:
    - 🎨 **Artist** (Rose Red)
    - 🏷️ **Copyright / Series** (Purple)
    - 👤 **Character** (Emerald Green)
    - 🏷️ **General** (Sky Blue)
    - ⚙️ **Meta** (Amber Yellow)
- 🖼️ **Interactive Lightbox Viewer**:
  - Smooth pan & zoom (scroll wheel zoom up to 400%, click-and-drag pan).
  - Slideshow keyboard navigation (`ArrowLeft` / `ArrowRight`, `Escape` to close, `D` to download, `F` to favorite).
  - Sliding Tag Sheet with one-click tag copy and direct search.
- 💖 **Local Bookmarks / Favorites**:
  - Save your favorite artworks locally.
  - Filter favorites by tags or download all saved favorites in batch.
- 🛡️ **Safe Mode & Content Filtering**:
  - Filter by General (SFW), Sensitive, Questionable, Explicit.
  - Optional "Blur Explicit Thumbnails" for safe browsing.
- 🌐 **Multi-Engine Support**:
  - Quick switcher between **Danbooru**, **Safebooru**, **Gelbooru**, **Yande.re**, and **Konachan**.

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ (tested on Node.js v24)
- npm v10+

### Installation
```bash
cd "D:\Coding\My project\lolisnatcher-pc"
npm install
```

### Running the App

#### Option 1: Native PC Desktop Window (Electron)
```bash
npm run electron:dev
```
*This launches the native desktop application with custom frameless titlebar and full access to native folder dialogs and direct file streaming.*

#### Option 2: Web Browser Preview
```bash
npm run dev
```
*Open http://localhost:5173 in your browser (features a built-in Danbooru proxy).*

#### Option 3: Build Windows Installer / Executable (.exe)
```bash
npm run electron:build
```
*Creates the standalone Windows setup executable in the `release/` folder.*

---

## 🔑 How to get your Danbooru API Key

1. Go to [Danbooru](https://danbooru.donmai.us/) and log in.
2. Click your avatar or navigate to **Profile**.
3. Under Account settings, find **API Key** and click **View API Key** (or Generate API Key).
4. In LoliSnatcher PC, open **Settings** (gear icon) -> **Danbooru API Auth**.
5. Paste your **Username** and **API Key**, then click **Test API Connection**.
6. Click **Save Preferences**.
