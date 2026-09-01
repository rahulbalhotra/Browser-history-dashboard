import React, { useState, useMemo } from 'react';
import { 
  Globe, 
  Clock, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  EyeOff, 
  ArrowUpDown, 
  Trophy, 
  Tag, 
  Link as LinkIcon 
} from 'lucide-react';
import { BrowsingVisit, DomainMetric } from '../types/tracking';
import { StorageService } from '../services/storageService';
import { formatDuration, getCategoryColor } from '../utils/formatters';

interface TopWebsitesSectionProps {
  visits: BrowsingVisit[];
  onSelectVisitUrl?: (url: string) => void;
}

export const TopWebsitesSection: React.FC<TopWebsitesSectionProps> = ({
  visits,
  onSelectVisitUrl
}) => {
  const [sortBy, setSortBy] = useState<'duration' | 'visits' | 'avg'>('duration');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [domainSearch, setDomainSearch] = useState('');
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());

  // Aggregate metrics
  const domainMetrics = useMemo(() => {
    const raw = StorageService.getDomainMetrics(visits);
    let filtered = raw;

    if (filterCategory !== 'all') {
      filtered = filtered.filter(d => d.category === filterCategory);
    }

    if (domainSearch.trim()) {
      const q = domainSearch.toLowerCase();
      filtered = filtered.filter(d => 
        d.domain.toLowerCase().includes(q) ||
        d.topPages.some(p => p.title.toLowerCase().includes(q) || p.url.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'duration') {
      return filtered.sort((a, b) => b.durationSec - a.durationSec);
    } else if (sortBy === 'visits') {
      return filtered.sort((a, b) => b.visits - a.visits);
    } else {
      return filtered.sort((a, b) => b.avgDurationSec - a.avgDurationSec);
    }
  }, [visits, filterCategory, domainSearch, sortBy]);

  const totalBrowsingSeconds = useMemo(() => {
    return visits.reduce((acc, v) => acc + v.durationSec, 0);
  }, [visits]);

  const toggleDomainExpand = (domain: string) => {
    setExpandedDomains(prev => {
      const next = new Set(prev);
      if (next.has(domain)) next.delete(domain);
      else next.add(domain);
      return next;
    });
  };

  return (
    <div className="sketch-card p-5 bg-white dark:bg-paper-800 font-sketch flex flex-col gap-4">
      
      {/* Header & Controls matching reference image */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-7 h-7 rounded-full border border-amber-500 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Trophy className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-graphite-900 dark:text-white tracking-tight">
              Top Websites & Active Engagement Leaderboard
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-500 rounded-md font-mono">
              {domainMetrics.length} Tracked Domains
            </span>
          </div>
          <p className="text-xs text-graphite-600 dark:text-slate-400 mt-1">
            Ranked by engagement, active dwell time, sub-pages, and incognito ratio.
          </p>
        </div>

        {/* Filters & Sorting */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Domain Search with sketch styling */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-graphite-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search domain or page..."
              value={domainSearch}
              onChange={(e) => setDomainSearch(e.target.value)}
              className="sketch-input pl-8 pr-3 py-1.5 text-xs text-graphite-900 dark:text-white placeholder-graphite-400 w-44 sm:w-52"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="sketch-input px-2.5 py-1.5 text-xs font-bold text-graphite-800 dark:text-slate-200 cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="Development">Development</option>
            <option value="Productivity">Productivity</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Social Media">Social Media</option>
            <option value="Research & News">Research & News</option>
            <option value="Shopping">Shopping</option>
          </select>

          {/* Sort By Toggle */}
          <div className="inline-flex p-0.5 rounded-xl border border-graphite-600 dark:border-graphite-400 bg-paper-50 dark:bg-paper-900 text-xs">
            <button
              onClick={() => setSortBy('duration')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                sortBy === 'duration' ? 'bg-graphite-800 text-white dark:bg-slate-200 dark:text-graphite-900' : 'text-graphite-600 dark:text-slate-400 hover:text-graphite-900'
              }`}
            >
              Time
            </button>
            <button
              onClick={() => setSortBy('visits')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                sortBy === 'visits' ? 'bg-graphite-800 text-white dark:bg-slate-200 dark:text-graphite-900' : 'text-graphite-600 dark:text-slate-400 hover:text-graphite-900'
              }`}
            >
              Visits
            </button>
            <button
              onClick={() => setSortBy('avg')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                sortBy === 'avg' ? 'bg-graphite-800 text-white dark:bg-slate-200 dark:text-graphite-900' : 'text-graphite-600 dark:text-slate-400 hover:text-graphite-900'
              }`}
            >
              Avg / Visit
            </button>
          </div>
        </div>
      </div>

      {/* Domain List in Sketch Theme */}
      <div className="flex flex-col gap-2.5">
        {domainMetrics.length === 0 ? (
          <div className="text-center py-10 bg-paper-50 dark:bg-paper-900/60 rounded-xl border-1.5 border-dashed border-graphite-400">
            <Globe className="w-8 h-8 text-graphite-400 mx-auto mb-2" />
            <div className="text-sm font-bold text-graphite-800 dark:text-slate-200">No websites found</div>
            <p className="text-xs text-graphite-500 mt-1">Try broadening your search query or filters.</p>
          </div>
        ) : (
          domainMetrics.map((item, index) => {
            const isExpanded = expandedDomains.has(item.domain);
            const catColor = getCategoryColor(item.category);
            const sharePct = totalBrowsingSeconds > 0 
              ? Math.min(100, Math.round((item.durationSec / totalBrowsingSeconds) * 100))
              : 0;
            const incognitoPct = item.durationSec > 0
              ? Math.round((item.incognitoDurationSec / item.durationSec) * 100)
              : 0;

            // Top podium badge colors
            let rankBadge = (
              <span className="w-6 h-6 rounded-md bg-paper-100 dark:bg-paper-800 border border-graphite-400 text-graphite-700 dark:text-slate-300 font-mono text-xs flex items-center justify-center font-bold">
                #{index + 1}
              </span>
            );
            if (index === 0) {
              rankBadge = (
                <span className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-500 font-mono text-xs flex items-center justify-center font-bold shadow-xs">
                  🥇
                </span>
              );
            } else if (index === 1) {
              rankBadge = (
                <span className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-400 font-mono text-xs flex items-center justify-center font-bold">
                  🥈
                </span>
              );
            } else if (index === 2) {
              rankBadge = (
                <span className="w-6 h-6 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-600 font-mono text-xs flex items-center justify-center font-bold">
                  🥉
                </span>
              );
            }

            return (
              <div
                key={item.domain}
                className="bg-paper-50 dark:bg-paper-900/70 hover:bg-paper-100 dark:hover:bg-paper-900 border-1.5 border-graphite-300 dark:border-graphite-700 rounded-xl transition-all shadow-sketch overflow-hidden"
              >
                {/* Main Domain Row */}
                <div 
                  className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                  onClick={() => toggleDomainExpand(item.domain)}
                >
                  {/* Left: Rank, Favicon, Domain, Category */}
                  <div className="flex items-center gap-3 min-w-0">
                    {rankBadge}

                    <div className="w-7 h-7 rounded-lg bg-white dark:bg-paper-800 flex items-center justify-center overflow-hidden border border-graphite-400 dark:border-graphite-600 shrink-0">
                      {item.favIconUrl ? (
                        <img 
                          src={item.favIconUrl} 
                          alt="" 
                          className="w-4 h-4 object-contain"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      ) : (
                        <Globe className="w-4 h-4 text-graphite-500" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-graphite-900 dark:text-white tracking-tight truncate max-w-[200px] sm:max-w-[320px]">
                          {item.domain}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${catColor.bg} ${catColor.text} border ${catColor.border}`}>
                          {item.category}
                        </span>
                        {incognitoPct > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-400 flex items-center gap-1">
                            <EyeOff className="w-2.5 h-2.5" /> {incognitoPct}% incognito
                          </span>
                        )}
                      </div>
                      
                      {/* Progress bar of total browsing */}
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-32 sm:w-48 h-1.5 bg-paper-200 dark:bg-paper-700 rounded-full overflow-hidden flex border border-graphite-300 dark:border-graphite-600">
                          <div 
                            className="bg-sky-500 h-full rounded-full"
                            style={{ width: `${Math.max(4, sharePct)}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-graphite-600 dark:text-slate-400 font-mono">
                          {sharePct}% total dwell
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Time, Visits, Expand Chevron */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-graphite-300 dark:border-graphite-700">
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-sky-700 dark:text-sky-400 font-mono">
                        {formatDuration(item.durationSec)}
                      </div>
                      <div className="text-[11px] text-graphite-600 dark:text-slate-400 font-mono">
                        {item.visits} visits ({formatDuration(item.avgDurationSec)} avg)
                      </div>
                    </div>

                    <div className="w-6 h-6 rounded-md bg-white dark:bg-paper-800 border border-graphite-400 flex items-center justify-center text-graphite-700 dark:text-slate-300">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Sub-pages & Queries Drawer */}
                {isExpanded && (
                  <div className="px-4 pb-3.5 pt-2 bg-paper-100 dark:bg-paper-950/80 border-t border-graphite-300 dark:border-graphite-700 flex flex-col gap-3">
                    
                    {/* Top sub-pages on this site */}
                    <div>
                      <div className="text-[11px] font-bold text-graphite-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <LinkIcon className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                        <span>Most Visited Pages on {item.domain}</span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        {item.topPages.map((page, pIdx) => (
                          <div
                            key={pIdx}
                            className="p-2 rounded-lg bg-white dark:bg-paper-900 border border-graphite-300 dark:border-graphite-700 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-graphite-500 font-mono text-[10px]">#{pIdx + 1}</span>
                              <span className="text-graphite-900 dark:text-slate-200 font-medium truncate max-w-[400px]" title={page.title}>
                                {page.title || page.url}
                              </span>
                              {page.incognito && (
                                <span className="px-1 py-0.2 rounded text-[9px] bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 border border-purple-400">
                                  🕶️
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 shrink-0 font-mono text-[11px]">
                              <span className="text-sky-700 dark:text-sky-400 font-bold">{formatDuration(page.durationSec)}</span>
                              <span className="text-graphite-500">({page.visits}v)</span>
                              <a
                                href={page.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-graphite-600 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
                                title="Open link"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Search queries leading to this domain */}
                    {item.searchQueries.length > 0 && (
                      <div>
                        <div className="text-[11px] font-bold text-graphite-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <Search className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                          <span>Search Queries that led here:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {item.searchQueries.map((query, qIdx) => (
                            <span 
                              key={qIdx}
                              className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-400 text-[11px] font-mono"
                            >
                              "{query}"
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
