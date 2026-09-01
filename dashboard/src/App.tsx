import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  Compass, 
  Layers, 
  TrendingUp, 
  EyeOff, 
  Cpu, 
  Filter, 
  RefreshCw, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Globe 
} from 'lucide-react';
import { BrowsingVisit, DateRangeFilter, ModeFilter, TimeWindowFilter, LineageNode } from './types/tracking';
import { StorageService } from './services/storageService';
import { Header } from './components/Header';
import { LiveSessionBanner } from './components/LiveSessionBanner';
import { OverviewCards } from './components/OverviewCards';
import { TimeWindowFilterCard } from './components/TimeWindowFilterCard';
import { TopWebsitesSection } from './components/TopWebsitesSection';
import { LineageGraphView } from './components/LineageGraphView';
import { MonthlyTrendsView } from './components/MonthlyTrendsView';
import { IncognitoDeepDive } from './components/IncognitoDeepDive';
import { ExtensionSyncModal } from './components/ExtensionSyncModal';
import { VisitDetailModal } from './components/VisitDetailModal';

export const App: React.FC = () => {
  const [allVisits, setAllVisits] = useState<BrowsingVisit[]>([]);
  const [dateRange, setDateRange] = useState<DateRangeFilter>('all');
  const [timeWindow, setTimeWindow] = useState<TimeWindowFilter>('all');
  const [mode, setMode] = useState<ModeFilter>('all');
  const [activeTab, setActiveTab] = useState<'analytics' | 'lineage' | 'trends' | 'incognito' | 'extension'>('analytics');
  
  // Theme state: Day (Light Sketchbook Paper) or Night (Dark Charcoal / Blueprint)
  const [theme, setTheme] = useState<'day' | 'night'>(() => {
    const saved = localStorage.getItem('lineagetrack_theme');
    if (saved === 'day' || saved === 'night') return saved;
    return 'day'; // Default to Day paper mode as in reference image!
  });

  const [selectedVisit, setSelectedVisit] = useState<BrowsingVisit | LineageNode | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [activeLiveTab, setActiveLiveTab] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success?: boolean; message?: string } | null>(null);

  // Sync theme with HTML document class and local storage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'night') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('lineagetrack_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'day' ? 'night' : 'day');
  };

  // Initialize data on mount & connect WebSocket
  useEffect(() => {
    // 1. Fetch from SQLite Backend
    StorageService.fetchVisitsFromServer().then((data) => {
      setAllVisits(data);
    });

    // 2. Initialize Real-Time WebSocket stream
    StorageService.initWebSocket((event) => {
      if (event.type === 'INIT_STATE' || event.type === 'LIVE_ACTIVE_TAB') {
        setActiveLiveTab(event.data);
      } else if (event.type === 'NEW_VISIT') {
        setAllVisits((prev) => [event.data, ...prev.filter(v => v.id !== event.data.id)]);
      } else if (event.type === 'HEARTBEAT') {
        setActiveLiveTab((prev: any) => ({
          ...prev,
          durationSec: event.data.durationSec,
          isIdle: event.data.isIdle
        }));
        setAllVisits((prev) => {
          return prev.map(v => {
            if (v.id === event.data.visitId) {
              return { ...v, durationSec: event.data.durationSec };
            }
            return v;
          });
        });
      } else if (event.type === 'HISTORY_IMPORTED') {
        StorageService.fetchVisitsFromServer().then((data) => {
          setAllVisits(data);
        });
      }
    });
  }, []);

  const handleRefreshData = () => {
    StorageService.fetchVisitsFromServer().then((data) => {
      setAllVisits(data);
    });
  };

  const handleImportActualChromeHistory = async () => {
    setIsImporting(true);
    setImportResult(null);
    try {
      const res = await StorageService.importActualChromeHistory();
      setIsImporting(false);
      setImportResult(res);
      if (res.success && res.count > 0) {
        const fresh = await StorageService.fetchVisitsFromServer();
        setAllVisits(fresh);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err: any) {
      setIsImporting(false);
      setImportResult({ success: false, message: err.message });
    }
  };

  // Filtered visits based on global state
  const filteredVisits = useMemo(() => {
    return StorageService.filterVisits(allVisits, {
      dateRange,
      timeWindow,
      mode
    });
  }, [allVisits, dateRange, timeWindow, mode]);

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      theme === 'day' ? 'paper-pattern-light text-graphite-900' : 'paper-pattern-dark text-slate-100'
    }`}>
      
      {/* Top Sticky Header */}
      <Header
        dateRange={dateRange}
        setDateRange={setDateRange}
        mode={mode}
        setMode={setMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onRefreshData={handleRefreshData}
        totalVisits={allVisits.length}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 flex-1 flex flex-col gap-5">
        
        {/* Real-time Live Stream & Chrome History Sync Banner */}
        <LiveSessionBanner
          activeTab={activeLiveTab}
          onImportChromeHistory={handleImportActualChromeHistory}
          isImporting={isImporting}
          importResult={importResult}
          connectedToBackend={true}
          totalDbVisits={allVisits.length}
        />

        {/* Active Filter Notice Bar (if any filter is active) */}
        {(timeWindow !== 'all' || mode !== 'all' || dateRange !== 'all') && (
          <div className="sketch-card p-3 flex items-center justify-between text-xs bg-sky-50 dark:bg-sky-950/40 border-sky-600 dark:border-sky-500">
            <div className="flex items-center gap-2 flex-wrap text-graphite-800 dark:text-sky-200">
              <Filter className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span className="font-bold">Active Sketch Filters:</span>
              {mode !== 'all' && (
                <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 border border-purple-400 font-bold">
                  Mode: {mode === 'incognito' ? '🕶️ Incognito' : '🌐 Normal'}
                </span>
              )}
              {timeWindow !== 'all' && (
                <span className="px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-300 border border-sky-400 font-bold">
                  Window: {timeWindow}
                </span>
              )}
              {dateRange !== 'all' && (
                <span className="px-2 py-0.5 rounded-md bg-paper-200 dark:bg-paper-800 text-graphite-800 dark:text-slate-300 border border-graphite-400 font-bold">
                  Date: {dateRange}
                </span>
              )}
              <span className="text-graphite-600 dark:text-slate-400 font-mono">({filteredVisits.length} matching nodes)</span>
            </div>

            <button
              onClick={() => {
                setTimeWindow('all');
                setMode('all');
                setDateRange('all');
              }}
              className="text-sky-700 dark:text-sky-400 hover:underline font-bold text-xs ml-2 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Tab 1: Overview & Top Sites */}
        {activeTab === 'analytics' && (
          <div className="flex flex-col gap-5 animate-fade-in">
            <OverviewCards visits={filteredVisits} />
            <TimeWindowFilterCard
              visits={filteredVisits}
              selectedWindow={timeWindow}
              onSelectWindow={setTimeWindow}
            />
            <TopWebsitesSection
              visits={filteredVisits}
              onSelectVisitUrl={(url) => {
                const found = filteredVisits.find(v => v.url === url);
                if (found) setSelectedVisit(found);
              }}
            />
          </div>
        )}

        {/* Tab 2: Lineage Tree & Paths */}
        {activeTab === 'lineage' && (
          <div className="flex flex-col gap-5 animate-fade-in">
            <TimeWindowFilterCard
              visits={filteredVisits}
              selectedWindow={timeWindow}
              onSelectWindow={setTimeWindow}
            />
            <LineageGraphView
              visits={filteredVisits}
              onSelectVisit={(v) => setSelectedVisit(v)}
            />
          </div>
        )}

        {/* Tab 3: Monthly Trends */}
        {activeTab === 'trends' && (
          <div className="animate-fade-in">
            <MonthlyTrendsView visits={allVisits} />
          </div>
        )}

        {/* Tab 4: Incognito Deep-Dive */}
        {activeTab === 'incognito' && (
          <div className="animate-fade-in">
            <IncognitoDeepDive
              visits={filteredVisits}
              onSelectVisit={(v) => setSelectedVisit(v)}
            />
          </div>
        )}

        {/* Tab 5: Extension Setup Guide */}
        {activeTab === 'extension' && (
          <div className="sketch-card p-6 flex flex-col gap-5 animate-fade-in bg-white dark:bg-paper-900">
            <div className="flex items-center justify-between border-b border-graphite-300 dark:border-graphite-700 pb-3">
              <div>
                <h2 className="text-base font-bold text-graphite-900 dark:text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  <span>Chrome / Edge Extension Setup & Live Logging</span>
                </h2>
                <p className="text-xs text-graphite-600 dark:text-slate-400 mt-1">
                  Track real-time browsing history and lineage directly from your browser.
                </p>
              </div>
              <button
                onClick={() => setIsSyncModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sketch-btn flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Import Extension Data</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-paper-50 dark:bg-paper-800/80 border-1.5 border-graphite-400 dark:border-graphite-600 flex flex-col gap-2 shadow-sketch">
                <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300 font-bold flex items-center justify-center text-xs border border-sky-500">
                  1
                </span>
                <h3 className="text-sm font-bold text-graphite-900 dark:text-white">Install Manifest V3 Extension</h3>
                <p className="text-xs text-graphite-600 dark:text-slate-300 leading-relaxed">
                  Open <code className="text-sky-700 dark:text-sky-300 font-mono font-bold">chrome://extensions</code>, turn on Developer Mode, and click <b>Load unpacked</b> $\to$ select <code className="text-sky-700 dark:text-sky-300 font-mono">d:\Browser Tracking Dashboard\extension</code>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border-1.5 border-purple-400 dark:border-purple-700 flex flex-col gap-2 shadow-sketch">
                <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 font-bold flex items-center justify-center text-xs border border-purple-500">
                  2
                </span>
                <h3 className="text-sm font-bold text-purple-900 dark:text-purple-200">Enable Incognito Mode</h3>
                <p className="text-xs text-purple-800 dark:text-purple-300/80 leading-relaxed">
                  In Chrome Extensions details for LineageTrack, toggle ON <b>"Allow in Incognito"</b> so private windows stream lineage in real-time.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border-1.5 border-emerald-400 dark:border-emerald-700 flex flex-col gap-2 shadow-sketch">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 font-bold flex items-center justify-center text-xs border border-emerald-500">
                  3
                </span>
                <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">Live Real-Time Streaming</h3>
                <p className="text-xs text-emerald-800 dark:text-emerald-300/80 leading-relaxed">
                  The extension streams live tab events & heartbeats straight to the SQLite DB on <code className="text-emerald-700 dark:text-emerald-300 font-mono">localhost:3001</code>.
                </p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer in Sketch Paper style */}
      <footer className="border-t-2 border-graphite-300 dark:border-graphite-700 bg-paper-100/90 dark:bg-paper-900/90 py-3 text-center text-xs text-graphite-600 dark:text-graphite-400 font-sketch">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>LineageTrack • Sketch Paper Browsing Lineage & Dwell Time Analyzer</span>
          <span className="font-mono font-bold text-graphite-800 dark:text-slate-300">100% Real SQLite Database</span>
        </div>
      </footer>

      {/* Modals */}
      <ExtensionSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onDataImported={handleRefreshData}
        visits={allVisits}
      />

      <VisitDetailModal
        visit={selectedVisit}
        onClose={() => setSelectedVisit(null)}
        onSelectChild={(child) => setSelectedVisit(child)}
      />

    </div>
  );
};

export default App;
