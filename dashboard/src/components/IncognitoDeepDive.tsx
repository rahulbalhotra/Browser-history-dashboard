import React, { useState, useMemo } from 'react';
import { 
  EyeOff, 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  ExternalLink, 
  Clock, 
  Trash2, 
  Download, 
  Lock, 
  Unlock, 
  Sparkles, 
  GitFork 
} from 'lucide-react';
import { BrowsingVisit } from '../types/tracking';
import { StorageService } from '../services/storageService';
import { formatDuration, formatTimestamp, getCategoryColor } from '../utils/formatters';

interface IncognitoDeepDiveProps {
  visits: BrowsingVisit[];
  onSelectVisit: (visit: BrowsingVisit) => void;
}

export const IncognitoDeepDive: React.FC<IncognitoDeepDiveProps> = ({
  visits,
  onSelectVisit
}) => {
  const [maskSensitiveData, setMaskSensitiveData] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const incognitoVisits = useMemo(() => {
    return visits.filter(v => v.incognito);
  }, [visits]);

  const totalIncognitoSeconds = useMemo(() => {
    return incognitoVisits.reduce((acc, v) => acc + v.durationSec, 0);
  }, [incognitoVisits]);

  const incognitoDomains = useMemo(() => {
    const raw = StorageService.getDomainMetrics(incognitoVisits);
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return raw.filter(d => d.domain.toLowerCase().includes(q));
    }
    return raw;
  }, [incognitoVisits, searchFilter]);

  const privateQueries = useMemo(() => {
    const queries = new Set<string>();
    incognitoVisits.forEach(v => {
      if (v.searchQuery) queries.add(v.searchQuery);
    });
    return Array.from(queries);
  }, [incognitoVisits]);

  // Mask text helper
  const maskText = (text: string) => {
    if (!maskSensitiveData || !text) return text;
    return '••••••••••••••••';
  };

  return (
    <div className="flex flex-col gap-4 font-sketch">
      
      {/* Top Banner */}
      <div className="sketch-card p-5 bg-purple-50/80 dark:bg-purple-950/30 border-purple-500">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full border border-purple-500 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <EyeOff className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-purple-950 dark:text-purple-100 tracking-tight">
                Incognito Mode Deep-Dive & Private Lineage
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-purple-100 text-purple-900 dark:bg-purple-900/60 dark:text-purple-200 border border-purple-400 rounded-md">
                Spanning Lineage Enabled
              </span>
            </div>
            <p className="text-xs text-purple-900/80 dark:text-purple-300/80 mt-1">
              Analyze private session ancestry, active dwell times, and private research queries with full local privacy.
            </p>
          </div>

          {/* Privacy Mask Toggle */}
          <button
            onClick={() => setMaskSensitiveData(!maskSensitiveData)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border-1.5 shadow-sketch cursor-pointer ${
              maskSensitiveData
                ? 'bg-purple-700 text-white border-purple-800'
                : 'bg-white dark:bg-paper-800 text-purple-900 dark:text-purple-300 border-purple-400 hover:bg-purple-100'
            }`}
          >
            {maskSensitiveData ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{maskSensitiveData ? 'Privacy Mask ON (Blurred)' : 'Privacy Mask OFF'}</span>
          </button>
        </div>
      </div>

      {/* Incognito Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        
        <div className="sketch-card p-4 bg-white dark:bg-paper-800">
          <div className="text-[11px] font-bold text-purple-800 dark:text-purple-300 uppercase">Total Incognito Dwell</div>
          <div className="text-2xl font-extrabold text-purple-700 dark:text-purple-300 mt-1 font-sketch">
            {formatDuration(totalIncognitoSeconds)}
          </div>
          <div className="text-xs text-graphite-600 dark:text-slate-400 mt-1 font-mono">
            {incognitoVisits.length} total private page visits
          </div>
        </div>

        <div className="sketch-card p-4 bg-white dark:bg-paper-800">
          <div className="text-[11px] font-bold text-purple-800 dark:text-purple-300 uppercase">Unique Private Domains</div>
          <div className="text-2xl font-extrabold text-purple-700 dark:text-purple-300 mt-1 font-sketch">
            {incognitoDomains.length}
          </div>
          <div className="text-xs text-graphite-600 dark:text-slate-400 mt-1 font-mono">
            Across {new Set(incognitoVisits.map(v => v.category)).size} categories
          </div>
        </div>

        <div className="sketch-card p-4 bg-white dark:bg-paper-800">
          <div className="text-[11px] font-bold text-sky-800 dark:text-sky-300 uppercase">Private Search Queries</div>
          <div className="text-2xl font-extrabold text-sky-700 dark:text-sky-400 mt-1 font-sketch">
            {privateQueries.length}
          </div>
          <div className="text-xs text-graphite-600 dark:text-slate-400 mt-1 font-mono">
            Recorded search origins
          </div>
        </div>

      </div>

      {/* Main Grid: Private Domains & Private Search Queries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Left: Private Domains Leaderboard */}
        <div className="sketch-card p-5 bg-white dark:bg-paper-800 flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-graphite-900 dark:text-white flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Top Websites in Incognito</span>
            </h3>
            <span className="text-xs text-graphite-600 dark:text-slate-400 font-mono">{incognitoDomains.length} domains</span>
          </div>

          <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
            {incognitoDomains.length === 0 ? (
              <div className="text-center py-8 text-xs text-graphite-500">
                No incognito activity recorded in this time range.
              </div>
            ) : (
              incognitoDomains.map((dom, idx) => {
                const catColor = getCategoryColor(dom.category);
                return (
                  <div
                    key={dom.domain}
                    className="p-3 rounded-xl bg-paper-50 dark:bg-paper-900 border border-graphite-300 dark:border-graphite-700 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-graphite-500 font-mono text-[11px]">#{idx + 1}</span>
                      <span className="text-graphite-900 dark:text-white font-bold truncate max-w-[200px]">
                        {maskSensitiveData ? maskText(dom.domain) : dom.domain}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${catColor.bg} ${catColor.text} border ${catColor.border}`}>
                        {dom.category}
                      </span>
                    </div>

                    <div className="text-right font-mono shrink-0">
                      <div className="text-purple-700 dark:text-purple-300 font-bold">{formatDuration(dom.durationSec)}</div>
                      <div className="text-[10px] text-graphite-500">{dom.visits} visits</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Private Search Query Cloud */}
        <div className="sketch-card p-5 bg-white dark:bg-paper-800 flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-graphite-900 dark:text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Incognito Search Queries & Roots</span>
            </h3>
            <span className="text-xs text-graphite-600 dark:text-slate-400 font-mono">{privateQueries.length} queries</span>
          </div>

          {/* Search Queries List */}
          <div className="flex flex-wrap gap-1.5">
            {privateQueries.length === 0 ? (
              <div className="text-xs text-graphite-500 py-3">No private search queries captured yet.</div>
            ) : (
              privateQueries.map((q, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-900 dark:text-purple-200 border border-purple-400 text-xs font-mono"
                >
                  "{maskSensitiveData ? maskText(q) : q}"
                </span>
              ))
            )}
          </div>

          {/* Recent Private Lineage Visits */}
          <div className="mt-2 pt-3 border-t border-graphite-300 dark:border-graphite-700">
            <div className="text-xs font-bold text-graphite-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Recent Incognito Navigation Chain
            </div>

            <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto">
              {incognitoVisits.slice(0, 5).map((v) => (
                <div
                  key={v.id}
                  onClick={() => onSelectVisit(v)}
                  className="p-2.5 rounded-lg bg-paper-50 dark:bg-paper-900/80 hover:bg-paper-100 dark:hover:bg-paper-900 border border-graphite-300 dark:border-graphite-700 cursor-pointer flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <EyeOff className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span className="text-graphite-900 dark:text-slate-200 truncate max-w-[280px]" title={v.title}>
                      {maskSensitiveData ? maskText(v.title) : v.title}
                    </span>
                  </div>

                  <div className="font-mono font-bold text-purple-700 dark:text-purple-300 shrink-0">
                    {formatDuration(v.durationSec)}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
