# 🌐 LineageTrack Browser Extension

A Manifest V3 extension for Chrome, Edge, Brave, and Opera that captures browsing lineage, active dwell time, and supports both Normal and Incognito modes.

## 🚀 How to Install in Your Browser

### Step 1: Open Extensions Page
- In **Chrome**: Go to `chrome://extensions`
- In **Edge**: Go to `edge://extensions`
- In **Brave**: Go to `brave://extensions`

### Step 2: Enable Developer Mode
- Turn on the **Developer mode** toggle in the top-right corner.

### Step 3: Load Unpacked Extension
- Click **"Load unpacked"** (top-left).
- Select the `extension` folder inside this project directory (`d:\Browser Tracking Dashboard\extension`).

### Step 4: Enable Incognito Tracking (Crucial for Incognito Lineage!)
1. On the `chrome://extensions` page, find **LineageTrack**.
2. Click **Details**.
3. Scroll down and toggle ON **"Allow in Incognito"**.
4. That's it! The extension will now track navigation trees and dwell time in both normal windows and private incognito windows seamlessly.

---

## ⚡ Features
- **Active Dwell Time**: True active focused time tracking (auto-pauses when idle/locked).
- **Navigation Lineage Tree**: Connects search queries, parent URLs, link clicks, and tab ancestry.
- **Normal & Incognito**: Unified spanning background service worker.
- **Privacy First**: 100% local storage on your device.
