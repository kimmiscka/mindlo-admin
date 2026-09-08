import { useState } from 'react';
import { Search } from 'lucide-react';
import TopBar from '../components/TopBar';
import quotesData from '../data/quotes.json';

interface Quote { id: number; text: string; }
const QUOTES: Quote[] = (quotesData as { daily_quotes: Quote[] }).daily_quotes;

export default function Quotes() {
  const [query, setQuery] = useState('');

  const filtered = query
    ? QUOTES.filter((q) => q.text.toLowerCase().includes(query.toLowerCase()))
    : QUOTES;

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Daily Quotes" subtitle="30-quote motivational rotation" />
      <main className="flex-1 p-6 space-y-4">

        {/* Search + count */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search quotes…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal"
            />
          </div>
          <span className="text-sm text-gray-400">{filtered.length} of {QUOTES.length}</span>
        </div>

        {/* Quote cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((q) => (
            <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
              {/* Notification preview */}
              <div className="bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                    MindLo · Notification preview
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-gray-800">💛 MindLo</p>
                <p className="text-[11px] text-gray-600 leading-snug mt-0.5">{q.text}</p>
              </div>
              {/* Meta */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Quote #{q.id}</span>
                <span className="text-xs text-gray-400">Day {q.id} of 30 · index {q.id - 1}</span>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-gray-400">No quotes match "{query}"</div>
        )}

        <p className="text-xs text-gray-400 pt-2">
          Quotes rotate by calendar day (daysSinceEpoch % 30). To update, edit{' '}
          <code className="bg-gray-100 px-1 py-0.5 rounded">mindlo_daily_quotes.json</code>{' '}
          in the mobile repo and redeploy.
        </p>
      </main>
    </div>
  );
}
