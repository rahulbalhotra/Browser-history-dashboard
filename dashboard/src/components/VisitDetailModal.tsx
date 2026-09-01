import React from 'react';
import { 
  X, 
  ExternalLink, 
  Clock, 
  EyeOff, 
  Globe, 
  GitFork, 
  CornerDownRight, 
  Search, 
  Tag, 
  Calendar, 
  Layers 
} from 'lucide-react';
import { BrowsingVisit, LineageNode } from '../types/tracking';
import { formatDuration, formatTimestamp, getCategoryColor } from '../utils/formatters';

interface VisitDetailModalProps {
  visit: BrowsingVisit | LineageNode | null;
  onClose: () => void;
  onSelectChild?: (child: LineageNode) => void;
}

export const VisitDetailModal: React.FC<VisitDetailModalProps> = ({
  visit,
  onClose,
  onSelectChild
}) => {
  if (!visit) return null;

  const catColor = getCategoryColor(visit.category);
  const children = (visit as LineageNode).children || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-900/60 backdrop-blur-xs animate-fade-in font-sketch">
      <div 
        className="sketch-card w-full max-w-xl bg-paper-50 dark:bg-paper-900 p-6 shadow-sketch-lg flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b-2 border-dashed border-graphite-300 dark:border-graphite-700 pb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-paper-800 flex items-center justify-center overflow-hidden border border-graphite-400 dark:border-graphite-600 shrink-0">
              {visit.favIconUrl ? (
                <img src={visit.favIconUrl} alt="" className="w-5 h-5 object-contain" />
              ) : (
                <Globe className="w-5 h-5 text-graphite-500" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-graphite-900 dark:text-white truncate max-w-[380px]" title={visit.title}>
                {visit.title || visit.url}
              </h3>
              <div className="text-xs text-graphite-600 dark:text-slate-400 font-mono mt-0.5">{visit.domain}</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white dark:bg-paper-800 hover:bg-paper-200 text-graphite-700 dark:text-slate-200 border border-graphite-400 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Badges Row */}
        <div className="flex flex-wrap items-center gap-2">
          {visit.incognito ? (
            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 border border-purple-400 flex items-center gap-1">
              <EyeOff className="w-3 h-3" /> Incognito Session
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-paper-100 dark:bg-paper-800 text-graphite-700 dark:text-slate-300 border border-graphite-400">
              🌐 Normal Window
            </span>
          )}

          <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${catColor.bg} ${catColor.text} border ${catColor.border}`}>
            {visit.category}
          </span>

          {visit.transitionType && (
            <span className="px-2 py-0.5 rounded-md text-xs bg-white dark:bg-paper-800 border border-graphite-300 dark:border-graphite-700 text-graphite-600 dark:text-slate-400 font-mono">
              Type: {visit.transitionType}
            </span>
          )}
        </div>

        {/* Metric Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-white dark:bg-paper-800/80 border border-graphite-300 dark:border-graphite-700">
            <div className="text-[11px] font-bold text-graphite-600 dark:text-slate-400 uppercase flex items-center gap-1">
              <Clock className="w-3 h-3 text-sky-600 dark:text-sky-400" /> Active Dwell Time
            </div>
            <div className="text-lg font-bold text-sky-700 dark:text-sky-400 font-mono mt-1">
              {formatDuration(visit.durationSec)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-paper-800/80 border border-graphite-300 dark:border-graphite-700">
            <div className="text-[11px] font-bold text-graphite-600 dark:text-slate-400 uppercase flex items-center gap-1">
              <Calendar className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> Navigation Timestamp
            </div>
            <div className="text-xs font-bold text-graphite-800 dark:text-slate-200 mt-1 font-mono">
              {formatTimestamp(('startTime' in visit ? visit.startTime : (visit as LineageNode).timestamp) || Date.now())}
            </div>
          </div>
        </div>

        {/* Search Query Anchor */}
        {visit.searchQuery && (
          <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-400">
            <div className="text-[11px] font-bold text-sky-900 dark:text-sky-300 uppercase flex items-center gap-1.5 mb-1">
              <Search className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> Originating Search Query
            </div>
            <div className="text-xs font-mono font-bold text-graphite-900 dark:text-white bg-white dark:bg-paper-900 p-2 rounded-lg border border-sky-300 dark:border-sky-700">
              "{visit.searchQuery}"
            </div>
          </div>
        )}

        {/* Parent Link Lineage */}
        {(visit as BrowsingVisit).parentTitle && (
          <div className="p-3 rounded-xl bg-white dark:bg-paper-800/80 border border-graphite-300 dark:border-graphite-700">
            <div className="text-[11px] font-bold text-graphite-600 dark:text-slate-400 uppercase flex items-center gap-1.5 mb-1">
              <GitFork className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Parent Page Ancestry
            </div>
            <div className="text-xs font-bold text-graphite-800 dark:text-slate-200">
              {(visit as BrowsingVisit).parentTitle}
            </div>
            {(visit as BrowsingVisit).parentUrl && (
              <div className="text-[11px] text-graphite-500 font-mono truncate mt-0.5">
                {(visit as BrowsingVisit).parentUrl}
              </div>
            )}
          </div>
        )}

        {/* URL Box */}
        <div className="flex flex-col gap-1">
          <div className="text-[11px] font-bold text-graphite-600 dark:text-slate-400 uppercase">Target Page URL</div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-paper-800 border border-graphite-300 dark:border-graphite-700 flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-graphite-800 dark:text-slate-200 break-all truncate max-w-[420px]">
              {visit.url}
            </span>
            <a
              href={visit.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white shrink-0 transition-colors shadow-xs"
              title="Open link in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Children Sub-branches */}
        {children.length > 0 && (
          <div className="flex flex-col gap-2 pt-2 border-t border-dashed border-graphite-300 dark:border-graphite-700">
            <div className="text-xs font-bold text-graphite-800 dark:text-slate-200 flex items-center gap-1.5">
              <CornerDownRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Branched Navigations from this Tab ({children.length})</span>
            </div>

            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
              {children.map((child) => (
                <div
                  key={child.id}
                  onClick={() => onSelectChild && onSelectChild(child)}
                  className="p-2 rounded-lg bg-white dark:bg-paper-800 hover:bg-paper-100 dark:hover:bg-paper-700 border border-graphite-300 dark:border-graphite-700 cursor-pointer flex items-center justify-between text-xs transition-colors"
                >
                  <span className="text-graphite-800 dark:text-slate-200 truncate max-w-[340px]" title={child.title}>
                    {child.title || child.url}
                  </span>
                  <span className="text-sky-700 dark:text-sky-400 font-mono font-bold">
                    {formatDuration(child.durationSec)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
