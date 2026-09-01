export type CategoryType = 
  | 'Development'
  | 'Productivity'
  | 'Entertainment'
  | 'Social Media'
  | 'Research & News'
  | 'Shopping'
  | 'General';

export interface BrowsingVisit {
  id: string;
  tabId?: number;
  windowId?: number;
  url: string;
  domain: string;
  title: string;
  favIconUrl?: string;
  incognito: boolean;
  startTime: number;
  endTime: number;
  durationSec: number;
  parentVisitId?: string | null;
  parentUrl?: string | null;
  parentTitle?: string | null;
  transitionType: string;
  searchQuery?: string;
  category: CategoryType;
}

export interface LineageNode {
  id: string;
  title: string;
  url: string;
  domain: string;
  durationSec: number;
  incognito: boolean;
  searchQuery?: string;
  transitionType?: string;
  timestamp: number;
  favIconUrl?: string;
  category: CategoryType;
  children: LineageNode[];
  parentVisitId?: string | null;
}

export type TimeWindow6h = '00:00-06:00' | '06:00-12:00' | '12:00-18:00' | '18:00-24:00';
export type TimeWindowFilter = 'all' | TimeWindow6h;
export type DateRangeFilter = 'today' | 'yesterday' | '7d' | '30d' | '90d' | '180d' | '365d' | 'all';
export type ModeFilter = 'all' | 'normal' | 'incognito';

export interface PageVisitStat {
  url: string;
  title: string;
  visits: number;
  durationSec: number;
  incognito: boolean;
}

export interface DomainMetric {
  domain: string;
  visits: number;
  durationSec: number;
  normalDurationSec: number;
  incognitoDurationSec: number;
  category: CategoryType;
  topPages: PageVisitStat[];
  searchQueries: string[];
  favIconUrl?: string;
  avgDurationSec: number;
}

export interface MonthlyTrendSummary {
  monthKey: string; // "2026-06"
  monthName: string; // "June 2026"
  totalHours: number;
  normalHours: number;
  incognitoHours: number;
  totalVisits: number;
  categoryBreakdown: Record<CategoryType, number>; // in hours
  topDomains: { domain: string; hours: number; visits: number; category: CategoryType }[];
  hourlyDistribution: number[]; // 24 hours in percentage or hours
  focusScore: number; // 0 - 100
  nightBrowsingRatio: number; // % between 00:00-06:00
}

export interface DailyStatsBucket {
  date: string; // "2026-08-23"
  totalSeconds: number;
  normalSeconds: number;
  incognitoSeconds: number;
  domains: Record<string, { visits: number; durationSec: number; incognitoSec: number; category: CategoryType }>;
  categories: Record<string, number>;
  timeWindows: Record<TimeWindow6h, { totalSec: number; incognitoSec: number }>;
  hourly: number[];
}
