import React from 'react';
import { 
  Clock, 
  Moon, 
  Sunrise, 
  Sun, 
  Sunset, 
  Filter, 
  Flame, 
  Check, 
  BarChart3,
  Globe
} from 'lucide-react';
import { BrowsingVisit, TimeWindow6h, TimeWindowFilter } from '../types/tracking';
import { StorageService } from '../services/storageService';
import { formatDuration, getCategoryColor } from '../utils/formatters';

interface TimeWindowFilterCardProps {
  visits: BrowsingVisit[];
  selectedWindow: TimeWindowFilter;
  onSelectWindow: (window: TimeWindowFilter) => void;
}

export const TimeWindowFilterCard: React.FC<TimeWindowFilterCardProps> = ({
  visits,
  selectedWindow,
  onSelectWindow
}) => {
  const matrix = StorageService.get6HourWindowMatrix(visits);

  // Calculate 24-hour hourly distribution
  const hourlySeconds = Array(24).fill(0);
  visits.forEach(v => {
    const hour = new Date(v.startTime).getHours();
    hourlySeconds[hour] += v.durationSec;
  });
  const maxHourSec = Math.max(1, ...hourlySeconds);

  const windowConfigs: Array<{
    id: TimeWindow6h;
    title: string;
    sublabel: string;
    icon: React.ReactNode;
    color: string;
    borderColor: string;
    pillBg: string;
  }> = [
    {
      id: '00:00-06:00',
      title: '00:00 – 06:00',
      sublabel: 'Late Night / Night Owl',
      icon: <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
      color: 'text-indigo-600 dark:text-indigo-400',
      borderColor: 'border-indigo-500',
      pillBg: 'bg-indigo-50 dark:bg-indigo-950/40'
    },
    {
      id: '06:00-12:00',
      title: '06:00 – 12:00',
      sublabel: 'Morning Focus & Planning',
      icon: <Sunrise className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
      color: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-amber-500',
      pillBg: 'bg-amber-50 dark:bg-amber-950/40'
    },
    {
      id: '12:00-18:00',
      title: '12:00 – 18:00',
      sublabel: 'Afternoon Peak Hours',
      icon: <Sun className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
      color: 'text-sky-600 dark:text-sky-400',
      borderColor: 'border-sky-500',
      pillBg: 'bg-sky-50 dark:bg-sky-950/40'
    },
    {
      id: '18:00-24:00',
      title: '18:00 – 24:00',
      sublabel: 'Evening & Leisure',
      icon: <Sunset className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
      color: 'text-purple-600 dark:text-purple-400',
      borderColor: 'border-purple-500',
      pillBg: 'bg-purple-50 dark:bg-purple-950/40'
    }
  ];

  return (
    <div className="sketch-card p-5 bg-white dark:bg-paper-800 font-sketch flex flex-col gap-4">
      
      {/* Header matching reference image */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full border border-sky-500 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-base font-bold text-graphite-900 dark:text-white tracking-tight">
              6-Hour Circadian Window Matrix
            </h2>
          </div>
          <p className="text-xs text-graphite-600 dark:text-slate-400 mt-1">
            Filter all browser metrics, lineage trees, and dwell times by specific circadian time frames.
          </p>
        </div>

        {/* Dropdown Selector matching reference image */}
        <div className="flex items-center gap-2">
          <select
            value={selectedWindow}
            onChange={(e) => onSelectWindow(e.target.value as TimeWindowFilter)}
            className="sketch-input px-3 py-1.5 text-xs font-bold text-graphite-800 dark:text-slate-200 cursor-pointer shadow-sketch focus:outline-none"
          >
            <option value="all">All 24 Hours</option>
            <option value="00:00-06:00">00:00 – 06:00 (Late Night)</option>
            <option value="06:00-12:00">06:00 – 12:00 (Morning Focus)</option>
            <option value="12:00-18:00">12:00 – 18:00 (Afternoon Peak)</option>
            <option value="18:00-24:00">18:00 – 24:00 (Evening Leisure)</option>
          </select>
        </div>
      </div>

      {/* 4 Cards Grid matching reference image */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {windowConfigs.map((cfg) => {
          const stats = matrix[cfg.id];
          const isSelected = selectedWindow === cfg.id;
          const catColor = getCategoryColor(stats.topCategory);
          const incognitoPct = stats.totalSec > 0 ? Math.round((stats.incognitoSec / stats.totalSec) * 100) : 0;

          return (
            <div
              key={cfg.id}
              onClick={() => onSelectWindow(isSelected ? 'all' : cfg.id)}
              className={`cursor-pointer rounded-xl p-3.5 transition-all border-1.5 flex flex-col justify-between relative shadow-sketch ${
                isSelected
                  ? 'border-2 border-graphite-900 dark:border-white bg-paper-100 dark:bg-paper-700 ring-2 ring-sky-500/40'
                  : 'border-graphite-400 dark:border-graphite-600 hover:border-graphite-700 dark:hover:border-graphite-300 bg-white dark:bg-paper-900/60'
              }`}
            >
              {/* Card Top */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    {cfg.icon}
                    <span className="text-xs font-bold text-graphite-800 dark:text-slate-200">{cfg.title}</span>
                  </div>
                  {isSelected && (
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-xs animate-pulse"></span>
                  )}
                </div>
                <div className="text-[11px] text-graphite-600 dark:text-slate-400 mb-2">{cfg.sublabel}</div>

                {/* Duration & Visits */}
                <div className="text-xl font-extrabold text-graphite-900 dark:text-white font-sketch">
                  {formatDuration(stats.totalSec)}
                </div>
                <div className="text-[11px] text-graphite-600 dark:text-slate-400 font-mono">
                  {stats.visitsCount.toLocaleString()} page visits
                </div>
              </div>

              {/* Incognito vs Normal bar */}
              <div className="mt-3 pt-2.5 border-t border-dashed border-graphite-300 dark:border-graphite-700">
                <div className="flex justify-between text-[10px] text-graphite-600 dark:text-slate-400 mb-1 font-mono">
                  <span>Normal: {formatDuration(stats.normalSec)}</span>
                  <span className="text-purple-700 dark:text-purple-300 font-bold">{incognitoPct}%</span>
                </div>
                <div className="w-full h-1.5 bg-paper-200 dark:bg-paper-700 rounded-full overflow-hidden flex border border-graphite-400 dark:border-graphite-600">
                  <div className="bg-sky-500 h-full" style={{ width: `${100 - incognitoPct}%` }} />
                  <div className="bg-purple-500 h-full" style={{ width: `${incognitoPct}%` }} />
                </div>

                {/* Top Site & Category Pill matching reference image */}
                <div className="flex items-center justify-between mt-2.5 text-[11px]">
                  <span className="text-graphite-800 dark:text-slate-200 font-bold truncate max-w-[110px] flex items-center gap-1" title={stats.topDomain}>
                    <Globe className="w-3 h-3 text-sky-500 shrink-0" />
                    {stats.topDomain}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${catColor.bg} ${catColor.text} border ${catColor.border}`}>
                    {stats.topCategory}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 24-Hour Intensity Matrix matching reference image */}
      <div className="mt-2 pt-3 border-t border-graphite-300 dark:border-graphite-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-graphite-800 dark:text-slate-200 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>24-Hour Hourly Activity Intensity Matrix</span>
          </span>
          <span className="text-[11px] text-graphite-500 dark:text-slate-400 italic">
            Hover bar for exact duration
          </span>
        </div>

        {/* Shaded pencil chart container with light background guide lines */}
        <div className="relative rounded-xl border border-graphite-400 dark:border-graphite-600 p-2.5 bg-paper-50 dark:bg-paper-900 shadow-sketch overflow-hidden">
          {/* Very light horizontal sketch guide lines */}
          <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none opacity-40">
            <div className="w-full border-b border-dashed border-graphite-300 dark:border-graphite-700"></div>
            <div className="w-full border-b border-dashed border-graphite-300 dark:border-graphite-700"></div>
            <div className="w-full border-b border-dashed border-graphite-300 dark:border-graphite-700"></div>
          </div>

          {/* 24 Vertical Bars */}
          <div 
            className="w-full h-14 relative z-10"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(24, minmax(0, 1fr))', gap: '3px', alignItems: 'end' }}
          >
            {hourlySeconds.map((sec, hour) => {
              const heightPct = maxHourSec > 0 ? Math.max(10, Math.round((sec / maxHourSec) * 100)) : 15;
              const window6hIdx = Math.floor(hour / 6);
              const isWindowMatched = 
                selectedWindow === 'all' || 
                (selectedWindow === '00:00-06:00' && window6hIdx === 0) ||
                (selectedWindow === '06:00-12:00' && window6hIdx === 1) ||
                (selectedWindow === '12:00-18:00' && window6hIdx === 2) ||
                (selectedWindow === '18:00-24:00' && window6hIdx === 3);

              let barColor = 'bg-graphite-200/60 dark:bg-graphite-800/50 border-graphite-300 dark:border-graphite-700';
              if (isWindowMatched) {
                if (window6hIdx === 0) barColor = 'bg-indigo-300/70 dark:bg-indigo-600/50 border-indigo-400 dark:border-indigo-400';
                else if (window6hIdx === 1) barColor = 'bg-amber-300/70 dark:bg-amber-600/50 border-amber-400 dark:border-amber-400';
                else if (window6hIdx === 2) barColor = 'bg-sky-300/70 dark:bg-sky-600/50 border-sky-400 dark:border-sky-400';
                else barColor = 'bg-purple-300/70 dark:bg-purple-600/50 border-purple-400 dark:border-purple-400';
              } else {
                barColor = 'bg-graphite-200/30 dark:bg-graphite-800/20 opacity-30 border-graphite-300/40';
              }

              return (
                <div
                  key={hour}
                  className="flex flex-col items-center h-full justify-end group relative cursor-pointer"
                >
                  {/* Tooltip */}
                  <div className="absolute -top-9 scale-0 group-hover:scale-100 transition-all z-30 px-2 py-0.5 bg-graphite-900 text-white dark:bg-paper-100 dark:text-graphite-900 rounded-md text-[10px] whitespace-nowrap shadow-sketch border border-graphite-600 pointer-events-none font-mono">
                    {String(hour).padStart(2, '0')}:00 – {formatDuration(sec)}
                  </div>

                  <div 
                    className={`w-full rounded-t-xs transition-all duration-200 border-t border-x ${barColor}`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Hour Axis Labels matching reference image */}
        <div className="flex justify-between text-[10px] text-graphite-600 dark:text-slate-400 font-mono mt-1 px-1">
          <span>00:00 (Night Owl)</span>
          <span>06:00 (Morning Focus)</span>
          <span>12:00 (Afternoon Peak)</span>
          <span>18:00 (Evening)</span>
          <span>23:59</span>
        </div>
      </div>

    </div>
  );
};
