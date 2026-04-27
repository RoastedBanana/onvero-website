'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import UniqueLoading from '@onvero/ui/effects/grid-loading';
import { calcReadTime } from '@onvero/lib/utils';
import { C, PrimaryButton } from './_shared';

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export interface BlogPost {
  id: string | number;
  documentId: string;
  title: string;
  content: string;
  tags: string;
  author: string;
  imageUrl: string | null;
  imageId: string | null;
  createdAt: string;
  marked: boolean;
}

export interface FormState {
  title: string;
  content: string;
  tags: string[];
  author: string;
  imageFile: File | null;
  existingImageUrl: string | null;
  imageRemoved: boolean;
}

export const POSTS_PER_PAGE = 12;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function getImageUrl(url: string | null | undefined): string | null {
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

export function emptyForm(author = ''): FormState {
  return {
    title: '',
    content: '',
    tags: [],
    author,
    imageFile: null,
    existingImageUrl: null,
    imageRemoved: false,
  };
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

export function useAuthorFromCookie(): string | null {
  const [author, setAuthor] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          const name = [data.user.firstName, data.user.lastName].filter(Boolean).join(' ');
          if (name) setAuthor(name);
        }
      })
      .catch(() => {});
  }, []);
  return author;
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.03)',
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  color: C.text1,
  fontSize: 13,
  padding: '10px 12px',
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'all 0.2s ease',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 200,
  resize: 'vertical',
  lineHeight: 1.55,
};

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: 'block',
        color: C.text3,
        fontSize: 11,
        marginBottom: 6,
        fontWeight: 500,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </label>
  );
}

// ─── TAG INPUT ───────────────────────────────────────────────────────────────

export function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput('');
  };
  return (
    <div>
      <Label>Tags</Label>
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {tags.map((t) => (
            <span
              key={t}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 6,
                padding: '3px 9px',
                fontSize: 11.5,
                color: C.accentBright,
              }}
            >
              {t}
              <button
                type="button"
                onClick={() => onChange(tags.filter((x) => x !== t))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(165,180,252,0.6)',
                  cursor: 'pointer',
                  fontSize: 14,
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
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          className="w-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Tag hinzufügen…"
          style={inputStyle}
        />
        <button
          type="button"
          onClick={add}
          className="w-ghost"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${C.border}`,
            color: C.text2,
            borderRadius: 8,
            padding: '0 14px',
            cursor: 'pointer',
            fontSize: 14,
            fontFamily: 'inherit',
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

// ─── IMAGE UPLOAD ────────────────────────────────────────────────────────────

export function ImageUpload({
  file,
  existingUrl,
  onChange,
  onRemove,
}: {
  file: File | null;
  existingUrl: string | null;
  onChange: (f: File) => void;
  onRemove: () => void;
}) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const previewUrl = file ? URL.createObjectURL(file) : existingUrl;

  const validate = (f: File) => /\.(jpe?g|png)$/i.test(f.name) || /image\/(jpeg|png)/.test(f.type);

  return (
    <div>
      <Label>Cover-Bild</Label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f && validate(f)) onChange(f);
        }}
        onClick={() => inputRef.current?.click()}
        style={{
          position: 'relative',
          border: `1px dashed ${drag ? C.accent : C.borderLight}`,
          borderRadius: 12,
          minHeight: 140,
          background: drag ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.02)',
          cursor: 'pointer',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}
      >
        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Cover"
              style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 6,
                color: '#fff',
                fontSize: 11,
                padding: '4px 8px',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Entfernen
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: C.text3, fontSize: 12, padding: 24 }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>↑</div>
            Drag &amp; Drop oder klicken
            <div style={{ fontSize: 10, marginTop: 4, color: C.text3 }}>JPG oder PNG</div>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && validate(f)) onChange(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}

// ─── SHIMMER OVERLAY ─────────────────────────────────────────────────────────

function ShimmerOverlay() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 10,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, transparent 0%, rgba(129,140,248,0.12) 40%, rgba(129,140,248,0.22) 50%, rgba(129,140,248,0.12) 60%, transparent 100%)',
          animation: 'aiShimmer 1.4s ease-in-out infinite',
        }}
      />
    </div>
  );
}

// ─── AI PROMPT POPOVER ───────────────────────────────────────────────────────

function AiPromptPopover({
  open,
  onClose,
  onSubmit,
  disabled,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (prompt: string) => void;
  disabled: boolean;
}) {
  const [prompt, setPrompt] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setPrompt('');
      return;
    }
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 8px)',
        right: 0,
        width: 320,
        background: C.surface,
        border: '1px solid rgba(99,102,241,0.25)',
        borderRadius: 12,
        padding: 12,
        boxShadow: '0 12px 32px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.04)',
        zIndex: 20,
        animation: 'scaleIn 0.18s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          color: C.accentBright,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <SparkleIcon size={11} />
        Mit KI überarbeiten
      </div>
      <textarea
        autoFocus
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Optional: Was soll die KI ändern? z. B. kürzer fassen, förmlicher, CTA hinzufügen…"
        rows={3}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            onSubmit(prompt.trim());
            onClose();
          }
          if (e.key === 'Escape') onClose();
        }}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          color: C.text1,
          fontSize: 12.5,
          padding: '8px 10px',
          outline: 'none',
          fontFamily: 'inherit',
          resize: 'none',
          lineHeight: 1.5,
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 8 }}>
        <span style={{ fontSize: 10, color: C.text3 }}>⌘ + Enter</span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            onSubmit(prompt.trim());
            onClose();
          }}
          className="w-primary"
          style={{
            background: 'linear-gradient(135deg, #6366F1, #818CF8)',
            color: '#fff',
            border: 'none',
            borderRadius: 7,
            padding: '6px 14px',
            fontSize: 11.5,
            fontWeight: 500,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            fontFamily: 'inherit',
            boxShadow: '0 2px 12px rgba(99,102,241,0.25)',
          }}
        >
          Anwenden →
        </button>
      </div>
    </div>
  );
}

function SparkleIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
      <path d="M20 16l1.04 3.13L24 20l-2.96.87L20 24l-1.04-3.13L16 20l2.96-.87L20 16z" />
    </svg>
  );
}

// ─── BLOG FORM ───────────────────────────────────────────────────────────────

export function BlogForm({
  form,
  setForm,
  onSubmit,
  submitting,
  submitLabel,
  onAiPolish,
  aiPolishing,
}: {
  form: FormState;
  setForm: (f: FormState | ((prev: FormState) => FormState)) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitLabel: string;
  onAiPolish: (prompt?: string) => void;
  aiPolishing: boolean;
}) {
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((p) => ({ ...p, [k]: v }));
  const [aiOpen, setAiOpen] = useState(false);

  const canSubmit = !!(form.title.trim() && form.content.trim() && form.author.trim() && !submitting);
  const canPolish = !!(form.title.trim() || form.content.trim());

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit();
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
    >
      <div>
        <Label>Titel</Label>
        <div style={{ position: 'relative' }}>
          <input
            className="w-input"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="z. B. Wie wir Sales-Automation neu denken"
            style={inputStyle}
          />
          {aiPolishing && <ShimmerOverlay />}
        </div>
      </div>

      <div>
        <Label>Inhalt</Label>
        <div style={{ position: 'relative' }}>
          <textarea
            className="w-input"
            value={form.content}
            onChange={(e) => set('content', e.target.value)}
            placeholder="Markdown wird unterstützt…"
            style={{ ...textareaStyle, paddingBottom: 44 }}
          />
          {aiPolishing && <ShimmerOverlay />}
          <AiPromptPopover
            open={aiOpen}
            onClose={() => setAiOpen(false)}
            onSubmit={(p) => onAiPolish(p || undefined)}
            disabled={aiPolishing || !canPolish}
          />
          <button
            type="button"
            onClick={() => setAiOpen((o) => !o)}
            disabled={aiPolishing || !canPolish}
            title="Mit KI überarbeiten"
            style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              width: 30,
              height: 30,
              borderRadius: 8,
              border: '1px solid rgba(99,102,241,0.3)',
              background: aiPolishing || aiOpen ? 'rgba(99,102,241,0.22)' : 'rgba(99,102,241,0.1)',
              color: C.accentBright,
              cursor: aiPolishing ? 'wait' : !canPolish ? 'not-allowed' : 'pointer',
              opacity: !canPolish ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s, border-color 0.2s',
              zIndex: 3,
              padding: 0,
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
              if (!aiPolishing && canPolish) {
                e.currentTarget.style.background = 'rgba(99,102,241,0.25)';
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!aiPolishing && canPolish && !aiOpen) {
                e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
              }
            }}
          >
            {aiPolishing ? (
              <svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ animation: 'spin 1s linear infinite' }}
              >
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
            ) : (
              <SparkleIcon size={14} />
            )}
          </button>
        </div>
      </div>

      <TagInput tags={form.tags} onChange={(t) => set('tags', t)} />

      <div>
        <Label>Autor</Label>
        <input
          className="w-input"
          value={form.author}
          onChange={(e) => set('author', e.target.value)}
          placeholder="Vorname Nachname"
          style={inputStyle}
        />
      </div>

      <ImageUpload
        file={form.imageFile}
        existingUrl={form.existingImageUrl}
        onChange={(f) => setForm((p) => ({ ...p, imageFile: f, imageRemoved: false }))}
        onRemove={() =>
          setForm((p) => ({
            ...p,
            imageFile: null,
            existingImageUrl: null,
            imageRemoved: true,
          }))
        }
      />

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <PrimaryButton type="submit" disabled={!canSubmit}>
          {submitting ? (
            <>
              <UniqueLoading size="sm" />
              Speichern…
            </>
          ) : (
            submitLabel
          )}
        </PrimaryButton>
      </div>
    </form>
  );
}

// ─── POST CARD ───────────────────────────────────────────────────────────────

const skeletonBg: React.CSSProperties = {
  background:
    'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
  backgroundSize: '200% 100%',
  animation: 'skeletonShimmer 1.6s ease-in-out infinite',
  borderRadius: 6,
};

function PostCardSkeleton({ delay = 0 }: { delay?: number }) {
  const wrap: React.CSSProperties = {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 14,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 2px 16px rgba(0,0,0,0.25)',
    animationDelay: `${delay}ms`,
  };
  const block = (style: React.CSSProperties): React.CSSProperties => ({
    ...skeletonBg,
    ...style,
    animationDelay: `${delay}ms`,
  });
  return (
    <div style={wrap} aria-hidden="true">
      <div style={block({ width: '100%', height: 130, borderRadius: 0 })} />
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={block({ height: 12, width: '85%' })} />
        <div style={block({ height: 12, width: '60%' })} />
        <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
          <div style={block({ height: 14, width: 38 })} />
          <div style={block({ height: 14, width: 50 })} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <div style={block({ height: 9, width: 70 })} />
          <div style={block({ height: 9, width: 90 })} />
        </div>
      </div>
    </div>
  );
}

function CheckIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function StarIcon({ size = 12, filled = false }: { size?: number; filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function PostCard({
  post,
  selected,
  checked,
  selectionActive,
  onOpen,
  onToggleCheck,
  onContextMenu,
}: {
  post: BlogPost;
  selected: boolean;
  checked: boolean;
  selectionActive: boolean;
  onOpen: () => void;
  onToggleCheck: () => void;
  onContextMenu: (e: React.MouseEvent, post: BlogPost) => void;
}) {
  const tags = (post.tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 3);
  const img = getImageUrl(post.imageUrl);

  const handleClick = () => {
    if (selectionActive) onToggleCheck();
    else onOpen();
  };

  return (
    <div
      onClick={handleClick}
      onContextMenu={(e) => onContextMenu(e, post)}
      className="w-card"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      style={{
        position: 'relative',
        textAlign: 'left',
        background: checked ? 'rgba(99,102,241,0.1)' : selected ? 'rgba(99,102,241,0.06)' : C.surface,
        border: `1px solid ${checked || selected ? C.borderAccent : C.border}`,
        borderRadius: 14,
        padding: 0,
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 16px rgba(0,0,0,0.25)',
        fontFamily: 'inherit',
      }}
    >
      <button
        type="button"
        aria-label={checked ? 'Auswahl entfernen' : 'Auswählen'}
        onClick={(e) => {
          e.stopPropagation();
          onToggleCheck();
        }}
        className="w-card-check"
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          width: 22,
          height: 22,
          borderRadius: 6,
          background: checked ? C.accentDim : 'rgba(8,9,26,0.72)',
          border: `1px solid ${checked ? C.accentDim : 'rgba(255,255,255,0.25)'}`,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 3,
          padding: 0,
          backdropFilter: 'blur(6px)',
          opacity: selectionActive || checked ? 1 : 0,
          transition: 'opacity 0.15s ease, background 0.15s ease',
          fontFamily: 'inherit',
        }}
      >
        {checked && <CheckIcon size={12} />}
      </button>

      {post.marked && (
        <div
          aria-label="Markiert"
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 22,
            height: 22,
            borderRadius: 6,
            background: 'rgba(251,191,36,0.18)',
            border: '1px solid rgba(251,191,36,0.45)',
            color: C.warning,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3,
            backdropFilter: 'blur(6px)',
          }}
        >
          <StarIcon size={12} filled />
        </div>
      )}

      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt={post.title} style={{ width: '100%', height: 130, objectFit: 'cover' }} />
      ) : (
        <div
          style={{
            width: '100%',
            height: 130,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(56,189,248,0.05))',
          }}
        />
      )}
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <h3
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: C.text1,
            margin: 0,
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            overflow: 'hidden',
          }}
        >
          {post.title}
        </h3>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {tags.map((t) => (
            <span
              key={t}
              style={{
                fontSize: 9.5,
                color: C.text2,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 4,
                padding: '2px 6px',
              }}
            >
              {t}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
          <span style={{ fontSize: 10, color: C.text3 }}>{post.author}</span>
          <span style={{ fontSize: 10, color: C.text3 }}>
            {formatDate(post.createdAt)} · {calcReadTime(post.content)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── POST GRID ───────────────────────────────────────────────────────────────

export function PostGrid({
  posts,
  selectedId,
  onSelect,
  loading,
  checkedIds,
  onToggleCheck,
  onCheckAllVisible,
  onContextMenu,
}: {
  posts: BlogPost[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
  checkedIds: Set<string>;
  onToggleCheck: (id: string) => void;
  onCheckAllVisible: (ids: string[], checked: boolean) => void;
  onContextMenu: (e: React.MouseEvent, post: BlogPost) => void;
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.tags?.toLowerCase().includes(q)
    );
  }, [posts, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE));
  const visible = filtered.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);

  const visibleIds = visible.map((p) => p.documentId);
  const allVisibleChecked = visibleIds.length > 0 && visibleIds.every((id) => checkedIds.has(id));
  const selectionActive = checkedIds.size > 0;

  if (loading) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 14,
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <PostCardSkeleton key={i} delay={i * 60} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <input
          className="w-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Suchen nach Titel, Autor oder Tag…"
          style={{ ...inputStyle, maxWidth: 360 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {visibleIds.length > 0 && (
            <button
              type="button"
              onClick={() => onCheckAllVisible(visibleIds, !allVisibleChecked)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${C.border}`,
                color: C.text2,
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: 11,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {allVisibleChecked ? 'Auswahl auf dieser Seite aufheben' : 'Alle auf dieser Seite auswählen'}
            </button>
          )}
          <span style={{ fontSize: 11, color: C.text3 }}>
            {filtered.length} {filtered.length === 1 ? 'Beitrag' : 'Beiträge'}
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: '40px 24px',
            textAlign: 'center',
            color: C.text3,
            fontSize: 13,
          }}
        >
          Noch keine Beiträge — wechsle zu „Erstellen", um den ersten zu schreiben.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 14,
            animation: 'fadeIn 0.3s ease both',
          }}
        >
          {visible.map((p) => (
            <PostCard
              key={p.documentId}
              post={p}
              selected={selectedId === p.documentId}
              checked={checkedIds.has(p.documentId)}
              selectionActive={selectionActive}
              onOpen={() => onSelect(p.documentId)}
              onToggleCheck={() => onToggleCheck(p.documentId)}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              style={{
                background: page === n ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${page === n ? C.borderAccent : C.border}`,
                color: page === n ? C.accentBright : C.text2,
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 11.5,
                cursor: 'pointer',
                fontFamily: 'inherit',
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

// ─── BLOG PREVIEW (matches apps/marketing/blog/[documentId] layout) ─────────

export function BlogPreview({
  form,
  createdAt,
}: {
  form: FormState;
  createdAt?: string;
}) {
  const previewImage = form.imageFile
    ? URL.createObjectURL(form.imageFile)
    : form.existingImageUrl;

  const dateStr = (() => {
    const iso = createdAt ?? new Date().toISOString();
    try {
      return new Date(iso).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  })();

  const readTime = form.content.trim() ? calcReadTime(form.content) : '— min Lesezeit';

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: C.text3,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontWeight: 600,
          paddingLeft: 4,
        }}
      >
        Vorschau
      </div>
      <div
        style={{
          background: '#0f0f0f',
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          overflow: 'hidden',
          color: '#fff',
          maxHeight: 'calc(100vh - 180px)',
          overflowY: 'auto',
        }}
      >
        {previewImage && (
          <div style={{ width: '100%', height: 200, position: 'relative', overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage}
              alt={form.title || 'Cover'}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, transparent 60%, #0f0f0f 100%)',
              }}
            />
          </div>
        )}

        <div style={{ padding: previewImage ? '20px 24px 32px' : '40px 24px 32px' }}>
          {form.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 10.5,
                    padding: '2px 9px',
                    borderRadius: 6,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              lineHeight: 1.25,
              letterSpacing: '-0.02em',
              margin: '0 0 16px',
              color: form.title ? '#fff' : 'rgba(255,255,255,0.3)',
            }}
          >
            {form.title || 'Titel deines Beitrags'}
          </h1>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 14,
              alignItems: 'center',
              fontSize: 11.5,
              color: 'rgba(255,255,255,0.45)',
              paddingBottom: 18,
              marginBottom: 22,
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
              </svg>
              {form.author || 'Autor'}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {dateStr}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {readTime}
            </span>
          </div>

          <div
            style={{
              fontSize: 13.5,
              lineHeight: 1.75,
              color: form.content ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)',
              whiteSpace: 'pre-wrap',
              fontStyle: form.content ? 'normal' : 'italic',
            }}
          >
            {form.content || 'Der Inhalt deines Beitrags erscheint hier in der Vorschau, wie er später auf onvero.de angezeigt wird.'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SPLIT LAYOUT (form left, preview right) ─────────────────────────────────

export function SplitLayout({ form, preview }: { form: React.ReactNode; preview: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: 22,
        alignItems: 'start',
      }}
    >
      <div>{form}</div>
      <div>{preview}</div>
    </div>
  );
}

// ─── CONTEXT MENU ────────────────────────────────────────────────────────────

export interface ContextMenuState {
  x: number;
  y: number;
  post: BlogPost;
}

export function PostContextMenu({
  state,
  onClose,
  onToggleMark,
  onDelete,
  onOpen,
}: {
  state: ContextMenuState | null;
  onClose: () => void;
  onToggleMark: (post: BlogPost) => void;
  onDelete: (post: BlogPost) => void;
  onOpen: (post: BlogPost) => void;
}) {
  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onScroll = () => onClose();
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [state, onClose]);

  if (!state) return null;

  const MENU_W = 200;
  const MENU_H = 132;
  const x = Math.min(state.x, window.innerWidth - MENU_W - 8);
  const y = Math.min(state.y, window.innerHeight - MENU_H - 8);

  const item: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '8px 12px',
    background: 'transparent',
    border: 'none',
    color: C.text1,
    fontSize: 12.5,
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
    transition: 'background 0.12s ease',
  };

  return (
    <>
      <div
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
        style={{ position: 'fixed', inset: 0, zIndex: 60 }}
      />
      <div
        role="menu"
        style={{
          position: 'fixed',
          left: x,
          top: y,
          width: MENU_W,
          background: 'rgba(14,16,37,0.97)',
          border: `1px solid ${C.borderAccent}`,
          borderRadius: 10,
          padding: 4,
          boxShadow: '0 16px 48px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(255,255,255,0.04)',
          backdropFilter: 'blur(12px)',
          zIndex: 61,
          animation: 'scaleIn 0.12s cubic-bezier(0.22, 1, 0.36, 1) both',
          transformOrigin: 'top left',
          fontFamily: 'inherit',
        }}
      >
        <button
          type="button"
          onClick={() => {
            onOpen(state.post);
            onClose();
          }}
          style={item}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.12)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Bearbeiten
        </button>
        <button
          type="button"
          onClick={() => {
            onToggleMark(state.post);
            onClose();
          }}
          style={{ ...item, color: C.warning }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(251,191,36,0.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <StarIcon size={13} filled={state.post.marked} />
          {state.post.marked ? 'Markierung entfernen' : 'Markieren'}
        </button>
        <div style={{ height: 1, background: C.border, margin: '4px 0' }} />
        <button
          type="button"
          onClick={() => {
            onDelete(state.post);
            onClose();
          }}
          style={{ ...item, color: C.danger }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(248,113,113,0.12)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
          Löschen
        </button>
      </div>
    </>
  );
}

// ─── BULK ACTION BAR ─────────────────────────────────────────────────────────

export function BulkActionBar({
  count,
  allMarked,
  busy,
  onClear,
  onToggleMark,
  onExport,
  onDelete,
}: {
  count: number;
  allMarked: boolean;
  busy: boolean;
  onClear: () => void;
  onToggleMark: () => void;
  onExport: () => void;
  onDelete: () => void;
}) {
  if (count === 0) return null;
  return (
    <div
      style={{
        position: 'fixed',
        left: 220,
        right: 0,
        bottom: 24,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
    <div
      role="region"
      aria-label="Massenaktionen"
      style={{
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'rgba(14,16,37,0.92)',
        border: `1px solid ${C.borderAccent}`,
        borderRadius: 14,
        padding: '10px 12px 10px 16px',
        boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(99,102,241,0.15), 0 0 32px rgba(99,102,241,0.18)',
        backdropFilter: 'blur(12px)',
        animation: 'fadeInUp 0.25s cubic-bezier(0.22, 1, 0.36, 1) both',
        fontFamily: 'inherit',
      }}
    >
      <span style={{ fontSize: 12, color: C.text1, fontWeight: 500 }}>
        {count} {count === 1 ? 'Beitrag' : 'Beiträge'} ausgewählt
      </span>
      <span style={{ width: 1, height: 22, background: C.border }} />
      <button
        type="button"
        disabled={busy}
        onClick={onToggleMark}
        className="w-ghost"
        style={{
          background: 'rgba(251,191,36,0.08)',
          border: '1px solid rgba(251,191,36,0.25)',
          color: C.warning,
          borderRadius: 8,
          padding: '7px 12px',
          fontSize: 12,
          cursor: busy ? 'not-allowed' : 'pointer',
          opacity: busy ? 0.5 : 1,
          fontFamily: 'inherit',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <StarIcon size={12} filled={allMarked} />
        {allMarked ? 'Markierung entfernen' : 'Markieren'}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onExport}
        className="w-ghost"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${C.border}`,
          color: C.text2,
          borderRadius: 8,
          padding: '7px 12px',
          fontSize: 12,
          cursor: busy ? 'not-allowed' : 'pointer',
          opacity: busy ? 0.5 : 1,
          fontFamily: 'inherit',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
        CSV exportieren
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onDelete}
        style={{
          background: 'rgba(248,113,113,0.1)',
          border: '1px solid rgba(248,113,113,0.3)',
          color: C.danger,
          borderRadius: 8,
          padding: '7px 12px',
          fontSize: 12,
          cursor: busy ? 'not-allowed' : 'pointer',
          opacity: busy ? 0.5 : 1,
          fontFamily: 'inherit',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          transition: 'background 0.15s ease, border-color 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (busy) return;
          e.currentTarget.style.background = 'rgba(248,113,113,0.18)';
          e.currentTarget.style.borderColor = 'rgba(248,113,113,0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(248,113,113,0.1)';
          e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)';
        }}
      >
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
        Löschen
      </button>
      <span style={{ width: 1, height: 22, background: C.border }} />
      <button
        type="button"
        onClick={onClear}
        aria-label="Auswahl aufheben"
        style={{
          background: 'transparent',
          border: 'none',
          color: C.text3,
          fontSize: 18,
          lineHeight: 1,
          cursor: 'pointer',
          padding: '4px 8px',
          fontFamily: 'inherit',
        }}
      >
        ×
      </button>
    </div>
    </div>
  );
}

// ─── CSV EXPORT ──────────────────────────────────────────────────────────────

export function postsToCsv(posts: BlogPost[]): string {
  const headers = ['document_id', 'title', 'author', 'tags', 'marked', 'created_at', 'cover_image_url', 'content'];
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = posts.map((p) =>
    [p.documentId, p.title, p.author, p.tags, p.marked ? 'true' : 'false', p.createdAt, p.imageUrl ?? '', p.content]
      .map(escape)
      .join(',')
  );
  return [headers.join(','), ...rows].join('\r\n');
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── BANNERS ─────────────────────────────────────────────────────────────────

export function SuccessBanner({ text }: { text: string }) {
  return (
    <div
      style={{
        background: 'rgba(52,211,153,0.06)',
        border: '1px solid rgba(52,211,153,0.2)',
        borderRadius: 10,
        padding: '10px 14px',
        color: C.success,
        fontSize: 12.5,
        marginBottom: 18,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span style={{ fontSize: 14 }}>✓</span> {text}
    </div>
  );
}

export function ErrorBanner({ text }: { text: string }) {
  return (
    <div
      style={{
        background: 'rgba(248,113,113,0.06)',
        border: '1px solid rgba(248,113,113,0.2)',
        borderRadius: 10,
        padding: '10px 14px',
        color: '#FCA5A5',
        fontSize: 12.5,
      }}
    >
      {text}
    </div>
  );
}

// ─── AI POLISH ───────────────────────────────────────────────────────────────

export async function polishWithAI(
  form: FormState,
  setForm: (f: FormState) => void,
  setAiPolishing: (b: boolean) => void,
  setErrorMsg: (s: string | null) => void,
  prompt?: string
) {
  if (!form.title.trim() && !form.content.trim()) return;
  setAiPolishing(true);
  setErrorMsg(null);
  try {
    const res = await fetch('/api/proxy/n8n', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'blog-ai-polish',
        title: form.title,
        content: form.content,
        ...(prompt ? { prompt } : {}),
      }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'AI polish failed');
    setForm({
      ...form,
      title: result.title || form.title,
      content: result.content || form.content,
      tags:
        typeof result.tags === 'string'
          ? result.tags
              .split(',')
              .map((t: string) => t.trim())
              .filter(Boolean)
          : form.tags,
    });
  } catch (e) {
    setErrorMsg(e instanceof Error ? e.message : 'KI-Polish fehlgeschlagen.');
  } finally {
    setAiPolishing(false);
  }
}

// ─── POSTS LOADER ────────────────────────────────────────────────────────────

export function mapRawPost(r: Record<string, unknown>): BlogPost {
  return {
    id: (r.id as string | number) ?? '',
    documentId: (r.document_id as string) ?? String(r.id ?? ''),
    title: (r.title as string) ?? '',
    content: (r.content as string) ?? '',
    tags: (r.tags as string) ?? '',
    author: (r.writer as string) ?? '',
    imageUrl: (r.cover_image_url as string | null) ?? null,
    imageId: (r.cover_image_id as string | null) ?? null,
    createdAt: (r.created_at as string) ?? '',
    marked: r.marked === true,
  };
}
