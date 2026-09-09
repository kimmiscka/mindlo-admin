import { supabase } from './supabase';
import { logAudit } from './audit';
import type { CmsArticle, CmsDirectoryService, CmsQuote } from '../types';
import articlesJson from '../data/articles.json';
import quotesJson from '../data/quotes.json';
import directoryJson from '../data/directory.json';

// ── Category key mapping (mirrors articles.ts in mobile app) ─────────────────
const CATEGORY_KEY: Record<string, string> = {
  'Feelings & Emotions': 'feelings',
  'Breathwork & Grounding': 'breathwork',
  Teens: 'teens',
  Family: 'family',
  Friends: 'friends',
  'High School': 'highschool',
  'University and Career': 'university',
  'Physical Health': 'physical',
  'Healthy Mind': 'mind',
  Relationships: 'relationships',
};

function toSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
}

// ── Articles ─────────────────────────────────────────────────────────────────

export async function listArticles(): Promise<CmsArticle[]> {
  const { data, error } = await supabase
    .from('cms_articles')
    .select('*')
    .order('title');
  if (error) throw new Error(error.message);
  return (data ?? []) as CmsArticle[];
}

export async function upsertArticle(
  article: Partial<CmsArticle> & { title: string; category: string },
  adminId: string,
  adminEmail: string,
): Promise<CmsArticle> {
  const id = article.id || toSlug(article.title);
  const isNew = !article.id;
  const payload = { ...article, id, updated_at: new Date().toISOString() };
  if (isNew) payload.created_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('cms_articles')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw new Error(error.message);

  await logAudit(adminId, adminEmail, {
    action: isNew ? 'create_article' : 'update_article',
    resource_type: 'article',
    resource_id: id,
    details: { title: article.title, status: article.status },
  });
  return data as CmsArticle;
}

export async function deleteArticle(id: string, adminId: string, adminEmail: string): Promise<void> {
  const { error } = await supabase.from('cms_articles').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit(adminId, adminEmail, {
    action: 'delete_article',
    resource_type: 'article',
    resource_id: id,
  });
}

// Seed from bundled mindlo_articles.json (idempotent upsert).
export async function seedArticles(adminId: string, adminEmail: string): Promise<number> {
  type Raw = {
    id: string; title: string; category: string; categories?: string[];
    topic: string | null; format: string; duration: string; language: string;
    short_description: string; body: string[] | string; themes?: string[]; support?: string[];
  };
  const rows = (articlesJson as { articles: Raw[] }).articles.map((a) => {
    const primaryKey = CATEGORY_KEY[a.category] ?? 'feelings';
    const categoryKeys = Array.isArray(a.categories) && a.categories.length
      ? a.categories.map((c) => CATEGORY_KEY[c]).filter(Boolean)
      : [primaryKey];
    return {
      id: a.id,
      title: a.title,
      category: primaryKey,
      categories: categoryKeys,
      topic: a.topic ?? '',
      format: a.format === 'video' ? 'video' : 'article',
      duration: a.duration ?? '',
      language: a.language ?? 'English',
      short_description: a.short_description ?? '',
      body: Array.isArray(a.body) ? a.body : a.body ? [a.body] : [],
      themes: a.themes ?? [],
      support: a.support?.length ? a.support : null,
      status: 'published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase.from('cms_articles').upsert(rows, { onConflict: 'id' });
  if (error) throw new Error(error.message);
  await logAudit(adminId, adminEmail, {
    action: 'seed_articles',
    resource_type: 'article',
    details: { count: rows.length },
  });
  return rows.length;
}

// ── Directory services ────────────────────────────────────────────────────────

export async function listServices(): Promise<CmsDirectoryService[]> {
  const { data, error } = await supabase
    .from('cms_directory_services')
    .select('*')
    .order('sort_order');
  if (error) throw new Error(error.message);
  return (data ?? []) as CmsDirectoryService[];
}

export async function upsertService(
  svc: Partial<CmsDirectoryService> & { name: string; tier: CmsDirectoryService['tier'] },
  adminId: string,
  adminEmail: string,
): Promise<CmsDirectoryService> {
  const id = svc.id || toSlug(svc.name);
  const isNew = !svc.id;
  const payload = { ...svc, id, updated_at: new Date().toISOString() };

  const { data, error } = await supabase
    .from('cms_directory_services')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw new Error(error.message);

  await logAudit(adminId, adminEmail, {
    action: isNew ? 'create_directory_service' : 'update_directory_service',
    resource_type: 'directory_service',
    resource_id: id,
    details: { name: svc.name },
  });
  return data as CmsDirectoryService;
}

export async function deleteService(id: string, adminId: string, adminEmail: string): Promise<void> {
  const { error } = await supabase.from('cms_directory_services').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit(adminId, adminEmail, {
    action: 'delete_directory_service',
    resource_type: 'directory_service',
    resource_id: id,
  });
}

export async function seedDirectory(adminId: string, adminEmail: string): Promise<number> {
  const rows = (directoryJson as CmsDirectoryService[]).map((s, i) => ({
    ...s,
    sort_order: s.sort_order ?? i,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase
    .from('cms_directory_services')
    .upsert(rows, { onConflict: 'id' });
  if (error) throw new Error(error.message);
  await logAudit(adminId, adminEmail, {
    action: 'seed_directory',
    resource_type: 'directory_service',
    details: { count: rows.length },
  });
  return rows.length;
}

// ── Daily quotes ──────────────────────────────────────────────────────────────

export async function listQuotes(): Promise<CmsQuote[]> {
  const { data, error } = await supabase
    .from('cms_daily_quotes')
    .select('*')
    .order('sort_order');
  if (error) throw new Error(error.message);
  return (data ?? []) as CmsQuote[];
}

export async function upsertQuote(
  quote: Partial<CmsQuote> & { text: string },
  adminId: string,
  adminEmail: string,
): Promise<CmsQuote> {
  const isNew = !quote.id;
  const { data, error } = await supabase
    .from('cms_daily_quotes')
    .upsert(quote, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  await logAudit(adminId, adminEmail, {
    action: isNew ? 'create_quote' : 'update_quote',
    resource_type: 'quote',
    resource_id: String(quote.id ?? ''),
  });
  return data as CmsQuote;
}

export async function deleteQuote(id: number, adminId: string, adminEmail: string): Promise<void> {
  const { error } = await supabase.from('cms_daily_quotes').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit(adminId, adminEmail, {
    action: 'delete_quote',
    resource_type: 'quote',
    resource_id: String(id),
  });
}

export async function reorderQuotes(
  orderedIds: number[],
  adminId: string,
  adminEmail: string,
): Promise<void> {
  const updates = orderedIds.map((id, i) =>
    supabase.from('cms_daily_quotes').update({ sort_order: i }).eq('id', id),
  );
  await Promise.all(updates);
  await logAudit(adminId, adminEmail, { action: 'reorder_quotes', resource_type: 'quote' });
}

export async function seedQuotes(adminId: string, adminEmail: string): Promise<number> {
  const rows = (quotesJson as { daily_quotes: { id: number; text: string }[] }).daily_quotes.map(
    (q, i) => ({ text: q.text, sort_order: i, status: 'published' }),
  );
  const { error } = await supabase.from('cms_daily_quotes').insert(rows);
  if (error) throw new Error(error.message);
  await logAudit(adminId, adminEmail, {
    action: 'seed_quotes',
    resource_type: 'quote',
    details: { count: rows.length },
  });
  return rows.length;
}

// ── Analytics ────────────────────────────────────────────────────────────────

export async function getAnalyticsTotalUsers(): Promise<number> {
  const { data, error } = await supabase.rpc('analytics_total_users');
  if (error) throw new Error(error.message);
  return data as number;
}

export async function getAnalyticsNewUsers(startDate: string, endDate: string): Promise<number> {
  const { data, error } = await supabase.rpc('analytics_new_users', {
    start_date: startDate,
    end_date: endDate,
  });
  if (error) throw new Error(error.message);
  return data as number;
}

export async function getAnalyticsDailyActiveUsers(startDate: string, endDate: string): Promise<Array<{ date: string; count: number }>> {
  const { data, error } = await supabase.rpc('analytics_daily_active_users', {
    start_date: startDate,
    end_date: endDate,
  });
  if (error) throw new Error(error.message);
  return (data as Array<{ date: string; count: number }>) ?? [];
}

export async function getAnalyticsCheckInCompletion(startDate: string, endDate: string): Promise<Array<{ date: string; count: number }>> {
  const { data, error } = await supabase.rpc('analytics_check_in_completion', {
    start_date: startDate,
    end_date: endDate,
  });
  if (error) throw new Error(error.message);
  return (data as Array<{ date: string; count: number }>) ?? [];
}

export async function getAnalyticsContentCompletion(startDate: string, endDate: string): Promise<Array<{ content_type: string; content_id: string; count: number }>> {
  const { data, error } = await supabase.rpc('analytics_content_completion', {
    start_date: startDate,
    end_date: endDate,
  });
  if (error) throw new Error(error.message);
  return (data as Array<{ content_type: string; content_id: string; count: number }>) ?? [];
}

export async function getAnalyticsMoodDistribution(startDate: string, endDate: string): Promise<Array<{ mood_key: string | null; count: number }>> {
  const { data, error } = await supabase.rpc('analytics_mood_distribution', {
    start_date: startDate,
    end_date: endDate,
  });
  if (error) throw new Error(error.message);
  return (data as Array<{ mood_key: string | null; count: number }>) ?? [];
}

export async function getAnalyticsThemeFrequency(startDate: string, endDate: string): Promise<Array<{ theme: string; count: number }>> {
  const { data, error } = await supabase.rpc('analytics_theme_frequency', {
    start_date: startDate,
    end_date: endDate,
  });
  if (error) throw new Error(error.message);
  return (data as Array<{ theme: string; count: number }>) ?? [];
}

// ── User Management ──────────────────────────────────────────────────────────

export async function getUserList(
  searchTerm?: string,
  limit: number = 50,
  offset: number = 0,
): Promise<Array<any>> {
  const { data, error } = await supabase.rpc('get_user_list', {
    search_term: searchTerm || null,
    limit_count: limit,
    offset_count: offset,
  });
  if (error) throw new Error(error.message);
  return (data ?? []);
}

export async function countAppUsers(searchTerm?: string): Promise<number> {
  const { data, error } = await supabase.rpc('count_app_users', {
    search_term: searchTerm || null,
  });
  if (error) throw new Error(error.message);
  return data as number;
}

export async function getUserDetail(userId: string): Promise<any> {
  const { data, error } = await supabase.rpc('get_user_detail', {
    user_id: userId,
  });
  if (error) throw new Error(error.message);
  if (!Array.isArray(data) || data.length === 0) return null;
  return data[0];
}

export async function logUserAccess(
  adminId: string,
  adminEmail: string,
  targetUserId: string,
  accessType: string,
  reason?: string,
  details?: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase.rpc('log_user_access', {
    admin_id: adminId,
    admin_email: adminEmail,
    target_user_id: targetUserId,
    access_type: accessType,
    reason: reason || null,
    details: details || null,
  });
  if (error) throw new Error(error.message);
  await logAudit(adminId, adminEmail, {
    action: 'user_access',
    resource_type: 'user',
    resource_id: targetUserId,
    details: { accessType, reason },
  });
}

export async function getSafeguardingFlags(): Promise<Array<any>> {
  const { data, error } = await supabase
    .from('user_safeguarding_flags')
    .select('*')
    .is('addressed_at', true);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function markFlagAddressed(
  flagId: string,
  adminId: string,
  notes: string,
): Promise<void> {
  const { error } = await supabase
    .from('user_safeguarding_flags')
    .update({ addressed_by: adminId, addressed_at: new Date().toISOString(), addressed_notes: notes })
    .eq('id', flagId);
  if (error) throw new Error(error.message);
}

export async function deleteUserAndData(userId: string, adminId: string, adminEmail: string): Promise<void> {
  // Delete user via Supabase auth
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);

  // Log the deletion
  await logAudit(adminId, adminEmail, {
    action: 'delete_user',
    resource_type: 'user',
    resource_id: userId,
    details: { reason: 'POPIA erasure right - user deletion' },
  });
}
