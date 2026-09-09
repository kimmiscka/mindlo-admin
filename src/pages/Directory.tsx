import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, ExternalLink, Phone, MessageSquare, X, Database } from 'lucide-react';
import TopBar from '../components/TopBar';
import { useAuth } from '../hooks/useAuth';
import { listServices, upsertService, deleteService, seedDirectory } from '../lib/contentApi';
import type { CmsDirectoryService, ServiceContact, ContactKind } from '../types';

const TIER_LABELS: Record<CmsDirectoryService['tier'], string> = {
  emergency: '🚨 Emergency',
  support: 'More support',
  partner: 'Partner organisations',
};
const TIER_ORDER: CmsDirectoryService['tier'][] = ['emergency', 'support', 'partner'];

const KIND_ICON = { call: Phone, sms: MessageSquare, whatsapp: MessageSquare };

const EMPTY_SERVICE: Partial<CmsDirectoryService> = {
  name: '', description: '', tier: 'support', cost: '', url: '',
  contacts: [], sort_order: 0, status: 'published',
};

export default function Directory() {
  const { admin } = useAuth();
  const [services, setServices] = useState<CmsDirectoryService[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [formSvc, setFormSvc] = useState<Partial<CmsDirectoryService> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try { setServices(await listServices()); }
    catch (e: unknown) { setError(String(e)); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    if (!admin || !formSvc?.name || !formSvc?.tier) return;
    setSaving(true);
    try {
      await upsertService(
        { ...formSvc, name: formSvc.name!, tier: formSvc.tier! },
        admin.id, admin.email,
      );
      setFormSvc(null);
      await load();
    } catch (e: unknown) { setError(String(e)); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteId || !admin) return;
    setSaving(true);
    try {
      await deleteService(deleteId, admin.id, admin.email);
      setDeleteId(null);
      await load();
    } catch (e: unknown) { setError(String(e)); }
    finally { setSaving(false); }
  }

  async function handleSeed() {
    if (!admin) return;
    setSeeding(true);
    setError('');
    try {
      const n = await seedDirectory(admin.id, admin.email);
      await load();
      alert(`Seeded ${n} directory services.`);
    } catch (e: unknown) { setError(String(e)); }
    finally { setSeeding(false); }
  }

  const grouped = TIER_ORDER.map((tier) => ({
    tier, label: TIER_LABELS[tier],
    items: services.filter((s) => s.tier === tier).sort((a, b) => a.sort_order - b.sort_order),
  }));

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Directory" subtitle="Support services and partner organisations" />
      <main className="flex-1 p-6 space-y-6">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        {/* Seed banner */}
        {!loading && services.length === 0 && (
          <div className="bg-brand-teal-pale border border-brand-teal/20 rounded-xl px-5 py-4 flex items-center gap-4">
            <Database size={18} className="text-brand-teal flex-shrink-0" />
            <p className="flex-1 text-sm text-brand-teal">No services in Supabase yet. Seed the 9 bundled services to get started.</p>
            <button onClick={handleSeed} disabled={seeding}
              className="px-4 py-2 text-sm font-medium bg-brand-teal text-white rounded-lg hover:bg-brand-teal-mid disabled:opacity-50">
              {seeding ? 'Seeding…' : 'Seed services'}
            </button>
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1" />
          {services.length > 0 && (
            <button onClick={handleSeed} disabled={seeding}
              className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg">
              {seeding ? 'Seeding…' : 'Re-seed from bundled'}
            </button>
          )}
          <button onClick={() => setFormSvc({ ...EMPTY_SERVICE })}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-brand-teal text-white rounded-lg hover:bg-brand-teal-mid">
            <Plus size={15} /> Add service
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">Loading…</div>
        ) : (
          grouped.map(({ tier, label, items }) => (
            <section key={tier}>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">{label}</h2>
              {items.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No services in this tier.</p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {items.map((s) => (
                    <div key={s.id}
                      className={`bg-white rounded-xl border p-4 ${
                        tier === 'emergency' ? 'border-brand-pink/40' : 'border-gray-200'
                      }`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                          {s.cost && (
                            <span className="text-[10px] font-medium bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">
                              {s.cost}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {s.url && (
                            <a href={s.url} target="_blank" rel="noopener noreferrer"
                              className="p-1.5 hover:bg-gray-100 rounded-lg">
                              <ExternalLink size={13} className="text-gray-400" />
                            </a>
                          )}
                          <button onClick={() => setFormSvc(s)}
                            className="p-1.5 hover:bg-brand-teal-pale rounded-lg">
                            <Edit2 size={13} className="text-brand-teal" />
                          </button>
                          <button onClick={() => setDeleteId(s.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg">
                            <Trash2 size={13} className="text-red-400" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed mb-3">{s.description}</p>
                      {s.contacts.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {s.contacts.map((c, ci) => {
                            const Icon = KIND_ICON[c.kind];
                            return (
                              <span key={ci}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                                  tier === 'emergency'
                                    ? 'bg-brand-pink/10 text-brand-pink-dark'
                                    : 'bg-brand-teal-pale text-brand-teal'
                                }`}>
                                <Icon size={11} /> {c.display}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))
        )}
      </main>

      {/* Service form */}
      {formSvc !== null && (
        <ServiceForm
          svc={formSvc}
          onChange={setFormSvc}
          onSave={handleSave}
          onClose={() => setFormSvc(null)}
          saving={saving}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <p className="text-base font-semibold text-gray-900 mb-2">Remove this service?</p>
            <p className="text-sm text-gray-500 mb-5">It will no longer appear in the app directory.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} disabled={saving}
                className="flex-1 py-2 text-sm border border-gray-200 rounded-xl text-gray-600">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={saving}
                className="flex-1 py-2 text-sm font-medium bg-red-500 text-white rounded-xl disabled:opacity-50">
                {saving ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Inline service form ───────────────────────────────────────────────────────

function ServiceForm({
  svc, onChange, onSave, onClose, saving,
}: {
  svc: Partial<CmsDirectoryService>;
  onChange: (s: Partial<CmsDirectoryService>) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
}) {
  function set<K extends keyof CmsDirectoryService>(k: K, v: CmsDirectoryService[K]) {
    onChange({ ...svc, [k]: v });
  }

  function addContact() {
    const c: ServiceContact = { kind: 'call', display: '', url: '' };
    onChange({ ...svc, contacts: [...(svc.contacts ?? []), c] });
  }

  function updateContact(i: number, c: ServiceContact) {
    const next = [...(svc.contacts ?? [])];
    next[i] = c;
    onChange({ ...svc, contacts: next });
  }

  function removeContact(i: number) {
    onChange({ ...svc, contacts: (svc.contacts ?? []).filter((_, j) => j !== i) });
  }

  const f = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal';

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">
            {svc.id ? 'Edit service' : 'New service'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Name *</label>
            <input value={svc.name ?? ''} onChange={(e) => set('name', e.target.value)} className={f} placeholder="SADAG" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description *</label>
            <textarea value={svc.description ?? ''} onChange={(e) => set('description', e.target.value)}
              rows={3} className={f} placeholder="What this service offers…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tier *</label>
              <select value={svc.tier ?? 'support'} onChange={(e) => set('tier', e.target.value as CmsDirectoryService['tier'])} className={f}>
                <option value="emergency">Emergency</option>
                <option value="support">Support</option>
                <option value="partner">Partner</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Cost</label>
              <input value={svc.cost ?? ''} onChange={(e) => set('cost', e.target.value || null)} className={f} placeholder="Free" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Website URL</label>
            <input value={svc.url ?? ''} onChange={(e) => set('url', e.target.value || null)} className={f} placeholder="https://sadag.org" />
          </div>

          {/* Contacts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-600">Contact options</label>
              <button onClick={addContact} className="text-xs text-brand-teal hover:underline flex items-center gap-1">
                <Plus size={12} /> Add
              </button>
            </div>
            <div className="space-y-2">
              {(svc.contacts ?? []).map((c, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select value={c.kind}
                    onChange={(e) => updateContact(i, { ...c, kind: e.target.value as ContactKind })}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/30">
                    <option value="call">📞 Call</option>
                    <option value="sms">💬 SMS</option>
                    <option value="whatsapp">🟢 WhatsApp</option>
                  </select>
                  <input value={c.display} onChange={(e) => updateContact(i, { ...c, display: e.target.value })}
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
                    placeholder="0800 567 567" />
                  <input value={c.url} onChange={(e) => updateContact(i, { ...c, url: e.target.value })}
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
                    placeholder="tel:0800567567" />
                  <button onClick={() => removeContact(i)} className="p-1.5 hover:bg-red-50 rounded-lg">
                    <X size={14} className="text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
            <div className="flex gap-3">
              {(['published', 'draft'] as const).map((s) => (
                <label key={s} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm ${
                  svc.status === s ? 'border-brand-teal bg-brand-teal-pale text-brand-teal font-medium' : 'border-gray-200 text-gray-500'
                }`}>
                  <input type="radio" className="hidden" checked={svc.status === s} onChange={() => set('status', s)} />
                  {s === 'published' ? '✅ Published' : '📝 Draft'}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
          <button onClick={onClose} disabled={saving}
            className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={onSave} disabled={saving || !svc.name?.trim()}
            className="flex-1 py-2 text-sm font-medium bg-brand-teal text-white rounded-lg hover:bg-brand-teal-mid disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </>
  );
}
