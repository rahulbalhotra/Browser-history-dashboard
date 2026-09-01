import React from 'react';
import { 
  Clock, 
  Globe, 
  Target, 
  Sun, 
  Moon, 
  EyeOff, 
  TrendingUp, 
  ShieldAlert,
  Sparkles,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { BrowsingVisit } from '../types/tracking';
import { formatDuration } from '../utils/formatters';

interface OverviewCardsProps {
  visits: BrowsingVisit[];
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({ visits }) => {
  const totalVisitsCount = visits.length;
  const totalSeconds = visits.reduce((acc, v) => acc + v.durationSec, 0);
  const normalSeconds = visits.filter(v => !v.incognito).reduce((acc, v) => acc + v.durationSec, 0);
  const incognitoSeconds = visits.filter(v => v.incognito).reduce((acc, v) => acc + v.durationSec, 0);

  const uniqueDomains = new Set(visits.map(v => v.domain)).size;
  const incognitoVisitsCount = visits.filter(v => v.incognito).length;
  const incognitoRatio = totalSeconds > 0 ? Math.round((incognitoSeconds / totalSeconds) * 100) : 0;

  // Average dwell time per visit
  const avgVisitSec = totalVisitsCount > 0 ? Math.round(totalSeconds / totalVisitsCount) : 0;

  // Productivity / Focus calculation (Dev + Productivity + Research)
  const productiveSec = visits
    .filter(v => ['Development', 'Productivity', 'Research & News'].includes(v.category))
    .reduce((acc, v) => acc + v.durationSec, 0);
  const focusScore = totalSeconds > 0 ? Math.min(100, Math.round((productiveSec / totalSeconds) * 100)) : 0;

  // Calculate Peak 6-hour window
  const windowBuckets: Record<string, number> = {
    'Late Night (00-06)': 0,
    'Morning (06-12)': 0,
    'Afternoon (12-18)': 0,
    'Evening (18-24)': 0
  };

  visits.forEach(v => {
    const hour = new Date(v.startTime).getHours();
    if (hour < 6) windowBuckets['Late Night (00-06)'] += v.durationSec;
    else if (hour < 12) windowBuckets['Morning (06-12)'] += v.durationSec;
    else if (hour < 18) windowBuckets['Afternoon (12-18)'] += v.durationSec;
    else windowBuckets['Evening (18-24)'] += v.durationSec;
  });

  const topWindow = Object.entries(windowBuckets).sort((a, b) => b[1] - a[1])[0] || ['Afternoon (12-18)', 0];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 font-sketch">
      
      {/* 1. TOTAL ACTIVE TIME matching reference image */}
      <div className="sketch-card p-4 flex flex-col justify-between relative bg-white dark:bg-paper-800">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              TOTAL ACTIVE TIME
            </span>
            <div className="w-7 h-7 rounded-full border border-sky-500 dark:border-sky-400 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          
          <div className="text-2xl font-extrabold text-graphite-900 dark:text-white mt-2 font-sketch tracking-tight">
            {formatDuration(totalSeconds)}
          </div>
        </div>

        <div className="mt-3">
          {/* Sky blue marker progress bar */}
          <div className="w-full h-1.5 bg-paper-200 dark:bg-paper-700 rounded-full overflow-hidden flex border border-graphite-400 dark:border-graphite-600">
            <div 
              className="bg-sky-500 h-full transition-all duration-500" 
              style={{ width: `${Math.max(5, 100 - incognitoRatio)}%` }}
              title={`Normal: ${formatDuration(normalSeconds)}`}
            />
            <div 
              className="bg-purple-500 h-full transition-all duration-500" 
              style={{ width: `${incognitoRatio}%` }}
              title={`Incognito: ${formatDuration(incognitoSeconds)}`}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-graphite-600 dark:text-slate-400 mt-2 font-mono">
            <span className="text-sky-700 dark:text-sky-400 font-bold">🌐 {formatDuration(normalSeconds)}</span>
            <span className="text-graphite-600 dark:text-slate-400">~ {formatDuration(avgVisitSec)}</span>
          </div>
        </div>
      </div>

      {/* 2. VISITS & SITES matching reference image */}
      <div className="sketch-card p-4 flex flex-col justify-between relative bg-white dark:bg-paper-800">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              VISITS & SITES
            </span>
            <div className="w-7 h-7 rounded-full border border-purple-500 dark:border-purple-400 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Globe className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="text-2xl font-extrabold text-graphite-900 dark:text-white font-sketch tracking-tight">
              {totalVisitsCount.toLocaleString()}
            </div>
            {/* Hand-drawn squiggly purple curve sketch */}
            <svg className="w-14 h-6 text-purple-500 dark:text-purple-400 stroke-current fill-none" viewBox="0 0 60 24" strokeWidth="2.5" strokeLinecap="round">
              <path d="M 2 18 Q 15 22 25 12 T 45 6 T 58 2" />
            </svg>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-graphite-700 dark:text-slate-300 pt-2 border-t border-dashed border-graphite-300 dark:border-graphite-700 font-mono">
          <span>Across <b className="text-graphite-900 dark:text-white">{uniqueDomains}</b> domains</span>
          <span>~{formatDuration(avgVisitSec)}/visit</span>
        </div>
      </div>

      {/* 3. FOCUS INDEX matching reference image */}
      <div className="sketch-card p-4 flex flex-col justify-between relative bg-white dark:bg-paper-800">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              FOCUS INDEX
            </span>
            <div className="w-7 h-7 rounded-full border border-emerald-500 dark:border-emerald-400 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Target className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 font-sketch tracking-tight">
              {focusScore}%
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-500">
              {focusScore > 70 ? '⚡ Peak Focus' : focusScore > 45 ? '✨ Balanced' : '🛋️ Casual'}
            </span>
          </div>
        </div>

        <div className="mt-3">
          <div className="w-full bg-paper-200 dark:bg-paper-700 h-1.5 rounded-full overflow-hidden border border-graphite-400 dark:border-graphite-600">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.max(4, focusScore)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-graphite-600 dark:text-slate-400 mt-1 font-mono">
            <span>Dev & Research dwell</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatDuration(productiveSec)}</span>
          </div>
        </div>
      </div>

      {/* 4. PEAK CIRCADIAN matching reference image */}
      <div className="sketch-card p-4 flex flex-col justify-between relative bg-white dark:bg-paper-800">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              PEAK CIRCADIAN
            </span>
            <div className="w-7 h-7 rounded-full border border-amber-500 dark:border-amber-400 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Sun className="w-4 h-4" />
            </div>
          </div>

          <div className="text-base font-bold text-graphite-900 dark:text-white mt-1.5 truncate" title={topWindow[0]}>
            {topWindow[0]}
          </div>
        </div>

        <div className="mt-2">
          {/* Yellow highlighter box with upward arrow */}
          <div className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/70 border border-amber-500 text-amber-900 dark:text-amber-200 text-xs font-mono font-bold flex items-center gap-1 shadow-xs">
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{formatDuration(topWindow[1] as number)} dwell</span>
          </div>
          <div className="text-[10px] text-graphite-500 dark:text-slate-400 mt-1">
            Highest active engagement
          </div>
        </div>
      </div>

      {/* 5. PRIVATE SHARE matching reference image */}
      <div className="sketch-card p-4 flex flex-col justify-between relative bg-white dark:bg-paper-800">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              PRIVATE SHARE
            </span>
            <div className="w-7 h-7 rounded-full border border-purple-500 dark:border-purple-400 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <EyeOff className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-extrabold text-purple-700 dark:text-purple-300 font-sketch tracking-tight">
              {incognitoRatio}%
            </span>
            <span className="text-xs text-graphite-600 dark:text-slate-400 font-mono">
              ({incognitoVisitsCount} pages)
            </span>
          </div>
        </div>

        <div className="mt-3">
          <div className="w-full bg-paper-200 dark:bg-paper-700 h-1.5 rounded-full overflow-hidden border border-graphite-400 dark:border-graphite-600">
            <div 
              className="bg-purple-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.max(4, incognitoRatio)}%` }}
            />
          </div>
          <p className="text-[11px] text-purple-800 dark:text-purple-300 mt-1">
            Spanning lineage active
          </p>
        </div>
      </div>

    </div>
  );
};
