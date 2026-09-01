const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { db, categorizeDomain, extractDomain, extractSearchQuery } = require('./db');

const os = require('os');

function chromeTimeToJsMs(chromeMicroseconds) {
  if (!chromeMicroseconds || chromeMicroseconds <= 0) return Date.now();
  // 11644473600000000 microseconds between 1601-01-01 and 1970-01-01
  return Math.floor((Number(chromeMicroseconds) - 11644473600000000) / 1000);
}

function getBrowserHistoryPath() {
  const platform = os.platform();
  const homeDir = os.homedir();
  const candidates = [];

  if (platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || path.join(homeDir, 'AppData', 'Local');
    candidates.push(
      { path: path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'History'), browser: 'Chrome (Default)' },
      { path: path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Profile 1', 'History'), browser: 'Chrome (Profile 1)' },
      { path: path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Profile 2', 'History'), browser: 'Chrome (Profile 2)' },
      { path: path.join(localAppData, 'Microsoft', 'Edge', 'User Data', 'Default', 'History'), browser: 'Edge (Default)' },
      { path: path.join(localAppData, 'Microsoft', 'Edge', 'User Data', 'Profile 1', 'History'), browser: 'Edge (Profile 1)' },
      { path: path.join(localAppData, 'BraveSoftware', 'Brave-Browser', 'User Data', 'Default', 'History'), browser: 'Brave (Default)' }
    );
  } else if (platform === 'darwin') {
    const appSupport = path.join(homeDir, 'Library', 'Application Support');
    candidates.push(
      { path: path.join(appSupport, 'Google', 'Chrome', 'Default', 'History'), browser: 'Chrome (Default)' },
      { path: path.join(appSupport, 'Google', 'Chrome', 'Profile 1', 'History'), browser: 'Chrome (Profile 1)' },
      { path: path.join(appSupport, 'Microsoft Edge', 'Default', 'History'), browser: 'Edge (Default)' },
      { path: path.join(appSupport, 'BraveSoftware', 'Brave-Browser', 'Default', 'History'), browser: 'Brave (Default)' }
    );
  } else {
    // Linux and other Unix-like systems
    candidates.push(
      { path: path.join(homeDir, '.config', 'google-chrome', 'Default', 'History'), browser: 'Chrome (Default)' },
      { path: path.join(homeDir, '.config', 'google-chrome', 'Profile 1', 'History'), browser: 'Chrome (Profile 1)' },
      { path: path.join(homeDir, '.config', 'chromium', 'Default', 'History'), browser: 'Chromium (Default)' },
      { path: path.join(homeDir, '.config', 'microsoft-edge', 'Default', 'History'), browser: 'Edge (Default)' },
      { path: path.join(homeDir, '.config', 'BraveSoftware', 'Brave-Browser', 'Default', 'History'), browser: 'Brave (Default)' }
    );
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate.path)) {
      return candidate;
    }
  }

  return null;
}

async function importActualBrowserHistory(limit = 50000) {
  const browserInfo = getBrowserHistoryPath();
  if (!browserInfo) {
    return { success: false, count: 0, error: 'No Chrome or Edge history database found on this computer.' };
  }

  const tempHistoryFile = path.join(__dirname, 'temp_browser_history.db');
  try {
    fs.copyFileSync(browserInfo.path, tempHistoryFile);
  } catch (err) {
    return { success: false, count: 0, error: 'Could not access browser history file: ' + err.message };
  }

  return new Promise((resolve) => {
    const srcDb = new sqlite3.Database(tempHistoryFile, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        try { fs.unlinkSync(tempHistoryFile); } catch (e) {}
        return resolve({ success: false, count: 0, error: err.message });
      }

      const query = `
        SELECT 
          u.id as url_id,
          u.url,
          u.title,
          u.visit_count,
          u.last_visit_time,
          v.id as visit_id,
          v.visit_time,
          v.visit_duration,
          v.from_visit,
          v.transition
        FROM urls u
        LEFT JOIN visits v ON u.id = v.url
        WHERE u.url NOT LIKE 'chrome://%' AND u.url NOT LIKE 'chrome-extension://%'
        ORDER BY u.last_visit_time DESC
        LIMIT ?
      `;

      srcDb.all(query, [limit], (queryErr, rows) => {
        srcDb.close();
        try { fs.unlinkSync(tempHistoryFile); } catch (e) {}

        if (queryErr) {
          return resolve({ success: false, count: 0, error: queryErr.message });
        }

        if (!rows || rows.length === 0) {
          return resolve({ success: true, count: 0, message: 'Browser history file had no URLs.' });
        }

        let insertedCount = 0;
        const insertStmt = db.prepare(`
          INSERT OR IGNORE INTO visits (
            id, url, domain, title, fav_icon_url, is_incognito, 
            start_time, end_time, duration_sec, parent_visit_id, 
            parent_url, parent_title, transition_type, search_query, 
            category, source
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        db.run('BEGIN TRANSACTION', () => {
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const startMs = chromeTimeToJsMs(row.visit_time || row.last_visit_time);
            const durationSec = Math.max(5, Math.round((row.visit_duration || 0) / 1000000));
            const endMs = startMs + (durationSec * 1000);
            const domain = extractDomain(row.url);
            const searchQuery = extractSearchQuery(row.url);
            const category = categorizeDomain(domain);
            const visitId = `chrome_${row.visit_id || row.url_id}_${startMs}_${i}`;
            const parentId = row.from_visit ? `chrome_parent_${row.from_visit}` : null;
            const favIconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

            insertStmt.run([
              visitId,
              row.url,
              domain,
              row.title || domain,
              favIconUrl,
              0,
              startMs,
              endMs,
              durationSec,
              parentId,
              null,
              null,
              row.transition ? String(row.transition) : 'link',
              searchQuery || null,
              category,
              'chrome_history_import'
            ]);
            insertedCount++;
          }

          insertStmt.finalize(() => {
            db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                resolve({ success: false, count: 0, error: commitErr.message });
              } else {
                resolve({
                  success: true,
                  count: insertedCount,
                  browser: browserInfo.browser,
                  message: `Successfully imported ${insertedCount} real history visits from ${browserInfo.browser} into SQLite!`
                });
              }
            });
          });
        });
      });
    });
  });
}

module.exports = {
  importActualBrowserHistory,
  getBrowserHistoryPath
};
