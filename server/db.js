const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'tracking.db');
const db = new sqlite3.Database(DB_PATH);

// Helper function to categorize domain
function categorizeDomain(domain) {
  if (!domain) return 'General';
  domain = domain.toLowerCase();
  if (/github|gitlab|stackoverflow|dev\.to|npmjs|pypi|docker|aws|cloud\.google|azure|vercel|netlify|codepen|leetcode|hashnode|localhost|127\.0\.0\.1/.test(domain)) {
    return 'Development';
  }
  if (/notion|slack|asana|jira|trello|linear|google\.com\/docs|workspace|docs\.google|calendar\.google|figma|miro|zoom|mail\.google/.test(domain)) {
    return 'Productivity';
  }
  if (/youtube|netflix|twitch|spotify|disney|primevideo|hulu|tiktok|soundcloud|crunchyroll/.test(domain)) {
    return 'Entertainment';
  }
  if (/reddit|twitter|x\.com|linkedin|facebook|instagram|threads\.net|discord|pinterest/.test(domain)) {
    return 'Social Media';
  }
  if (/wikipedia|arxiv|scholar\.google|medium|substack|quora|researchgate|nature\.com|nytimes|theverge|techcrunch/.test(domain)) {
    return 'Research & News';
  }
  if (/amazon|ebay|aliexpress|shopify|walmart|etsy|target\.com|flipkart/.test(domain)) {
    return 'Shopping';
  }
  return 'General';
}

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

// Initialize SQLite Schema
function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS visits (
          id TEXT PRIMARY KEY,
          url TEXT NOT NULL,
          domain TEXT NOT NULL,
          title TEXT,
          fav_icon_url TEXT,
          is_incognito INTEGER DEFAULT 0,
          start_time INTEGER NOT NULL,
          end_time INTEGER NOT NULL,
          duration_sec INTEGER DEFAULT 0,
          parent_visit_id TEXT,
          parent_url TEXT,
          parent_title TEXT,
          transition_type TEXT DEFAULT 'link',
          search_query TEXT,
          category TEXT DEFAULT 'General',
          source TEXT DEFAULT 'extension',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`CREATE INDEX IF NOT EXISTS idx_visits_domain ON visits(domain)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_visits_start_time ON visits(start_time)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_visits_incognito ON visits(is_incognito)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_visits_parent ON visits(parent_visit_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_visits_category ON visits(category)`);

      // Heartbeat table for granular time ticks
      db.run(`
        CREATE TABLE IF NOT EXISTS dwell_heartbeats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          visit_id TEXT NOT NULL,
          domain TEXT NOT NULL,
          is_incognito INTEGER DEFAULT 0,
          timestamp INTEGER NOT NULL,
          seconds INTEGER DEFAULT 1
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

module.exports = {
  db,
  initDatabase,
  categorizeDomain,
  extractDomain,
  extractSearchQuery
};
