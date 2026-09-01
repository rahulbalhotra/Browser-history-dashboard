// LineageTrack - Background Service Worker (Manifest V3)
// 100% Real-Time Browser & Incognito Lineage Streamer to Local SQLite Database

const SERVER_URL = 'http://localhost:3001';

const STORAGE_KEYS = {
  VISITS: 'lineage_visits',
  DAILY_STATS: 'lineage_daily_stats'
};

let activeTabState = {
  tabId: null,
  windowId: null,
  visitId: null,
  url: '',
  domain: '',
  title: '',
  incognito: false,
  startTime: Date.now(),
  lastHeartbeat: Date.now(),
  isIdle: false
};

const tabLineageMap = new Map();

function extractDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch (e) {
    return 'other';
  }
}

function extractSearchQuery(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host.includes('google.') || host.includes('bing.') || host.includes('duckduckgo.') || host.includes('ecosia.')) {
      return parsed.searchParams.get('q') || '';
    }
    if (host.includes('youtube.')) {
      return parsed.searchParams.get('search_query') || '';
    }
    if (host.includes('github.')) {
      return parsed.searchParams.get('q') || '';
    }
    if (host.includes('reddit.')) {
      return parsed.searchParams.get('q') || '';
    }
  } catch (e) {}
  return '';
}

function generateId() {
  return 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
}

// Stream heartbeat tick to backend SQLite server
async function streamHeartbeatToServer(seconds = 1) {
  if (!activeTabState.visitId || activeTabState.isIdle || !activeTabState.url) return;

  try {
    fetch(`${SERVER_URL}/api/track/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitId: activeTabState.visitId,
        seconds: seconds,
        domain: activeTabState.domain,
        incognito: activeTabState.incognito,
        isIdle: false
      })
    }).catch(() => {});
  } catch (e) {}
}

// Stream new visit to backend SQLite server
async function streamVisitToServer(visitRecord) {
  try {
    fetch(`${SERVER_URL}/api/track/visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visitRecord)
    }).catch(() => {});
  } catch (e) {}
}

// Flush accumulated active time
async function recordActiveDwellTime() {
  if (!activeTabState.visitId || activeTabState.isIdle || !activeTabState.url) return;
  if (activeTabState.url.startsWith('chrome://') || activeTabState.url.startsWith('chrome-extension://')) return;

  const now = Date.now();
  const elapsedSeconds = Math.max(1, Math.round((now - activeTabState.lastHeartbeat) / 1000));
  activeTabState.lastHeartbeat = now;

  // Stream to SQLite backend in real-time
  await streamHeartbeatToServer(elapsedSeconds);

  // Maintain local storage copy
  try {
    const data = await chrome.storage.local.get([STORAGE_KEYS.VISITS]);
    const visits = data[STORAGE_KEYS.VISITS] || [];
    const visitIndex = visits.findIndex(v => v.id === activeTabState.visitId);
    if (visitIndex !== -1) {
      visits[visitIndex].durationSec = (visits[visitIndex].durationSec || 0) + elapsedSeconds;
      visits[visitIndex].endTime = now;
      await chrome.storage.local.set({ [STORAGE_KEYS.VISITS]: visits.slice(-5000) });
    }
  } catch (e) {}
}

// Record new page visit with lineage
async function recordNewVisit(tab, transitionType = 'link') {
  if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    return;
  }

  await recordActiveDwellTime();

  const domain = extractDomain(tab.url);
  const searchQuery = extractSearchQuery(tab.url);
  const now = Date.now();
  const visitId = generateId();

  // Resolve parent lineage
  let parentVisitId = null;
  let parentUrl = null;
  let parentTitle = null;

  if (tabLineageMap.has(tab.id)) {
    const prev = tabLineageMap.get(tab.id);
    parentVisitId = prev.currentVisitId;
    parentUrl = prev.url;
    parentTitle = prev.title;
  } else if (tab.openerTabId && tabLineageMap.has(tab.openerTabId)) {
    const parentTab = tabLineageMap.get(tab.openerTabId);
    parentVisitId = parentTab.currentVisitId;
    parentUrl = parentTab.url;
    parentTitle = parentTab.title;
  }

  tabLineageMap.set(tab.id, {
    currentVisitId: visitId,
    url: tab.url,
    title: tab.title || domain,
    openerTabId: tab.openerTabId || null
  });

  activeTabState = {
    tabId: tab.id,
    windowId: tab.windowId,
    visitId: visitId,
    url: tab.url,
    domain: domain,
    title: tab.title || domain,
    incognito: !!tab.incognito,
    startTime: now,
    lastHeartbeat: now,
    isIdle: false
  };

  const newVisitRecord = {
    id: visitId,
    tabId: tab.id,
    windowId: tab.windowId,
    url: tab.url,
    domain: domain,
    title: tab.title || domain,
    favIconUrl: tab.favIconUrl || `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
    incognito: !!tab.incognito,
    startTime: now,
    endTime: now,
    durationSec: 0,
    parentVisitId: parentVisitId,
    parentUrl: parentUrl,
    parentTitle: parentTitle,
    transitionType: transitionType,
    searchQuery: searchQuery
  };

  // Stream to SQLite backend immediately!
  await streamVisitToServer(newVisitRecord);

  // Save to local storage
  try {
    const data = await chrome.storage.local.get([STORAGE_KEYS.VISITS]);
    const visits = data[STORAGE_KEYS.VISITS] || [];
    visits.push(newVisitRecord);
    await chrome.storage.local.set({ [STORAGE_KEYS.VISITS]: visits.slice(-5000) });
  } catch (e) {}
}

// Proactively scan all open tabs (both Normal and Incognito)
function scanAllOpenTabs() {
  chrome.tabs.query({}, (tabs) => {
    if (chrome.runtime.lastError || !tabs) return;
    tabs.forEach((tab) => {
      if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
        if (!tabLineageMap.has(tab.id)) {
          recordNewVisit(tab, 'existing_tab');
        }
      }
    });
  });

  // Track the currently active tab
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (activeTabs) => {
    if (chrome.runtime.lastError || !activeTabs || !activeTabs[0]) return;
    const tab = activeTabs[0];
    if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
      if (tabLineageMap.has(tab.id)) {
        const existing = tabLineageMap.get(tab.id);
        activeTabState = {
          tabId: tab.id,
          windowId: tab.windowId,
          visitId: existing.currentVisitId,
          url: tab.url,
          domain: extractDomain(tab.url),
          title: tab.title || existing.title,
          incognito: !!tab.incognito,
          startTime: Date.now(),
          lastHeartbeat: Date.now(),
          isIdle: false
        };
        streamHeartbeatToServer(0);
      } else {
        recordNewVisit(tab, 'active_focus');
      }
    }
  });
}

// Navigation event listener
chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId !== 0) return;
  chrome.tabs.get(details.tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) return;
    recordNewVisit(tab, details.transitionType || 'link');
  });
});

chrome.webNavigation.onCreatedNavigationTarget.addListener((details) => {
  if (tabLineageMap.has(details.sourceTabId)) {
    const parent = tabLineageMap.get(details.sourceTabId);
    tabLineageMap.set(details.tabId, {
      currentVisitId: null,
      url: details.url,
      title: '',
      openerTabId: details.sourceTabId,
      parentVisitId: parent.currentVisitId
    });
  }
});

// Tab updated (URL or title changed or finished loading)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
    if (!tabLineageMap.has(tabId) || tabLineageMap.get(tabId).url !== tab.url) {
      recordNewVisit(tab, 'page_load');
    }
  }
});

// Tab Activated
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await recordActiveDwellTime();
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) return;
    if (tabLineageMap.has(tab.id)) {
      const existing = tabLineageMap.get(tab.id);
      activeTabState = {
        tabId: tab.id,
        windowId: tab.windowId,
        visitId: existing.currentVisitId,
        url: tab.url,
        domain: extractDomain(tab.url),
        title: tab.title || existing.title,
        incognito: !!tab.incognito,
        startTime: Date.now(),
        lastHeartbeat: Date.now(),
        isIdle: false
      };
      streamHeartbeatToServer(0);
    } else {
      recordNewVisit(tab, 'tab_switch');
    }
  });
});

// Window focus changed
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  await recordActiveDwellTime();
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    activeTabState.isIdle = true;
    try {
      fetch(`${SERVER_URL}/api/track/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isIdle: true })
      }).catch(() => {});
    } catch (e) {}
  } else {
    activeTabState.isIdle = false;
    chrome.tabs.query({ active: true, windowId }, (tabs) => {
      if (tabs && tabs[0]) {
        const tab = tabs[0];
        activeTabState.tabId = tab.id;
        activeTabState.incognito = !!tab.incognito;
        activeTabState.lastHeartbeat = Date.now();
        if (!tabLineageMap.has(tab.id)) {
          recordNewVisit(tab, 'window_focus');
        }
      }
    });
  }
});

// Idle state detection
chrome.idle.setDetectionInterval(60);
chrome.idle.onStateChanged.addListener(async (newState) => {
  if (newState === 'idle' || newState === 'locked') {
    await recordActiveDwellTime();
    activeTabState.isIdle = true;
  } else if (newState === 'active') {
    activeTabState.isIdle = false;
    activeTabState.lastHeartbeat = Date.now();
  }
});

// Periodic alarm every 2 seconds for continuous dwell time streaming & open tab scanning
chrome.alarms.create('dwell_heartbeat', { periodInMinutes: 0.05 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dwell_heartbeat') {
    recordActiveDwellTime();
    scanAllOpenTabs();
  }
});

// Run initial open tab scan immediately on load
scanAllOpenTabs();

// Popup messaging
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_CURRENT_STATUS') {
    recordActiveDwellTime().then(async () => {
      const data = await chrome.storage.local.get([STORAGE_KEYS.VISITS]);
      sendResponse({
        activeTab: activeTabState,
        totalVisitsLogged: (data[STORAGE_KEYS.VISITS] || []).length
      });
    });
    return true;
  }

  if (request.type === 'GET_ALL_DATA') {
    recordActiveDwellTime().then(async () => {
      const data = await chrome.storage.local.get(null);
      sendResponse(data);
    });
    return true;
  }

  if (request.type === 'CLEAR_DATA') {
    chrome.storage.local.clear().then(() => {
      tabLineageMap.clear();
      activeTabState.visitId = null;
      sendResponse({ success: true });
    });
    return true;
  }
});
