# LineageTrack 🚀
### Browser & Incognito Lineage Analyzer and Real-Time Dashboard

LineageTrack is a high-performance browser activity tracking and analytics suite. It captures browsing lineage (parent-child navigation trees, search origins, direct navigations), records active dwell time across both Normal and Incognito modes, and provides an interactive visual dashboard.

---

## ✨ Features

- **🌐 Complete Browsing Lineage**: Maps URL-to-URL navigation paths, link transitions, and search engine queries into an interactive lineage graph.
- **🕶️ Incognito & Normal Tracking**: Seamlessly tracks active tabs across standard and incognito sessions using Manifest V3 spanning mode.
- **⏱️ Precise Active Dwell Time**: Intelligently measures real user engagement, pausing tracking when the browser is idle or tabs are backgrounded.
- **📊 Interactive Analytics Dashboard**:
  - **Overview Metrics**: Total active time, visit counts, normal vs. incognito ratio, domain distributions.
  - **Live Session Monitor**: Real-time heartbeat stream of the currently active tab.
  - **Top Websites & Categories**: Categorization across Development, Productivity, Social Media, Entertainment, Research, and Shopping.
  - **Time Window & Date Range Filters**: 6-hour blocks, custom ranges, and monthly trends.
  - **Interactive Tree & Graph Visualization**: Explore deep navigation chains from source search terms to target pages.
- **📦 Self-Contained Chrome Extension**: The dashboard is pre-built into the extension (`chrome-extension://...`) so you can launch and view everything with 1 click directly from your browser toolbar—no terminal servers required!
- **⚡ Optional Real-Time SQLite Server**: Includes an Express + WebSocket + SQLite backend with cross-platform Chrome/Edge/Brave history import capabilities.

---

## 📁 Project Structure

```text
Browser Tracking Dashboard/
├── extension/             # Chrome Extension (Manifest V3)
│   ├── dashboard/         # Bundled, self-contained React dashboard
│   ├── icons/             # Extension icon assets
│   ├── background.js      # Background service worker (real-time tracker)
│   ├── manifest.json      # Manifest V3 extension configuration
│   ├── popup.html         # Toolbar quick-status popup
│   ├── popup.js           # Popup controller & dashboard launcher
│   └── popup.css          # Sleek dark-mode styling for popup
├── dashboard/             # React 19 + TypeScript + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/    # UI widgets (Lineage graphs, metrics, filters, modals)
│   │   ├── services/      # Storage & WebSocket streaming service
│   │   ├── types/         # TypeScript data structures
│   │   └── utils/         # Time and domain formatters
│   ├── package.json
│   └── vite.config.ts     # Configured to build into ../extension/dashboard
├── server/                # Express + WebSocket + SQLite Backend (Optional)
│   ├── db.js              # SQLite schema & domain categorization engine
│   ├── chromeHistoryImporter.js # Dynamic cross-platform browser history importer
│   ├── server.js          # REST API & WebSocket event broadcast server
│   └── package.json
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Load the Chrome Extension

1. Open Google Chrome (or any Chromium browser like Edge, Brave).
2. Navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the [`extension`](file:///d:/Browser%20Tracking%20Dashboard/extension) folder from this project.
5. (Optional for Incognito): On the LineageTrack extension card, click **Details** and enable **"Allow in Incognito"**.
6. Pin **LineageTrack** to your browser toolbar.

---

### 2. Open the Dashboard

Click the pinned **LineageTrack** icon in your toolbar, then click **"🚀 Open Full Dashboard"**.

The dashboard opens instantly inside a new browser tab with live access to all your tracked data.

---

### 3. Optional: Run the SQLite Backend & Dev Server

If you want to use the local SQLite database and import your past browsing history from disk:

#### Start the Backend Server (Port 3001)
```bash
cd server
npm install
npm start
```

#### Run Frontend in Development Mode (Port 5173)
```bash
cd dashboard
npm install
npm run dev
```

#### Rebuild Extension Dashboard Bundle
```bash
cd dashboard
npm run build
```

---

## 🛠️ Tech Stack

- **Extension**: Chrome Extensions Manifest V3, WebNavigation API, Chrome Storage Local, Service Workers
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti
- **Backend**: Node.js, Express, WebSocket (`ws`), SQLite3
- **Data Engine**: Cross-platform history path resolution (Windows `%LOCALAPPDATA%`, macOS `Application Support`, Linux `~/.config`)

---

## 🔒 Privacy & Security

LineageTrack is designed with privacy as a first principle:
- All tracking data is stored **100% locally on your computer** (inside Chrome's local extension storage and optional local SQLite database).
- No browsing data is ever transmitted to external servers or third-party cloud services.

---

## 📄 License

MIT License. Feel free to use, modify, and build upon this project.
