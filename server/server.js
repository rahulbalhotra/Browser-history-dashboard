const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { db, initDatabase, categorizeDomain, extractDomain, extractSearchQuery } = require('./db');
const { importActualBrowserHistory, getBrowserHistoryPath } = require('./chromeHistoryImporter');

const PORT = 3001;
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// In-memory live state
let currentActiveState = {
  tabId: null,
  visitId: null,
  url: '',
  domain: '',
  title: '',
  isIncognito: false,
  durationSec: 0,
  isIdle: false,
  lastUpdated: Date.now()
};

// Broadcast helper to all connected WebSocket clients
function broadcastWs(type, data) {
  const message = JSON.stringify({ type, data, timestamp: Date.now() });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws) => {
  // Send current active state immediately on connect
  ws.send(JSON.stringify({ type: 'INIT_STATE', data: currentActiveState }));
});

// ==========================================
// TRACKING ENDPOINTS (Used by Chrome Extension)
// ==========================================

// 1. Log New Page Visit (Normal or Incognito)
app.post('/api/track/visit', (req, res) => {
  const {
    id,
    url,
    title,
    favIconUrl,
    incognito,
    startTime,
    parentVisitId,
    parentUrl,
    parentTitle,
    transitionType,
    searchQuery
  } = req.body;

  if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
    return res.json({ success: true, ignored: true });
  }

  const domain = extractDomain(url);
  const detectedSearch = searchQuery || extractSearchQuery(url);
  const category = categorizeDomain(domain);
  const startMs = startTime || Date.now();
  const isIncog = incognito ? 1 : 0;
  const visitId = id || `v_${startMs}_${Math.random().toString(36).substring(2, 7)}`;

  const query = `
    INSERT OR REPLACE INTO visits (
      id, url, domain, title, fav_icon_url, is_incognito,
      start_time, end_time, duration_sec, parent_visit_id,
      parent_url, parent_title, transition_type, search_query,
      category, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, 'extension')
  `;

  db.run(query, [
    visitId,
    url,
    domain,
    title || domain,
    favIconUrl || `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
    isIncog,
    startMs,
    startMs,
    parentVisitId || null,
    parentUrl || null,
    parentTitle || null,
    transitionType || 'link',
    detectedSearch || null,
    category
  ], function (err) {
    if (err) {
      console.error('Error inserting visit:', err);
      return res.status(500).json({ success: false, error: err.message });
    }

    currentActiveState = {
      tabId: req.body.tabId || null,
      visitId: visitId,
      url,
      domain,
      title: title || domain,
      isIncognito: !!incognito,
      durationSec: 0,
      isIdle: false,
      lastUpdated: Date.now()
    };

    const newVisitObj = {
      id: visitId,
      url,
      domain,
      title: title || domain,
      favIconUrl: favIconUrl || `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      incognito: !!incognito,
      startTime: startMs,
      endTime: startMs,
      durationSec: 0,
      parentVisitId: parentVisitId || null,
      parentUrl: parentUrl || null,
      parentTitle: parentTitle || null,
      transitionType: transitionType || 'link',
      searchQuery: detectedSearch || null,
      category
    };

    broadcastWs('NEW_VISIT', newVisitObj);
    broadcastWs('LIVE_ACTIVE_TAB', currentActiveState);

    res.json({ success: true, visitId });
  });
});

// 2. Dwell Time Heartbeat (Every active second or tick)
app.post('/api/track/heartbeat', (req, res) => {
  const { visitId, seconds = 1, isIdle = false, domain, incognito } = req.body;

  if (isIdle || !visitId) {
    currentActiveState.isIdle = true;
    broadcastWs('LIVE_ACTIVE_TAB', currentActiveState);
    return res.json({ success: true, idle: true });
  }

  const now = Date.now();
  currentActiveState.isIdle = false;
  currentActiveState.durationSec += seconds;
  currentActiveState.lastUpdated = now;

  // Update visit in SQLite
  db.run(`
    UPDATE visits 
    SET duration_sec = duration_sec + ?, end_time = ? 
    WHERE id = ?
  `, [seconds, now, visitId], function (err) {
    if (err) {
      console.error('Error updating dwell time:', err);
    }

    // Insert heartbeat record
    if (domain) {
      db.run(`
        INSERT INTO dwell_heartbeats (visit_id, domain, is_incognito, timestamp, seconds)
        VALUES (?, ?, ?, ?, ?)
      `, [visitId, domain, incognito ? 1 : 0, now, seconds]);
    }

    broadcastWs('HEARTBEAT', {
      visitId,
      durationSec: currentActiveState.durationSec,
      domain: currentActiveState.domain,
      isIncognito: currentActiveState.isIncognito,
      isIdle: false
    });

    res.json({ success: true, durationSec: currentActiveState.durationSec });
  });
});

// ==========================================
// DASHBOARD QUERY API (SQLite Powered)
// ==========================================

// Get all visits with filtering
app.get('/api/visits', (req, res) => {
  const { mode, dateRange, timeWindow, category, search, limit = 5000 } = req.query;

  let query = 'SELECT * FROM visits WHERE 1=1';
  const params = [];

  // Mode filter
  if (mode === 'normal') {
    query += ' AND is_incognito = 0';
  } else if (mode === 'incognito') {
    query += ' AND is_incognito = 1';
  }

  // Category filter
  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(category);
  }

  // Search filter
  if (search && search.trim() !== '') {
    query += ' AND (title LIKE ? OR domain LIKE ? OR search_query LIKE ? OR url LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term, term, term);
  }

  query += ' ORDER BY start_time DESC LIMIT ?';
  params.push(Number(limit));

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }

    // Map rows to clean frontend schema
    const visits = (rows || []).map(r => ({
      id: r.id,
      url: r.url,
      domain: r.domain,
      title: r.title,
      favIconUrl: r.fav_icon_url,
      incognito: r.is_incognito === 1,
      startTime: r.start_time,
      endTime: r.end_time,
      durationSec: r.duration_sec,
      parentVisitId: r.parent_visit_id,
      parentUrl: r.parent_url,
      parentTitle: r.parent_title,
      transitionType: r.transition_type,
      searchQuery: r.search_query,
      category: r.category,
      source: r.source
    }));

    res.json({ success: true, count: visits.length, visits });
  });
});

// Live Status & Active Tab
app.get('/api/live-status', (req, res) => {
  res.json({
    success: true,
    activeTab: currentActiveState,
    connectedClients: wss.clients.size
  });
});

// Trigger Real Chrome/Edge History Import
app.post('/api/import/chrome-history', async (req, res) => {
  const result = await importActualBrowserHistory(5000);
  if (result.success) {
    broadcastWs('HISTORY_IMPORTED', { count: result.count, browser: result.browser });
  }
  res.json(result);
});

// Check if Chrome history exists on disk
app.get('/api/browser-history-status', (req, res) => {
  const info = getBrowserHistoryPath();
  res.json({
    hasHistoryFile: !!info,
    browser: info ? info.browser : 'None found',
    path: info ? info.path : null
  });
});

// Clear Database / Reset
app.post('/api/clear-data', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM visits');
    db.run('DELETE FROM dwell_heartbeats', (err) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      broadcastWs('DATA_CLEARED', {});
      res.json({ success: true, message: 'SQLite database cleared' });
    });
  });
});

// Start server
initDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 LineageTrack SQLite & WebSocket Backend Running!`);
    console.log(`📡 HTTP REST API: http://localhost:${PORT}`);
    console.log(`⚡ WebSocket Stream: ws://localhost:${PORT}`);
    console.log(`🗄️  SQLite Database: d:\\Browser Tracking Dashboard\\server\\tracking.db`);
    console.log(`=======================================================`);
  });
}).catch((err) => {
  console.error('Failed to init SQLite DB:', err);
});
