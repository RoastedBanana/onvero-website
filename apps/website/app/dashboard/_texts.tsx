'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, File, Folder, FolderOpen, Save, Search } from 'lucide-react';
import { createClient } from '@onvero/lib/supabase';
import { C, SkeletonBox } from './_shared';

// ─── TYPES ───────────────────────────────────────────────────────────────────

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

interface SearchResult {
  text: WebsiteText;
  fieldPath?: string[];
  fieldValue?: string;
}

// ─── STYLES (matched to _shared C tokens) ────────────────────────────────────

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

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: C.text3,
  fontSize: 11,
  marginBottom: 6,
  fontWeight: 500,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

// ─── AUTO-RESIZE TEXTAREA ────────────────────────────────────────────────────

function AutoResizeTextarea({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div id={id} style={{ marginBottom: 12 }}>
      <label style={labelStyle}>{label}</label>
      <textarea
        className="w-input"
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
        style={{ ...inputStyle, resize: 'none', overflow: 'hidden', minHeight: 56, lineHeight: 1.55 }}
      />
    </div>
  );
}

// ─── FIELD CATEGORIZATION ────────────────────────────────────────────────────

function categorizeKey(key: string): string {
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
}

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

// ─── MAIN ────────────────────────────────────────────────────────────────────

export function WebsiteTextsEditor() {
  const [texts, setTexts] = useState<WebsiteText[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selected, setSelected] = useState<WebsiteText | null>(null);
  const [editContent, setEditContent] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [scrollToField, setScrollToField] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // ─── Load texts ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data, error } = await sb.from('website_texts').select('*').order('page').order('sort_order');
      if (error) {
        setErrorMsg(error.message);
      } else if (data) {
        setTexts(data as WebsiteText[]);
        setExpandedPages(new Set((data as WebsiteText[]).map((t) => t.page)));
      }
      setLoading(false);
    })();
  }, []);

  const pages = useMemo(() => [...new Set(texts.map((t) => t.page))], [texts]);

  function handleSelect(t: WebsiteText) {
    setSelected(t);
    setEditContent(structuredClone(t.content));
    setSaveOk(false);
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    const sb = createClient();
    const { error } = await sb
      .from('website_texts')
      .update({ content: editContent, updated_at: new Date().toISOString() })
      .eq('id', selected.id);
    if (error) {
      setErrorMsg('Speichern fehlgeschlagen: ' + error.message);
    } else {
      setTexts((prev) => prev.map((t) => (t.id === selected.id ? { ...t, content: editContent } : t)));
      setSelected((prev) => (prev ? { ...prev, content: editContent } : prev));
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 3000);
    }
    setSaving(false);
  }

  function togglePage(p: string) {
    setExpandedPages((prev) => {
      const n = new Set(prev);
      if (n.has(p)) n.delete(p);
      else n.add(p);
      return n;
    });
  }

  function toggleGroup(g: string) {
    setCollapsedGroups((prev) => {
      const n = new Set(prev);
      if (n.has(g)) n.delete(g);
      else n.add(g);
      return n;
    });
  }

  // ─── Search ──────────────────────────────────────────────────────────────
  const searchResults: SearchResult[] = useMemo(() => {
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
      const walk = (obj: unknown, path: string[]) => {
        if (typeof obj === 'string' && obj.toLowerCase().includes(q)) {
          results.push({ text: t, fieldPath: path, fieldValue: obj });
        } else if (Array.isArray(obj)) {
          obj.forEach((item, i) => walk(item, [...path, String(i)]));
        } else if (typeof obj === 'object' && obj !== null) {
          for (const [k, v] of Object.entries(obj)) walk(v, [...path, k]);
        }
      };
      walk(t.content, []);
    }
    return results.slice(0, 20);
  }, [texts, search]);

  function handleSearchSelect(r: SearchResult) {
    handleSelect(r.text);
    setExpandedPages((prev) => new Set([...prev, r.text.page]));
    if (r.fieldPath) setScrollToField(r.fieldPath.join('.'));
    setSearch('');
    setSearchFocused(false);
  }

  // Auto-scroll + flash highlight on field jump
  useEffect(() => {
    if (!scrollToField) return;
    const t = setTimeout(() => {
      const el = document.getElementById(`field-${scrollToField}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.outline = `2px solid ${C.borderAccent}`;
        el.style.borderRadius = '8px';
        setTimeout(() => {
          el.style.outline = 'none';
        }, 1800);
      }
      setScrollToField(null);
    }, 100);
    return () => clearTimeout(t);
  }, [scrollToField, selected]);

  // Click outside search dropdown
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchFocused(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // ─── Field renderer ──────────────────────────────────────────────────────
  function updateField(path: string[], value: unknown) {
    setEditContent((prev) => {
      const clone = structuredClone(prev);
      let obj: Record<string, unknown> = clone;
      for (let i = 0; i < path.length - 1; i++) {
        obj = obj[path[i]] as Record<string, unknown>;
      }
      obj[path[path.length - 1]] = value;
      return clone;
    });
  }

  function renderField(key: string, value: unknown, path: string[] = []): React.ReactNode {
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
          setErrorMsg('Upload fehlgeschlagen: ' + upErr.message);
          return;
        }
        const { data: urlData } = sb.storage.from('website-assets').getPublicUrl(fileName);
        updateField(fullPath, urlData.publicUrl);
      };
      return (
        <div key={pathKey} id={fieldId} style={{ marginBottom: 12 }}>
          <label style={labelStyle}>{key}</label>
          {imgUrl && (
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 8 }}>
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
                  border: `1px solid ${C.borderLight}`,
                }}
              />
              <button
                type="button"
                onClick={() => updateField(fullPath, '')}
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  background: 'rgba(0,0,0,0.7)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  cursor: 'pointer',
                  fontSize: 13,
                  lineHeight: '22px',
                  textAlign: 'center',
                  fontFamily: 'inherit',
                }}
              >
                ×
              </button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              className="w-input"
              value={imgUrl}
              onChange={(e) => updateField(fullPath, e.target.value)}
              placeholder="Bild-URL oder hochladen…"
              style={{ ...inputStyle, flex: 1 }}
            />
            <label
              className="w-ghost"
              style={{
                padding: '8px 14px',
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                color: C.text2,
                fontSize: 11.5,
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
        <div key={pathKey} id={fieldId} style={{ marginBottom: 12 }}>
          <label style={labelStyle}>{key}</label>
          <input
            className="w-input"
            value={value}
            onChange={(e) => updateField(fullPath, e.target.value)}
            style={inputStyle}
          />
        </div>
      );
    }

    if (typeof value === 'boolean') {
      return (
        <div
          key={pathKey}
          id={fieldId}
          style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => updateField(fullPath, e.target.checked)}
            style={{ accentColor: C.accent }}
          />
          <label style={{ ...labelStyle, margin: 0 }}>{key}</label>
        </div>
      );
    }

    if (typeof value === 'number') {
      return (
        <div key={pathKey} id={fieldId} style={{ marginBottom: 12 }}>
          <label style={labelStyle}>{key}</label>
          <input
            type="number"
            className="w-input"
            value={value}
            onChange={(e) => updateField(fullPath, Number(e.target.value))}
            style={inputStyle}
          />
        </div>
      );
    }

    if (Array.isArray(value)) {
      return (
        <div key={pathKey} id={fieldId} style={{ marginBottom: 12 }}>
          <label style={{ ...labelStyle, marginBottom: 8 }}>
            {key} ({value.length})
          </label>
          <div style={{ paddingLeft: 12, borderLeft: `2px solid ${C.border}` }}>
            {value.map((item, i) => {
              if (typeof item === 'object' && item !== null) {
                return (
                  <div
                    key={`${pathKey}.${i}`}
                    style={{
                      marginBottom: 12,
                      padding: 12,
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    <p style={{ fontSize: 10.5, color: C.text3, marginBottom: 8 }}>
                      {key}[{i}]
                    </p>
                    {Object.entries(item).map(([k, v]) => renderField(k, v, [...fullPath, String(i)]))}
                  </div>
                );
              }
              return (
                <div key={`${pathKey}.${i}`} style={{ marginBottom: 6 }}>
                  <label style={labelStyle}>
                    {key}[{i}]
                  </label>
                  <input
                    className="w-input"
                    value={String(item)}
                    onChange={(e) => updateField([...fullPath, String(i)], e.target.value)}
                    style={inputStyle}
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
        <div key={pathKey} id={fieldId} style={{ marginBottom: 12 }}>
          <label style={{ ...labelStyle, marginBottom: 8 }}>{key}</label>
          <div style={{ paddingLeft: 12, borderLeft: `2px solid ${C.border}` }}>
            {Object.entries(value).map(([k, v]) => renderField(k, v, fullPath))}
          </div>
        </div>
      );
    }

    return null;
  }

  function renderGroupedContent(content: Record<string, unknown>) {
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
        <div key={cat} style={{ marginBottom: 8 }}>
          <button
            type="button"
            onClick={() => toggleGroup(cat)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '8px 0',
              background: 'none',
              border: 'none',
              borderBottom: `1px solid ${C.border}`,
              cursor: 'pointer',
              marginBottom: isCollapsed ? 0 : 12,
              fontFamily: 'inherit',
            }}
          >
            <ChevronDown
              size={12}
              style={{
                color: C.text3,
                transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s',
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: C.text2,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {cat}
            </span>
            <span style={{ fontSize: 10, color: C.text3 }}>({fields.length})</span>
          </button>
          {!isCollapsed && <div style={{ paddingLeft: 4 }}>{fields.map(([k, v]) => renderField(k, v))}</div>}
        </div>
      );
    });
  }

  // ─── Render ──────────────────────────────────────────────────────────────
  if (loading) {
    return <WebsiteTextsSkeleton />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 500 }}>
      {errorMsg && (
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
          {errorMsg}
        </div>
      )}

      {/* Search */}
      <div ref={searchRef} style={{ position: 'relative', maxWidth: 480 }}>
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: C.text3,
            pointerEvents: 'none',
          }}
        />
        <input
          className="w-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          placeholder="Texte durchsuchen…"
          style={{ ...inputStyle, paddingLeft: 36 }}
        />
        {searchFocused && search.trim() && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 6,
              background: C.surface,
              border: `1px solid ${C.borderLight}`,
              borderRadius: 10,
              maxHeight: 280,
              overflowY: 'auto',
              zIndex: 50,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}
          >
            {searchResults.length === 0 ? (
              <p style={{ padding: '10px 14px', color: C.text3, fontSize: 12.5 }}>Keine Ergebnisse</p>
            ) : (
              searchResults.map((r, i) => {
                const t = r.text;
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
                      gap: 3,
                      width: '100%',
                      padding: '9px 14px',
                      background: 'none',
                      border: 'none',
                      borderBottom: `1px solid ${C.border}`,
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.06)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <p
                      style={{
                        fontSize: 13,
                        color: C.text1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        margin: 0,
                      }}
                    >
                      {preview || t.label || t.section}
                    </p>
                    <p
                      style={{
                        fontSize: 10.5,
                        color: C.text3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        margin: 0,
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

      {/* Sidebar + editor */}
      <div style={{ display: 'flex', gap: 18, flex: 1, minHeight: 500 }}>
        <div
          style={{
            width: 240,
            flexShrink: 0,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: '12px 8px',
            overflowY: 'auto',
            maxHeight: '70vh',
          }}
        >
          <p
            style={{
              padding: '4px 10px',
              fontSize: 10.5,
              fontWeight: 600,
              color: C.text3,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 6,
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
                  gap: 7,
                  width: '100%',
                  padding: '6px 10px',
                  background: 'none',
                  border: 'none',
                  color: C.text2,
                  fontSize: 12.5,
                  fontWeight: 500,
                  cursor: 'pointer',
                  borderRadius: 6,
                  fontFamily: 'inherit',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <ChevronDown
                  size={11}
                  style={{
                    color: C.text3,
                    transform: expandedPages.has(page) ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform 0.15s',
                    flexShrink: 0,
                  }}
                />
                {expandedPages.has(page) ? (
                  <FolderOpen size={14} style={{ color: C.accent, flexShrink: 0 }} />
                ) : (
                  <Folder size={14} style={{ color: C.text3, flexShrink: 0 }} />
                )}
                <span style={{ textTransform: 'capitalize' }}>{page}</span>
              </button>
              {expandedPages.has(page) && (
                <div
                  style={{
                    position: 'relative',
                    marginLeft: 10,
                    paddingLeft: 12,
                    borderLeft: `1px solid ${C.border}`,
                  }}
                >
                  {texts
                    .filter((t) => t.page === page)
                    .map((t) => {
                      const active = selected?.id === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => handleSelect(t)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            width: '100%',
                            textAlign: 'left',
                            padding: '6px 8px',
                            background: active ? 'rgba(99,102,241,0.12)' : 'none',
                            border: 'none',
                            color: active ? C.accentBright : C.text2,
                            fontSize: 12,
                            cursor: 'pointer',
                            borderRadius: 6,
                            fontFamily: 'inherit',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                          }}
                          onMouseLeave={(e) => {
                            if (!active) e.currentTarget.style.background = 'none';
                          }}
                        >
                          <File size={11} style={{ color: active ? C.accent : C.text3, flexShrink: 0 }} />
                          {t.label || t.section}
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Editor */}
        <div
          style={{
            flex: 1,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 24,
            overflowY: 'auto',
            maxHeight: '70vh',
          }}
        >
          {selected ? (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 20,
                }}
              >
                <div>
                  <h3 style={{ fontWeight: 600, fontSize: 14, color: C.text1, margin: 0 }}>
                    {selected.label || selected.section}
                  </h3>
                  <p style={{ fontSize: 11, color: C.text3, margin: '3px 0 0' }}>
                    {selected.page} / {selected.section} — {selected.type}
                  </p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={saveOk ? '' : 'w-primary'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: saveOk ? '1px solid rgba(52,211,153,0.4)' : 'none',
                    background: saveOk ? 'rgba(52,211,153,0.12)' : 'linear-gradient(135deg, #6366F1, #818CF8)',
                    color: saveOk ? C.success : '#fff',
                    fontWeight: 500,
                    fontSize: 12,
                    cursor: saving ? 'wait' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                    fontFamily: 'inherit',
                    boxShadow: saveOk
                      ? 'none'
                      : '0 2px 16px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                    transition: 'all 0.2s ease',
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
                color: C.text3,
                fontSize: 13,
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

// ─── SKELETON ────────────────────────────────────────────────────────────────

function WebsiteTextsSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 500 }}>
      <SkeletonBox height={38} width={480} radius={10} />

      <div style={{ display: 'flex', gap: 18, flex: 1, minHeight: 500 }}>
        <div
          style={{
            width: 240,
            flexShrink: 0,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: '12px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <SkeletonBox height={10} width={50} delay={0} style={{ margin: '4px 10px 8px' }} />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px' }}>
              <SkeletonBox height={11} width={11} radius={3} delay={i * 50} />
              <SkeletonBox height={12} width={`${60 + ((i * 13) % 30)}%`} delay={i * 50} />
            </div>
          ))}
        </div>

        <div
          style={{
            flex: 1,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          <SkeletonBox height={18} width="40%" delay={120} />
          <SkeletonBox height={1} width="100%" radius={0} delay={120} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SkeletonBox height={10} width={90} delay={140 + i * 70} />
              <SkeletonBox height={i % 2 === 0 ? 40 : 80} width="100%" radius={10} delay={140 + i * 70} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
