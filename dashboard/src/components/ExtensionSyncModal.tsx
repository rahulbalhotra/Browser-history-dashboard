import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Download, 
  Check, 
  AlertCircle, 
  Cpu, 
  ShieldCheck, 
  FolderPlus, 
  HelpCircle, 
  ExternalLink, 
  Sparkles,
  Puzzle
} from 'lucide-react';
import { BrowsingVisit } from '../types/tracking';
import { StorageService } from '../services/storageService';

interface ExtensionSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataImported: () => void;
  visits: BrowsingVisit[];
}

export const ExtensionSyncModal: React.FC<ExtensionSyncModalProps> = ({
  isOpen,
  onClose,
  onDataImported,
  visits
}) => {
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = StorageService.importExtensionData(content);
        if (res.success) {
          setImportStatus({
            success: true,
            message: `Successfully imported ${res.count} new navigation visits from extension!`
          });
          onDataImported();
        } else {
          setImportStatus({
            success: false,
            message: res.error || 'Failed to parse JSON file'
          });
        }
      }
    };
    reader.readAsText(file);
  };

  const handleExportData = () => {
    const exportObj = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      totalVisits: visits.length,
      lineage_visits: visits
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lineagetrack_data_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-900/60 backdrop-blur-xs animate-fade-in font-sketch">
      <div 
        className="sketch-card w-full max-w-2xl bg-paper-50 dark:bg-paper-900 p-6 shadow-sketch-lg flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-dashed border-graphite-300 dark:border-graphite-700 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/60 border border-sky-500 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Puzzle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-graphite-900 dark:text-white">
                Browser Extension & Data Sync Center
              </h2>
              <p className="text-xs text-graphite-600 dark:text-slate-400">
                Connect your Chrome/Edge browser extension or import/export JSON logs.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white dark:bg-paper-800 hover:bg-paper-200 text-graphite-700 dark:text-slate-200 border border-graphite-400 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4-Step Quick Install Card */}
        <div className="bg-white dark:bg-paper-800 border-1.5 border-graphite-300 dark:border-graphite-700 rounded-xl p-4 flex flex-col gap-2.5 shadow-sketch">
          <div className="text-xs font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>How to Load the Extension (Manifest V3)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-graphite-700 dark:text-slate-300">
            <div className="p-2.5 rounded-lg bg-paper-50 dark:bg-paper-900 border border-graphite-300 dark:border-graphite-700">
              <div className="font-bold text-graphite-900 dark:text-white mb-1">1. Open Extensions Page</div>
              <p className="text-graphite-600 dark:text-slate-400">
                In Chrome, go to <code className="text-sky-700 dark:text-sky-300 font-mono font-bold">chrome://extensions</code> and toggle ON <b>Developer mode</b>.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-paper-50 dark:bg-paper-900 border border-graphite-300 dark:border-graphite-700">
              <div className="font-bold text-graphite-900 dark:text-white mb-1">2. Load Unpacked</div>
              <p className="text-graphite-600 dark:text-slate-400">
                Click <b>"Load unpacked"</b> and select: <code className="text-sky-700 dark:text-sky-300 font-mono">d:\Browser Tracking Dashboard\extension</code>.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-400">
              <div className="font-bold text-purple-900 dark:text-purple-200 mb-1">3. Enable Incognito Mode</div>
              <p className="text-purple-800 dark:text-purple-300/80">
                Click <b>Details</b> on LineageTrack $\to$ toggle ON <b>"Allow in Incognito"</b> to track private lineage!
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-paper-50 dark:bg-paper-900 border border-graphite-300 dark:border-graphite-700">
              <div className="font-bold text-graphite-900 dark:text-white mb-1">4. Automatic Local Logging</div>
              <p className="text-graphite-600 dark:text-slate-400">
                All visits, idle dwell times, and lineage links are stored locally on your machine with 100% privacy.
              </p>
            </div>
          </div>
        </div>

        {/* Import JSON Section */}
        <div className="border-1.5 border-graphite-300 dark:border-graphite-700 rounded-xl p-4 bg-white dark:bg-paper-800 flex flex-col gap-2.5 shadow-sketch">
          <div className="text-xs font-bold text-graphite-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Import Extension JSON Export</span>
          </div>

          <p className="text-xs text-graphite-600 dark:text-slate-400">
            Export JSON from your LineageTrack popup, then drop or upload the file here to merge it with your dashboard:
          </p>

          <label className="border-2 border-dashed border-graphite-400 dark:border-graphite-600 hover:border-sky-500 rounded-xl p-5 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-paper-50 dark:bg-paper-900 transition-colors">
            <Upload className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            <span className="text-xs font-bold text-graphite-800 dark:text-slate-200">
              Click to select JSON export file
            </span>
            <span className="text-[11px] text-graphite-500 font-mono">
              lineagetrack_export_*.json
            </span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {importStatus && (
            <div className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 ${
              importStatus.success
                ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-500'
                : 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300 border border-rose-500'
            }`}>
              {importStatus.success ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{importStatus.message}</span>
            </div>
          )}
        </div>

        {/* Export Data Button */}
        <div className="flex items-center justify-between pt-2 border-t border-graphite-300 dark:border-graphite-700">
          <div className="text-xs text-graphite-600 dark:text-slate-400">
            Total active visits in database: <b className="text-graphite-900 dark:text-white font-mono">{visits.length}</b>
          </div>

          <button
            onClick={handleExportData}
            className="sketch-btn px-4 py-2 bg-paper-100 dark:bg-paper-800 text-xs font-bold text-graphite-900 dark:text-white flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Export Complete Dataset (.JSON)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
