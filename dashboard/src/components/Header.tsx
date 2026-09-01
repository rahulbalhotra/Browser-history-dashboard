import React from 'react';
import { 
  Compass, 
  Eye, 
  EyeOff, 
  Layers, 
  Calendar, 
  RefreshCw, 
  Cpu,
  Sun,
  Moon,
  Database,
  SlidersHorizontal,
  FolderTree,
  TrendingUp,
  Activity,
  Sparkles,
  Puzzle
} from 'lucide-react';
import { DateRangeFilter, ModeFilter } from '../types/tracking';

interface HeaderProps {
  dateRange: DateRangeFilter;
  setDateRange: (range: DateRangeFilter) => void;
  mode: ModeFilter;
  setMode: (mode: ModeFilter) => void;
  activeTab: 'analytics' | 'lineage' | 'trends' | 'incognito' | 'extension';
  setActiveTab: (tab: 'analytics' | 'lineage' | 'trends' | 'incognito' | 'extension') => void;
  onOpenSyncModal: () => void;
  onRefreshData: () => void;
  totalVisits: number;
  theme: 'day' | 'night';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  dateRange,
  setDateRange,
  mode,
  setMode,
  activeTab,
  setActiveTab,
  onOpenSyncModal,
  onRefreshData,
  totalVisits,
  theme,
  onToggleTheme
}) => {
  const dateRanges: { id: DateRangeFilter; label: string }[] = [
    { id: 'all', label: 'All Real History (Unlimited)' },
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
    { id: '90d', label: 'Last 90 Days' },
    { id: '180d', label: 'Last 6 Months (180d)' },
    { id: '365d', label: 'Last 1 Year (365d)' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-paper-100/95 dark:bg-paper-900/95 backdrop-blur-md border-b-2 border-graphite-700/70 dark:border-graphite-500/50 shadow-sketch transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3.5">
          
          {/* Brand & Status matching reference image */}
          <div className="flex items-center gap-3">
            {/* Hand-drawn double ring logo */}
            <div className="relative flex items-center justify-center w-10 h-10 rounded-full border-2 border-graphite-800 dark:border-graphite-300 bg-white dark:bg-paper-800 shadow-sketch">
              <div className="w-8 h-8 rounded-full border border-dashed border-sky-500 flex items-center justify-center">
                <Compass className="w-5 h-5 text-sky-600 dark:text-sky-400 rotate-12" />
              </div>
              {/* Green indicator ink dot */}
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border border-graphite-800 dark:border-white shadow-xs"></span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-graphite-900 dark:text-white font-sketch whitespace-nowrap">
                  Lineage Track
                </h1>
                <span className="px-2.5 py-0.5 text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-1.5 border-emerald-600 dark:border-emerald-500 sketch-pill font-mono">
                  SQLITE CORE
                </span>
              </div>
              <p className="text-xs text-graphite-600 dark:text-graphite-400 font-sketch flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
                <span>Live Dwell & Navigation Lineage</span>
                <span>•</span>
                <span className="font-semibold text-graphite-800 dark:text-graphite-200">{totalVisits.toLocaleString()} active nodes</span>
              </p>
            </div>
          </div>

          {/* Right Controls matching reference image */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Mode Switcher Buttons */}
            <div className="inline-flex p-0.5 rounded-xl border-1.5 border-graphite-700 dark:border-graphite-400 bg-paper-50 dark:bg-paper-800 shadow-sketch">
              <button
                onClick={() => setMode('all')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  mode === 'all'
                    ? 'bg-graphite-800 text-white dark:bg-slate-200 dark:text-graphite-900 shadow-xs'
                    : 'text-graphite-700 dark:text-graphite-300 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                title="All browsing sessions"
              >
                <Layers className="w-3.5 h-3.5 text-sky-500" />
                <span>All Modes</span>
              </button>

              <button
                onClick={() => setMode('normal')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  mode === 'normal'
                    ? 'bg-sky-600 text-white dark:bg-sky-500 dark:text-white shadow-xs'
                    : 'text-graphite-700 dark:text-graphite-300 hover:text-sky-600 dark:hover:text-sky-300'
                }`}
                title="Normal browsing mode only"
              >
                <Eye className="w-3.5 h-3.5 text-sky-500" />
                <span>Normal</span>
              </button>

              <button
                onClick={() => setMode('incognito')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  mode === 'incognito'
                    ? 'bg-purple-600 text-white dark:bg-purple-500 dark:text-white shadow-xs'
                    : 'text-graphite-700 dark:text-graphite-300 hover:text-purple-600 dark:hover:text-purple-300'
                }`}
                title="Incognito private sessions only"
              >
                <EyeOff className="w-3.5 h-3.5 text-purple-500" />
                <span>Incognito</span>
              </button>
            </div>

            {/* Date Range Selector */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-paper-800 border-1.5 border-graphite-700 dark:border-graphite-400 rounded-xl px-2.5 py-1 shadow-sketch">
              <Calendar className="w-3.5 h-3.5 text-graphite-600 dark:text-graphite-300" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRangeFilter)}
                className="bg-transparent text-xs font-bold text-graphite-800 dark:text-graphite-100 focus:outline-none cursor-pointer pr-1"
              >
                {dateRanges.map(r => (
                  <option key={r.id} value={r.id} className="bg-white dark:bg-paper-900 text-graphite-900 dark:text-slate-100">
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Extension Setup Guide Button */}
            <button
              onClick={onOpenSyncModal}
              className="px-3 py-1 text-xs font-bold bg-sky-50 hover:bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:hover:bg-sky-900/60 dark:text-sky-200 border-1.5 border-sky-600 dark:border-sky-400 rounded-xl shadow-sketch flex items-center gap-1.5 cursor-pointer transition-all"
              title="Extension instructions & sync"
            >
              <Puzzle className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Extension Setup</span>
            </button>

            {/* DAY & NIGHT SWITCH BUTTON (Pencil Sketch Toggle) */}
            <button
              onClick={onToggleTheme}
              className="px-3 py-1 rounded-xl border-1.5 border-graphite-800 dark:border-amber-400 bg-amber-50 hover:bg-amber-100 dark:bg-paper-800 dark:hover:bg-paper-700 text-graphite-900 dark:text-amber-300 shadow-sketch flex items-center gap-1.5 font-bold text-xs cursor-pointer transition-all"
              title={theme === 'day' ? 'Switch to Night Mode (Dark Sketchbook / Blackboard)' : 'Switch to Day Mode (Ivory Sketch Paper)'}
            >
              {theme === 'day' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-500 fill-amber-400 animate-spin-slow" />
                  <span>Day Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>Night Mode</span>
                </>
              )}
            </button>

            {/* Refresh SQLite DB button */}
            <button
              onClick={onRefreshData}
              className="p-1.5 rounded-xl bg-white dark:bg-paper-800 hover:bg-paper-100 dark:hover:bg-paper-700 border-1.5 border-graphite-700 dark:border-graphite-400 text-graphite-700 dark:text-graphite-200 shadow-sketch cursor-pointer transition-all"
              title="Reload from SQLite database"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

          </div>
        </div>

        {/* Navigation Tabs matching reference image */}
        <nav className="flex items-center gap-2 mt-3 pt-2 border-t border-graphite-400/40 dark:border-graphite-600/40 overflow-x-auto no-scrollbar">
          {[
            { id: 'analytics', label: 'Overview & Top Sites', icon: <Activity className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> },
            { id: 'lineage', label: 'Lineage Tree & Paths', icon: <FolderTree className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> },
            { id: 'trends', label: 'Behavioral Shifts', icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> },
            { id: 'incognito', label: 'Incognito Deep-Dive', icon: <EyeOff className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> },
            { id: 'extension', label: 'Extension Setup', icon: <Cpu className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-white dark:bg-paper-800 text-graphite-900 dark:text-white border-2 border-graphite-800 dark:border-graphite-300 shadow-sketch'
                    : 'text-graphite-600 dark:text-graphite-400 hover:text-graphite-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
