import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Eye, ChevronUp, ChevronDown } from 'lucide-react';
import type { CmsArticle } from '../types';
import { CATEGORY_LABELS } from '../types';

interface Props {
  article: Partial<CmsArticle> | null; // null = create new
  onSave: (data: Partial<CmsArticle> & { title: string; category: string }, status: 'draft' | 'published') => Promise<void>;
  onClose: () => void;
}

const CATEGORIES = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({ key, label }));
const LANGUAGES = ['English', 'isiZulu', 'isiXhosa'];
const FORMATS = [{ value: 'article', label: 'Article' }, { value: 'video', label: 'Video' }];

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
}

export default function ArticleForm({ article, onSave, onClose }: Props) {
  const isNew = !article?.id;

  const [title, setTitle] = useState(article?.title ?? '');
  const [id, setId] = useState(article?.id ?? '');
  const [idManual, setIdManual] = useState(false);
  const [category, setCategory] = useState(article?.category ?? 'feelings');
  const [categories, setCategories] = useState<string[]>(article?.categories ?? ['feelings']);
  const [topic, setTopic] = useState(article?.topic ?? '');
  const [format, setFormat] = useState<'article' | 'video'>(article?.format ?? 'article');
  const [language, setLanguage] = useState(article?.language ?? 'English');
  const [duration, setDuration] = useState(article?.duration ?? '');
  const [shortDesc, setShortDesc] = useState(article?.short_description ?? '');
  const [body, setBody] = useState<string[]>(article?.body?.length ? article.body : ['']);
  const [themes, setThemes] = useState((article?.themes ?? []).join(', '));
  const [support, setSupport] = useState((article?.support ?? []).join('\n'));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!idManual && isNew) setId(toSlug(title));
  }, [title, idManual, isNew]);

  // Keep primary category in the categories array
  useEffect(() => {
    if (!categories.includes(category)) {
      setCategories((prev) => [category, ...prev.filter((c) => c !== category)]);
    }
  }, [category]);

  function toggleCategory(key: string) {
    if (key === category) return; // primary always stays
    setCategories((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key],
    );
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!id.trim()) e.id = 'ID is required';
    if (!shortDesc.trim()) e.shortDesc = 'Short description is required';
    if (body.every((p) => !p.trim())) e.body = 'At least one paragraph is required';
    return e;
  }

  async function handleSave(status: 'draft' | 'published') {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      await onSave({
        ...(article ?? {}),
        id: id.trim(),
        title: title.trim(),
        category,
        categories,
        topic: topic.trim(),
        format,
        language,
        duration: duration.trim(),
        short_description: shortDesc.trim(),
        body: body.filter((p) => p.trim()),
        themes: themes.split(',').map((t) => t.trim()).filter(Boolean),
        support: support.trim() ? support.split('\n').map((s) => s.trim()).filter(Boolean) : null,
        status,
      }, status);
    } catch (err: unknown) {
      setErrors({ save: String(err) });
    } finally {
      setSaving(false);
    }
  }

  function moveParagraph(i: number, dir: -1 | 1) {
    const next = [...body];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setBody(next);
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">
            {isNew ? 'New article' : 'Edit article'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreview(true)}
              className="flex items-center gap-1.5 text-sm text-brand-teal hover:text-brand-teal-mid font-medium"
            >
              <Eye size={15} /> Preview
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {errors.save && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg border border-red-200">
              {errors.save}
            </div>
          )}

          {/* Title + ID */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Title *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={field(errors.title)}
                placeholder="What is breathwork?"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">ID (slug) *</label>
              <input
                value={id}
                onChange={(e) => { setId(e.target.value); setIdManual(true); }}
                className={field(errors.id)}
                placeholder="what_is_breathwork"
              />
              {errors.id && <p className="text-red-500 text-xs mt-1">{errors.id}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Duration</label>
              <input value={duration} onChange={(e) => setDuration(e.target.value)}
                className={field()} placeholder="3 min read" />
            </div>
          </div>

          {/* Category + format + language */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Primary category *</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={field()}>
                {CATEGORIES.map(({ key, label }) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Format</label>
              <select value={format} onChange={(e) => setFormat(e.target.value as 'article' | 'video')} className={field()}>
                {FORMATS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className={field()}>
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Additional categories */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Also appears in</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(({ key, label }) => (
                <label key={key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                  categories.includes(key)
                    ? 'border-brand-teal bg-brand-teal-pale text-brand-teal font-medium'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                } ${key === category ? 'opacity-60 cursor-not-allowed' : ''}`}>
                  <input type="checkbox" className="hidden" checked={categories.includes(key)}
                    onChange={() => toggleCategory(key)} disabled={key === category} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Topic / sub-section <span className="font-normal text-gray-400">(for Feelings & emotions sub-nav)</span>
            </label>
            <input value={topic} onChange={(e) => setTopic(e.target.value)}
              className={field()} placeholder="anxiety, depression, grief…" />
          </div>

          {/* Short description */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Short description *</label>
            <textarea value={shortDesc} onChange={(e) => setShortDesc(e.target.value)}
              rows={2} className={field(errors.shortDesc)}
              placeholder="One sentence that hooks the reader." />
            {errors.shortDesc && <p className="text-red-500 text-xs mt-1">{errors.shortDesc}</p>}
          </div>

          {/* Body paragraphs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-600">Body paragraphs *</label>
              {errors.body && <p className="text-red-500 text-xs">{errors.body}</p>}
            </div>
            <div className="space-y-2">
              {body.map((para, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex flex-col gap-0.5 pt-2 flex-shrink-0">
                    <button onClick={() => moveParagraph(i, -1)} disabled={i === 0}
                      className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30">
                      <ChevronUp size={13} className="text-gray-400" />
                    </button>
                    <button onClick={() => moveParagraph(i, 1)} disabled={i === body.length - 1}
                      className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30">
                      <ChevronDown size={13} className="text-gray-400" />
                    </button>
                  </div>
                  <textarea
                    value={para}
                    onChange={(e) => { const n = [...body]; n[i] = e.target.value; setBody(n); }}
                    rows={3}
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal resize-none"
                    placeholder={`Paragraph ${i + 1}…`}
                  />
                  <button onClick={() => setBody(body.filter((_, j) => j !== i))}
                    disabled={body.length === 1}
                    className="mt-2 p-1.5 hover:bg-red-50 rounded-lg disabled:opacity-30">
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setBody([...body, ''])}
              className="mt-2 flex items-center gap-1.5 text-sm text-brand-teal hover:text-brand-teal-mid font-medium">
              <Plus size={14} /> Add paragraph
            </button>
          </div>

          {/* Themes */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Themes / tags <span className="font-normal text-gray-400">(comma-separated)</span>
            </label>
            <input value={themes} onChange={(e) => setThemes(e.target.value)}
              className={field()} placeholder="anxiety, breathwork, calm" />
          </div>

          {/* Support lines */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Support lines <span className="font-normal text-gray-400">(optional — one per line)</span>
            </label>
            <textarea value={support} onChange={(e) => setSupport(e.target.value)}
              rows={3} className={field()}
              placeholder="SADAG: 0800 567 567&#10;Childline: 116" />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center gap-3 flex-shrink-0">
          <button onClick={onClose} disabled={saving}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <div className="flex-1" />
          <button onClick={() => handleSave('draft')} disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save as draft'}
          </button>
          <button onClick={() => handleSave('published')} disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-teal rounded-lg hover:bg-brand-teal-mid disabled:opacity-50">
            {saving ? 'Saving…' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
          onClick={() => setPreview(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="bg-brand-teal-pale px-5 pt-6 pb-4">
              <span className="text-xs font-semibold text-brand-teal uppercase tracking-wide">
                {CATEGORY_LABELS[category] ?? category}
              </span>
              <h1 className="text-xl font-bold text-gray-900 mt-1 leading-snug">{title || 'Untitled'}</h1>
              {duration && <p className="text-xs text-gray-500 mt-1">{duration}</p>}
            </div>
            <div className="px-5 py-4 space-y-4">
              {shortDesc && <p className="text-sm text-gray-500 italic">{shortDesc}</p>}
              {body.filter((p) => p.trim()).map((p, i) => (
                <p key={i} className="text-sm text-gray-800 leading-relaxed">{p}</p>
              ))}
            </div>
            <div className="px-5 pb-5">
              <button onClick={() => setPreview(false)}
                className="w-full py-2.5 text-sm font-medium bg-brand-teal text-white rounded-xl">
                Close preview
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function field(error?: string) {
  return `w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal ${
    error ? 'border-red-300 bg-red-50' : 'border-gray-200'
  }`;
}
