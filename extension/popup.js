// LineageTrack - Popup Script

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0s';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

function updateUI() {
  chrome.runtime.sendMessage({ type: 'GET_CURRENT_STATUS' }, (response) => {
    if (chrome.runtime.lastError || !response) return;

    const { activeTab, today, totalVisitsLogged } = response;

    // Total today dwell time
    document.getElementById('todayTotalTime').textContent = formatDuration(today.totalSeconds || 0);
    document.getElementById('todayNormalTime').textContent = formatDuration(today.normalSeconds || 0);
    document.getElementById('todayIncognitoTime').textContent = formatDuration(today.incognitoSeconds || 0);

    // Active tab info
    if (activeTab && activeTab.url) {
      document.getElementById('activeTabTitle').textContent = activeTab.title || 'Untitled page';
      document.getElementById('activeTabDomain').textContent = activeTab.domain || '';
      
      const modeTag = document.getElementById('currentModeTag');
      if (activeTab.incognito) {
        modeTag.textContent = '🕶️ Incognito';
        modeTag.className = 'mode-tag incognito';
      } else {
        modeTag.textContent = '🌐 Normal';
        modeTag.className = 'mode-tag';
      }

      // Lineage indicator
      const lineageText = document.getElementById('lineageParentText');
      if (activeTab.searchQuery) {
        lineageText.textContent = `Search: "${activeTab.searchQuery}"`;
      } else if (activeTab.parentTitle) {
        lineageText.textContent = `From: ${activeTab.parentTitle}`;
      } else {
        lineageText.textContent = 'Direct navigation / root';
      }
    } else {
      document.getElementById('activeTabTitle').textContent = 'No active webpage';
      document.getElementById('activeTabDomain').textContent = '—';
      document.getElementById('lineageParentText').textContent = 'Direct navigation';
    }

    // Top visited list
    const topListEl = document.getElementById('topSitesList');
    const domains = today.domains || {};
    const domainKeys = Object.keys(domains).sort((a, b) => (domains[b].durationSec || 0) - (domains[a].durationSec || 0));

    document.getElementById('totalVisitsBadge').textContent = `${totalVisitsLogged || 0} visits`;

    if (domainKeys.length === 0) {
      topListEl.innerHTML = '<div class="empty-state">Browsing activity will appear here...</div>';
    } else {
      topListEl.innerHTML = domainKeys.slice(0, 4).map(dom => {
        const item = domains[dom];
        return `
          <div class="site-item">
            <div class="site-info">
              <span class="site-domain" title="${dom}">${dom}</span>
            </div>
            <div class="site-time">${formatDuration(item.durationSec || 0)}</div>
          </div>
        `;
      }).join('');
    }
  });
}

// Open Dashboard
document.getElementById('openDashboardBtn').addEventListener('click', () => {
  const dashboardUrl = chrome.runtime.getURL('dashboard/index.html');
  chrome.tabs.create({ url: dashboardUrl });
});

// Export JSON
document.getElementById('exportJsonBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'GET_ALL_DATA' }, (data) => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lineagetrack_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
});

// Clear Data
document.getElementById('clearDataBtn').addEventListener('click', () => {
  if (confirm('Are you sure you want to reset all tracked history?')) {
    chrome.runtime.sendMessage({ type: 'CLEAR_DATA' }, () => {
      updateUI();
    });
  }
});

// Initial update & 1s polling while popup is open
updateUI();
const interval = setInterval(updateUI, 1000);
window.addEventListener('unload', () => clearInterval(interval));
