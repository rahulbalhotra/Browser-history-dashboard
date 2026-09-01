import React, { useState } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Activity, 
  Zap, 
  Moon, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2,
  Sparkles,
  BarChart2,
  PieChart
} from 'lucide-react';
import { BrowsingVisit, CategoryType, MonthlyTrendSummary } from '../types/tracking';
import { StorageService } from '../services/storageService';
import { formatHours, getCategoryColor } from '../utils/formatters';

interface MonthlyTrendsViewProps {
  visits: BrowsingVisit[];
}

export const MonthlyTrendsView: React.FC<MonthlyTrendsViewProps> = ({ visits }) => {
  const monthlyTrends = StorageService.getMonthlyTrends(visits);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    monthlyTrends.length > 0 ? monthlyTrends[monthlyTrends.length - 1].monthKey : ''
  );

  const activeSummary = monthlyTrends.find(m => m.monthKey === selectedMonth) || monthlyTrends[monthlyTrends.length - 1];
  const prevSummary = monthlyTrends.length > 1 
    ? monthlyTrends[monthlyTrends.findIndex(m => m.monthKey === selectedMonth) - 1] 
    : null;

  // Compute shift deltas if previous month exists
  const hoursDelta = prevSummary && prevSummary.totalHours > 0
    ? Math.round(((activeSummary.totalHours - prevSummary.totalHours) / prevSummary.totalHours) * 100)
    : 0;

  const focusDelta = prevSummary 
    ? activeSummary.focusScore - prevSummary.focusScore 
    : 0;

  const nightDelta = prevSummary 
    ? activeSummary.nightBrowsingRatio - prevSummary.nightBrowsingRatio 
    : 0;

  const maxTotalHours = Math.max(1, ...monthlyTrends.map(m => m.totalHours));

  const categories: CategoryType[] = [
    'Development',
    'Productivity',
    'Entertainment',
    'Social Media',
    'Research & News',
    'Shopping',
    'General'
  ];

  return (
    <div className="flex flex-col gap-4 font-sketch">
      
      {/* Top Banner with Month Selector */}
      <div className="sketch-card p-5 bg-white dark:bg-paper-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full border border-emerald-500 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-graphite-900 dark:text-white tracking-tight">
                Monthly Browsing Behavior & Shift Analytics
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-500 rounded-md font-mono">
                3-Month Longitudinal Track
              </span>
            </div>
            <p className="text-xs text-graphite-600 dark:text-slate-400 mt-1">
              Inspect how your focus, time investment, nocturnal habits, and site categories evolved over months.
            </p>
          </div>

          {/* Month Tabs in Sketch Pill */}
          <div className="inline-flex p-0.5 rounded-xl border border-graphite-600 dark:border-graphite-400 bg-paper-50 dark:bg-paper-900 shadow-sketch">
            {monthlyTrends.map((m) => (
              <button
                key={m.monthKey}
                onClick={() => setSelectedMonth(m.monthKey)}
                className={`px-3.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  (selectedMonth === m.monthKey || (!selectedMonth && m === activeSummary))
                    ? 'bg-graphite-800 text-white dark:bg-slate-200 dark:text-graphite-900 shadow-xs'
                    : 'text-graphite-600 dark:text-slate-400 hover:text-graphite-900'
                }`}
              >
                {m.monthName}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Month-over-Month Delta Cards */}
      {activeSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          
          {/* Card 1: Total Hours */}
          <div className="sketch-card p-4 bg-white dark:bg-paper-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-sky-800 dark:text-sky-300 uppercase">Monthly Dwell Time</span>
              <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="text-2xl font-extrabold text-graphite-900 dark:text-white mt-2 font-sketch">
              {formatHours(activeSummary.totalHours)}
            </div>
            <div className="flex items-center gap-1.5 text-xs mt-2 font-mono">
              {hoursDelta >= 0 ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +{hoursDelta}%
                </span>
              ) : (
                <span className="text-rose-700 dark:text-rose-400 font-bold flex items-center gap-0.5">
                  <ArrowDownRight className="w-3.5 h-3.5" /> {hoursDelta}%
                </span>
              )}
              <span className="text-graphite-500">vs previous month</span>
            </div>
          </div>

          {/* Card 2: Focus Score */}
          <div className="sketch-card p-4 bg-white dark:bg-paper-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">Focus Score</span>
              <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-2 font-sketch">
              {activeSummary.focusScore}%
            </div>
            <div className="flex items-center gap-1.5 text-xs mt-2 font-mono">
              {focusDelta >= 0 ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +{focusDelta} pts
                </span>
              ) : (
                <span className="text-amber-700 dark:text-amber-400 font-bold flex items-center gap-0.5">
                  <ArrowDownRight className="w-3.5 h-3.5" /> {focusDelta} pts
                </span>
              )}
              <span className="text-graphite-500">productivity score</span>
            </div>
          </div>

          {/* Card 3: Late Night */}
          <div className="sketch-card p-4 bg-white dark:bg-paper-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300 uppercase">Late Night (00-06h)</span>
              <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-300 mt-2 font-sketch">
              {activeSummary.nightBrowsingRatio}%
            </div>
            <div className="flex items-center gap-1.5 text-xs mt-2 font-mono">
              {nightDelta <= 0 ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {nightDelta}% night shift
                </span>
              ) : (
                <span className="text-amber-700 dark:text-amber-400 font-bold flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +{nightDelta}% late sessions
                </span>
              )}
              <span className="text-graphite-500">sleep alignment</span>
            </div>
          </div>

          {/* Card 4: Incognito Usage */}
          <div className="sketch-card p-4 bg-white dark:bg-paper-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-800 dark:text-purple-300 uppercase">Incognito Dwell</span>
              <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-extrabold text-purple-700 dark:text-purple-300 mt-2 font-sketch">
              {formatHours(activeSummary.incognitoHours)}
            </div>
            <div className="flex items-center gap-1.5 text-xs mt-2 font-mono text-purple-800 dark:text-purple-300">
              <span>{Math.round((activeSummary.incognitoHours / Math.max(0.1, activeSummary.totalHours)) * 100)}% of month's dwell</span>
            </div>
          </div>

        </div>
      )}

      {/* Multi-month stacked bars in Sketch Theme */}
      <div className="sketch-card p-5 bg-white dark:bg-paper-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <h3 className="text-sm font-bold text-graphite-900 dark:text-white">Monthly Dwell Time Volume Progression</h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-graphite-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 border border-graphite-600" /> Normal Mode
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-purple-500 border border-graphite-600" /> Incognito Mode
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          {monthlyTrends.map((m) => {
            const isSelected = m.monthKey === activeSummary.monthKey;
            const normalHeight = (m.normalHours / m.totalHours) * 100;
            const incognitoHeight = (m.incognitoHours / m.totalHours) * 100;

            return (
              <div
                key={m.monthKey}
                onClick={() => setSelectedMonth(m.monthKey)}
                className={`cursor-pointer rounded-xl p-3.5 transition-all border-1.5 shadow-sketch ${
                  isSelected
                    ? 'bg-paper-100 dark:bg-paper-700 border-2 border-graphite-900 dark:border-white ring-2 ring-sky-500/40'
                    : 'bg-white dark:bg-paper-900/60 border-graphite-400 dark:border-graphite-600 hover:border-graphite-700'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-graphite-900 dark:text-white">{m.monthName}</span>
                  <span className="text-xs font-mono font-bold text-sky-700 dark:text-sky-400">{formatHours(m.totalHours)}</span>
                </div>

                <div className="text-[11px] text-graphite-600 dark:text-slate-400 mb-2">
                  {m.totalVisits.toLocaleString()} page navigations
                </div>

                {/* Stacked Visual Bar with Pencil Hatching */}
                <div className="w-full h-8 bg-paper-200 dark:bg-paper-900 rounded-lg overflow-hidden flex border border-graphite-400 dark:border-graphite-600 sketch-bar-hatch">
                  <div 
                    className="bg-sky-500 h-full transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-white font-mono"
                    style={{ width: `${normalHeight}%` }}
                    title={`Normal: ${formatHours(m.normalHours)}`}
                  >
                    {normalHeight > 20 && `${Math.round(normalHeight)}%`}
                  </div>
                  <div 
                    className="bg-purple-500 h-full transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-white font-mono"
                    style={{ width: `${incognitoHeight}%` }}
                    title={`Incognito: ${formatHours(m.incognitoHours)}`}
                  >
                    {incognitoHeight > 20 && `${Math.round(incognitoHeight)}%`}
                  </div>
                </div>

                <div className="flex justify-between text-[10px] text-graphite-600 dark:text-slate-400 mt-2 font-mono">
                  <span>🌐 Normal: {formatHours(m.normalHours)}</span>
                  <span className="text-purple-700 dark:text-purple-300 font-bold">🕶️ {formatHours(m.incognitoHours)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Composition & Top Domains */}
      {activeSummary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Category Breakdown */}
          <div className="sketch-card p-5 bg-white dark:bg-paper-800">
            <div className="flex items-center gap-2 mb-3">
              <PieChart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-graphite-900 dark:text-white">
                Category Time Composition ({activeSummary.monthName})
              </h3>
            </div>

            <div className="flex flex-col gap-2.5">
              {categories.map((cat) => {
                const catHours = activeSummary.categoryBreakdown[cat] || 0;
                const catPct = activeSummary.totalHours > 0 
                  ? Math.round((catHours / activeSummary.totalHours) * 100)
                  : 0;
                const catColor = getCategoryColor(cat);

                return (
                  <div key={cat} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="flex items-center gap-2 text-graphite-800 dark:text-slate-200">
                        <span 
                          className="w-2.5 h-2.5 rounded-full border border-graphite-400" 
                          style={{ backgroundColor: catColor.accent }} 
                        />
                        <span>{cat}</span>
                      </span>
                      <span className="text-graphite-600 dark:text-slate-400 font-mono">
                        <b className="text-graphite-900 dark:text-white">{formatHours(catHours)}</b> ({catPct}%)
                      </span>
                    </div>

                    <div className="w-full h-2 bg-paper-200 dark:bg-paper-700 rounded-full overflow-hidden border border-graphite-300 dark:border-graphite-600">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${catPct}%`, 
                          backgroundColor: catColor.accent 
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Monthly Domains & Takeaway */}
          <div className="sketch-card p-5 bg-white dark:bg-paper-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-bold text-graphite-900 dark:text-white">
                  Top Anchor Domains in {activeSummary.monthName}
                </h3>
              </div>

              <div className="flex flex-col gap-2">
                {activeSummary.topDomains.map((dom, idx) => (
                  <div
                    key={dom.domain}
                    className="p-2.5 rounded-xl bg-paper-50 dark:bg-paper-900 border border-graphite-300 dark:border-graphite-700 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-graphite-500 font-mono text-[11px]">#{idx + 1}</span>
                      <span className="text-graphite-900 dark:text-slate-200 font-bold">{dom.domain}</span>
                      <span className="text-[10px] text-graphite-500">({dom.category})</span>
                    </div>

                    <div className="font-mono text-sky-700 dark:text-sky-400 font-bold">
                      {formatHours(dom.hours)} ({dom.visits}v)
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Smart Behavioral Insight Summary */}
            <div className="mt-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-500">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Behavioral Shift Takeaway:</span>
              </div>
              <p className="text-xs text-graphite-700 dark:text-slate-300 leading-relaxed">
                In <b>{activeSummary.monthName}</b>, your focus score was <b>{activeSummary.focusScore}%</b>. 
                {activeSummary.nightBrowsingRatio > 25 
                  ? " Late-night sessions were elevated (25%+). Consider winding down earlier."
                  : " Great sleep-wake alignment with under 15% nocturnal browsing!"}
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
