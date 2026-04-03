'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { calcReadTime } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  Search,
  FileText,
  PenLine,
  ChevronDown,
  Type,
  Save,
  FolderOpen,
  Folder,
  File,
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { Confetti } from '@/components/ui/confetti';
import { GlassBlogCard } from '@/components/ui/glass-blog-card';
import UniqueLoading from '@/components/ui/grid-loading';
import PageHeader from '@/components/ui/PageHeader';

function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

// ── Types ────────────────────────────────────────────────────────────────────

interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
}
interface BlogPost {
  id: number;
  documentId: string;
  title: string;
  content: string;
  tags: string;
  author: string;
  imageUrl: string | null;
  imageId: string | null;
  createdAt: string;
}
type Mode = 'create' | 'update' | 'texts';
type SubmitState = 'idle' | 'loading' | 'success';

const N8N_WEBHOOK = '/api/n8n';
const POSTS_PER_PAGE = 15;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchUser(): Promise<UserInfo | null> {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    return data.user ?? null;
  } catch {
    return null;
  }
}

function getImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  let fixed = url.replace(
    '/storage/v1/object/public/blogpost-images/blogpost-images/',
    '/storage/v1/object/public/blogpost-images/'
  );
  if (fixed.endsWith('/blogpost-images/')) return null;
  try {
    return encodeURI(decodeURI(fixed));
  } catch {
    return fixed;
  }
}

// ── Styles ────────────────────────────────────────────────────────────────────

const field: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  color: '#fff',
  fontSize: '0.875rem',
  padding: '0.65rem 0.9rem',
  outline: 'none',
  transition: 'border-color 0.2s',
  resize: 'vertical' as const,
};
const lbl: React.CSSProperties = {
  display: 'block',
  color: 'rgba(255,255,255,0.4)',
  fontSize: '0.72rem',
  marginBottom: '0.3rem',
  fontWeight: 500,
  letterSpacing: '0.04em',
  textTransform: 'uppercase' as const,
};

// ── TagInput ──────────────────────────────────────────────────────────────────

function TagInput({ tags, onChange, shimmer }: { tags: string[]; onChange: (t: string[]) => void; shimmer?: boolean }) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput('');
  };
  return (
    <div>
      <label style={lbl}>Tags</label>
      <div style={{ position: 'relative' }}>
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
            {tags.map((t) => (
              <span
                key={t}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: 6,
                  padding: '0.2rem 0.6rem',
                  fontSize: '0.78rem',
                  color: 'rgba(255,255,255,0.8)',
                }}
              >
                {t}
                <button
                  type="button"
                  onClick={() => onChange(tags.filter((x) => x !== t))}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    lineHeight: 1,
                    padding: 0,
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
            placeholder="Tag hinzufügen…"
            style={field}
          />
          <button
            type="button"
            onClick={add}
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)',
              borderRadius: 8,
              padding: '0 0.9rem',
              cursor: 'pointer',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
            }}
          >
            +
          </button>
        </div>
        {shimmer && (
          <div style={{ position: 'absolute', inset: 0, borderRadius: 8, overflow: 'hidden', pointerEvents: 'none', zIndex: 2 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(107,122,255,0.15) 40%, rgba(107,122,255,0.25) 50%, rgba(107,122,255,0.15) 60%, transparent 100%)', animation: 'aiShimmer 1.5s ease-in-out infinite' }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── ImageUpload ───────────────────────────────────────────────────────────────

function ImageUpload({
  file,
  previewUrl,
  onFile,
  onRemove,
}: {
  file: File | null;
  previewUrl: string | null;
  onFile: (f: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.type.startsWith('image/') || /\.(jpg|jpeg|png)$/i.test(f.name))) onFile(f);
  };
  const preview = file ? URL.createObjectURL(file) : previewUrl;
  return (
    <div>
      <label style={lbl}>Bild</label>
      {preview ? (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Vorschau"
            style={{ maxWidth: 260, maxHeight: 180, borderRadius: 8, display: 'block', objectFit: 'cover' }}
          />
          <button
            type="button"
            onClick={onRemove}
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              background: 'rgba(0,0,0,0.75)',
              border: 'none',
              color: '#fff',
              borderRadius: '50%',
              width: 24,
              height: 24,
              cursor: 'pointer',
              fontSize: '0.9rem',
              lineHeight: '24px',
              textAlign: 'center',
            }}
          >
            ×
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `1.5px dashed ${dragging ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'}`,
            borderRadius: 8,
            padding: '1.75rem',
            textAlign: 'center',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.35)',
            fontSize: '0.82rem',
            transition: 'border-color 0.2s',
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem', opacity: 0.5 }}>↑</div>
          Drag & Drop oder{' '}
          <span style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'underline' }}>auswählen</span>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', marginTop: '0.25rem' }}>
            JPG, JPEG, PNG
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
        style={{ display: 'none' }}
      />
    </div>
  );
}

// ── SubmitButton ──────────────────────────────────────────────────────────────

function SubmitButton({ state, label }: { state: SubmitState; label: string }) {
  return (
    <button
      type="submit"
      disabled={state === 'loading' || state === 'success'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        marginTop: '0.25rem',
        width: '100%',
        background: state === 'success' ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.95)',
        color: state === 'success' ? '#4ade80' : '#0a0a0a',
        fontWeight: 600,
        fontSize: '0.88rem',
        border: state === 'success' ? '1px solid rgba(74,222,128,0.4)' : 'none',
        borderRadius: 8,
        padding: '0.75rem',
        cursor: state === 'loading' || state === 'success' ? 'default' : 'pointer',
        opacity: state === 'loading' ? 0.7 : 1,
        transition: 'all 0.3s',
      }}
    >
      {state === 'loading' && <UniqueLoading size="sm" className="opacity-60" />}
      {state === 'success' ? '✓ Gespeichert' : state === 'loading' ? 'Wird gespeichert…' : label}
    </button>
  );
}

// ── PostCard ──────────────────────────────────────────────────────────────────

function PostCard({ post, selected, onClick }: { post: BlogPost; selected: boolean; onClick: () => void }) {
  const tags = post.tags
    ? post.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];
  const excerpt = post.content ? post.content.replace(/<[^>]*>/g, '').slice(0, 100) + '…' : '';
  const date = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
    : '';
  const readTime = calcReadTime(post.content);

  return (
    <div
      onClick={onClick}
      style={{
        cursor: 'pointer',
        position: 'relative',
        transition: 'transform 0.15s',
        transform: selected ? 'scale(0.97)' : 'scale(1)',
      }}
    >
      {selected && (
        <div
          style={{
            position: 'absolute',
            inset: -2,
            borderRadius: 18,
            border: '2px solid rgba(255,255,255,0.6)',
            zIndex: 10,
            pointerEvents: 'none',
            boxShadow: '0 0 0 4px rgba(255,255,255,0.08)',
          }}
        />
      )}
      <GlassBlogCard
        title={post.title || '(Kein Titel)'}
        excerpt={excerpt}
        image={getImageUrl(post.imageUrl) ?? undefined}
        author={{ name: post.author || 'Onvero' }}
        date={date}
        readTime={readTime}
        tags={tags}
        hoverLabel="Artikel bearbeiten"
        className="h-full"
      />
    </div>
  );
}

// ── PostGrid ──────────────────────────────────────────────────────────────────

function PostGrid({
  posts,
  selected,
  onSelect,
}: {
  posts: BlogPost[];
  selected: BlogPost | null;
  onSelect: (p: BlogPost) => void;
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const filtered = posts.filter(
    (p) => p.title.toLowerCase().includes(search.toLowerCase()) || p.author.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE));
  const visible = filtered.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);
  return (
    <div>
      <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(255,255,255,0.25)',
          }}
        />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Suchen…"
          style={{ ...field, paddingLeft: '2rem' }}
        />
      </div>
      {visible.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '2rem 0', fontSize: '0.85rem' }}>
          Keine Einträge gefunden.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.1rem' }}>
          {visible.map((p) => (
            <PostCard
              key={p.documentId}
              post={p}
              selected={selected?.documentId === p.documentId}
              onClick={() => onSelect(p)}
            />
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <div
          style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', marginTop: '1.25rem', flexWrap: 'wrap' }}
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: 'none',
                background: page === n ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                color: page === n ? '#fff' : 'rgba(255,255,255,0.35)',
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── BlogFormValues ────────────────────────────────────────────────────────────

interface BlogFormValues {
  title: string;
  content: string;
  tags: string[];
  author: string;
  imageFile: File | null;
  existingImageUrl: string | null;
  imageRemoved: boolean;
}

// ── BlogForm ──────────────────────────────────────────────────────────────────

function BlogForm({
  initial,
  onSubmit,
  submitLabel,
  submitState,
}: {
  initial: BlogFormValues;
  onSubmit: (v: BlogFormValues) => void;
  submitLabel: string;
  submitState: SubmitState;
}) {
  const [form, setForm] = useState<BlogFormValues>(initial);
  const [aiPolishing, setAiPolishing] = useState(false);
  useEffect(() => {
    setForm(initial);
  }, [initial]);
  const set = <K extends keyof BlogFormValues>(k: K, v: BlogFormValues[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function polishWithAI() {
    if (!form.title.trim() && !form.content.trim()) return;
    setAiPolishing(true);
    try {
      const res = await fetch('/api/proxy/n8n', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'blog-ai-polish', title: form.title, content: form.content }),
      });
      const result = await res.json();
      if (result.title) set('title', result.title);
      if (result.content) set('content', result.content);
      if (result.tags) set('tags', result.tags.split(',').map((t: string) => t.trim()).filter(Boolean));
    } catch (err) {
      console.error('AI polish error:', err);
    } finally {
      setAiPolishing(false);
    }
  }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim() || !form.author.trim()) return;
    onSubmit(form);
  };
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      <div>
        <label style={lbl}>Titel</label>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Titel des Blogposts"
            required
            style={field}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
          />
          {aiPolishing && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 8,
                overflow: 'hidden',
                pointerEvents: 'none',
                zIndex: 2,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(90deg, transparent 0%, rgba(107,122,255,0.15) 40%, rgba(107,122,255,0.25) 50%, rgba(107,122,255,0.15) 60%, transparent 100%)',
                  animation: 'aiShimmer 1.5s ease-in-out infinite',
                }}
              />
            </div>
          )}
        </div>
      </div>
      <div>
        <label style={lbl}>Inhalt</label>
        <div style={{ position: 'relative' }}>
          <textarea
            value={form.content}
            onChange={(e) => set('content', e.target.value)}
            placeholder="Inhalt des Blogposts…"
            required
            rows={9}
            style={{ ...field, paddingBottom: 36 }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
          />
          {/* AI shimmer overlay */}
          {aiPolishing && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 8,
                overflow: 'hidden',
                pointerEvents: 'none',
                zIndex: 2,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(90deg, transparent 0%, rgba(107,122,255,0.15) 40%, rgba(107,122,255,0.25) 50%, rgba(107,122,255,0.15) 60%, transparent 100%)',
                  animation: 'aiShimmer 1.5s ease-in-out infinite',
                }}
              />
              <style>{`
                @keyframes aiShimmer {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(100%); }
                }
              `}</style>
            </div>
          )}
          {/* AI button */}
          <button
            type="button"
            onClick={polishWithAI}
            disabled={aiPolishing || (!form.title.trim() && !form.content.trim())}
            title="Mit AI ueberarbeiten"
            style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              width: 28,
              height: 28,
              borderRadius: 7,
              border: '1px solid rgba(107,122,255,0.3)',
              background: aiPolishing ? 'rgba(107,122,255,0.2)' : 'rgba(107,122,255,0.1)',
              color: '#6B7AFF',
              cursor: aiPolishing ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              transition: 'background 0.2s, border-color 0.2s',
              zIndex: 3,
              padding: 0,
            }}
            onMouseEnter={(e) => { if (!aiPolishing) { e.currentTarget.style.background = 'rgba(107,122,255,0.25)'; e.currentTarget.style.borderColor = 'rgba(107,122,255,0.5)'; }}}
            onMouseLeave={(e) => { if (!aiPolishing) { e.currentTarget.style.background = 'rgba(107,122,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(107,122,255,0.3)'; }}}
          >
            {aiPolishing ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
                <path d="M20 16l1.04 3.13L24 20l-2.96.87L20 24l-1.04-3.13L16 20l2.96-.87L20 16z" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <TagInput tags={form.tags} onChange={(v) => set('tags', v)} shimmer={aiPolishing} />
      <div>
        <label style={lbl}>Autor</label>
        <input
          type="text"
          value={form.author}
          onChange={(e) => set('author', e.target.value)}
          required
          style={field}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
        />
      </div>
      <ImageUpload
        file={form.imageFile}
        previewUrl={form.existingImageUrl}
        onFile={(f) => set('imageFile', f)}
        onRemove={() => {
          set('imageFile', null);
          set('existingImageUrl', null);
          set('imageRemoved', true);
        }}
      />
      <SubmitButton state={submitState} label={submitLabel} />
    </form>
  );
}

// ── AutoResizeTextarea ───────────────────────────────────────────────────────

function AutoResizeTextarea({
  id,
  label: labelText,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div id={id} style={{ marginBottom: '0.75rem' }}>
      <label style={lbl}>{labelText}</label>
      <textarea
        ref={(el) => {
          if (el) {
            el.style.height = 'auto';
            el.style.height = `${el.scrollHeight}px`;
          }
        }}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          const el = e.target;
          el.style.height = 'auto';
          el.style.height = `${el.scrollHeight}px`;
        }}
        style={{ ...field, resize: 'none' as const, overflow: 'hidden', minHeight: 56 }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
      />
    </div>
  );
}

// ── WebsiteTextsEditor ───────────────────────────────────────────────────────

interface WebsiteText {
  id: number;
  text_id: string;
  page: string;
  section: string;
  type: string;
  label: string;
  sort_order: number;
  content: Record<string, unknown>;
  is_editable: boolean;
}

function WebsiteTextsEditor() {
  const [texts, setTexts] = useState<WebsiteText[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WebsiteText | null>(null);
  const [editContent, setEditContent] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [scrollToField, setScrollToField] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data } = await sb.from('website_texts').select('*').order('page').order('sort_order');
      if (data) setTexts(data as WebsiteText[]);
      setLoading(false);
      if (data) setExpandedPages(new Set(data.map((t: { page: string }) => t.page)));
    })();
  }, []);

  const pages = [...new Set(texts.map((t) => t.page))];

  const handleSelect = (t: WebsiteText) => {
    setSelected(t);
    setEditContent(structuredClone(t.content));
    setSaveOk(false);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    const sb = createClient();
    const { error } = await sb
      .from('website_texts')
      .update({ content: editContent, updated_at: new Date().toISOString() })
      .eq('id', selected.id);
    if (error) {
      console.error('website_texts update failed:', error);
      alert('Fehler beim Speichern: ' + error.message);
    } else {
      setTexts((prev) => prev.map((t) => (t.id === selected.id ? { ...t, content: editContent } : t)));
      setSelected((prev) => (prev ? { ...prev, content: editContent } : prev));
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 3000);
    }
    setSaving(false);
  };

  const togglePage = (p: string) =>
    setExpandedPages((prev) => {
      const n = new Set(prev);
      n.has(p) ? n.delete(p) : n.add(p);
      return n;
    });

  interface SearchResult {
    text: WebsiteText;
    fieldPath?: string[];
    fieldValue?: string;
  }

  const searchResults: SearchResult[] = (() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const results: SearchResult[] = [];

    for (const t of texts) {
      if (
        (t.label || '').toLowerCase().includes(q) ||
        t.section.toLowerCase().includes(q) ||
        t.page.toLowerCase().includes(q)
      ) {
        results.push({ text: t });
      }
      const walkContent = (obj: unknown, path: string[]) => {
        if (typeof obj === 'string' && obj.toLowerCase().includes(q)) {
          results.push({ text: t, fieldPath: path, fieldValue: obj });
        } else if (Array.isArray(obj)) {
          obj.forEach((item, i) => walkContent(item, [...path, String(i)]));
        } else if (typeof obj === 'object' && obj !== null) {
          for (const [k, v] of Object.entries(obj)) walkContent(v, [...path, k]);
        }
      };
      walkContent(t.content, []);
    }
    return results.slice(0, 20);
  })();

  const handleSearchSelect = (r: SearchResult) => {
    handleSelect(r.text);
    setExpandedPages((prev) => new Set([...prev, r.text.page]));
    if (r.fieldPath) setScrollToField(r.fieldPath.join('.'));
    setSearch('');
    setSearchFocused(false);
  };

  useEffect(() => {
    if (!scrollToField) return;
    const timeout = setTimeout(() => {
      const el = document.getElementById(`field-${scrollToField}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.outline = '2px solid rgba(255,255,255,0.3)';
        el.style.borderRadius = '8px';
        setTimeout(() => {
          el.style.outline = 'none';
        }, 2000);
      }
      setScrollToField(null);
    }, 100);
    return () => clearTimeout(timeout);
  }, [scrollToField, selected]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchFocused(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const updateField = (path: string[], value: unknown) => {
    setEditContent((prev) => {
      const clone = structuredClone(prev);
      let obj: Record<string, unknown> = clone;
      for (let i = 0; i < path.length - 1; i++) {
        obj = obj[path[i]] as Record<string, unknown>;
      }
      obj[path[path.length - 1]] = value;
      return clone;
    });
  };

  const renderField = (key: string, value: unknown, path: string[] = []) => {
    const fullPath = [...path, key];
    const pathKey = fullPath.join('.');
    const fieldId = `field-${pathKey}`;

    const isImageField =
      typeof value === 'string' &&
      (/image|img|logo|cover|banner|thumbnail|avatar|icon|src|foto|photo|bild/i.test(key) ||
        (value.includes('supabase') && /\.(jpg|jpeg|png|gif|webp|svg)/i.test(value)));

    if (isImageField) {
      const imgUrl = value as string;
      const handleImageUpload = async (file: File) => {
        const sb = createClient();
        const ext = file.name.split('.').pop() ?? 'jpg';
        const fileName = `${selected?.text_id ?? 'img'}/${fullPath.join('_')}_${Date.now()}.${ext}`;
        const { error: upErr } = await sb.storage
          .from('website-assets')
          .upload(fileName, file, { contentType: file.type, upsert: true });
        if (upErr) {
          console.error('Upload failed:', upErr);
          return;
        }
        const { data: urlData } = sb.storage.from('website-assets').getPublicUrl(fileName);
        updateField(fullPath, urlData.publicUrl);
      };
      return (
        <div key={pathKey} id={fieldId} style={{ marginBottom: '0.75rem' }}>
          <label style={lbl}>{key}</label>
          {imgUrl ? (
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '0.5rem' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgUrl}
                alt={key}
                style={{
                  maxWidth: 260,
                  maxHeight: 160,
                  borderRadius: 8,
                  display: 'block',
                  objectFit: 'cover',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              />
              <button
                type="button"
                onClick={() => updateField(fullPath, '')}
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  background: 'rgba(0,0,0,0.75)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  lineHeight: '24px',
                  textAlign: 'center',
                }}
              >
                ×
              </button>
            </div>
          ) : null}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              value={imgUrl}
              onChange={(e) => updateField(fullPath, e.target.value)}
              placeholder="Bild-URL oder hochladen…"
              style={{ ...field, flex: 1 }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
            <label
              style={{
                padding: '0.5rem 0.75rem',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Hochladen
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImageUpload(f);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        </div>
      );
    }

    if (typeof value === 'string') {
      const isLong = value.length > 80 || /paragraph|text|description|content|subheadline|bio|quote/i.test(key);
      if (isLong) {
        return (
          <AutoResizeTextarea
            key={pathKey}
            id={fieldId}
            label={key}
            value={value}
            onChange={(v) => updateField(fullPath, v)}
          />
        );
      }
      return (
        <div key={pathKey} id={fieldId} style={{ marginBottom: '0.75rem' }}>
          <label style={lbl}>{key}</label>
          <input
            value={value}
            onChange={(e) => updateField(fullPath, e.target.value)}
            style={field}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
          />
        </div>
      );
    }
    if (typeof value === 'boolean') {
      return (
        <div
          key={pathKey}
          id={fieldId}
          style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <input type="checkbox" checked={value} onChange={(e) => updateField(fullPath, e.target.checked)} />
          <label style={{ ...lbl, margin: 0 }}>{key}</label>
        </div>
      );
    }
    if (typeof value === 'number') {
      return (
        <div key={pathKey} id={fieldId} style={{ marginBottom: '0.75rem' }}>
          <label style={lbl}>{key}</label>
          <input
            type="number"
            value={value}
            onChange={(e) => updateField(fullPath, Number(e.target.value))}
            style={field}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
          />
        </div>
      );
    }
    if (Array.isArray(value)) {
      return (
        <div key={pathKey} id={fieldId} style={{ marginBottom: '0.75rem' }}>
          <label style={{ ...lbl, marginBottom: '0.5rem' }}>
            {key} ({value.length})
          </label>
          <div style={{ paddingLeft: '0.75rem', borderLeft: '2px solid rgba(255,255,255,0.06)' }}>
            {value.map((item, i) => {
              if (typeof item === 'object' && item !== null) {
                return (
                  <div
                    key={`${pathKey}.${i}`}
                    style={{
                      marginBottom: '0.75rem',
                      padding: '0.75rem',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', marginBottom: '0.5rem' }}>
                      {key}[{i}]
                    </p>
                    {Object.entries(item).map(([k, v]) => renderField(k, v, [...fullPath, String(i)]))}
                  </div>
                );
              }
              return (
                <div key={`${pathKey}.${i}`} style={{ marginBottom: '0.4rem' }}>
                  <label style={lbl}>
                    {key}[{i}]
                  </label>
                  <input
                    value={String(item)}
                    onChange={(e) => updateField([...fullPath, String(i)], e.target.value)}
                    style={field}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    if (typeof value === 'object' && value !== null) {
      return (
        <div key={pathKey} id={fieldId} style={{ marginBottom: '0.75rem' }}>
          <label style={{ ...lbl, marginBottom: '0.5rem' }}>{key}</label>
          <div style={{ paddingLeft: '0.75rem', borderLeft: '2px solid rgba(255,255,255,0.06)' }}>
            {Object.entries(value).map(([k, v]) => renderField(k, v, fullPath))}
          </div>
        </div>
      );
    }
    return null;
  };

  const categorizeKey = (key: string): string => {
    const k = key.toLowerCase();
    if (/headline|title|heading/.test(k)) return 'Headlines';
    if (/paragraph|text|description|subheadline|content/.test(k)) return 'Texte';
    if (/button/.test(k)) return 'Buttons';
    if (/badge|tag/.test(k)) return 'Badges';
    if (/feature|benefit|point/.test(k)) return 'Features';
    if (/image|img|logo|cover|banner|thumbnail|avatar|icon|foto|photo|bild|src/.test(k)) return 'Bilder';
    if (/node|grid|diagram/.test(k)) return 'Elemente';
    if (/url|link|href/.test(k)) return 'Links';
    return 'Sonstiges';
  };

  const categoryOrder = [
    'Headlines',
    'Texte',
    'Buttons',
    'Badges',
    'Features',
    'Bilder',
    'Elemente',
    'Links',
    'Sonstiges',
  ];

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const toggleGroup = (g: string) =>
    setCollapsedGroups((prev) => {
      const n = new Set(prev);
      n.has(g) ? n.delete(g) : n.add(g);
      return n;
    });

  const renderGroupedContent = (content: Record<string, unknown>) => {
    const groups = new Map<string, [string, unknown][]>();
    for (const [k, v] of Object.entries(content)) {
      const cat = categorizeKey(k);
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push([k, v]);
    }

    const sorted = categoryOrder.filter((c) => groups.has(c));

    return sorted.map((cat) => {
      const fields = groups.get(cat)!;
      const isCollapsed = collapsedGroups.has(cat);
      return (
        <div key={cat} style={{ marginBottom: '0.5rem' }}>
          <button
            type="button"
            onClick={() => toggleGroup(cat)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.5rem 0',
              background: 'none',
              border: 'none',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              cursor: 'pointer',
              marginBottom: isCollapsed ? 0 : '0.75rem',
            }}
          >
            <ChevronDown
              size={12}
              style={{
                color: 'rgba(255,255,255,0.3)',
                transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s',
              }}
            />
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {cat}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)' }}>({fields.length})</span>
          </button>
          {!isCollapsed && <div style={{ paddingLeft: '0.25rem' }}>{fields.map(([k, v]) => renderField(k, v))}</div>}
        </div>
      );
    });
  };

  if (loading) return <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>Lade Texte…</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 400 }}>
      {/* Search bar */}
      <div ref={searchRef} style={{ position: 'relative', maxWidth: 480 }}>
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(255,255,255,0.25)',
            pointerEvents: 'none',
          }}
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          placeholder="Texte durchsuchen…"
          style={{ ...field, paddingLeft: '2rem' }}
        />
        {searchFocused && search.trim() && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 4,
              background: '#1a1a1a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              maxHeight: 260,
              overflowY: 'auto',
              zIndex: 50,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}
          >
            {searchResults.length === 0 ? (
              <p style={{ padding: '0.75rem 1rem', color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem' }}>
                Keine Ergebnisse
              </p>
            ) : (
              searchResults.map((r, i) => {
                const t = r.text;
                const displayName = r.fieldPath ? r.fieldPath[r.fieldPath.length - 1] : t.label || t.section;
                const breadcrumb = r.fieldPath
                  ? `${t.page} / ${t.label || t.section} / ${r.fieldPath.join(' / ')}`
                  : `${t.page} / ${t.label || t.section}`;
                const preview =
                  r.fieldValue && r.fieldValue.length > 60 ? r.fieldValue.slice(0, 60) + '…' : r.fieldValue;

                return (
                  <button
                    key={`${t.id}-${i}`}
                    onClick={() => handleSearchSelect(r)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.2rem',
                      width: '100%',
                      padding: '0.6rem 1rem',
                      background: 'none',
                      border: 'none',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <p
                      style={{
                        fontSize: '0.85rem',
                        color: 'rgba(255,255,255,0.85)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {preview || t.label || t.section}
                    </p>
                    <p
                      style={{
                        fontSize: '0.68rem',
                        color: 'rgba(255,255,255,0.25)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {breadcrumb}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1 }}>
        {/* File tree */}
        <div
          style={{
            width: 240,
            flexShrink: 0,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12,
            padding: '0.75rem 0.5rem',
            overflowY: 'auto',
          }}
        >
          <p
            style={{
              padding: '0.3rem 0.6rem',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.25)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.35rem',
            }}
          >
            Seiten
          </p>
          {pages.map((page) => (
            <div key={page}>
              <button
                onClick={() => togglePage(page)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  width: '100%',
                  padding: '0.4rem 0.6rem',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  borderRadius: 6,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <ChevronDown
                  size={11}
                  style={{
                    color: 'rgba(255,255,255,0.3)',
                    transform: expandedPages.has(page) ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform 0.15s',
                    flexShrink: 0,
                  }}
                />
                {expandedPages.has(page) ? (
                  <FolderOpen size={14} style={{ color: 'rgba(255,255,255,0.5)', flexShrink: 0 }} />
                ) : (
                  <Folder size={14} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
                )}
                <span style={{ textTransform: 'capitalize' }}>{page}</span>
              </button>
              {expandedPages.has(page) && (
                <div
                  style={{
                    position: 'relative',
                    marginLeft: '0.65rem',
                    paddingLeft: '0.75rem',
                    borderLeft: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {texts
                    .filter((t) => t.page === page)
                    .map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleSelect(t)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.35rem 0.5rem',
                          background: selected?.id === t.id ? 'rgba(255,255,255,0.08)' : 'none',
                          border: 'none',
                          color: selected?.id === t.id ? '#fff' : 'rgba(255,255,255,0.45)',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          borderRadius: 6,
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          if (selected?.id !== t.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                        }}
                        onMouseLeave={(e) => {
                          if (selected?.id !== t.id) e.currentTarget.style.background = 'none';
                        }}
                      >
                        <File
                          size={12}
                          style={{
                            color: selected?.id === t.id ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)',
                            flexShrink: 0,
                          }}
                        />
                        {t.label || t.section}
                      </button>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Editor */}
        <div
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12,
            padding: '1.5rem',
            overflowY: 'auto',
          }}
        >
          {selected ? (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.25rem',
                }}
              >
                <div>
                  <h3 style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>
                    {selected.label || selected.section}
                  </h3>
                  <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', marginTop: '0.15rem' }}>
                    {selected.page} / {selected.section} — {selected.type}
                  </p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 1rem',
                    borderRadius: 8,
                    border: saveOk ? '1px solid rgba(74,222,128,0.4)' : 'none',
                    background: saveOk ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.95)',
                    color: saveOk ? '#4ade80' : '#0a0a0a',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: saving ? 'default' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  <Save size={13} />
                  {saveOk ? 'Gespeichert' : saving ? 'Speichern…' : 'Speichern'}
                </button>
              </div>
              {renderGroupedContent(editContent)}
            </>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'rgba(255,255,255,0.2)',
                fontSize: '0.85rem',
              }}
            >
              Wähle einen Abschnitt aus der linken Seite
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── WebsitePage ──────────────────────────────────────────────────────────────

export default function WebsitePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  useEffect(() => {
    fetchUser().then(setUser);
  }, []);

  const [mode, setMode] = useState<Mode>('create');
  const [createState, setCreateState] = useState<SubmitState>('idle');
  const [createConfetti, setCreateConfetti] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [gridOpen, setGridOpen] = useState(true);
  const [updateState, setUpdateState] = useState<SubmitState>('idle');
  const [updateConfetti, setUpdateConfetti] = useState(false);
  const [pageSpeed, setPageSpeed] = useState<any>(null);

  const defaultAuthor = user ? `${user.firstName} ${user.lastName}`.trim() : '';
  const emptyForm: BlogFormValues = {
    title: '',
    content: '',
    tags: [],
    author: defaultAuthor,
    imageFile: null,
    existingImageUrl: null,
    imageRemoved: false,
  };

  const postToForm = useCallback(
    (p: BlogPost): BlogFormValues => ({
      title: p.title || '',
      content: p.content || '',
      tags: p.tags
        ? p.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      author: p.author || defaultAuthor,
      imageFile: null,
      existingImageUrl: getImageUrl(p.imageUrl),
      imageRemoved: false,
    }),
    [defaultAuthor]
  );

  // Fetch PageSpeed data
  useEffect(() => {
    fetch('/api/analytics/pagespeed')
      .then((r) => r.json())
      .then((d) => { if (!d.error) setPageSpeed(d); })
      .catch(() => {});
  }, []);

  // Prevent browser file-drop navigation
  useEffect(() => {
    const prevent = (e: DragEvent) => e.preventDefault();
    document.addEventListener('dragover', prevent);
    document.addEventListener('drop', prevent);
    return () => {
      document.removeEventListener('dragover', prevent);
      document.removeEventListener('drop', prevent);
    };
  }, []);

  useEffect(() => {
    if (mode !== 'update') return;
    setPostsLoading(true);
    setPostsError(null);
    fetch('/api/posts')
      .then(async (r) => {
        const body = await r.json();
        console.log('[posts] status:', r.status, 'body:', JSON.stringify(body).slice(0, 500));
        if (r.status === 401) {
          router.push('/login');
          throw new Error('unauthorized');
        }
        if (!r.ok) throw new Error(`Fehler ${r.status}`);
        return body;
      })
      .then((data) => {
        const items: BlogPost[] = (Array.isArray(data) ? data : []).map(
          (item: {
            id: number;
            document_id: string;
            title?: string;
            content?: string;
            tags?: string;
            writer?: string;
            cover_image_url?: string | null;
            cover_image_id?: string | null;
            created_at?: string;
          }) => ({
            id: item.id,
            documentId: item.document_id,
            title: item.title ?? '',
            content: item.content ?? '',
            tags: item.tags ?? '',
            author: item.writer ?? '',
            imageUrl: item.cover_image_url ?? null,
            imageId: item.cover_image_id ?? null,
            createdAt: item.created_at ?? '',
          })
        );
        setPosts(items);
      })
      .catch((err) => {
        if (err.message !== 'unauthorized') setPostsError('Artikel konnten nicht geladen werden.');
      })
      .finally(() => setPostsLoading(false));
  }, [mode, router]);

  const handleSelectPost = async (post: BlogPost) => {
    try {
      const res = await fetch(`/api/posts/${post.documentId}`);
      const full = await res.json();
      setSelectedPost({
        id: full.id,
        documentId: full.document_id ?? post.documentId,
        title: full.title ?? '',
        content: full.content ?? '',
        tags: full.tags ?? '',
        author: full.writer ?? '',
        imageUrl: full.cover_image_url ?? null,
        imageId: full.cover_image_id ?? null,
        createdAt: full.created_at ?? '',
      });
    } catch {
      setSelectedPost(post);
    }
    setGridOpen(false);
  };

  const handleCreate = async (form: BlogFormValues) => {
    setCreateState('loading');
    try {
      const fd = new FormData();
      fd.append('action', 'create');
      fd.append('title', form.title.trim());
      fd.append('content', form.content.trim());
      fd.append('tags', form.tags.join(','));
      fd.append('author', form.author.trim());
      if (form.imageFile) fd.append('image', form.imageFile);
      const res = await fetch(N8N_WEBHOOK, { method: 'POST', body: fd });
      if (!res.ok) throw new Error();
      const json = await res.json();

      const newPost: BlogPost = {
        id: json.id,
        documentId: json.documentId,
        title: form.title.trim(),
        content: form.content.trim(),
        tags: form.tags.join(','),
        author: form.author.trim(),
        imageUrl: form.imageFile ? URL.createObjectURL(form.imageFile) : null,
        imageId: null,
        createdAt: new Date().toISOString(),
      };
      setPosts((prev) => [newPost, ...prev]);

      setCreateState('success');
      setCreateConfetti(true);
      setTimeout(() => setCreateConfetti(false), 5000);
    } catch {
      setCreateState('idle');
      alert('Fehler beim Erstellen des Blogposts.');
    }
  };

  const handleUpdate = async (form: BlogFormValues) => {
    if (!selectedPost) return;

    const newImageUrl = form.imageFile
      ? URL.createObjectURL(form.imageFile)
      : form.imageRemoved
        ? null
        : selectedPost.imageUrl;
    const updated: BlogPost = {
      ...selectedPost,
      title: form.title.trim(),
      content: form.content.trim(),
      tags: form.tags.join(','),
      author: form.author.trim(),
      imageUrl: newImageUrl,
    };
    setSelectedPost(updated);
    setPosts((prev) => prev.map((p) => (p.documentId === updated.documentId ? updated : p)));
    setUpdateState('loading');

    try {
      const fd = new FormData();
      fd.append('action', 'update');
      fd.append('documentId', selectedPost.documentId);
      fd.append('id', String(selectedPost.id));
      fd.append('imageId', selectedPost.imageId ?? '');
      fd.append('title', form.title.trim());
      fd.append('content', form.content.trim());
      fd.append('tags', form.tags.join(','));
      fd.append('author', form.author.trim());
      if (form.imageFile) fd.append('image', form.imageFile);
      if (form.imageRemoved) fd.append('imageRemoved', 'true');
      const res = await fetch(N8N_WEBHOOK, { method: 'POST', body: fd });
      if (!res.ok) throw new Error();

      setUpdateState('success');
      setUpdateConfetti(true);
      setTimeout(() => setUpdateConfetti(false), 5000);
    } catch {
      setSelectedPost(selectedPost);
      setPosts((prev) => prev.map((p) => (p.documentId === selectedPost.documentId ? selectedPost : p)));
      setUpdateState('idle');
      alert('Fehler beim Aktualisieren.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#f5f5f5', padding: '28px 32px' }}>
      <style>{`* { box-sizing: border-box; }`}</style>
      <Confetti active={createConfetti} />
      <Confetti active={updateConfetti} />

      <PageHeader title="Website" subtitle="Blogposts und Website-Texte verwalten" />

      {/* KPIs + Tips */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {pageSpeed ? [
            {
              label: 'Status',
              val: pageSpeed.ok ? 'Online' : 'Offline',
              color: pageSpeed.ok ? '#22C55E' : '#FF5C2E',
              sub: `HTTP ${pageSpeed.status || '—'}`,
            },
            {
              label: 'Ladezeit',
              val: pageSpeed.loadTimeFormatted || '—',
              color: pageSpeed.speedScore >= 70 ? '#22C55E' : pageSpeed.speedScore >= 50 ? '#F59E0B' : '#FF5C2E',
              sub: pageSpeed.speed || '—',
            },
            {
              label: 'SEO Score',
              val: `${pageSpeed.seoScore}%`,
              color: pageSpeed.seoScore >= 80 ? '#22C55E' : '#F59E0B',
              sub: `${Object.values(pageSpeed.checks || {}).filter(Boolean).length}/6 Checks`,
            },
            {
              label: 'Blogposts',
              val: String(posts.length),
              color: '#6B7AFF',
              sub: posts.length > 0 ? `${new Set(posts.map(p => p.author)).size} Autoren` : 'Keine Posts',
            },
          ].map((kpi) => (
            <div key={kpi.label} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginBottom: 6 }}>{kpi.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-dm-mono)', lineHeight: 1, marginBottom: 3, color: kpi.color }}>{kpi.val}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{kpi.sub}</div>
            </div>
          )) : (
            [1,2,3,4].map((i) => (
              <div key={i} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 16px', height: 80 }}>
                <div style={{ width: 50, height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, marginBottom: 10 }} />
                <div style={{ width: 40, height: 18, background: 'rgba(255,255,255,0.04)', borderRadius: 4 }} />
              </div>
            ))
          )}
        </div>

        {/* Tips Card */}
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '16px 18px' }}>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginBottom: 4 }}>Empfehlungen</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Website-Tipps</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pageSpeed ? (() => {
              const tips: { text: string; ok: boolean }[] = [];
              if (pageSpeed.checks) {
                if (!pageSpeed.checks.title) tips.push({ text: 'Seitentitel fehlt — wichtig fuer Google-Ergebnisse', ok: false });
                if (!pageSpeed.checks.description) tips.push({ text: 'Meta-Beschreibung fehlt — verbessert Click-Through-Rate', ok: false });
                if (!pageSpeed.checks.ogImage) tips.push({ text: 'Social-Media-Bild fehlt — Vorschau bei geteilten Links', ok: false });
                if (!pageSpeed.checks.viewport) tips.push({ text: 'Viewport-Tag fehlt — Mobile-Optimierung noetig', ok: false });
                if (pageSpeed.checks.title) tips.push({ text: 'Seitentitel vorhanden', ok: true });
                if (pageSpeed.checks.description) tips.push({ text: 'Meta-Beschreibung gesetzt', ok: true });
                if (pageSpeed.checks.https) tips.push({ text: 'HTTPS aktiv — Verbindung verschluesselt', ok: true });
              }
              if (pageSpeed.speedScore < 70) tips.push({ text: `Ladezeit optimieren (${pageSpeed.loadTimeFormatted}) — Bilder komprimieren, CSS minimieren`, ok: false });
              if (pageSpeed.speedScore >= 70) tips.push({ text: `Gute Ladezeit (${pageSpeed.loadTimeFormatted})`, ok: true });
              if (posts.length === 0) tips.push({ text: 'Ersten Blogpost erstellen — verbessert SEO und Sichtbarkeit', ok: false });
              if (posts.length > 0) tips.push({ text: `${posts.length} Blogposts veroeffentlicht`, ok: true });
              // Show max 5, problems first
              return tips.sort((a, b) => Number(a.ok) - Number(b.ok)).slice(0, 5).map((tip, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 8px', borderRadius: 6, background: tip.ok ? 'rgba(34,197,94,0.05)' : 'rgba(255,92,46,0.05)', border: `1px solid ${tip.ok ? 'rgba(34,197,94,0.1)' : 'rgba(255,92,46,0.1)'}` }}>
                  <span style={{ fontSize: 10, color: tip.ok ? '#22C55E' : '#FF5C2E', flexShrink: 0, marginTop: 1 }}>{tip.ok ? '✓' : '!'}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>{tip.text}</span>
                </div>
              ));
            })() : (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Daten werden geladen...</div>
            )}
          </div>
        </div>
      </div>

      {/* Mode tabs */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          marginTop: 20,
          marginBottom: 24,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          paddingBottom: 0,
        }}
      >
        {(
          [
            ['create', 'Create Blogpost'],
            ['update', 'Update Blogpost'],
            ['texts', 'Content'],
          ] as const
        ).map(([m, label]) => {
          const isActive = mode === m;
          return (
            <button
              key={m}
              onClick={() => {
                setMode(m as Mode);
                setCreateState('idle');
                setUpdateState('idle');
              }}
              style={{
                padding: '10px 20px',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                background: 'transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.2s',
                position: 'relative',
                borderBottom: isActive ? '2px solid #6B7AFF' : '2px solid transparent',
                marginBottom: -1,
                fontFamily: 'inherit',
              }}
            >
              {label}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: -1,
                    left: '10%',
                    right: '10%',
                    height: 2,
                    background: '#6B7AFF',
                    boxShadow: '0 0 10px rgba(107,122,255,0.5), 0 0 20px rgba(107,122,255,0.2)',
                    borderRadius: 1,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {mode === 'create' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Form card */}
          <div
            style={{
              background: '#111',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10,
              padding: 24,
            }}
          >
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginBottom: 6 }}>
              Neuer Blogpost
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 20 }}>
              Erstellen
            </div>
            <BlogForm initial={emptyForm} onSubmit={handleCreate} submitLabel="Erstellen" submitState={createState} />
          </div>

          {/* Preview / stats card */}
          <div
            style={{
              background: '#111',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginBottom: 6 }}>
              Uebersicht
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '14px 16px' }}>
                <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginBottom: 6 }}>Posts</div>
                <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-dm-mono)', lineHeight: 1 }}>{posts.length}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '14px 16px' }}>
                <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginBottom: 6 }}>Autoren</div>
                <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-dm-mono)', lineHeight: 1 }}>{new Set(posts.map(p => p.author)).size}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '14px 16px' }}>
                <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginBottom: 6 }}>Tags</div>
                <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-dm-mono)', lineHeight: 1 }}>{new Set(posts.flatMap(p => p.tags.split(',').filter(Boolean))).size}</div>
              </div>
            </div>
            {posts.length > 0 && (
              <div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>Letzte Posts</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {posts.slice(0, 5).map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 7, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{p.title}</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-dm-mono)', flexShrink: 0 }}>{new Date(p.createdAt).toLocaleDateString('de-DE')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {mode === 'update' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {gridOpen ? (
            <div
              style={{
                background: '#111',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10,
                padding: 24,
              }}
            >
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginBottom: 6 }}>
                Blogpost
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 20 }}>
                Auswählen
              </div>
              {postsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2.5rem' }}>
                  <UniqueLoading size="lg" />
                </div>
              ) : postsError ? (
                <p style={{ color: 'rgba(255,80,80,0.8)', fontSize: 13, padding: '1rem 0' }}>{postsError}</p>
              ) : (
                <PostGrid posts={posts} selected={selectedPost} onSelect={handleSelectPost} />
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setGridOpen(true)}
              style={{
                alignSelf: 'flex-start',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#111',
                border: '1px solid rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.6)',
                fontSize: 12,
                borderRadius: 8,
                padding: '8px 14px',
                cursor: 'pointer',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
            >
              <ChevronRight size={13} style={{ transform: 'rotate(180deg)' }} /> Anderen Eintrag wählen
            </button>
          )}
          {selectedPost && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div
                style={{
                  background: '#111',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 10,
                  padding: 24,
                }}
              >
                <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginBottom: 6 }}>
                  Blogpost
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
                  Bearbeiten
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginBottom: 20 }}>
                  {selectedPost.title}
                </div>
                <BlogForm
                  initial={postToForm(selectedPost)}
                  onSubmit={handleUpdate}
                  submitLabel="Speichern"
                  submitState={updateState}
                />
              </div>

              {/* Preview card */}
              <div
                style={{
                  background: '#111',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 10,
                  padding: 24,
                }}
              >
                <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginBottom: 6 }}>
                  Vorschau
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 20 }}>
                  {selectedPost.title}
                </div>
                {selectedPost.imageUrl && (
                  <img
                    src={getImageUrl(selectedPost.imageUrl) ?? ''}
                    alt=""
                    style={{ width: '100%', borderRadius: 8, marginBottom: 16, objectFit: 'cover', maxHeight: 200, border: '1px solid rgba(255,255,255,0.06)' }}
                  />
                )}
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto' }}>
                  {selectedPost.content}
                </div>
                <div style={{ marginTop: 16, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {selectedPost.tags.split(',').filter(Boolean).map(t => (
                    <span key={t} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 5, background: 'rgba(107,122,255,0.12)', color: 'rgba(107,122,255,0.8)', border: '1px solid rgba(107,122,255,0.2)' }}>
                      {t.trim()}
                    </span>
                  ))}
                </div>
                <div style={{ marginTop: 12, fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-dm-mono)' }}>
                  {selectedPost.author} · {new Date(selectedPost.createdAt).toLocaleDateString('de-DE')} · {calcReadTime(selectedPost.content)} Min. Lesezeit
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'texts' && <WebsiteTextsEditor />}
    </div>
  );
}
