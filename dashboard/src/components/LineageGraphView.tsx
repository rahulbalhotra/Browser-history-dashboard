import React, { useState, useMemo } from 'react';
import { 
  GitFork, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  ExternalLink, 
  Clock, 
  EyeOff, 
  Globe, 
  CornerDownRight, 
  Filter, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  ArrowRight,
  FolderTree
} from 'lucide-react';
import { BrowsingVisit, LineageNode, ModeFilter } from '../types/tracking';
import { StorageService } from '../services/storageService';
import { formatDuration, formatTimestamp, getCategoryColor } from '../utils/formatters';

interface LineageGraphViewProps {
  visits: BrowsingVisit[];
  onSelectVisit: (visit: BrowsingVisit | LineageNode) => void;
}

export const LineageGraphView: React.FC<LineageGraphViewProps> = ({
  visits,
  onSelectVisit
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [incognitoOnly, setIncognitoOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [expandAll, setExpandAll] = useState(true);

  // Build trees from current filtered visits
  const trees = useMemo(() => {
    let filtered = visits;
    if (incognitoOnly) {
      filtered = filtered.filter(v => v.incognito);
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(v => v.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(v => 
        v.title.toLowerCase().includes(q) || 
        v.domain.toLowerCase().includes(q) || 
        (v.searchQuery && v.searchQuery.toLowerCase().includes(q))
      );
    }
    return StorageService.buildLineageTrees(filtered);
  }, [visits, incognitoOnly, selectedCategory, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleExpandAll = () => {
    if (expandAll) {
      setExpandedNodes(new Set());
      setExpandAll(false);
    } else {
      const allIds = new Set<string>();
      const collectIds = (nodes: LineageNode[]) => {
        nodes.forEach(n => {
          allIds.add(n.id);
          if (n.children && n.children.length > 0) {
            collectIds(n.children);
          }
        });
      };
      collectIds(trees);
      setExpandedNodes(allIds);
      setExpandAll(true);
    }
  };

  // Render individual tree branch recursively with sketch connectors
  const renderTreeNode = (node: LineageNode, depth = 0, isLast = false) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandAll ? !expandedNodes.has(node.id) : expandedNodes.has(node.id);
    const catColor = getCategoryColor(node.category);

    return (
      <div key={node.id} className="flex flex-col relative font-sketch">
        {/* Node Card */}
        <div 
          className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-200 border-1.5 relative group cursor-pointer shadow-sketch ${
            node.incognito 
              ? 'bg-purple-50/90 dark:bg-purple-950/30 border-purple-500 hover:border-purple-700' 
              : 'bg-white dark:bg-paper-900 border-graphite-400 dark:border-graphite-600 hover:border-sky-600 hover:bg-paper-50 dark:hover:bg-paper-850'
          }`}
          style={{ marginLeft: `${Math.min(depth * 24, 120)}px` }}
          onClick={() => onSelectVisit(node)}
        >
          {/* Tree connector branch guide for depth > 0 */}
          {depth > 0 && (
            <div className="absolute -left-4 top-4 w-4 h-0.5 border-t-2 border-dashed border-graphite-400 dark:border-graphite-600 pointer-events-none" />
          )}

          {/* Expand / Collapse toggle or Icon */}
          <div className="flex items-center gap-1.5 pt-0.5">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(node.id);
                }}
                className="w-6 h-6 rounded-md bg-paper-100 dark:bg-paper-800 border border-graphite-400 dark:border-graphite-600 hover:bg-paper-200 flex items-center justify-center text-graphite-800 dark:text-slate-200 transition-colors"
                title={isExpanded ? 'Collapse branch' : 'Expand branch'}
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <div className="w-6 h-6 flex items-center justify-center text-graphite-400">
                <CornerDownRight className="w-3.5 h-3.5" />
              </div>
            )}

            {/* Favicon */}
            <div className="w-6 h-6 rounded-md bg-white dark:bg-paper-800 flex items-center justify-center overflow-hidden border border-graphite-400 dark:border-graphite-600 shrink-0">
              {node.favIconUrl ? (
                <img 
                  src={node.favIconUrl} 
                  alt="" 
                  className="w-4 h-4 object-contain"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              ) : (
                <Globe className="w-3.5 h-3.5 text-graphite-500" />
              )}
            </div>
          </div>

          {/* Node Details */}
          <div className="flex-1 min-w-0">
            {/* Search Query Anchor pill if exists */}
            {node.searchQuery && (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-400 text-[11px] font-mono mb-1.5">
                <Search className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                <span>Search Anchor: <b>"{node.searchQuery}"</b></span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-graphite-900 dark:text-white truncate max-w-[340px]" title={node.title}>
                {node.title || node.url}
              </span>

              {/* Mode Badge */}
              {node.incognito ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-400 flex items-center gap-1">
                  <EyeOff className="w-2.5 h-2.5" /> Incognito
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-paper-100 dark:bg-paper-800 text-graphite-700 dark:text-slate-300 border border-graphite-400">
                  🌐 Normal
                </span>
              )}

              {/* Category Pill */}
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${catColor.bg} ${catColor.text} border ${catColor.border}`}>
                {node.category}
              </span>

              {/* Transition Type */}
              {node.transitionType && (
                <span className="text-[10px] text-graphite-500 dark:text-slate-400 font-mono">
                  via {node.transitionType}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-[11px] text-graphite-600 dark:text-slate-400 mt-1.5">
              <span className="font-mono font-bold text-graphite-800 dark:text-slate-200">{node.domain}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-sky-700 dark:text-sky-400 font-bold font-mono">
                <Clock className="w-3 h-3" />
                {formatDuration(node.durationSec)}
              </span>
              <span>•</span>
              <span>{formatTimestamp(node.timestamp)}</span>

              {hasChildren && (
                <>
                  <span>•</span>
                  <span className="text-purple-700 dark:text-purple-400 font-bold">
                    {node.children.length} sub-links branched
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Quick open external link */}
          <a
            href={node.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg bg-paper-100 hover:bg-paper-200 dark:bg-paper-800 dark:hover:bg-paper-700 text-graphite-600 hover:text-graphite-900 border border-graphite-400 transition-colors opacity-0 group-hover:opacity-100"
            title="Open page in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Recursive Children Branches */}
        {hasChildren && isExpanded && (
          <div className="flex flex-col gap-2 mt-2 relative pl-2 border-l-2 border-dashed border-graphite-400 dark:border-graphite-600 ml-4">
            {node.children.map((child, idx) => 
              renderTreeNode(child, depth + 1, idx === node.children.length - 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="sketch-card p-5 bg-white dark:bg-paper-800 font-sketch flex flex-col gap-4">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full border border-purple-500 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <FolderTree className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-graphite-900 dark:text-white tracking-tight">
              Navigation Lineage Tree Explorer
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-purple-100 text-purple-900 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-500 rounded-md font-mono">
              {trees.length} Root Lineages
            </span>
          </div>
          <p className="text-xs text-graphite-600 dark:text-slate-400 mt-1">
            Tracks parent-child ancestry: search queries $\to$ visited pages $\to$ tab branches in Normal & Incognito modes.
          </p>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-graphite-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, URL, query..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sketch-input pl-8 pr-3 py-1.5 text-xs text-graphite-900 dark:text-white placeholder-graphite-400 w-44 sm:w-56"
            />
          </div>

          {/* Incognito Only Toggle */}
          <button
            onClick={() => setIncognitoOnly(!incognitoOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border-1.5 shadow-sketch cursor-pointer ${
              incognitoOnly
                ? 'bg-purple-600 text-white border-purple-700'
                : 'bg-paper-50 dark:bg-paper-900 text-graphite-700 dark:text-slate-300 border-graphite-400'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Incognito Only</span>
          </button>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
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

          {/* Expand / Collapse All */}
          <button
            onClick={toggleExpandAll}
            className="sketch-btn px-3 py-1.5 bg-paper-50 dark:bg-paper-900 text-xs font-bold text-graphite-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer"
            title="Expand / Collapse all lineage branches"
          >
            {expandAll ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{expandAll ? 'Collapse' : 'Expand All'}</span>
          </button>
        </div>
      </div>

      {/* Tree Visualization Container */}
      <div className="flex flex-col gap-3 max-h-[640px] overflow-y-auto pr-1">
        {trees.length === 0 ? (
          <div className="text-center py-14 bg-paper-50 dark:bg-paper-900/60 rounded-xl border-1.5 border-dashed border-graphite-400">
            <GitFork className="w-8 h-8 text-graphite-400 mx-auto mb-2" />
            <div className="text-sm font-bold text-graphite-800 dark:text-slate-200">No lineage sessions matched your filter</div>
            <p className="text-xs text-graphite-500 mt-1">Try resetting the search query or mode toggles.</p>
          </div>
        ) : (
          trees.map((rootNode) => renderTreeNode(rootNode))
        )}
      </div>

    </div>
  );
};
