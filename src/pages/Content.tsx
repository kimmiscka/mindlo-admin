import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Trash2, Edit2, Database, FileText, BookOpen, Dumbbell } from 'lucide-react';
import TopBar from '../components/TopBar';
import ArticleForm from '../components/ArticleForm';
import { useAuth } from '../hooks/useAuth';
import { listArticles, upsertArticle, deleteArticle, seedArticles } from '../lib/contentApi';
import type { CmsArticle } from '../types';
import { CATEGORY_LABELS } from '../types';
import quizzesRaw from '../data/quizzes.json';

type Tab = 'articles' | 'quizzes' | 'exercises';

const STATUS_COLORS = {
  published: 'bg-green-100 text-green-700',
  draft: 'bg-amber-100 text-amber-700',
};

const CATEGORY_PILL: Record<string, string> = {
  feelings: 'bg-violet-100 text-violet-700',
  breathwork: 'bg-teal-100 text-teal-700',
  teens: 'bg-pink-100 text-pink-700',
  family: 'bg-amber-100 text-amber-700',
  friends: 'bg-rose-100 text-rose-700',
  highschool: 'bg-lime-100 text-lime-700',
  university: 'bg-blue-100 text-blue-700',
  physical: 'bg-pink-100 text-pink-700',
  mind: 'bg-slate-100 text-slate-700',
  relationships: 'bg-fuchsia-100 text-fuchsia-700',
};

export default function Content() {
  const { admin } = useAuth();
  const [tab, setTab] = useState<Tab>('articles');
  const [articles, setArticles] = useState<CmsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [formArticle, setFormArticle] = useState<Partial<CmsArticle> | null | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      setArticles(await listArticles());
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = articles;
    if (catFilter !== 'all') list = list.filter((a) => a.category === catFilter);
    if (statusFilter !== 'all') list = list.filter((a) => a.status === statusFilter);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((a) => a.title.toLowerCase().includes(q) || a.short_description.toLowerCase().includes(q));
    }
    return list;
  }, [articles, catFilter, statusFilter, query]);

  async function handleSave(data: Partial<CmsArticle> & { title: string; category: string }, status: 'draft' | 'published') {
    if (!admin) return;
    await upsertArticle({ ...data, status }, admin.id, admin.email);
    setFormArticle(undefined);
    await load();
  }

  async function handleDelete() {
    if (!deleteId || !admin) return;
    setDeleting(true);
    try {
      await deleteArticle(deleteId, admin.id, admin.email);
      setDeleteId(null);
      await load();
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setDeleting(false);
    }
  }

  async function handleSeed() {
    if (!admin) return;
    setSeeding(true);
    setError('');
    try {
      const n = await seedArticles(admin.id, admin.email);
      await load();
      alert(`Seeded ${n} articles from bundled data.`);
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setSeeding(false);
    }
  }

  // Static quiz data for read-only tab
  type RawQuiz = { id: string; title: string; topic?: string; categories?: string[]; format?: string };
  const quizzes: RawQuiz[] = (quizzesRaw as { quizzes: RawQuiz[] }).quizzes ?? [];

  const EXERCISES = [
    { id: 'box-breathing', title: 'Box breathing', type: 'breathing' },
    { id: 'palm-breathing', title: 'Palm breathing', type: 'breathing' },
    { id: 'deep-belly', title: 'Deep belly breath', type: 'breathing' },
    { id: 'flower-candle', title: 'Flower & candle', type: 'breathing' },
    { id: 'lions-breath', title: "Lion's breath", type: 'breathing' },
    { id: 'stomp-stomp-blow', title: 'Stomp stomp blow', type: 'breathing' },
    { id: 'bumble-bee', title: 'Bumble bee', type: 'breathing' },
    { id: 'reset', title: 'Reset', type: 'breathing' },
    { id: 'grounding-54321', title: '5-4-3-2-1 grounding', type: 'grounding' },
    { id: 'abc-room', title: 'ABC room', type: 'grounding' },
    { id: 'deep-pressure-hug', title: 'Deep pressure hug', type: 'grounding' },
    { id: 'deep-dive-reflex', title: 'Deep dive reflex', type: 'grounding' },
    { id: 'heavy-work', title: 'Heavy work', type: 'grounding' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Content" subtitle="Manage the MindLo library" />
      <main className="flex-1 p-6 space-y-4">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {([
            { key: 'articles', label: 'Articles', icon: FileText, count: articles.length },
            { key: 'quizzes',  label: 'Quizzes',  icon: BookOpen,  count: quizzes.length },
            { key: 'exercises',label: 'Exercises', icon: Dumbbell,  count: EXERCISES.length },
          ] as { key: Tab; label: string; icon: typeof FileText; count: number }[]).map(({ key, label, icon: Icon, count }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === key ? 'bg-white text-brand-teal shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <Icon size={14} /> {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                tab === key ? 'bg-brand-teal-pale text-brand-teal' : 'bg-gray-200 text-gray-500'
              }`}>{count}</span>
            </button>
          ))}
        </div>

        {/* ── Articles tab ───────────────────────────────────────────── */}
        {tab === 'articles' && (
          <>
            {/* Seed banner (shown when DB is empty) */}
            {!loading && articles.length === 0 && (
              <div className="bg-brand-teal-pale border border-brand-teal/20 rounded-xl px-5 py-4 flex items-start gap-4">
                <Database size={20} className="text-brand-teal mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-brand-teal">No articles in Supabase yet</p>
                  <p className="text-sm text-brand-teal/80 mt-0.5">
                    Seed the database from the 87 bundled articles to get started. This is a one-time operation.
                  </p>
                </div>
                <button onClick={handleSeed} disabled={seeding}
                  className="px-4 py-2 text-sm font-medium bg-brand-teal text-white rounded-lg hover:bg-brand-teal-mid disabled:opacity-50 flex-shrink-0">
                  {seeding ? 'Seeding…' : 'Seed 87 articles'}
                </button>
              </div>
            )}

            {/* Filters + New button */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search articles…" value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-52
                             focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal" />
              </div>
              <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/30">
                <option value="all">All categories</option>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'draft')}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/30">
                <option value="all">All statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              <span className="text-sm text-gray-400 ml-1">{filtered.length} articles</span>
              <div className="flex-1" />
              {articles.length > 0 && (
                <button onClick={handleSeed} disabled={seeding}
                  className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg">
                  {seeding ? 'Seeding…' : 'Re-seed from bundled'}
                </button>
              )}
              <button onClick={() => setFormArticle(null)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-brand-teal text-white rounded-lg hover:bg-brand-teal-mid">
                <Plus size={15} /> New article
              </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {loading ? (
                <div className="py-12 text-center text-sm text-gray-400">Loading…</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        {['Title', 'Category', 'Language', 'Duration', 'Status', ''].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filtered.map((a) => (
                        <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 max-w-xs">
                            <p className="font-medium text-gray-900 truncate">{a.title}</p>
                            {a.short_description && (
                              <p className="text-xs text-gray-400 truncate mt-0.5">{a.short_description}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${CATEGORY_PILL[a.category] ?? 'bg-gray-100 text-gray-600'}`}>
                              {CATEGORY_LABELS[a.category] ?? a.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{a.language}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{a.duration}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_COLORS[a.status]}`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 justify-end">
                              <button onClick={() => setFormArticle(a)}
                                className="p-1.5 hover:bg-brand-teal-pale rounded-lg transition-colors">
                                <Edit2 size={14} className="text-brand-teal" />
                              </button>
                              <button onClick={() => setDeleteId(a.id)}
                                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 size={14} className="text-red-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filtered.length === 0 && !loading && (
                    <div className="py-10 text-center text-sm text-gray-400">No articles match your filters.</div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Quizzes tab (read-only) ────────────────────────────────── */}
        {tab === 'quizzes' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 text-xs text-amber-700 font-medium">
              Quizzes are bundled in the app. Editing requires updating mindlo_quizzes.json and a mobile release.
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Title', 'Topic', 'Format'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {quizzes.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{q.title}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{q.topic}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{q.format ?? 'quiz'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Exercises tab (read-only) ──────────────────────────────── */}
        {tab === 'exercises' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 text-xs text-amber-700 font-medium">
              Exercises are animated and i18n-keyed — they live in the app codebase and cannot be edited here.
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Title', 'Type'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {EXERCISES.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{e.title}</td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-medium">
                        {e.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Article form panel */}
      {formArticle !== undefined && (
        <ArticleForm
          article={formArticle}
          onSave={handleSave}
          onClose={() => setFormArticle(undefined)}
        />
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <p className="text-base font-semibold text-gray-900 mb-2">Delete this article?</p>
            <p className="text-sm text-gray-500 mb-5">
              This removes it from Supabase immediately. The action is logged but cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} disabled={deleting}
                className="flex-1 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2 text-sm font-medium bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
