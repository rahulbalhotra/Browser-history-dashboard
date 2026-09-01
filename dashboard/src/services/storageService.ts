import { 
  BrowsingVisit, 
  DomainMetric, 
  LineageNode, 
  MonthlyTrendSummary, 
  DateRangeFilter, 
  TimeWindowFilter, 
  TimeWindow6h,
  ModeFilter,
  CategoryType,
  PageVisitStat
} from '../types/tracking';

declare const chrome: any;

const API_BASE = 'http://localhost:3001/api';
const STORAGE_KEY = 'lineagetrack_dashboard_real_visits_v1';

export class StorageService {
  private static cachedVisits: BrowsingVisit[] | null = null;
  private static ws: WebSocket | null = null;
  private static wsListeners: Array<(event: { type: string; data: any }) => void> = [];

  // Check if running within Chrome Extension environment
  public static isExtensionContext(): boolean {
    try {
      return typeof chrome !== 'undefined' && Boolean(chrome?.storage?.local);
    } catch {
      return false;
    }
  }

  // Initialize WebSocket connection to local SQLite server and Chrome Storage listener
  public static initWebSocket(onMessage?: (event: { type: string; data: any }) => void) {
    if (onMessage) {
      this.wsListeners.push(onMessage);
    }

    // If running inside extension page, listen to live chrome.storage updates
    if (this.isExtensionContext()) {
      try {
        chrome.storage.onChanged.addListener((changes, areaName) => {
          if (areaName === 'local' && changes.lineage_visits) {
            const newVisits = changes.lineage_visits.newValue || [];
            this.cachedVisits = newVisits;
            this.wsListeners.forEach(listener => listener({ type: 'EXTENSION_STORAGE_UPDATED', data: newVisits }));
          }
        });
      } catch (e) {}
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket('ws://localhost:3001');

      this.ws.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          this.wsListeners.forEach(listener => listener(parsed));

          if (parsed.type === 'NEW_VISIT' && this.cachedVisits) {
            this.cachedVisits = [parsed.data, ...this.cachedVisits.filter(v => v.id !== parsed.data.id)];
          } else if (parsed.type === 'HEARTBEAT' && this.cachedVisits) {
            const v = this.cachedVisits.find(item => item.id === parsed.data.visitId);
            if (v) {
              v.durationSec = parsed.data.durationSec;
            }
          }
        } catch (err) {}
      };

      this.ws.onclose = () => {
        setTimeout(() => this.initWebSocket(), 3000);
      };
    } catch (e) {
      console.warn('WebSocket connection error:', e);
    }
  }

  // Fetch real visits from Chrome extension storage or SQLite database
  public static async fetchVisitsFromServer(): Promise<BrowsingVisit[]> {
    // 1. Try Chrome extension storage first if in extension context
    if (this.isExtensionContext()) {
      try {
        const data = await chrome.storage.local.get(['lineage_visits']);
        if (data && Array.isArray(data.lineage_visits) && data.lineage_visits.length > 0) {
          this.cachedVisits = data.lineage_visits;
          this.saveVisits(data.lineage_visits);
          return data.lineage_visits;
        }
      } catch (e) {
        console.warn('Could not read from chrome.storage.local:', e);
      }
    }

    // 2. Try backend server
    try {
      const res = await fetch(`${API_BASE}/visits?limit=5000`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.visits)) {
          this.cachedVisits = json.visits;
          this.saveVisits(json.visits);
          return json.visits;
        }
      }
    } catch (e) {
      console.warn('Backend server not reachable, using local cached visits:', e);
    }

    return this.getVisits();
  }

  // Import actual Chrome history from disk into SQLite
  public static async importActualChromeHistory(): Promise<{ success: boolean; count: number; browser?: string; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/import/chrome-history`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        await this.fetchVisitsFromServer();
      }
      return json;
    } catch (err: any) {
      return { success: false, count: 0, message: 'Could not connect to backend server: ' + err.message };
    }
  }

  public static getVisits(): BrowsingVisit[] {
    if (this.cachedVisits) {
      return this.cachedVisits;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.cachedVisits = parsed;
          return this.cachedVisits;
        }
      }
    } catch (e) {}

    this.cachedVisits = [];
    return [];
  }

  public static saveVisits(visits: BrowsingVisit[]): void {
    this.cachedVisits = visits;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
    } catch (e) {}
  }

  public static importExtensionData(jsonString: string): { success: boolean; count: number; error?: string } {
    try {
      const data = JSON.parse(jsonString);
      let newVisits: BrowsingVisit[] = [];

      if (Array.isArray(data)) {
        newVisits = data;
      } else if (data.lineage_visits && Array.isArray(data.lineage_visits)) {
        newVisits = data.lineage_visits;
      } else if (data.visits && Array.isArray(data.visits)) {
        newVisits = data.visits;
      } else {
        return { success: false, count: 0, error: 'JSON does not contain recognized visits array.' };
      }

      if (newVisits.length === 0) {
        return { success: false, count: 0, error: 'No visits found in JSON file.' };
      }

      const existing = this.getVisits();
      const existingIds = new Set(existing.map(v => v.id));
      const filteredNew = newVisits.filter(v => v && v.url && !existingIds.has(v.id));

      const merged = [...filteredNew, ...existing].sort((a, b) => b.startTime - a.startTime);
      this.saveVisits(merged);

      return { success: true, count: filteredNew.length };
    } catch (err: any) {
      return { success: false, count: 0, error: err.message || 'Invalid JSON format' };
    }
  }

  // Filter visits
  public static filterVisits(
    visits: BrowsingVisit[],
    filters: {
      dateRange: DateRangeFilter;
      timeWindow: TimeWindowFilter;
      mode: ModeFilter;
      category?: string;
      searchQuery?: string;
    }
  ): BrowsingVisit[] {
    const now = Date.now();

    return visits.filter(v => {
      if (filters.mode === 'normal' && v.incognito) return false;
      if (filters.mode === 'incognito' && !v.incognito) return false;

      const visitDate = new Date(v.startTime);
      const diffMs = now - v.startTime;
      const oneDayMs = 24 * 60 * 60 * 1000;

      if (filters.dateRange === 'today') {
        const nowDateStr = new Date(now).toISOString().slice(0, 10);
        const visitDateStr = visitDate.toISOString().slice(0, 10);
        if (nowDateStr !== visitDateStr) return false;
      } else if (filters.dateRange === 'yesterday') {
        const yesterdayDateStr = new Date(now - oneDayMs).toISOString().slice(0, 10);
        const visitDateStr = visitDate.toISOString().slice(0, 10);
        if (yesterdayDateStr !== visitDateStr) return false;
      } else if (filters.dateRange === '7d') {
        if (diffMs > 7 * oneDayMs) return false;
      } else if (filters.dateRange === '30d') {
        if (diffMs > 30 * oneDayMs) return false;
      } else if (filters.dateRange === '90d') {
        if (diffMs > 90 * oneDayMs) return false;
      } else if (filters.dateRange === '180d') {
        if (diffMs > 180 * oneDayMs) return false;
      } else if (filters.dateRange === '365d') {
        if (diffMs > 365 * oneDayMs) return false;
      }

      if (filters.timeWindow !== 'all') {
        const hour = visitDate.getHours();
        if (filters.timeWindow === '00:00-06:00' && (hour < 0 || hour >= 6)) return false;
        if (filters.timeWindow === '06:00-12:00' && (hour < 6 || hour >= 12)) return false;
        if (filters.timeWindow === '12:00-18:00' && (hour < 12 || hour >= 18)) return false;
        if (filters.timeWindow === '18:00-24:00' && (hour < 18 || hour >= 24)) return false;
      }

      if (filters.category && filters.category !== 'all' && v.category !== filters.category) {
        return false;
      }

      if (filters.searchQuery && filters.searchQuery.trim() !== '') {
        const q = filters.searchQuery.toLowerCase();
        const matches = 
          v.title.toLowerCase().includes(q) ||
          v.domain.toLowerCase().includes(q) ||
          v.url.toLowerCase().includes(q) ||
          (v.searchQuery && v.searchQuery.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }

  // Aggregate Domain Metrics
  public static getDomainMetrics(visits: BrowsingVisit[]): DomainMetric[] {
    const domainMap = new Map<string, {
      visits: number;
      durationSec: number;
      normalDurationSec: number;
      incognitoDurationSec: number;
      category: CategoryType;
      pagesMap: Map<string, PageVisitStat>;
      searchQueries: Set<string>;
      favIconUrl?: string;
    }>();

    for (const v of visits) {
      if (!domainMap.has(v.domain)) {
        domainMap.set(v.domain, {
          visits: 0,
          durationSec: 0,
          normalDurationSec: 0,
          incognitoDurationSec: 0,
          category: v.category,
          pagesMap: new Map(),
          searchQueries: new Set(),
          favIconUrl: v.favIconUrl
        });
      }

      const entry = domainMap.get(v.domain)!;
      entry.visits += 1;
      entry.durationSec += (v.durationSec || 0);
      if (v.incognito) {
        entry.incognitoDurationSec += (v.durationSec || 0);
      } else {
        entry.normalDurationSec += (v.durationSec || 0);
      }

      if (v.searchQuery) {
        entry.searchQueries.add(v.searchQuery);
      }

      if (!entry.pagesMap.has(v.url)) {
        entry.pagesMap.set(v.url, {
          url: v.url,
          title: v.title,
          visits: 0,
          durationSec: 0,
          incognito: v.incognito
        });
      }
      const pageEntry = entry.pagesMap.get(v.url)!;
      pageEntry.visits += 1;
      pageEntry.durationSec += (v.durationSec || 0);
    }

    const result: DomainMetric[] = [];
    domainMap.forEach((entry, domain) => {
      const topPages = Array.from(entry.pagesMap.values())
        .sort((a, b) => b.durationSec - a.durationSec)
        .slice(0, 5);

      result.push({
        domain,
        visits: entry.visits,
        durationSec: entry.durationSec,
        normalDurationSec: entry.normalDurationSec,
        incognitoDurationSec: entry.incognitoDurationSec,
        category: entry.category,
        topPages,
        searchQueries: Array.from(entry.searchQueries),
        favIconUrl: entry.favIconUrl,
        avgDurationSec: Math.round(entry.durationSec / Math.max(1, entry.visits))
      });
    });

    return result.sort((a, b) => b.durationSec - a.durationSec);
  }

  // Construct Lineage Trees
  public static buildLineageTrees(visits: BrowsingVisit[]): LineageNode[] {
    const nodeMap = new Map<string, LineageNode>();
    const roots: LineageNode[] = [];

    for (const v of visits) {
      nodeMap.set(v.id, {
        id: v.id,
        title: v.title,
        url: v.url,
        domain: v.domain,
        durationSec: v.durationSec || 0,
        incognito: v.incognito,
        searchQuery: v.searchQuery,
        transitionType: v.transitionType,
        timestamp: v.startTime,
        favIconUrl: v.favIconUrl,
        category: v.category,
        children: [],
        parentVisitId: v.parentVisitId
      });
    }

    for (const v of visits) {
      const node = nodeMap.get(v.id)!;
      if (v.parentVisitId && nodeMap.has(v.parentVisitId)) {
        const parentNode = nodeMap.get(v.parentVisitId)!;
        parentNode.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Monthly Behavioral Trend Analytics
  public static getMonthlyTrends(visits: BrowsingVisit[]): MonthlyTrendSummary[] {
    const monthMap = new Map<string, {
      monthKey: string;
      monthName: string;
      totalSec: number;
      normalSec: number;
      incognitoSec: number;
      totalVisits: number;
      categories: Record<CategoryType, number>;
      domainSec: Map<string, { sec: number; visits: number; category: CategoryType }>;
      hourlySec: number[];
      nightSec: number;
    }>();

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const initialCategories: Record<CategoryType, number> = {
      Development: 0,
      Productivity: 0,
      Entertainment: 0,
      'Social Media': 0,
      'Research & News': 0,
      Shopping: 0,
      General: 0
    };

    for (const v of visits) {
      const date = new Date(v.startTime);
      const year = date.getFullYear();
      const monthIdx = date.getMonth();
      const monthKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
      const monthName = `${monthNames[monthIdx]} ${year}`;

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          monthKey,
          monthName,
          totalSec: 0,
          normalSec: 0,
          incognitoSec: 0,
          totalVisits: 0,
          categories: { ...initialCategories },
          domainSec: new Map(),
          hourlySec: Array(24).fill(0),
          nightSec: 0
        });
      }

      const m = monthMap.get(monthKey)!;
      m.totalSec += (v.durationSec || 0);
      m.totalVisits += 1;

      if (v.incognito) {
        m.incognitoSec += (v.durationSec || 0);
      } else {
        m.normalSec += (v.durationSec || 0);
      }

      if (v.category) {
        m.categories[v.category] = (m.categories[v.category] || 0) + (v.durationSec || 0);
      }

      if (!m.domainSec.has(v.domain)) {
        m.domainSec.set(v.domain, { sec: 0, visits: 0, category: v.category });
      }
      const dom = m.domainSec.get(v.domain)!;
      dom.sec += (v.durationSec || 0);
      dom.visits += 1;

      const hour = date.getHours();
      m.hourlySec[hour] += (v.durationSec || 0);
      if (hour >= 0 && hour < 6) {
        m.nightSec += (v.durationSec || 0);
      }
    }

    const summaries: MonthlyTrendSummary[] = [];

    monthMap.forEach((m) => {
      const totalHours = Math.round((m.totalSec / 3600) * 10) / 10;
      const normalHours = Math.round((m.normalSec / 3600) * 10) / 10;
      const incognitoHours = Math.round((m.incognitoSec / 3600) * 10) / 10;

      const categoryBreakdown: Record<CategoryType, number> = {} as any;
      Object.entries(m.categories).forEach(([cat, sec]) => {
        categoryBreakdown[cat as CategoryType] = Math.round((sec / 3600) * 10) / 10;
      });

      const topDomains = Array.from(m.domainSec.entries())
        .map(([domain, data]) => ({
          domain,
          hours: Math.round((data.sec / 3600) * 10) / 10,
          visits: data.visits,
          category: data.category
        }))
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 6);

      const productiveSec = (m.categories.Development || 0) + (m.categories.Productivity || 0) + (m.categories['Research & News'] || 0);
      const focusScore = m.totalSec > 0 ? Math.min(100, Math.round((productiveSec / m.totalSec) * 100)) : 50;

      const maxHourly = Math.max(1, ...m.hourlySec);
      const hourlyDistribution = m.hourlySec.map(sec => Math.round((sec / maxHourly) * 100));
      const nightBrowsingRatio = m.totalSec > 0 ? Math.round((m.nightSec / m.totalSec) * 100) : 0;

      summaries.push({
        monthKey: m.monthKey,
        monthName: m.monthName,
        totalHours,
        normalHours,
        incognitoHours,
        totalVisits: m.totalVisits,
        categoryBreakdown,
        topDomains,
        hourlyDistribution,
        focusScore,
        nightBrowsingRatio
      });
    });

    return summaries.sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }

  // 6-Hour Time Window Matrix
  public static get6HourWindowMatrix(visits: BrowsingVisit[]): Record<TimeWindow6h, {
    totalSec: number;
    normalSec: number;
    incognitoSec: number;
    visitsCount: number;
    topCategory: CategoryType;
    topDomain: string;
  }> {
    const matrix: Record<TimeWindow6h, {
      totalSec: number;
      normalSec: number;
      incognitoSec: number;
      visitsCount: number;
      categories: Record<string, number>;
      domains: Record<string, number>;
    }> = {
      '00:00-06:00': { totalSec: 0, normalSec: 0, incognitoSec: 0, visitsCount: 0, categories: {}, domains: {} },
      '06:00-12:00': { totalSec: 0, normalSec: 0, incognitoSec: 0, visitsCount: 0, categories: {}, domains: {} },
      '12:00-18:00': { totalSec: 0, normalSec: 0, incognitoSec: 0, visitsCount: 0, categories: {}, domains: {} },
      '18:00-24:00': { totalSec: 0, normalSec: 0, incognitoSec: 0, visitsCount: 0, categories: {}, domains: {} }
    };

    for (const v of visits) {
      const hour = new Date(v.startTime).getHours();
      let windowKey: TimeWindow6h;
      if (hour < 6) windowKey = '00:00-06:00';
      else if (hour < 12) windowKey = '06:00-12:00';
      else if (hour < 18) windowKey = '12:00-18:00';
      else windowKey = '18:00-24:00';

      const w = matrix[windowKey];
      w.totalSec += (v.durationSec || 0);
      w.visitsCount += 1;
      if (v.incognito) {
        w.incognitoSec += (v.durationSec || 0);
      } else {
        w.normalSec += (v.durationSec || 0);
      }

      w.categories[v.category] = (w.categories[v.category] || 0) + (v.durationSec || 0);
      w.domains[v.domain] = (w.domains[v.domain] || 0) + (v.durationSec || 0);
    }

    const output: any = {};
    (Object.keys(matrix) as TimeWindow6h[]).forEach(k => {
      const w = matrix[k];
      const topCat = Object.entries(w.categories).sort((a, b) => b[1] - a[1])[0]?.[0] || 'General';
      const topDom = Object.entries(w.domains).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

      output[k] = {
        totalSec: w.totalSec,
        normalSec: w.normalSec,
        incognitoSec: w.incognitoSec,
        visitsCount: w.visitsCount,
        topCategory: topCat as CategoryType,
        topDomain: topDom
      };
    });

    return output;
  }
}
