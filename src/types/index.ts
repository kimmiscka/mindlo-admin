export type AdminRole = 'super_admin' | 'content_manager' | 'support_moderator';

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  created_at: string;
}

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  content_manager: 'Content Manager',
  support_moderator: 'Support / Moderator',
};

// Which sidebar sections each role can access.
export const ROLE_SECTIONS: Record<AdminRole, string[]> = {
  super_admin:       ['overview', 'content', 'users', 'activity', 'directory', 'quotes', 'settings'],
  content_manager:   ['overview', 'content', 'directory', 'quotes'],
  support_moderator: ['overview', 'users', 'activity'],
};

// ── CMS content types ────────────────────────────────────────────────────────

export interface CmsArticle {
  id: string;
  title: string;
  category: string;
  categories: string[];
  topic: string;
  format: 'article' | 'video';
  duration: string;
  language: string;
  short_description: string;
  body: string[];
  themes: string[];
  support: string[] | null;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export type ContactKind = 'call' | 'sms' | 'whatsapp';
export interface ServiceContact { kind: ContactKind; display: string; url: string; }

export interface CmsDirectoryService {
  id: string;
  name: string;
  description: string;
  tier: 'emergency' | 'support' | 'partner';
  cost: string | null;
  url: string | null;
  contacts: ServiceContact[];
  sort_order: number;
  status: 'draft' | 'published';
  updated_at: string;
}

export interface CmsQuote {
  id: number;
  text: string;
  sort_order: number;
  status: 'draft' | 'published';
}

export const CATEGORY_KEY: Record<string, string> = {
  'Feelings & Emotions': 'feelings',
  'Breathwork & Grounding': 'breathwork',
  'Teens': 'teens',
  'Family': 'family',
  'Friends': 'friends',
  'High School': 'highschool',
  'University and Career': 'university',
  'Physical Health': 'physical',
  'Healthy Mind': 'mind',
  'Relationships': 'relationships',
};

export const CATEGORY_LABELS: Record<string, string> = {
  feelings: 'Feelings & emotions',
  breathwork: 'Breathwork & grounding',
  teens: 'Teens',
  family: 'Family',
  friends: 'Friends',
  highschool: 'High School',
  university: 'University & career',
  physical: 'Physical health',
  mind: 'Healthy mind',
  relationships: 'Relationships',
};

// ── Analytics types ─────────────────────────────────────────────────────────

export interface DailyMetric {
  date: string;
  count: number;
}

export interface ContentCompletion {
  content_type: string;
  content_id: string;
  count: number;
}

export interface MoodStat {
  mood_key: string | null;
  count: number;
}

export interface ThemeStat {
  theme: string;
  count: number;
}

export interface AnalyticsMetrics {
  totalUsers: number;
  newUsers: number;
  dau: DailyMetric[];
  checkins: DailyMetric[];
  topContent: ContentCompletion[];
  moodDistribution: MoodStat[];
  themeFrequency: ThemeStat[];
}
