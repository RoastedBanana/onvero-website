'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { calcReadTime } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  Home, Globe, GitBranch, Calendar, Headphones, Users, BarChart2,
  BookOpen, Settings, LogOut, ChevronRight, Search,
  FileText, PenLine, Sparkles,
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { LeadsPage } from '@/components/dashboard/LeadsPage';

function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
import { OnveroLogo } from '@/components/ui/onvero-logo';
import { Confetti } from '@/components/ui/confetti';
import { GlassBlogCard } from '@/components/ui/glass-blog-card';
import UniqueLoading from '@/components/ui/grid-loading';
import { BusinessAIChat } from '@/components/ui/business-ai-chat';

// ── Types ────────────────────────────────────────────────────────────────────

interface UserInfo { firstName: string; lastName: string; email: string; }
interface BlogPost {
  id: number; documentId: string; title: string; content: string;
  tags: string; author: string; imageUrl: string | null; imageId: string | null; createdAt: string;
}
type Mode = 'create' | 'update';
type SubmitState = 'idle' | 'loading' | 'success';
type Page = 'home' | 'website' | 'workflows' | 'meetings' | 'support' | 'leads' | 'analytics' | 'business-ai';

const N8N_WEBHOOK = '/api/n8n';
const POSTS_PER_PAGE = 15;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchUser(): Promise<UserInfo | null> {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    return data.user ?? null;
  } catch { return null; }
}

function getImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // Fix: n8n sometimes doubles the bucket name in the path
  let fixed = url.replace(
    '/storage/v1/object/public/blogpost-images/blogpost-images/',
    '/storage/v1/object/public/blogpost-images/'
  );
  // Fix: incomplete URL with no filename
  if (fixed.endsWith('/blogpost-images/')) return null;
  try { return encodeURI(decodeURI(fixed)); } catch { return fixed; }
}

// ── Styles ────────────────────────────────────────────────────────────────────

const field: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
  color: '#fff', fontSize: '0.875rem', padding: '0.65rem 0.9rem',
  outline: 'none', transition: 'border-color 0.2s', resize: 'vertical' as const,
};
const lbl: React.CSSProperties = {
  display: 'block', color: 'rgba(255,255,255,0.4)',
  fontSize: '0.72rem', marginBottom: '0.3rem', fontWeight: 500, letterSpacing: '0.04em',
  textTransform: 'uppercase' as const,
};

// ── TagInput ──────────────────────────────────────────────────────────────────

function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = () => { const v = input.trim(); if (v && !tags.includes(v)) onChange([...tags, v]); setInput(''); };
  return (
    <div>
      <label style={lbl}>Tags</label>
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
          {tags.map(t => (
            <span key={t} style={{ display:'inline-flex', alignItems:'center', gap:'0.3rem', background:'rgba(255,255,255,0.08)', borderRadius:6, padding:'0.2rem 0.6rem', fontSize:'0.78rem', color:'rgba(255,255,255,0.8)' }}>
              {t}
              <button type="button" onClick={() => onChange(tags.filter(x => x !== t))} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:'0.85rem', lineHeight:1, padding:0 }}>×</button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display:'flex', gap:'0.5rem' }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key==='Enter'){e.preventDefault();add();}}} placeholder="Tag hinzufügen…" style={field} />
        <button type="button" onClick={add} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.7)', borderRadius:8, padding:'0 0.9rem', cursor:'pointer', fontSize:'0.85rem', whiteSpace:'nowrap' }}>+</button>
      </div>
    </div>
  );
}

// ── ImageUpload ───────────────────────────────────────────────────────────────

function ImageUpload({ file, previewUrl, onFile, onRemove }: { file: File|null; previewUrl: string|null; onFile:(f:File)=>void; onRemove:()=>void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.type.startsWith('image/') || /\.(jpg|jpeg|png)$/i.test(f.name))) onFile(f);
  };
  const preview = file ? URL.createObjectURL(file) : previewUrl;
  return (
    <div>
      <label style={lbl}>Bild</label>
      {preview ? (
        <div style={{ position:'relative', display:'inline-block' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Vorschau" style={{ maxWidth:260, maxHeight:180, borderRadius:8, display:'block', objectFit:'cover' }} />
          <button type="button" onClick={onRemove} style={{ position:'absolute', top:6, right:6, background:'rgba(0,0,0,0.75)', border:'none', color:'#fff', borderRadius:'50%', width:24, height:24, cursor:'pointer', fontSize:'0.9rem', lineHeight:'24px', textAlign:'center' }}>×</button>
        </div>
      ) : (
        <div
          onDragOver={e=>{e.preventDefault();setDragging(true);}}
          onDragLeave={()=>setDragging(false)}
          onDrop={handleDrop}
          onClick={()=>inputRef.current?.click()}
          style={{ border:`1.5px dashed ${dragging?'rgba(255,255,255,0.35)':'rgba(255,255,255,0.12)'}`, borderRadius:8, padding:'1.75rem', textAlign:'center', cursor:'pointer', color:'rgba(255,255,255,0.35)', fontSize:'0.82rem', transition:'border-color 0.2s' }}
        >
          <div style={{ fontSize:'1.5rem', marginBottom:'0.4rem', opacity:0.5 }}>↑</div>
          Drag & Drop oder <span style={{ color:'rgba(255,255,255,0.65)', textDecoration:'underline' }}>auswählen</span>
          <div style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.2)', marginTop:'0.25rem' }}>JPG, JPEG, PNG</div>
        </div>
      )}
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png" onChange={e=>{const f=e.target.files?.[0];if(f)onFile(f);}} style={{display:'none'}} />
    </div>
  );
}

// ── SubmitButton ──────────────────────────────────────────────────────────────

function SubmitButton({ state, label }: { state: SubmitState; label: string }) {
  return (
    <button
      type="submit"
      disabled={state==='loading'||state==='success'}
      style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', marginTop:'0.25rem', width:'100%', background: state==='success'?'rgba(74,222,128,0.15)':'rgba(255,255,255,0.95)', color: state==='success'?'#4ade80':'#0a0a0a', fontWeight:600, fontSize:'0.88rem', border: state==='success'?'1px solid rgba(74,222,128,0.4)':'none', borderRadius:8, padding:'0.75rem', cursor: state==='loading'||state==='success'?'default':'pointer', opacity:state==='loading'?0.7:1, transition:'all 0.3s' }}
    >
      {state==='loading' && <UniqueLoading size="sm" className="opacity-60" />}
      {state==='success' ? '✓ Gespeichert' : state==='loading' ? 'Wird gespeichert…' : label}
    </button>
  );
}

// ── PostCard ──────────────────────────────────────────────────────────────────

function PostCard({ post, selected, onClick }: { post: BlogPost; selected: boolean; onClick: ()=>void }) {
  const tags = post.tags ? post.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  const excerpt = post.content ? post.content.replace(/<[^>]*>/g, '').slice(0, 100) + '…' : '';
  const date = post.createdAt ? new Date(post.createdAt).toLocaleDateString('de-DE', { day:'2-digit', month:'long', year:'numeric' }) : '';
  const readTime = calcReadTime(post.content);

  return (
    <div
      onClick={onClick}
      style={{ cursor: 'pointer', position: 'relative', transition: 'transform 0.15s', transform: selected ? 'scale(0.97)' : 'scale(1)' }}
    >
      {/* Selected ring overlay */}
      {selected && (
        <div style={{ position:'absolute', inset:-2, borderRadius:18, border:'2px solid rgba(255,255,255,0.6)', zIndex:10, pointerEvents:'none', boxShadow:'0 0 0 4px rgba(255,255,255,0.08)' }} />
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

function PostGrid({ posts, selected, onSelect }: { posts: BlogPost[]; selected: BlogPost|null; onSelect:(p:BlogPost)=>void }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const filtered = posts.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.author.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE));
  const visible = filtered.slice((page-1)*POSTS_PER_PAGE, page*POSTS_PER_PAGE);
  return (
    <div>
      <div style={{ position:'relative', marginBottom:'1.25rem' }}>
        <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.25)' }} />
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Suchen…" style={{ ...field, paddingLeft:'2rem' }} />
      </div>
      {visible.length===0 ? (
        <p style={{ color:'rgba(255,255,255,0.25)', textAlign:'center', padding:'2rem 0', fontSize:'0.85rem' }}>Keine Einträge gefunden.</p>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1.1rem' }}>
          {visible.map(p=><PostCard key={p.documentId} post={p} selected={selected?.documentId===p.documentId} onClick={()=>onSelect(p)}/>)}
        </div>
      )}
      {totalPages>1 && (
        <div style={{ display:'flex', gap:'0.35rem', justifyContent:'center', marginTop:'1.25rem', flexWrap:'wrap' }}>
          {Array.from({length:totalPages},(_,i)=>i+1).map(n=>(
            <button key={n} onClick={()=>setPage(n)} style={{ width:32,height:32,borderRadius:6,border:n===page?'1px solid rgba(255,255,255,0.5)':'1px solid rgba(255,255,255,0.1)',background:n===page?'rgba(255,255,255,0.08)':'transparent',color:n===page?'#fff':'rgba(255,255,255,0.35)',fontSize:'0.8rem',cursor:'pointer' }}>{n}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── BlogFormValues ────────────────────────────────────────────────────────────

interface BlogFormValues {
  title: string; content: string; tags: string[];
  author: string; imageFile: File|null; existingImageUrl: string|null; imageRemoved: boolean;
}

// ── BlogForm ──────────────────────────────────────────────────────────────────

function BlogForm({ initial, onSubmit, submitLabel, submitState }: { initial: BlogFormValues; onSubmit:(v:BlogFormValues)=>void; submitLabel:string; submitState:SubmitState }) {
  const [form, setForm] = useState<BlogFormValues>(initial);
  useEffect(()=>{setForm(initial);},[initial]);
  const set = <K extends keyof BlogFormValues>(k:K,v:BlogFormValues[K]) => setForm(f=>({...f,[k]:v}));
  const handleSubmit = (e:React.FormEvent) => { e.preventDefault(); if(!form.title.trim()||!form.content.trim()||!form.author.trim())return; onSubmit(form); };
  return (
    <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.1rem' }}>
      <div><label style={lbl}>Titel</label><input type="text" value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Titel des Blogposts" required style={field} onFocus={e=>(e.currentTarget.style.borderColor='rgba(255,255,255,0.25)')} onBlur={e=>(e.currentTarget.style.borderColor='rgba(255,255,255,0.08)')} /></div>
      <div><label style={lbl}>Inhalt</label><textarea value={form.content} onChange={e=>set('content',e.target.value)} placeholder="Inhalt des Blogposts…" required rows={9} style={field} onFocus={e=>(e.currentTarget.style.borderColor='rgba(255,255,255,0.25)')} onBlur={e=>(e.currentTarget.style.borderColor='rgba(255,255,255,0.08)')} /></div>
      <TagInput tags={form.tags} onChange={v=>set('tags',v)} />
      <div><label style={lbl}>Autor</label><input type="text" value={form.author} onChange={e=>set('author',e.target.value)} required style={field} onFocus={e=>(e.currentTarget.style.borderColor='rgba(255,255,255,0.25)')} onBlur={e=>(e.currentTarget.style.borderColor='rgba(255,255,255,0.08)')} /></div>
      <ImageUpload file={form.imageFile} previewUrl={form.existingImageUrl} onFile={f=>set('imageFile',f)} onRemove={()=>{set('imageFile',null);set('existingImageUrl',null);set('imageRemoved',true);}} />
      <SubmitButton state={submitState} label={submitLabel} />
    </form>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', textAlign:'center', gap:'0.75rem' }}>
      <div style={{ width:52, height:52, borderRadius:14, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'0.5rem' }}>
        <div style={{ width:20, height:20, borderRadius:4, background:'rgba(255,255,255,0.12)' }} />
      </div>
      <h2 style={{ fontWeight:600, fontSize:'1.05rem', color:'#fff' }}>{title}</h2>
      <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.85rem', maxWidth:320 }}>{description}</p>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

const NAV = [
  { id:'home' as Page,       icon: Home,         label:'Home'              },
  { id:'website' as Page,    icon: Globe,        label:'Website'           },
  { id:'workflows' as Page,  icon: GitBranch,    label:'Workflows'         },
  { id:'meetings' as Page,   icon: Calendar,     label:'Meetings'          },
  { id:'support' as Page,    icon: Headphones,   label:'Customer Support'  },
  { id:'leads' as Page,      icon: Users,        label:'Leads'             },
  { id:'analytics' as Page,  icon: BarChart2,    label:'Analytics'         },
  { id:'business-ai' as Page, icon: Sparkles,   label:'Business AI'       },
];

const NAV_BOTTOM = [
  { id:'docs',     icon: BookOpen,  label:'Dokumentation' },
  { id:'settings', icon: Settings,  label:'Einstellungen'  },
];

function Sidebar({ active, onNav, user, onLogout }: { active: Page; onNav:(p:Page)=>void; user: UserInfo|null; onLogout:()=>void }) {
  const [search, setSearch] = useState('');
  return (
    <aside style={{ width:190, flexShrink:0, height:'100vh', position:'sticky', top:0, background:'#0a0a0a', borderRight:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', padding:'0', overflow:'hidden' }}>
      {/* Logo */}
      <div style={{ padding:'1.1rem 1.1rem 0.9rem', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.5rem' }}>
          <OnveroLogo className="h-9 w-auto" />
          <div style={{ height:1, width:'100%', background:'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize:'0.75rem', fontWeight:500, color:'rgba(255,255,255,0.4)', letterSpacing:'0.02em' }}>
            BusinessOS
          </span>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding:'0.85rem 0.9rem 0.5rem' }}>
        <div style={{ position:'relative' }}>
          <Search size={13} style={{ position:'absolute', left:'0.65rem', top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.25)', pointerEvents:'none' }} />
          <input
            value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Suchen…"
            style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:7, color:'rgba(255,255,255,0.6)', fontSize:'0.8rem', padding:'0.45rem 0.6rem 0.45rem 2rem', outline:'none' }}
          />
          <span style={{ position:'absolute', right:'0.6rem', top:'50%', transform:'translateY(-50%)', fontSize:'0.65rem', color:'rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.06)', borderRadius:4, padding:'0.1rem 0.35rem', fontFamily:'monospace' }}>/</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'0.25rem 0.7rem', overflowY:'auto', display:'flex', flexDirection:'column', gap:'1px' }}>
        {NAV.map(item => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={()=>onNav(item.id)}
              style={{ display:'flex', alignItems:'center', gap:'0.65rem', width:'100%', padding:'0.55rem 0.75rem', borderRadius:7, border:'none', background: isActive?'rgba(255,255,255,0.08)':'transparent', color: isActive?'#fff':'rgba(255,255,255,0.45)', fontSize:'0.85rem', fontWeight: isActive?500:400, cursor:'pointer', transition:'all 0.15s', textAlign:'left' }}
              onMouseEnter={e=>{if(!isActive)(e.currentTarget.style.background='rgba(255,255,255,0.04)');(e.currentTarget.style.color='rgba(255,255,255,0.8)');}}
              onMouseLeave={e=>{if(!isActive){e.currentTarget.style.background='transparent';e.currentTarget.style.color='rgba(255,255,255,0.45)';}}}
            >
              <Icon size={15} strokeWidth={1.8} style={{ flexShrink:0 }} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div style={{ padding:'0.5rem 0.7rem', borderTop:'1px solid rgba(255,255,255,0.05)', display:'flex', flexDirection:'column', gap:'1px' }}>
        {NAV_BOTTOM.map(item => {
          const Icon = item.icon;
          return (
            <button key={item.id} style={{ display:'flex', alignItems:'center', gap:'0.65rem', width:'100%', padding:'0.5rem 0.75rem', borderRadius:7, border:'none', background:'transparent', color:'rgba(255,255,255,0.4)', fontSize:'0.82rem', cursor:'pointer', transition:'all 0.15s', textAlign:'left' }}
              onMouseEnter={e=>{e.currentTarget.style.color='rgba(255,255,255,0.8)';e.currentTarget.style.background='rgba(255,255,255,0.04)';}}
              onMouseLeave={e=>{e.currentTarget.style.color='rgba(255,255,255,0.4)';e.currentTarget.style.background='transparent';}}>
              <Icon size={14} strokeWidth={1.8} style={{ flexShrink:0 }} />
              {item.label}
            </button>
          );
        })}

        {/* User */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.6rem 0.75rem', marginTop:'0.25rem', borderRadius:8, background:'rgba(255,255,255,0.03)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.55rem', minWidth:0 }}>
            <div style={{ width:26, height:26, borderRadius:'50%', background:'rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'0.75rem', fontWeight:600, color:'rgba(255,255,255,0.7)' }}>
              {user?.firstName?.[0] ?? '?'}
            </div>
            <span style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.5)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user?.firstName} {user?.lastName}
            </span>
          </div>
          <button onClick={onLogout} title="Abmelden" style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.25)', padding:'0.2rem', borderRadius:5, display:'flex', flexShrink:0, transition:'color 0.15s' }}
            onMouseEnter={e=>(e.currentTarget.style.color='rgba(255,255,255,0.7)')}
            onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.25)')}>
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ── Website Page ──────────────────────────────────────────────────────────────

function WebsitePage({ user }: { user: UserInfo|null }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('create');
  const [createState, setCreateState] = useState<SubmitState>('idle');
  const [createConfetti, setCreateConfetti] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string|null>(null);
  const [selectedPost, setSelectedPost] = useState<BlogPost|null>(null);
  const [gridOpen, setGridOpen] = useState(true);
  const [updateState, setUpdateState] = useState<SubmitState>('idle');
  const [updateConfetti, setUpdateConfetti] = useState(false);

  const defaultAuthor = user ? `${user.firstName} ${user.lastName}`.trim() : '';
  const emptyForm: BlogFormValues = { title:'', content:'', tags:[], author:defaultAuthor, imageFile:null, existingImageUrl:null, imageRemoved:false };

  const postToForm = useCallback((p: BlogPost): BlogFormValues => ({
    title:p.title||'', content:p.content||'',
    tags:p.tags?p.tags.split(',').map(t=>t.trim()).filter(Boolean):[],
    author:p.author||defaultAuthor, imageFile:null,
    existingImageUrl:getImageUrl(p.imageUrl), imageRemoved:false,
  }), [defaultAuthor]);

  useEffect(() => {
    if (mode !== 'update') return;
    setPostsLoading(true);
    setPostsError(null);
    fetch('/api/posts')
      .then(async r => {
        const body = await r.json();
        console.log('[posts] status:', r.status, 'body:', JSON.stringify(body).slice(0, 500));
        if (r.status === 401) { router.push('/login'); throw new Error('unauthorized'); }
        if (!r.ok) throw new Error(`Fehler ${r.status}`);
        return body;
      })
      .then(data => {
        const items: BlogPost[] = (Array.isArray(data) ? data : []).map((item: { id:number;document_id:string;title?:string;content?:string;tags?:string;writer?:string;cover_image_url?:string|null;cover_image_id?:string|null;created_at?:string }) => ({
          id:item.id, documentId:item.document_id, title:item.title??'',
          content:item.content??'', tags:item.tags??'',
          author:item.writer??'', imageUrl:item.cover_image_url??null, imageId:item.cover_image_id??null, createdAt:item.created_at??'',
        }));
        setPosts(items);
      })
      .catch(err => { if (err.message !== 'unauthorized') setPostsError('Artikel konnten nicht geladen werden.'); })
      .finally(() => setPostsLoading(false));
  }, [mode, router]);

  const handleSelectPost = async (post: BlogPost) => {
    try {
      const res = await fetch(`/api/posts/${post.documentId}`);
      const full = await res.json();
      setSelectedPost({ id:full.id, documentId:full.document_id??post.documentId, title:full.title??'', content:full.content??'', tags:full.tags??'', author:full.writer??'', imageUrl:full.cover_image_url??null, imageId:full.cover_image_id??null, createdAt:full.created_at??'' });
    } catch { setSelectedPost(post); }
    setGridOpen(false);
  };

  const handleCreate = async (form: BlogFormValues) => {
    setCreateState('loading');
    try {
      const fd = new FormData();
      fd.append('action', 'create');
      fd.append('title', form.title.trim()); fd.append('content', form.content.trim());
      fd.append('tags', form.tags.join(',')); fd.append('author', form.author.trim());
      if (form.imageFile) fd.append('image', form.imageFile);
      const res = await fetch(N8N_WEBHOOK, { method:'POST', body:fd });
      if (!res.ok) throw new Error();
      setCreateState('success'); setCreateConfetti(true);
      setTimeout(()=>setCreateConfetti(false), 5000);
    } catch { setCreateState('idle'); alert('Fehler beim Erstellen des Blogposts.'); }
  };

  const handleUpdate = async (form: BlogFormValues) => {
    if (!selectedPost) return;
    setUpdateState('loading');
    try {
      const fd = new FormData();
      fd.append('action','update'); fd.append('documentId',selectedPost.documentId);
      fd.append('id',String(selectedPost.id)); fd.append('imageId',selectedPost.imageId??'');
      fd.append('title',form.title.trim()); fd.append('content',form.content.trim());
      fd.append('tags',form.tags.join(',')); fd.append('author',form.author.trim());
      if (form.imageFile) fd.append('image',form.imageFile);
      const res = await fetch(N8N_WEBHOOK, { method:'POST', body:fd });
      if (!res.ok) throw new Error();
      setUpdateState('success'); setUpdateConfetti(true);
      setTimeout(()=>setUpdateConfetti(false), 5000);
    } catch { setUpdateState('idle'); alert('Fehler beim Aktualisieren.'); }
  };

  return (
    <>
      <Confetti active={createConfetti} />
      <Confetti active={updateConfetti} />

      <div style={{ marginBottom:'2rem' }}>
        <h1 style={{ fontWeight:600, fontSize:'1.35rem', color:'#fff', marginBottom:'0.2rem' }}>Website</h1>
        <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.85rem' }}>Blogposts erstellen und verwalten</p>
      </div>

      {/* Mode tabs */}
      <div style={{ display:'flex', gap:'0.2rem', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:9, padding:'0.25rem', width:'fit-content', marginBottom:'2rem' }}>
        {([['create','Erstellen',PenLine],['update','Verwalten',FileText]] as const).map(([m,label,Icon])=>(
          <button key={m} onClick={()=>{setMode(m as Mode);setCreateState('idle');setUpdateState('idle');}} style={{ display:'flex', alignItems:'center', gap:'0.4rem', padding:'0.45rem 1rem', borderRadius:7, border:'none', background:mode===m?'rgba(255,255,255,0.09)':'transparent', color:mode===m?'#fff':'rgba(255,255,255,0.4)', fontSize:'0.83rem', fontWeight:mode===m?500:400, cursor:'pointer', transition:'all 0.2s' }}>
            <Icon size={13} strokeWidth={2} />{label}
          </button>
        ))}
      </div>

      {mode === 'create' && (
        <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'1.75rem', maxWidth:720 }}>
          <h2 style={{ fontWeight:600, fontSize:'0.95rem', marginBottom:'1.5rem', color:'rgba(255,255,255,0.85)' }}>Neuen Blogpost erstellen</h2>
          <BlogForm initial={emptyForm} onSubmit={handleCreate} submitLabel="Erstellen" submitState={createState} />
        </div>
      )}

      {mode === 'update' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          {gridOpen ? (
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'1.75rem' }}>
              <h2 style={{ fontWeight:600, fontSize:'0.95rem', marginBottom:'1.25rem', color:'rgba(255,255,255,0.85)' }}>Blogpost auswählen</h2>
              {postsLoading ? (
                <div style={{ display:'flex', justifyContent:'center', padding:'2.5rem' }}>
                  <UniqueLoading size="lg" />
                </div>
              ) : postsError ? (
                <p style={{ color:'rgba(255,80,80,0.8)', fontSize:'0.85rem', padding:'1rem 0' }}>{postsError}</p>
              ) : <PostGrid posts={posts} selected={selectedPost} onSelect={handleSelectPost} />}
            </div>
          ) : (
            <button type="button" onClick={()=>setGridOpen(true)} style={{ alignSelf:'flex-start', display:'flex', alignItems:'center', gap:'0.4rem', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)', fontSize:'0.82rem', borderRadius:7, padding:'0.45rem 0.9rem', cursor:'pointer', transition:'color 0.2s' }}
              onMouseEnter={e=>(e.currentTarget.style.color='#fff')} onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.6)')}>
              <ChevronRight size={13} style={{transform:'rotate(180deg)'}} /> Anderen Eintrag wählen
            </button>
          )}
          {selectedPost && (
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'1.75rem', maxWidth:720 }}>
              <h2 style={{ fontWeight:600, fontSize:'0.95rem', marginBottom:'0.2rem', color:'rgba(255,255,255,0.85)' }}>Blogpost bearbeiten</h2>
              <p style={{ color:'rgba(255,255,255,0.25)', fontSize:'0.78rem', marginBottom:'1.5rem' }}>{selectedPost.title}</p>
              <BlogForm initial={postToForm(selectedPost)} onSubmit={handleUpdate} submitLabel="Speichern" submitState={updateState} />
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ── Dashboard Page ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  useEffect(() => { fetchUser().then(setUser); }, []);
  const [activePage, setActivePage] = useState<Page>('home');

  // Prevent browser file-drop navigation
  useEffect(() => {
    const prevent = (e: DragEvent) => e.preventDefault();
    document.addEventListener('dragover', prevent);
    document.addEventListener('drop', prevent);
    return () => { document.removeEventListener('dragover', prevent); document.removeEventListener('drop', prevent); };
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/');
  };

  const renderContent = () => {
    switch (activePage) {
      case 'home':       return <EmptyState title="Home" description="Hier entsteht deine Übersicht mit den wichtigsten Kennzahlen und Aktivitäten." />;
      case 'website':    return <WebsitePage user={user} />;
      case 'workflows':  return <EmptyState title="Workflows" description="Automatisiere deine Prozesse und verbinde deine Tools." />;
      case 'meetings':   return <EmptyState title="Meetings" description="Plane und verwalte deine Termine an einem Ort." />;
      case 'support':    return <EmptyState title="Customer Support" description="Bearbeite Anfragen und halte deinen Kunden-Support im Blick." />;
      case 'leads':      return <LeadsPage />;
      case 'analytics':  return <EmptyState title="Analytics" description="Analysiere deine Performance mit detaillierten Auswertungen." />;
      case 'business-ai':  return <BusinessAIChat />;
    }
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh', backgroundColor:'#000', color:'#fff' }}>
      <style>{`* { box-sizing: border-box; } @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } } .lead-row:hover .row-trash { opacity: 1 !important; color: #666 !important; } .lead-row:hover .row-trash:hover { color: #f87171 !important; }`}</style>

      <Sidebar active={activePage} onNav={setActivePage} user={user} onLogout={handleLogout} />

      <main style={{ flex:1, overflowY:'auto', padding: activePage === 'business-ai' ? '0' : '2.5rem 2.75rem' }}>
        {renderContent()}
      </main>
    </div>
  );
}
