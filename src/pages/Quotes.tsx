import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, ChevronUp, ChevronDown, Check, X, Database } from 'lucide-react';
import TopBar from '../components/TopBar';
import { useAuth } from '../hooks/useAuth';
import { listQuotes, upsertQuote, deleteQuote, reorderQuotes, seedQuotes } from '../lib/contentApi';
import type { CmsQuote } from '../types';

export default function Quotes() {
  const { admin } = useAuth();
  const [quotes, setQuotes] = useState<CmsQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [editText, setEditText] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try { setQuotes(await listQuotes()); }
    catch (e: unknown) { setError(String(e)); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    if (!admin || !editText.trim()) return;
    setSaving(true);
    try {
      if (editingId === 'new') {
        await upsertQuote(
          { text: editText.trim(), sort_order: quotes.length, status: 'published' },
          admin.id, admin.email,
        );
      } else if (editingId !== null) {
        const q = quotes.find((q) => q.id === editingId)!;
        await upsertQuote({ ...q, text: editText.trim() }, admin.id, admin.email);
      }
      setEditingId(null);
      setEditText('');
      await load();
    } catch (e: unknown) { setError(String(e)); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (deleteId === null || !admin) return;
    setSaving(true);
    try {
      await deleteQuote(deleteId, admin.id, admin.email);
      setDeleteId(null);
      await load();
    } catch (e: unknown) { setError(String(e)); }
    finally { setSaving(false); }
  }

  async function move(i: number, dir: -1 | 1) {
    if (!admin) return;
    const next = [...quotes];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setQuotes(next);
    await reorderQuotes(next.map((q) => q.id), admin.id, admin.email);
  }

  async function handleSeed() {
    if (!admin) return;
    setSeeding(true);
    setError('');
    try {
      const n = await seedQuotes(admin.id, admin.email);
      await load();
      alert(`Seeded ${n} quotes.`);
    } catch (e: unknown) { setError(String(e)); }
    finally { setSeeding(false); }
  }

  function startEdit(q: CmsQuote) {
    setEditingId(q.id);
    setEditText(q.text);
  }

  const published = quotes.filter((q) => q.status === 'published').length;

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Daily Quotes" subtitle={`${published} published · rotates by day`} />
      <main className="flex-1 p-6 space-y-4">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Seed banner */}
        {!loading && quotes.length === 0 && (
          <div className="bg-brand-teal-pale border border-brand-teal/20 rounded-xl px-5 py-4 flex items-center gap-4">
            <Database size={18} className="text-brand-teal flex-shrink-0" />
            <p className="flex-1 text-sm text-brand-teal">
              No quotes in Supabase yet. Seed the 30 bundled quotes to get started.
            </p>
            <button onClick={handleSeed} disabled={seeding}
              className="px-4 py-2 text-sm font-medium bg-brand-teal text-white rounded-lg hover:bg-brand-teal-mid disabled:opacity-50">
              {seeding ? 'Seeding…' : 'Seed 30 quotes'}
            </button>
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-gray-700 flex-1">
            {quotes.length} quotes
          </h2>
          {quotes.length > 0 && (
            <button onClick={handleSeed} disabled={seeding}
              className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg">
              {seeding ? 'Seeding…' : 'Re-seed from bundled'}
            </button>
          )}
          <button
            onClick={() => { setEditingId('new'); setEditText(''); }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-brand-teal text-white rounded-lg hover:bg-brand-teal-mid"
          >
            <Plus size={15} /> Add quote
          </button>
        </div>

        {/* New quote form */}
        {editingId === 'new' && (
          <div className="bg-white border-2 border-brand-teal/40 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-600">New quote</p>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={3}
              autoFocus
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal resize-none"
              placeholder="You've got this, and if you wobble, that's okay…"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditingId(null)} disabled={saving}
                className="px-3 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !editText.trim()}
                className="px-3 py-1.5 text-sm font-medium bg-brand-teal text-white rounded-lg hover:bg-brand-teal-mid disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {/* Quote list */}
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">Loading…</div>
        ) : (
          <div className="space-y-2">
            {quotes.map((q, i) => (
              <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-4">
                {editingId === q.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      autoFocus
                      className="w-full text-sm border border-brand-teal rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 resize-none"
                    />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditingId(null)} disabled={saving}
                        className="p-1.5 hover:bg-gray-100 rounded-lg">
                        <X size={16} className="text-gray-400" />
                      </button>
                      <button onClick={handleSave} disabled={saving || !editText.trim()}
                        className="p-1.5 bg-brand-teal rounded-lg hover:bg-brand-teal-mid disabled:opacity-50">
                        <Check size={16} className="text-white" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    {/* Reorder buttons */}
                    <div className="flex flex-col gap-0.5 flex-shrink-0 mt-0.5">
                      <button onClick={() => move(i, -1)} disabled={i === 0}
                        className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30">
                        <ChevronUp size={13} className="text-gray-400" />
                      </button>
                      <button onClick={() => move(i, 1)} disabled={i === quotes.length - 1}
                        className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30">
                        <ChevronDown size={13} className="text-gray-400" />
                      </button>
                    </div>

                    {/* Quote preview */}
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 mb-2">
                        <p className="text-[11px] font-semibold text-gray-700">💛 MindLo</p>
                        <p className="text-xs text-gray-600 leading-snug mt-0.5">{q.text}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">#{q.id} · order {i + 1}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          q.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>{q.status}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => startEdit(q)}
                        className="p-1.5 hover:bg-brand-teal-pale rounded-lg">
                        <Edit2 size={14} className="text-brand-teal" />
                      </button>
                      <button onClick={() => setDeleteId(q.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg">
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete confirmation */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <p className="text-base font-semibold text-gray-900 mb-2">Delete this quote?</p>
            <p className="text-sm text-gray-500 mb-5">
              The remaining quotes will keep their day rotation. Sort order is preserved.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} disabled={saving}
                className="flex-1 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={saving}
                className="flex-1 py-2 text-sm font-medium bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50">
                {saving ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
