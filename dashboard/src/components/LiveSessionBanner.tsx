import React from 'react';
import { 
  Activity, 
  Globe, 
  EyeOff, 
  Clock, 
  Database, 
  RefreshCw, 
  Sparkles, 
  HardDrive,
  Radio,
  Sliders,
  Laptop
} from 'lucide-react';
import { formatDuration } from '../utils/formatters';

interface LiveSessionBannerProps {
  activeTab: {
    domain?: string;
    title?: string;
    url?: string;
    isIncognito?: boolean;
    durationSec?: number;
    isIdle?: boolean;
  } | null;
  onImportChromeHistory: () => void;
  isImporting: boolean;
  importResult: { success?: boolean; message?: string } | null;
  connectedToBackend: boolean;
  totalDbVisits: number;
}

export const LiveSessionBanner: React.FC<LiveSessionBannerProps> = ({
  activeTab,
  onImportChromeHistory,
  isImporting,
  importResult,
  connectedToBackend,
  totalDbVisits
}) => {
  const hasActiveTab = activeTab && activeTab.url && !activeTab.isIdle;

  return (
    <div className="sketch-card p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-paper-800">
      
      {/* Left: Live WebSocket & Active Tab status matching reference image */}
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Oscilloscope green sketch icon */}
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-600 dark:border-emerald-500 shadow-sketch shrink-0">
          <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-graphite-800 animate-ping"></span>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-graphite-800"></span>
        </div>

        <div className="min-w-0 font-sketch">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono flex items-center gap-1.5">
              <span>● LIVE TELEMETRY STREAM</span>
            </span>
            <span className="text-graphite-400">•</span>
            <span className="text-xs font-bold text-graphite-700 dark:text-graphite-300 font-mono">
              SQLite DB ({totalDbVisits.toLocaleString()} records)
            </span>
          </div>

          {hasActiveTab ? (
            <div className="flex items-center gap-2 mt-0.5 min-w-0">
              <span className="text-xs font-bold text-graphite-900 dark:text-white truncate max-w-[280px] sm:max-w-[420px]">
                {activeTab.title || activeTab.domain}
              </span>
              <span className="text-sky-700 dark:text-sky-400 font-mono font-bold text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(activeTab.durationSec || 0)}
              </span>
              {activeTab.isIncognito && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 border border-purple-400 font-bold">
                  🕶️ Incognito
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-graphite-600 dark:text-graphite-400 mt-0.5">
              Listening on <code className="text-sky-700 dark:text-sky-300 font-mono font-bold">ws://localhost:3001</code> — open any website in Chrome with extension active!
            </p>
          )}
        </div>
      </div>

      {/* Right: Purple Sketch "Sync Actual Chrome History" button matching reference image */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onImportChromeHistory}
          disabled={isImporting}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:hover:bg-purple-900/80 dark:text-purple-200 border-2 border-purple-600 dark:border-purple-400 shadow-sketch flex items-center gap-2 disabled:opacity-50 cursor-pointer sketch-btn transition-all"
          title="Reads actual Google Chrome history file from your PC and loads past browsing into SQLite"
        >
          {isImporting ? (
            <RefreshCw className="w-4 h-4 animate-spin text-purple-600 dark:text-purple-300" />
          ) : (
            <Laptop className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          )}
          <span>{isImporting ? 'Importing Real History...' : 'Sync Actual Chrome History'}</span>
          <span className="text-xs text-purple-500">✏️</span>
        </button>
      </div>

    </div>
  );
};
