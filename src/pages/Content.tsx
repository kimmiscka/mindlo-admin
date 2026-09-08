import { useState, useMemo } from 'react';
import { Search, FileText, Clock, Globe } from 'lucide-react';
import TopBar from '../components/TopBar';
import articlesData from '../data/articles.json';

interface RawArticle {
  id: string;
  title: string;
  category: string;
  categories?: string[];
  format: string;
  duration: string;
  language: string;
  short_description: string;
}

const RAW = (articlesData as { articles: RawArticle[] }).articles;

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

const CATEGORY_LABELS: Record<string, string> = {
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

const CATEGORY_COLORS: Record<string, string> = {
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

const articles = RAW.map((a) => ({
  ...a,
  primaryKey: CATEGORY_KEY[a.category] ?? 'feelings',
}));

const ALL_CATEGORIES = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({ key, label }));

export default function Content() {
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [lang, setLang] = useState('all');

  const languages = useMemo(
    () => ['all', ...Array.from(new Set(articles.map((a) => a.language))).sort()],
    [],
  );

  const filtered = useMemo(() => {
    let list = articles;
    if (activeCat !== 'all') list = list.filter((a) => a.primaryKey === activeCat);
    if (lang !== 'all') list = list.filter((a) => a.language === lang);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.short_description.toLowerCase().includes(q),
      );
    }
    return list;
  }, [query, activeCat, lang]);

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Content" subtitle={`${articles.length} articles in the library`} />
      <main className="flex-1 p-6 space-y-4">

        {/* Filters row */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-56
                         focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal"
            />
          </div>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2
                       focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal"
          >
            {languages.map((l) => (
              <option key={l} value={l}>{l === 'all' ? 'All languages' : l}</option>
            ))}
          </select>
          <span className="ml-auto text-sm text-gray-400">{filtered.length} articles</span>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-1.5">
          {[{ key: 'all', label: 'All' }, ...ALL_CATEGORIES].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveCat(key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeCat === key
                  ? 'bg-brand-teal text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Article table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Title
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Category
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Language
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <FileText size={14} className="text-gray-300 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900 leading-snug">{a.title}</p>
                          {a.short_description && (
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{a.short_description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        CATEGORY_COLORS[a.primaryKey] ?? 'bg-gray-100 text-gray-600'
                      }`}>
                        {CATEGORY_LABELS[a.primaryKey] ?? a.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Globe size={12} className="text-gray-300" />
                        {a.language}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={12} className="text-gray-300" />
                        {a.duration}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400">
              No articles match your filters.
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400">
          Articles are bundled in{' '}
          <code className="bg-gray-100 px-1 py-0.5 rounded">mindlo_articles.json</code>
          {' '}in the mobile repo. Editing content requires a mobile app release.
        </p>
      </main>
    </div>
  );
}
