<div align="center">

# 🌸 LoliSnatcher PC

**Modern, fast, and beautiful Danbooru & anime booru desktop client for Windows**

[![Release](https://img.shields.io/github/v/release/PaYadyo/lolisnatcher-pc?color=f43f5e&label=Release&style=flat-square)](https://github.com/PaYadyo/lolisnatcher-pc/releases)
[![Platform](https://img.shields.io/badge/Platform-Windows-0078D6?logo=windows&style=flat-square)](https://github.com/PaYadyo/lolisnatcher-pc/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&style=flat-square)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&style=flat-square)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-45.0-47848F?logo=electron&style=flat-square)](https://www.electronjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwindcss&style=flat-square)](https://tailwindcss.com/)

[**📥 Download Latest Release**](https://github.com/PaYadyo/lolisnatcher-pc/releases/latest) • [**✨ Features**](#-features) • [**🔑 API Setup**](#-api-setup) • [**🛠️ Development**](#-development--build)

</div>

---

## 🌟 Overview

**LoliSnatcher PC** is a desktop image viewer and downloader inspired by mobile booru clients. Designed from the ground up for desktop PC users, it combines fluid 60fps animations, a responsive masonry layout, native Windows file system integration, and direct API authentication for high-speed, rate-limit-free downloads.

---

## ✨ Features

- 🎨 **Modern Anime Aesthetic & Fluid Animations**
  - AMOLED dark mode with Sakura pink & cyberpunk violet glow.
  - Smooth Framer Motion transitions, responsive masonry grid, and card hover overlays.
  - Native Windows frameless titlebar with custom window controls.

- ⚡ **Full Danbooru API Authentication**
  - Connect your Danbooru Username and API Key.
  - Test connection status directly within the app.
  - Unlocks higher rate limits, private favorites, and original full-resolution downloads.

- 📥 **High-Speed API Image Downloader**
  - Native streaming download with custom `Referer` and `User-Agent` headers (zero CORS / 403 hotlink errors).
  - Choose between **Original full-resolution** or **Sample** preview.
  - Custom filename formatting template using tokens: `{id}`, `{artist}`, `{character}`, `{copyright}`, `{rating}`, `{score}` with live preview.
  - Real-time Download Manager drawer with progress tracking, speed, downloaded bytes, and "Show in Folder" button.

- 📦 **Batch Selection Mode**
  - Select multiple posts with one-click checkboxes.
  - Queue batch downloads with concurrent connection controls.

- 🔍 **Real-Time Tag Autocomplete & Category Highlighting**
  - Live Danbooru tag suggestions with post counts as you type.
  - Color-coded categories:
    - 🎨 **Artist** (Rose Red)
    - 🏷️ **Copyright / Series** (Purple)
    - 👤 **Character** (Emerald Green)
    - 🏷️ **General** (Sky Blue)
    - ⚙️ **Meta** (Amber Yellow)

- 🖼️ **Interactive Lightbox Viewer**
  - Smooth zoom (up to 400% with scroll wheel or buttons) and drag-to-pan navigation.
  - Slideshow navigation (`ArrowLeft` / `ArrowRight`, `Escape` to close, `D` to download, `F` to favorite).
  - Sliding Tag Inspector with one-click tag copying and instant search.

- 💖 **Local Bookmarks & Favorites**
  - Bookmark your favorite artworks locally on your PC.
  - Filter favorites by tags or batch download all saved bookmarks.

- 🛡️ **Safe Mode & Content Filtering**
  - Rating filters: General (SFW), Sensitive, Questionable, Explicit.
  - Optional thumbnail blur for sensitive content.

- 🌐 **Multi-Booru Engine Support**
  - Seamlessly switch between **Danbooru**, **Safebooru**, **Gelbooru**, **Yande.re**, and **Konachan**.

---

## 📥 Quick Download

Get the ready-to-run Windows application from the [**Releases Page**](https://github.com/PaYadyo/lolisnatcher-pc/releases):

| Package | Description |
| :--- | :--- |
| **`LoliSnatcher-PC-1.0.0-Portable.exe`** | Standalone executable. Run directly without installation. |
| **`LoliSnatcher-PC-Setup-1.0.0.exe`** | Full Windows installer with Start Menu and Desktop shortcuts. |

---

## 🔑 API Setup

Connecting your Danbooru account is optional, but recommended for unrestricted downloading:

1. Log in to [Danbooru](https://danbooru.donmai.us/).
2. Navigate to your **Profile** page.
3. Under Account settings, find **API Key** and select **View API Key** (or create one).
4. In LoliSnatcher PC, open **Settings** (gear icon) → **Danbooru API Auth**.
5. Enter your **Username** and **API Key**, then click **Test API Connection**.
6. Click **Save Preferences**.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Arrow Left` | Previous post in viewer |
| `Arrow Right` | Next post in viewer |
| `Escape` | Close viewer / modal |
| `D` | Quick download original resolution |
| `F` | Toggle favorite |
| `Scroll Wheel` | Zoom in / out in viewer |

---

## 🛠️ Development & Build

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer)
- npm (v9 or newer)

### Setup
```bash
# Clone the repository
git clone https://github.com/PaYadyo/lolisnatcher-pc.git

# Enter the directory
cd lolisnatcher-pc

# Install dependencies
npm install
```

### Available Scripts

```bash
# Run desktop app in development mode
npm run electron:dev

# Run web browser preview
npm run dev

# Compile TypeScript and build production web assets
npm run build

# Package standalone Windows .exe installer and portable executable
npm run electron:build
```

---

## 🔒 Privacy Notice

- **Local Storage Only:** All user settings, Danbooru credentials, search history, and favorites are stored exclusively on your local machine using the browser/app local storage.
- **No Third-Party Tracking:** No analytics, tracking, telemetry, or remote telemetry servers are included.
- **Direct Requests:** Network traffic is exchanged exclusively between your computer and the respective booru API endpoints.

---

## ⚖️ Disclaimer

This application is a third-party open-source client for Danbooru and compatible booru image boards. It does not host, store, or own any images or media. All images belong to their respective creators and copyright holders. Users are responsible for complying with the terms of service of each respective content provider and their local laws regarding content access.

---

## 📄 License

Distributed under the [MIT License](LICENSE). See `LICENSE` for more information.
