import { CategoryType } from '../types/tracking';

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

export function formatHours(hours: number): string {
  if (!hours || hours <= 0) return '0h';
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  }
  return `${hours.toFixed(1)}h`;
}

export function formatTimestamp(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export function formatTimeAgo(timestamp: number): string {
  const now = new Date('2026-08-23T02:00:00+05:30').getTime();
  const diffSec = Math.max(0, Math.floor((now - timestamp) / 1000));

  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} mo ago`;
}

export function getCategoryColor(category: CategoryType | string): {
  bg: string;
  text: string;
  border: string;
  accent: string;
} {
  switch (category) {
    case 'Development':
      return {
        bg: 'bg-emerald-100 dark:bg-emerald-950/60',
        text: 'text-emerald-800 dark:text-emerald-300',
        border: 'border-emerald-600/40 dark:border-emerald-500/40',
        accent: '#10b981'
      };
    case 'Productivity':
      return {
        bg: 'bg-sky-100 dark:bg-sky-950/60',
        text: 'text-sky-800 dark:text-sky-300',
        border: 'border-sky-600/40 dark:border-sky-500/40',
        accent: '#0284c7'
      };
    case 'Entertainment':
      return {
        bg: 'bg-rose-100 dark:bg-rose-950/60',
        text: 'text-rose-800 dark:text-rose-300',
        border: 'border-rose-600/40 dark:border-rose-500/40',
        accent: '#f43f5e'
      };
    case 'Social Media':
      return {
        bg: 'bg-purple-100 dark:bg-purple-950/60',
        text: 'text-purple-800 dark:text-purple-300',
        border: 'border-purple-600/40 dark:border-purple-500/40',
        accent: '#a855f7'
      };
    case 'Research & News':
      return {
        bg: 'bg-amber-100 dark:bg-amber-950/60',
        text: 'text-amber-800 dark:text-amber-300',
        border: 'border-amber-600/40 dark:border-amber-500/40',
        accent: '#f59e0b'
      };
    case 'Shopping':
      return {
        bg: 'bg-pink-100 dark:bg-pink-950/60',
        text: 'text-pink-800 dark:text-pink-300',
        border: 'border-pink-600/40 dark:border-pink-500/40',
        accent: '#ec4899'
      };
    default:
      return {
        bg: 'bg-slate-100 dark:bg-slate-800/80',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-400/50 dark:border-slate-600/50',
        accent: '#64748b'
      };
  }
}
