'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { calcReadTime } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  Home, Globe, GitBranch, Calendar, Headphones, Users, BarChart2,
  BookOpen, Settings, LogOut, ChevronRight, Search,
  FileText, PenLine, Zap,
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useTenant } from '@/hooks/useTenant';

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

// ── Types ────────────────────────────────────────────────────────────────────

interface UserInfo { firstName: string; lastName: string; email: string; }
interface BlogPost {
  id: number; documentId: string; title: string; content: string;
  tags: string; author: string; imageUrl: string | null; imageId: string | null; createdAt: string;
}
type Mode = 'create' | 'update';
type SubmitState = 'idle' | 'loading' | 'success';
type Page = 'home' | 'website' | 'workflows' | 'meetings' | 'support' | 'leads' | 'analytics';

const N8N_WEBHOOK = '/api/n8n';
const POSTS_PER_PAGE = 15;

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseCookieUser(): UserInfo | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/onvero_user=([^;]+)/);
  if (!match) return null;
  try { return JSON.parse(decodeURIComponent(match[1])); } catch { return null; }
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

// ── Leads Page ────────────────────────────────────────────────────────────────


// ── Dummy Data ───────────────────────────────────────────────────────────────

const DUMMY_CF = {
  company_type: 'B2B', industry: 'Design', company_size: 'Micro <10',
  budget_estimate: '8.000 EUR', annual_revenue: '—', employee_count: 5,
  lead_quality: 'durchschnittlich', linkedin_url: 'https://linkedin.com/in/anna-weber',
  score_breakdown: { kontakt_vertrauen: 26, kaufbereitschaft: 27, unternehmensfit: 9, abzuege: -19 },
  strengths: ['Budget von 8.000 EUR genannt', 'Firmen-E-Mail vorhanden', 'Gültige Telefonnummer'],
  concerns: ['Website nicht erreichbar', 'Nachricht nur 9 Wörter'],
  red_flags: [] as string[],
  is_company_email: true, has_valid_phone: true, website_loaded: false,
  message_quality: 'minimal', source_quality: 'mittel (Website-Besucher)',
  normalized_phone: '+49 30 9876543', contact_in_hours: 4,
  is_free_email: false, is_disposable_email: false, website_matches_email: false,
};

const DUMMY_ACTIVITIES = [
  { id: '1', type: 'task', title: '🔥 HOT LEAD — Sofort anrufen!', content: 'Website manuell prüfen, dann Telefonat führen um Projektdetails und Unternehmen zu validieren.', created_at: '2026-03-28T16:41:00Z', is_pinned: true, user_id: null },
  { id: '2', type: 'ai_analysis', title: 'KI-Scoring abgeschlossen', content: 'Score: 44/100. Website nicht erreichbar macht Unternehmensvalidierung unmöglich. Sehr kurze Nachricht deutet auf wenig Engagement hin.', created_at: '2026-03-28T16:41:00Z', is_pinned: false, user_id: null },
  { id: '3', type: 'form_submit', title: 'Lead via Website eingegangen', content: 'Wir suchen KI-Automatisierung für unser CRM. Budget 8.000 EUR.', created_at: '2026-03-28T16:20:00Z', is_pinned: false, user_id: null },
];

interface Lead {
  id: string;
  company_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  city: string | null;
  status: string;
  score: number | null;
  source: string | null;
  estimated_value: number | null;
  ai_summary: string | null;
  ai_tags: string[] | null;
  ai_next_action: string | null;
  notes: string | null;
  custom_fields: Record<string, unknown> | null;
  created_at: string;
  activity_count?: number;
}

interface LeadActivity {
  id: string;
  type: string;
  title: string | null;
  content: string | null;
  metadata?: Record<string, unknown> | null;
  is_pinned: boolean;
  created_at: string;
  user_id: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Neu', contacted: 'Kontaktiert', qualified: 'Qualifiziert',
  proposal: 'Angebot', won: 'Gewonnen', lost: 'Verloren', archived: 'Archiviert',
};
const STATUS_BG: Record<string, string> = {
  new: 'rgba(107,122,255,0.15)', contacted: 'rgba(59,130,246,0.15)',
  qualified: 'rgba(255,215,0,0.12)', proposal: 'rgba(255,107,53,0.15)',
  won: 'rgba(34,197,94,0.12)', lost: 'rgba(239,68,68,0.12)', archived: 'rgba(100,116,139,0.12)',
};
const STATUS_FG: Record<string, string> = {
  new: '#6B7AFF', contacted: '#60a5fa', qualified: '#FFD700',
  proposal: '#FF6B35', won: '#22c55e', lost: '#ef4444', archived: '#888',
};

function getScoreLabel(s: number | null) {
  if (s === null || s === undefined) return 'COLD';
  if (s >= 75) return 'HOT'; if (s >= 45) return 'WARM'; return 'COLD';
}
function getScoreColor(s: number | null) {
  if (s === null || s === undefined) return { bg: 'rgba(107,122,255,0.15)', fg: '#6B7AFF' };
  if (s >= 75) return { bg: 'rgba(255,107,53,0.15)', fg: '#FF6B35' };
  if (s >= 45) return { bg: 'rgba(255,215,0,0.12)', fg: '#FFD700' };
  return { bg: 'rgba(107,122,255,0.15)', fg: '#6B7AFF' };
}

const LEAD_QUALITY_STYLE: Record<string, { bg: string; fg: string }> = {
  premium:          { bg: 'rgba(245,158,11,0.15)', fg: '#f59e0b' },
  gut:              { bg: 'rgba(34,197,94,0.12)',   fg: '#22c55e' },
  durchschnittlich: { bg: 'rgba(107,114,128,0.15)', fg: '#9ca3af' },
  schwach:          { bg: 'rgba(75,85,99,0.15)',    fg: '#6b7280' },
  spam:             { bg: 'rgba(239,68,68,0.12)',   fg: '#ef4444' },
};
const MSG_QUALITY_COLOR: Record<string, string> = {
  ausführlich: '#22c55e', gut: '#4ade80', minimal: '#FFD700',
  'zu kurz': '#FF6B35', leer: '#666', spam: '#ef4444',
};
const ACTIVITY_ICON: Record<string, string> = {
  note: '📝', email: '📧', call: '📞', meeting: '📅',
  status_change: '🔄', ai_analysis: '🤖', score_update: '📊',
  task: '✅', form_submit: '📨', default: '•',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', background: STATUS_BG[status] ?? 'rgba(100,116,139,0.12)', color: STATUS_FG[status] ?? '#888', borderRadius: 999, padding:'2px 8px', fontSize:'0.7rem', fontWeight:500, whiteSpace:'nowrap' }}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
function ScoreBadge({ score }: { score: number | null }) {
  const { bg, fg } = getScoreColor(score);
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'0.25rem', background:bg, color:fg, borderRadius:999, padding:'2px 8px', fontSize:'0.7rem', fontWeight:700, whiteSpace:'nowrap' }}>
      {score ?? '—'} {getScoreLabel(score)}
    </span>
  );
}
function QualityBadge({ quality }: { quality: string }) {
  const s = LEAD_QUALITY_STYLE[quality.toLowerCase()] ?? { bg:'rgba(107,114,128,0.15)', fg:'#9ca3af' };
  return <span style={{ display:'inline-flex', background:s.bg, color:s.fg, borderRadius:999, padding:'2px 8px', fontSize:'0.68rem', fontWeight:500 }}>{quality}</span>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'gerade eben';
  if (m < 60) return `vor ${m} Min.`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.floor(h / 24);
  if (d < 7) return `vor ${d} Tag${d === 1 ? '' : 'en'}`;
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
}

function copyToClipboard(text: string) {
  navigator.clipboard?.writeText(text).catch(() => {});
}

const ACTIVITY_ICONS: Record<string, string> = {
  note: '✍', email: '✉', call: '📞', meeting: '📅', task: '✓',
  form_submit: '📋', ai_analysis: '✦', status_change: '↻', score_update: '★', default: '·',
};

const QUALITY_COLORS: Record<string, { bg: string; fg: string }> = {
  premium:         { bg: 'rgba(74,222,128,0.15)',  fg: '#4ade80' },
  gut:             { bg: 'rgba(34,197,94,0.12)',   fg: '#86efac' },
  durchschnittlich:{ bg: 'rgba(234,179,8,0.12)',   fg: '#fde047' },
  schwach:         { bg: 'rgba(249,115,22,0.12)',  fg: '#fb923c' },
  spam:            { bg: 'rgba(239,68,68,0.15)',   fg: '#f87171' },
};

const MESSAGE_QUALITY_COLORS: Record<string, { bg: string; fg: string }> = {
  ausführlich: { bg: 'rgba(74,222,128,0.12)',  fg: '#4ade80' },
  gut:         { bg: 'rgba(34,197,94,0.10)',   fg: '#86efac' },
  minimal:     { bg: 'rgba(234,179,8,0.1)',    fg: '#fde047' },
  'zu kurz':   { bg: 'rgba(249,115,22,0.1)',   fg: '#fb923c' },
  leer:        { bg: 'rgba(100,116,139,0.12)', fg: '#94a3b8' },
  spam:        { bg: 'rgba(239,68,68,0.12)',   fg: '#f87171' },
};

const SCORE_MAX: Record<string, number> = {
  kontakt_vertrauen: 30, kaufbereitschaft: 35, unternehmensfit: 25, abzuege: 45,
};

function CollapsibleSection({ label, defaultOpen = true, children }: { label: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%', marginBottom: open ? '0.5rem' : 0 }}
      >
        <span style={{ ...lbl, margin: 0, flex: 1, textAlign: 'left' }}>{label}</span>
        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
      </button>
      {open && children}
    </div>
  );
}

function ActivityItem({ act }: { act: LeadActivity }) {
  const [expanded, setExpanded] = useState(false);
  const icon = ACTIVITY_ICONS[act.type] ?? ACTIVITY_ICONS.default;
  const isLong = (act.content?.length ?? 0) > 120;
  const displayContent = isLong && !expanded ? act.content!.slice(0, 120) + '…' : act.content;

  const iconColor: Record<string, string> = {
    ai_analysis: '#818cf8', email: '#60a5fa', call: '#4ade80', meeting: '#fb923c',
    form_submit: '#a78bfa', status_change: '#fde047', score_update: '#fde047',
  };

  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
      <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.75rem', color: iconColor[act.type] ?? 'rgba(255,255,255,0.3)' }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {act.is_pinned && <span style={{ fontSize: '0.65rem', color: '#fde047', marginBottom: '0.15rem', display: 'block' }}>📌 Angeheftet</span>}
        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500, lineHeight: 1.3 }}>{act.title ?? act.type}</div>
        {displayContent && (
          <div style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem', lineHeight: 1.5 }}>
            {displayContent}
            {isLong && (
              <button type="button" onClick={() => setExpanded(e => !e)} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '0.73rem', cursor: 'pointer', padding: '0 0 0 0.35rem' }}>
                {expanded ? 'weniger' : 'mehr'}
              </button>
            )}
          </div>
        )}
        <div style={{ fontSize: '0.69rem', color: 'rgba(255,255,255,0.2)', marginTop: '0.25rem', display: 'flex', gap: '0.4rem' }}>
          <span>{relativeTime(act.created_at)}</span>
          {act.user_id === null && <span style={{ color: 'rgba(107,122,255,0.7)' }}>· KI</span>}
        </div>
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 4000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', left: '1.5rem', zIndex: 999, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '0.75rem 1.1rem', fontSize: '0.83rem', color: '#ccc', boxShadow: '0 4px 20px rgba(0,0,0,0.6)', maxWidth: 360, animation: 'fadeSlideIn 0.2s ease' }}>
      {msg}
    </div>
  );
}

// ── GeneratorModal helpers ────────────────────────────────────────────────────

function GChipInput({ chips, onChange, placeholder }: { chips: string[]; onChange: (c: string[]) => void; placeholder: string }) {
  const [val, setVal] = useState('');
  const add = () => { const v = val.trim(); if (v && !chips.includes(v)) onChange([...chips, v]); setVal(''); };
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: chips.length ? '0.5rem' : 0 }}>
        {chips.map(c => (
          <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(107,122,255,0.12)', border: '1px solid rgba(107,122,255,0.25)', color: '#c4c8ff', borderRadius: 999, padding: '0.2rem 0.55rem', fontSize: '0.78rem' }}>
            {c}
            <button type="button" onClick={() => onChange(chips.filter(x => x !== c))} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.8rem', lineHeight: 1, padding: 0 }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        <input
          value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          style={{ flex: 1, background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, color: '#ccc', fontSize: '0.8rem', padding: '0.4rem 0.7rem', outline: 'none' }}
        />
        <button type="button" onClick={add} style={{ background: '#1a1a1a', border: '1px solid #333', color: '#888', borderRadius: 6, padding: '0 0.75rem', cursor: 'pointer', fontSize: '0.85rem' }}>+</button>
      </div>
    </div>
  );
}

function GToggle({ on, onChange }: { on: boolean; onChange?: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange?.(!on)} style={{ width: 36, height: 20, borderRadius: 10, background: on ? '#6B7AFF' : '#2a2a2a', border: `1px solid ${on ? '#6B7AFF' : '#333'}`, cursor: onChange ? 'pointer' : 'default', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 2, left: on ? 17 : 2, width: 14, height: 14, borderRadius: 7, background: '#fff', transition: 'left 0.2s' }} />
    </div>
  );
}

function GSectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.65rem' }}>{children}</div>;
}

// ── GeneratorModal ─────────────────────────────────────────────────────────────

const INDUSTRY_LABELS: Record<string, string> = {
  retail: 'Handel', manufacturing: 'Produktion',
  professional_services: 'Beratung/Dienstleistung', real_estate: 'Immobilien', construction: 'Bau/Handwerk',
};
const SENIORITY_KEYS = ['c_suite', 'director', 'manager'] as const;
const DEPT_KEYS = ['operations', 'finance', 'information_technology'] as const;

type ProfileRow = {
  id: string; name: string; industries: string[] | null; employee_min: number | null; employee_max: number | null;
  technologies: string[] | null; job_titles: string[] | null; seniority_levels: string[] | null;
  departments: string[] | null; countries: string[] | null; cities: string[] | null;
  keywords: string[] | null; excluded_domains: string[] | null;
  lead_count: number | null; schedule_enabled: boolean | null; schedule_time: string | null;
  schedule_days: boolean[] | null; only_verified_emails: boolean | null;
};
type GeneratorRow = {
  used_searches: number | null; search_limit: number | null; reset_date: string | null;
  last_run_at: string | null; last_run_leads: number | null; total_leads_generated: number | null;
};

function GeneratorModal({ onClose, onGenerated, tenantId, supabase }: {
  onClose: () => void;
  onGenerated: (count: number) => void;
  tenantId: string | null;
  supabase: ReturnType<typeof createClient>;
}) {
  const [tab, setTab] = useState<'zielgruppe' | 'einstellungen' | 'verlauf'>('zielgruppe');
  const [showBanner, setShowBanner] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [generator, setGenerator] = useState<GeneratorRow | null>(null);
  const [savedLabel, setSavedLabel] = useState('');
  const [generating, setGenerating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form state
  const [branchen, setBranchen] = useState<string[]>([]);
  const [empMin, setEmpMin] = useState(5);
  const [empMax, setEmpMax] = useState(250);
  const [techs, setTechs] = useState<string[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [seniority, setSeniority] = useState({ c_suite: true, director: true, manager: true });
  const [abteilungen, setAbteilungen] = useState({ operations: false, finance: false, information_technology: false });
  const [countries, setCountries] = useState<string[]>(['🇩🇪 Deutschland', '🇦🇹 Österreich', '🇨🇭 Schweiz']);
  const [cities, setCities] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [excludedDomains, setExcludedDomains] = useState<string[]>([]);
  const [domainsOpen, setDomainsOpen] = useState(false);
  const [leadCount, setLeadCount] = useState(25);
  const [scheduleOn, setScheduleOn] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('08:00');
  const [weekdays, setWeekdays] = useState([true, true, true, true, true, false, false]);
  const [onlyVerified, setOnlyVerified] = useState(true);

  // Load data on mount
  useEffect(() => {
    if (!tenantId) { setDataLoading(false); return; }
    (async () => {
      setDataLoading(true);
      const [genRes, profRes] = await Promise.all([
        supabase.from('tenant_lead_generator').select('*').eq('tenant_id', tenantId).single(),
        supabase.from('lead_search_profiles').select('*').eq('tenant_id', tenantId).eq('is_active', true).order('created_at', { ascending: false }).limit(1).single(),
      ]);
      if (genRes.data) setGenerator(genRes.data as GeneratorRow);
      if (profRes.data) {
        const p = profRes.data as ProfileRow;
        setProfile(p);
        setBranchen((p.industries ?? []).map(s => INDUSTRY_LABELS[s] ?? s));
        setEmpMin(p.employee_min ?? 5);
        setEmpMax(p.employee_max ?? 250);
        setTechs(p.technologies ?? []);
        setPositions(p.job_titles ?? []);
        setSeniority({
          c_suite: (p.seniority_levels ?? []).includes('c_suite'),
          director: (p.seniority_levels ?? []).includes('director'),
          manager: (p.seniority_levels ?? []).includes('manager'),
        });
        setAbteilungen({
          operations: (p.departments ?? []).includes('operations'),
          finance: (p.departments ?? []).includes('finance'),
          information_technology: (p.departments ?? []).includes('information_technology'),
        });
        setCountries(p.countries ?? ['🇩🇪 Deutschland', '🇦🇹 Österreich', '🇨🇭 Schweiz']);
        setCities(p.cities ?? []);
        setKeywords(p.keywords ?? []);
        setExcludedDomains(p.excluded_domains ?? []);
        setLeadCount(p.lead_count ?? 25);
        setScheduleOn(p.schedule_enabled ?? false);
        setScheduleTime(p.schedule_time ?? '08:00');
        setWeekdays(p.schedule_days ?? [true, true, true, true, true, false, false]);
        setOnlyVerified(p.only_verified_emails ?? true);
      }
      setDataLoading(false);
    })();
  }, [tenantId, supabase]);

  const buildProfilePayload = () => ({
    industries: branchen.map(l => Object.entries(INDUSTRY_LABELS).find(([, v]) => v === l)?.[0] ?? l),
    employee_min: empMin, employee_max: empMax,
    technologies: techs, job_titles: positions,
    seniority_levels: SENIORITY_KEYS.filter(k => seniority[k]),
    departments: DEPT_KEYS.filter(k => abteilungen[k]),
    countries, cities, keywords, excluded_domains: excludedDomains,
    lead_count: leadCount, schedule_enabled: scheduleOn,
    schedule_time: scheduleTime, schedule_days: weekdays,
    only_verified_emails: onlyVerified,
  });

  const saveProfile = async () => {
    if (!profile?.id) return;
    await supabase.from('lead_search_profiles').update(buildProfilePayload()).eq('id', profile.id);
    setSavedLabel('Gespeichert ✓');
    setTimeout(() => setSavedLabel(''), 2500);
  };

  const triggerDebounce = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(saveProfile, 2000);
  };

  const used = generator?.used_searches ?? 0;
  const limit = generator?.search_limit ?? 1000;
  const pct = Math.round(used / limit * 100);
  const remaining = limit - used;
  const budgetEmpty = remaining <= 0;

  const handleGenerate = async () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setGenerating(true);
    await saveProfile();
    try {
      const res = await fetch('/api/leads/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, profile_id: profile?.id }),
      });
      if (res.ok) {
        onGenerated(leadCount);
        onClose();
      }
    } catch { /* silent — toast will still show */ }
    finally { setGenerating(false); }
  };

  const TABS = [
    { key: 'zielgruppe', label: '🎯 Zielgruppe' },
    { key: 'einstellungen', label: '⚙️ Einstellungen' },
    { key: 'verlauf', label: '📊 Verlauf' },
  ] as const;

  const SkeletonBar = ({ w = '100%', h = 12 }: { w?: string; h?: number }) => (
    <div style={{ width: w, height: h, borderRadius: 4, background: 'linear-gradient(90deg,#1e1e1e 25%,#272727 50%,#1e1e1e 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={onClose}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ background: '#141414', border: '1px solid #222', borderRadius: 8, width: 580, maxWidth: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>

        {/* ── STICKY HEADER ── */}
        <div style={{ padding: '1.25rem 1.5rem 0', borderBottom: '1px solid #1f1f1f', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.15rem' }}>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff' }}>⚡ Lead Generator</div>
              <div style={{ fontSize: '0.78rem', color: '#555', marginTop: '0.1rem' }}>Neue qualifizierte Leads automatisch finden</div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '1.3rem', lineHeight: 1, padding: 0, marginTop: '0.1rem' }}>×</button>
          </div>

          {/* Budget bar */}
          <div style={{ margin: '0.9rem 0 0.75rem' }}>
            {dataLoading ? (
              <><SkeletonBar w="60%" h={10} /><div style={{ marginTop: '0.4rem' }}><SkeletonBar h={5} /></div></>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#555', marginBottom: '0.35rem' }}>
                  <span style={{ color: budgetEmpty ? '#f87171' : '#888' }}>{used.toLocaleString('de-DE')} / {limit.toLocaleString('de-DE')} Searches diesen Monat</span>
                  {generator?.reset_date && <span style={{ color: '#444' }}>Reset am {new Date(generator.reset_date).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
                </div>
                <div style={{ height: 5, borderRadius: 3, background: '#222' }}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${Math.min(pct, 100)}%`, background: budgetEmpty ? '#f87171' : 'linear-gradient(90deg,#6B7AFF,#818cf8)' }} />
                </div>
              </>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0 }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{ background: 'none', border: 'none', borderBottom: `2px solid ${tab === t.key ? '#6B7AFF' : 'transparent'}`, color: tab === t.key ? '#fff' : '#555', cursor: 'pointer', fontSize: '0.82rem', fontWeight: tab === t.key ? 600 : 400, padding: '0.5rem 1rem 0.6rem', transition: 'all 0.15s' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>

          {/* No profile state */}
          {!dataLoading && !profile && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '3rem 1rem', color: '#555', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem' }}>📋</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Noch kein Suchprofil angelegt</div>
              <div style={{ fontSize: '0.78rem', color: '#444' }}>Erstelle ein Suchprofil in den Einstellungen, um den Lead Generator zu nutzen.</div>
            </div>
          )}

          {/* ═══ TAB 1: ZIELGRUPPE ═══ */}
          {tab === 'zielgruppe' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* AI Banner */}
              {showBanner && !dataLoading && profile && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: 'rgba(107,122,255,0.08)', borderLeft: '3px solid #6B7AFF', borderRadius: '0 6px 6px 0', padding: '0.75rem 1rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#a0a8ff', flex: 1, lineHeight: 1.5 }}>
                    <strong style={{ color: '#b4baff' }}>✨ KI-Vorschlag</strong> — Diese Filter wurden basierend auf deinen bisherigen Leads vorgeschlagen. Du kannst sie jederzeit anpassen.
                  </span>
                  <button onClick={() => setShowBanner(false)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
                </div>
              )}

              {/* Skeleton */}
              {dataLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {[80, 120, 100].map((h, i) => (
                    <div key={i} style={{ background: '#1a1a1a', borderRadius: 6, padding: '1rem', height: h }}>
                      <SkeletonBar w="40%" h={10} />
                      <div style={{ marginTop: '0.85rem' }}><SkeletonBar h={28} /></div>
                    </div>
                  ))}
                </div>
              )}

              {/* UNTERNEHMEN */}
              {!dataLoading && profile && (
                <>
                  <div style={{ background: '#1a1a1a', borderRadius: 6, padding: '1rem' }}>
                    <GSectionLabel>Unternehmen</GSectionLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.45rem' }}>Branchen</div>
                        <GChipInput chips={branchen} onChange={v => { setBranchen(v); triggerDebounce(); }} placeholder="+ Branche hinzufügen" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.45rem' }}>Mitarbeiter: <span style={{ color: '#ccc' }}>{empMin} bis {empMax}</span></div>
                        <div style={{ position: 'relative', height: 24, margin: '0.25rem 0' }}>
                          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 4, borderRadius: 2, background: '#2a2a2a', transform: 'translateY(-50%)' }} />
                          <div style={{ position: 'absolute', top: '50%', height: 4, borderRadius: 2, background: '#6B7AFF', transform: 'translateY(-50%)', left: `${empMin / 1000 * 100}%`, right: `${(1000 - empMax) / 1000 * 100}%` }} />
                          <input type="range" min={1} max={1000} value={empMin}
                            onChange={e => { const v = +e.target.value; if (v < empMax - 5) { setEmpMin(v); triggerDebounce(); } }}
                            style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', height: '100%', zIndex: 2 }} />
                          <input type="range" min={1} max={1000} value={empMax}
                            onChange={e => { const v = +e.target.value; if (v > empMin + 5) { setEmpMax(v); triggerDebounce(); } }}
                            style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', height: '100%', zIndex: 3 }} />
                          {[{ pct: empMin / 1000 * 100, val: empMin }, { pct: empMax / 1000 * 100, val: empMax }].map((h, i) => (
                            <div key={i} style={{ position: 'absolute', top: '50%', left: `${h.pct}%`, transform: 'translate(-50%,-50%)', width: 14, height: 14, borderRadius: 7, background: '#fff', border: '2px solid #6B7AFF', zIndex: 4, pointerEvents: 'none' }}>
                              <div style={{ position: 'absolute', bottom: '120%', left: '50%', transform: 'translateX(-50%)', fontSize: '0.65rem', color: '#aaa', whiteSpace: 'nowrap', background: '#1a1a1a', padding: '1px 4px', borderRadius: 3 }}>{h.val}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.67rem', color: '#444', marginTop: '0.5rem' }}>
                          <span>1</span><span>1.000</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.45rem' }}>Technologien <span style={{ color: '#444' }}>(optional)</span></div>
                        <GChipInput chips={techs} onChange={v => { setTechs(v); triggerDebounce(); }} placeholder="+ Technologie hinzufügen" />
                      </div>
                    </div>
                  </div>

                  {/* KONTAKTPERSON */}
                  <div style={{ background: '#1a1a1a', borderRadius: 6, padding: '1rem' }}>
                    <GSectionLabel>Kontaktperson</GSectionLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.45rem' }}>Position / Jobtitel</div>
                        <GChipInput chips={positions} onChange={v => { setPositions(v); triggerDebounce(); }} placeholder="+ Position hinzufügen" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.5rem' }}>Seniority</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                          {([['c_suite', 'C-Level'], ['director', 'Director'], ['manager', 'Manager']] as const).map(([k, label]) => (
                            <label key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.8rem', color: '#aaa' }}>
                              <input type="checkbox" checked={seniority[k]} onChange={e => { setSeniority(s => ({ ...s, [k]: e.target.checked })); triggerDebounce(); }} style={{ accentColor: '#6B7AFF' }} />
                              {label}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.5rem' }}>Abteilung</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                          {([['operations', 'Operations'], ['finance', 'Finanzen'], ['information_technology', 'IT']] as const).map(([k, label]) => (
                            <label key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.8rem', color: '#aaa' }}>
                              <input type="checkbox" checked={abteilungen[k]} onChange={e => { setAbteilungen(a => ({ ...a, [k]: e.target.checked })); triggerDebounce(); }} style={{ accentColor: '#6B7AFF' }} />
                              {label}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* GEOGRAFIE */}
                  <div style={{ background: '#1a1a1a', borderRadius: 6, padding: '1rem' }}>
                    <GSectionLabel>Geografie</GSectionLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.45rem' }}>Länder</div>
                        <GChipInput chips={countries} onChange={v => { setCountries(v); triggerDebounce(); }} placeholder="+ Land hinzufügen" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.45rem' }}>Städte <span style={{ color: '#444' }}>(optional)</span></div>
                        <GChipInput chips={cities} onChange={v => { setCities(v); triggerDebounce(); }} placeholder="+ Stadt hinzufügen" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.45rem' }}>Keywords <span style={{ color: '#444' }}>(optional)</span></div>
                        <GChipInput chips={keywords} onChange={v => { setKeywords(v); triggerDebounce(); }} placeholder="+ Keyword hinzufügen" />
                      </div>
                      <div>
                        <button type="button" onClick={() => setDomainsOpen(o => !o)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.78rem', padding: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ fontSize: '0.65rem', display: 'inline-block', transform: domainsOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>▶</span>
                          Domains ausschließen ({excludedDomains.length})
                        </button>
                        {domainsOpen && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <GChipInput chips={excludedDomains} onChange={v => { setExcludedDomains(v); triggerDebounce(); }} placeholder="+ domain.de hinzufügen" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ═══ TAB 2: EINSTELLUNGEN ═══ */}
          {tab === 'einstellungen' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Anzahl Leads */}
              <div style={{ background: '#1a1a1a', borderRadius: 6, padding: '1rem' }}>
                <GSectionLabel>Anzahl Leads</GSectionLabel>
                <div style={{ fontSize: '0.82rem', color: '#888', marginBottom: '0.85rem' }}>Wie viele Leads möchtest du generieren?</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button onClick={() => { setLeadCount(c => Math.max(1, c - 5)); triggerDebounce(); }} style={{ width: 32, height: 32, background: '#222', border: '1px solid #333', color: '#ccc', borderRadius: 6, cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                  <input type="number" min={1} max={100} value={leadCount} onChange={e => { setLeadCount(Math.min(100, Math.max(1, +e.target.value))); triggerDebounce(); }} style={{ width: 64, textAlign: 'center', background: '#222', border: '1px solid #333', color: '#fff', borderRadius: 6, fontSize: '1.1rem', fontWeight: 600, padding: '0.35rem', outline: 'none' }} />
                  <button onClick={() => { setLeadCount(c => Math.min(100, c + 5)); triggerDebounce(); }} style={{ width: 32, height: 32, background: '#222', border: '1px solid #333', color: '#ccc', borderRadius: 6, cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>
                <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ fontSize: '0.73rem', color: '#444' }}>Max. 100 pro Lauf</span>
                  <span style={{ fontSize: '0.73rem', color: '#444' }}>Verbleibend diesen Monat: {remaining.toLocaleString('de-DE')} Searches</span>
                </div>
              </div>

              {/* Zeitplan */}
              <div style={{ background: '#1a1a1a', borderRadius: 6, padding: '1rem' }}>
                <GSectionLabel>Zeitplan</GSectionLabel>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: scheduleOn ? '0.85rem' : 0 }}>
                  <span style={{ fontSize: '0.82rem', color: '#aaa' }}>Täglich automatisch ausführen</span>
                  <GToggle on={scheduleOn} onChange={v => { setScheduleOn(v); triggerDebounce(); }} />
                </div>
                {scheduleOn && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.78rem', color: '#666' }}>Uhrzeit</span>
                      <input type="time" value={scheduleTime} onChange={e => { setScheduleTime(e.target.value); triggerDebounce(); }} style={{ background: '#222', border: '1px solid #333', color: '#ccc', borderRadius: 6, fontSize: '0.82rem', padding: '0.3rem 0.6rem', outline: 'none' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#555', marginBottom: '0.4rem' }}>Wochentage</div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((d, i) => (
                          <button key={d} onClick={() => { setWeekdays(w => w.map((v, j) => j === i ? !v : v)); triggerDebounce(); }} style={{ width: 34, height: 28, borderRadius: 5, background: weekdays[i] ? 'rgba(107,122,255,0.2)' : '#222', border: `1px solid ${weekdays[i] ? '#6B7AFF' : '#333'}`, color: weekdays[i] ? '#a0a8ff' : '#555', fontSize: '0.75rem', cursor: 'pointer', fontWeight: weekdays[i] ? 600 : 400 }}>{d}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Qualität */}
              <div style={{ background: '#1a1a1a', borderRadius: 6, padding: '1rem' }}>
                <GSectionLabel>Qualität</GSectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.82rem', color: '#aaa' }}>Nur verifizierte E-Mails</div>
                      <div style={{ fontSize: '0.73rem', color: '#555', marginTop: '0.15rem' }}>Reduziert Menge, erhöht Qualität</div>
                    </div>
                    <GToggle on={onlyVerified} onChange={v => { setOnlyVerified(v); triggerDebounce(); }} />
                  </div>
                  <div style={{ borderTop: '1px solid #222', paddingTop: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.82rem', color: '#aaa' }}>Duplikate überspringen</div>
                      <div style={{ fontSize: '0.73rem', color: '#555', marginTop: '0.15rem' }}>Bereits vorhandene Leads werden automatisch übersprungen</div>
                    </div>
                    <GToggle on={true} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ TAB 3: VERLAUF ═══ */}
          {tab === 'verlauf' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {dataLoading ? (
                [1, 2].map(i => (
                  <div key={i} style={{ background: '#1a1a1a', borderRadius: 6, padding: '0.85rem 1rem', height: 64 }}>
                    <SkeletonBar w="50%" h={10} />
                    <div style={{ marginTop: '0.5rem' }}><SkeletonBar w="70%" h={8} /></div>
                  </div>
                ))
              ) : generator?.last_run_at ? (
                <div style={{ background: '#1a1a1a', borderRadius: 6, padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', color: '#ccc', fontWeight: 500, marginBottom: '0.25rem' }}>
                      {new Date(generator.last_run_at).toLocaleString('de-DE', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} Uhr
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#555' }}>
                      <span style={{ color: '#4ade80' }}>{generator.last_run_leads ?? 0} neu</span> generiert
                    </div>
                  </div>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(74,222,128,0.1)', color: '#4ade80', borderRadius: 999, padding: '2px 8px', flexShrink: 0 }}>✅ Erfolgreich</span>
                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#444', fontSize: '0.82rem' }}>Noch keine Läufe</div>
              )}
              {!dataLoading && (
                <div style={{ marginTop: '0.25rem', padding: '0.75rem 1rem', background: '#1a1a1a', borderRadius: 6, fontSize: '0.8rem', color: '#666' }}>
                  Gesamt: <strong style={{ color: '#ccc' }}>{(generator?.total_leads_generated ?? 0).toLocaleString('de-DE')} neue Leads</strong> generiert
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── STICKY FOOTER ── */}
        <div style={{ borderTop: '1px solid #1f1f1f', padding: '0.9rem 1.5rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ minWidth: 0 }}>
              {dataLoading ? (
                <SkeletonBar w="160px" h={10} />
              ) : (
                <div style={{ fontSize: '0.75rem', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Suchprofil: {profile?.name ?? '—'}
                  {savedLabel && <span style={{ color: '#4ade80', marginLeft: '0.5rem' }}>{savedLabel}</span>}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', flexShrink: 0 }}>
              <button onClick={onClose} style={{ background: 'none', border: '1px solid #2a2a2a', color: '#777', borderRadius: 6, padding: '0.5rem 1rem', fontSize: '0.82rem', cursor: 'pointer' }}>Abbrechen</button>
              <button onClick={handleGenerate} disabled={generating || budgetEmpty || !profile} title={budgetEmpty ? 'Kein Budget mehr' : undefined} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: (generating || budgetEmpty || !profile) ? '#1f1f1f' : '#fff', color: (generating || budgetEmpty || !profile) ? '#555' : '#000', border: 'none', borderRadius: 6, padding: '0.5rem 1.15rem', fontSize: '0.82rem', fontWeight: 700, cursor: (generating || budgetEmpty || !profile) ? 'default' : 'pointer' }}>
                {generating ? <><UniqueLoading size="sm" /> Generiert…</> : budgetEmpty ? 'Kein Budget mehr' : <>⚡ Jetzt generieren</>}
              </button>
            </div>
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.67rem', color: '#333', textAlign: 'center' }}>
            Apollo.io API · Webhook-Secret wird sicher übertragen
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadsPage() {
  const { tenantId, supabase, loading: tenantLoading } = useTenant();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [scoreFilters, setScoreFilters] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => { setToast(msg); }, []);

  const loadLeads = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true); setError(null);
    try {
      const { data, error: err } = await supabase
        .from('v_leads_overview')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      if (err) throw err;
      setLeads(data ?? []);
    } catch { setError('Leads konnten nicht geladen werden.'); }
    finally { setLoading(false); }
  }, [tenantId, supabase]);

  useEffect(() => {
    if (!tenantLoading) loadLeads();
  }, [tenantLoading, loadLeads]);

  const loadActivities = useCallback(async (leadId: string) => {
    setActivitiesLoading(true); setActivities([]);
    try {
      const { data } = await supabase
        .from('lead_activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      setActivities(data ?? []);
    } catch { /* silent */ }
    finally { setActivitiesLoading(false); }
  }, [supabase]);

  const handleSelectLead = useCallback(async (lead: Lead) => {
    setSelectedLead(lead);
    loadActivities(lead.id);
    try {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .eq('id', lead.id)
        .single();
      if (data) setSelectedLead(data as Lead);
    } catch { /* keep partial data */ }
  }, [supabase, loadActivities]);

  const copyWithFeedback = (text: string, fieldKey: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleStatusUpdate = useCallback(async (leadId: string, newStatus: string) => {
    // Optimistic local update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    setSelectedLead(prev => prev?.id === leadId ? { ...prev, status: newStatus } : prev);
    try {
      const updates: Record<string, unknown> = { status: newStatus };
      if (newStatus === 'contacted') updates.last_contacted_at = new Date().toISOString();
      const { error: err } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', leadId)
        .eq('tenant_id', tenantId!);
      if (err) throw err;
      showToast('✅ Status aktualisiert');
    } catch {
      showToast('❌ Fehler beim Speichern');
    }
  }, [supabase, tenantId, showToast]);


  const toggleScore = (tier: string) =>
    setScoreFilters(prev => prev.includes(tier) ? prev.filter(x => x !== tier) : [...prev, tier]);

  const resetFilters = () => { setScoreFilters([]); setSourceFilter('all'); setSortBy('newest'); setSearch(''); };
  const hasFilters = scoreFilters.length > 0 || sourceFilter !== 'all' || sortBy !== 'newest' || search !== '';

  const filtered = leads
    .filter(l => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        (l.company_name ?? '').toLowerCase().includes(q) ||
        (l.email ?? '').toLowerCase().includes(q) ||
        (`${l.first_name ?? ''} ${l.last_name ?? ''}`).toLowerCase().includes(q);
      const tier = getScoreLabel(l.score);
      const matchScore = scoreFilters.length === 0 || scoreFilters.includes(tier);
      const matchSource = sourceFilter === 'all' || (l.source ?? '').toLowerCase().includes(sourceFilter.toLowerCase());
      return matchSearch && matchScore && matchSource;
    })
    .sort((a, b) => {
      if (sortBy === 'score_desc') return (b.score ?? 0) - (a.score ?? 0);
      if (sortBy === 'score_asc') return (a.score ?? 0) - (b.score ?? 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const hot = leads.filter(l => (l.score ?? 0) >= 75).length;
  const warm = leads.filter(l => { const s = l.score ?? 0; return s >= 45 && s < 75; }).length;
  const newCount = leads.filter(l => l.status === 'new').length;

  const cf = ((selectedLead?.custom_fields ?? DUMMY_CF) as unknown) as Record<string, unknown>;
  const displayActivities = activities.length > 0 ? activities : DUMMY_ACTIVITIES;

  const SCORE_TIERS = [
    { key: 'HOT', emoji: '🔥', color: '#FF6B35', bg: 'rgba(255,107,53,0.12)', border: 'rgba(255,107,53,0.35)' },
    { key: 'WARM', emoji: '☀️', color: '#FFD700', bg: 'rgba(255,215,0,0.1)', border: 'rgba(255,215,0,0.3)' },
    { key: 'COLD', emoji: '❄️', color: '#6B7AFF', bg: 'rgba(107,122,255,0.1)', border: 'rgba(107,122,255,0.3)' },
  ];

  return (
    <>
      {generatorOpen && (
        <GeneratorModal
          onClose={() => setGeneratorOpen(false)}
          onGenerated={count => { showToast(`✅ Lead Generator gestartet — ${count} Leads werden gesucht`); setTimeout(loadLeads, 5000); }}
          tenantId={tenantId}
          supabase={supabase}
        />
      )}

      <div style={{ display: 'flex', gap: '1.5rem', minHeight: 0 }}>

        {/* ── Main column ── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h1 style={{ fontWeight: 600, fontSize: '1.35rem', color: '#fff', marginBottom: '0.2rem' }}>Leads</h1>
              <p style={{ color: '#666', fontSize: '0.85rem' }}>Interessenten verwalten und Sales-Funnel verfolgen</p>
            </div>
            <button
              onClick={() => setGeneratorOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff', color: '#000', border: 'none', borderRadius: 8, padding: '0.6rem 1.2rem', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer' }}
            >
              <Zap size={14} strokeWidth={2.5} />
              Lead Generator
            </button>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            {[
              { label: 'Gesamt', value: leads.length, color: '#fff' },
              { label: '🔥 HOT', value: hot, color: '#FF6B35' },
              { label: '☀️ WARM', value: warm, color: '#FFD700' },
              { label: 'Neu', value: newCount, color: '#818cf8' },
            ].map(s => (
              <div key={s.label} style={{ background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: 10, padding: '1rem 1.25rem' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.73rem', color: '#555', marginTop: '0.35rem' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filter toolbar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 200px' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#444', pointerEvents: 'none' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Firma, Name oder E-Mail…" style={{ ...field, paddingLeft: '2rem', background: '#0a0a0a', borderColor: '#1f1f1f' }} />
            </div>
            {SCORE_TIERS.map(tier => {
              const active = scoreFilters.includes(tier.key);
              return (
                <button
                  key={tier.key}
                  onClick={() => toggleScore(tier.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: active ? tier.bg : '#0a0a0a', border: `1px solid ${active ? tier.border : '#1f1f1f'}`, color: active ? tier.color : '#666', borderRadius: 999, padding: '0.4rem 0.85rem', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                >
                  {tier.emoji} {tier.key}
                </button>
              );
            })}
            <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} style={{ ...field, width: 'auto', background: '#0a0a0a', borderColor: '#1f1f1f', color: '#aaa', cursor: 'pointer', padding: '0.42rem 0.9rem' }}>
              <option value="all">Alle Quellen</option>
              <option value="website">Website</option>
              <option value="apollo">Apollo</option>
              <option value="linkedin">LinkedIn</option>
              <option value="empfehlung">Empfehlung</option>
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...field, width: 'auto', background: '#0a0a0a', borderColor: '#1f1f1f', color: '#aaa', cursor: 'pointer', padding: '0.42rem 0.9rem' }}>
              <option value="newest">Neueste zuerst</option>
              <option value="score_desc">Score ↓</option>
              <option value="score_asc">Score ↑</option>
            </select>
            {hasFilters && (
              <button onClick={resetFilters} style={{ background: 'none', border: 'none', color: '#555', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                Filter zurücksetzen
              </button>
            )}
          </div>

          {/* Lead Table */}
          <div style={{ background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.8fr 1fr 1fr 1fr 0.9fr', padding: '0.65rem 1.25rem', borderBottom: '1px solid #1a1a1a', gap: '0.5rem' }}>
              {['Firma / Kontakt', 'E-Mail', 'Branche', 'Status', 'Score', 'Datum'].map(h => (
                <span key={h} style={{ fontSize: '0.69rem', fontWeight: 500, color: '#444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
              ))}
            </div>
            <div style={{ maxHeight: 480, overflowY: 'auto' }}>
              {(loading || tenantLoading) ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {[1,2,3].map(i => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.8fr 1fr 1fr 1fr 0.9fr', padding: '0.85rem 1.25rem', gap: '0.5rem', alignItems: 'center', borderBottom: '1px solid #141414' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <div style={{ height: 10, borderRadius: 4, background: '#1a1a1a', width: '65%' }} />
                        <div style={{ height: 8, borderRadius: 4, background: '#141414', width: '40%' }} />
                      </div>
                      {[55, 40, 30, 35, 25].map((w, j) => (
                        <div key={j} style={{ height: 10, borderRadius: 4, background: '#1a1a1a', width: `${w}%` }} />
                      ))}
                    </div>
                  ))}
                </div>
              ) : error ? (
                <p style={{ color: '#f87171', fontSize: '0.85rem', padding: '2rem', textAlign: 'center' }}>{error}</p>
              ) : filtered.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem', padding: '3rem 1.5rem' }}>
                  <span style={{ fontSize: '1.75rem' }}>🔍</span>
                  <span style={{ fontSize: '0.9rem', color: '#555', fontWeight: 500 }}>Keine Leads gefunden</span>
                  <span style={{ fontSize: '0.79rem', color: '#3a3a3a', textAlign: 'center' }}>Passe deine Filter an oder setze sie zurück</span>
                  {hasFilters && (
                    <button onClick={resetFilters} style={{ marginTop: '0.25rem', background: 'none', border: '1px solid #2a2a2a', color: '#666', borderRadius: 7, padding: '0.4rem 0.9rem', fontSize: '0.79rem', cursor: 'pointer' }}>Filter zurücksetzen</button>
                  )}
                </div>
              ) : filtered.map(lead => {
                const isSelected = selectedLead?.id === lead.id;
                const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || '—';
                const date = new Date(lead.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
                const leadCf = lead.custom_fields as Record<string, unknown> | null;
                const urgentContact = (leadCf?.contact_in_hours as number | undefined) !== undefined && (leadCf!.contact_in_hours as number) <= 24;
                const industry = (leadCf?.industry as string | undefined) ?? '—';
                return (
                  <div
                    key={lead.id}
                    onClick={() => handleSelectLead(lead)}
                    style={{ display: 'grid', gridTemplateColumns: '2fr 1.8fr 1fr 1fr 1fr 0.9fr', padding: '0.85rem 1.25rem', gap: '0.5rem', alignItems: 'center', cursor: 'pointer', transition: 'background 0.12s', background: isSelected ? 'rgba(255,255,255,0.05)' : 'transparent', borderBottom: '1px solid #141414', borderLeft: `2px solid ${isSelected ? 'rgba(255,255,255,0.35)' : 'transparent'}` }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.company_name || name}</div>
                      {lead.company_name && <div style={{ fontSize: '0.74rem', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.email ?? '—'}</div>
                    <div style={{ fontSize: '0.78rem', color: '#777' }}>{industry}</div>
                    <StatusBadge status={lead.status} />
                    <ScoreBadge score={lead.score} />
                    <div style={{ fontSize: '0.77rem', color: '#444', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      {date}
                      {urgentContact && <span title="Sofort kontaktieren" style={{ fontSize: '0.75rem' }}>⏰</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Detail Panel ── */}
        {selectedLead && (
          <div style={{ width: 380, flexShrink: 0, background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 5rem)', position: 'sticky', top: 0 }}>

            {/* Panel header */}
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexShrink: 0 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedLead.company_name || `${selectedLead.first_name ?? ''} ${selectedLead.last_name ?? ''}`.trim() || '—'}
                </div>
                <div style={{ fontSize: '0.77rem', color: '#555', marginTop: '0.15rem' }}>
                  {[selectedLead.first_name, selectedLead.last_name].filter(Boolean).join(' ')}
                  {selectedLead.city ? ` · ${selectedLead.city}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                {selectedLead.phone && (
                  <button onClick={() => window.open('tel:' + ((cf?.normalized_phone as string) ?? selectedLead.phone))} title="Anrufen" style={{ background: '#1a1a1a', border: '1px solid #222', color: '#888', borderRadius: 7, width: 29, height: 29, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.8rem' }}>📞</button>
                )}
                {selectedLead.email && (
                  <button onClick={() => window.open('mailto:' + selectedLead.email)} title="E-Mail senden" style={{ background: '#1a1a1a', border: '1px solid #222', color: '#888', borderRadius: 7, width: 29, height: 29, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.8rem' }}>✉️</button>
                )}
                {selectedLead.website && (
                  <a href={selectedLead.website.startsWith('http') ? selectedLead.website : `https://${selectedLead.website}`} target="_blank" rel="noopener noreferrer" title="Website öffnen" style={{ background: '#1a1a1a', border: '1px solid #222', color: '#888', borderRadius: 7, width: 29, height: 29, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '0.85rem' }}>↗</a>
                )}
                <button onClick={() => setSelectedLead(null)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, padding: '0 0 0 0.25rem' }}>×</button>
              </div>
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '0 0 12px 12px' }}>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'linear-gradient(to bottom, transparent, #111)', pointerEvents: 'none', zIndex: 1 }} />
            <div style={{ height: '100%', overflowY: 'auto', padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Disposable email warning */}
              {!!(cf?.is_disposable_email) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '0.65rem 0.9rem' }}>
                  <span>🚨</span>
                  <span style={{ fontSize: '0.79rem', color: '#f87171', fontWeight: 500 }}>Wegwerf-E-Mail erkannt — Lead wahrscheinlich unbrauchbar</span>
                </div>
              )}

              {/* Badges row */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <ScoreBadge score={selectedLead.score} />
                <StatusBadge status={selectedLead.status} />
                {!!(cf?.lead_quality) && (() => {
                  const q = (cf.lead_quality as string).toLowerCase();
                  const { bg, fg } = QUALITY_COLORS[q] ?? { bg: '#1a1a1a', fg: '#666' };
                  return <span style={{ display: 'inline-flex', alignItems: 'center', background: bg, color: fg, borderRadius: 999, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 500 }}>{cf.lead_quality as string}</span>;
                })()}
                {selectedLead.source && (
                  <span style={{ fontSize: '0.7rem', color: '#555', background: '#1a1a1a', borderRadius: 999, padding: '2px 8px' }}>{selectedLead.source}</span>
                )}
              </div>

              {/* Contact in hours */}
              {cf?.contact_in_hours !== undefined && (cf.contact_in_hours as number) > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.12)', borderRadius: 7, padding: '0.5rem 0.85rem' }}>
                  <span>⏰</span>
                  <span style={{ fontSize: '0.79rem', color: 'rgba(234,179,8,0.85)' }}>Empfohlen innerhalb von <strong>{cf.contact_in_hours as number} Std.</strong> kontaktieren</span>
                </div>
              )}

              {/* Status update */}
              <div>
                <label style={lbl}>Status ändern</label>
                <select
                  value={selectedLead.status}
                  onChange={e => handleStatusUpdate(selectedLead.id, e.target.value)}
                  style={{ ...field, cursor: 'pointer', background: '#0a0a0a', borderColor: '#1f1f1f' }}
                >
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              {/* Kontaktdaten */}
              <CollapsibleSection label="Kontaktdaten">
                <div style={{ background: '#0a0a0a', borderRadius: 8, padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {selectedLead.email && (
                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.81rem', alignItems: 'center' }}>
                      <span style={{ color: '#444', minWidth: 72, flexShrink: 0 }}>E-Mail</span>
                      <span style={{ color: '#ccc', wordBreak: 'break-all', flex: 1 }}>{selectedLead.email}</span>
                      <button onClick={() => copyWithFeedback(selectedLead.email!, 'email')} style={{ background: 'none', border: 'none', color: copiedField === 'email' ? '#4ade80' : '#444', cursor: 'pointer', fontSize: '0.78rem', padding: '0 0.15rem', flexShrink: 0 }} title="Kopieren">
                        {copiedField === 'email' ? '✓' : '📋'}
                      </button>
                    </div>
                  )}
                  {(cf?.normalized_phone ?? selectedLead.phone) && (
                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.81rem', alignItems: 'center' }}>
                      <span style={{ color: '#444', minWidth: 72, flexShrink: 0 }}>Telefon</span>
                      <span style={{ color: '#ccc', flex: 1 }}>{(cf?.normalized_phone as string) ?? selectedLead.phone}</span>
                      <button onClick={() => copyWithFeedback((cf?.normalized_phone as string) ?? selectedLead.phone!, 'phone')} style={{ background: 'none', border: 'none', color: copiedField === 'phone' ? '#4ade80' : '#444', cursor: 'pointer', fontSize: '0.78rem', padding: '0 0.15rem', flexShrink: 0 }} title="Kopieren">
                        {copiedField === 'phone' ? '✓' : '📋'}
                      </button>
                    </div>
                  )}
                  {!!(cf?.job_title) && <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.81rem' }}><span style={{ color: '#444', minWidth: 72, flexShrink: 0 }}>Position</span><span style={{ color: '#ccc' }}>{cf.job_title as string}</span></div>}
                  {!!(cf?.linkedin_url) && <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.81rem', alignItems: 'center' }}><span style={{ color: '#444', minWidth: 72, flexShrink: 0 }}>LinkedIn</span><a href={cf.linkedin_url as string} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', fontSize: '0.79rem', textDecoration: 'none' }}>Profil öffnen ↗</a></div>}
                  {!!selectedLead.estimated_value && <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.81rem' }}><span style={{ color: '#444', minWidth: 72, flexShrink: 0 }}>Deal-Wert</span><span style={{ color: '#4ade80', fontWeight: 600 }}>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(selectedLead.estimated_value)}</span></div>}
                </div>
              </CollapsibleSection>

              {/* AI Summary */}
              {selectedLead.ai_summary && (
                <CollapsibleSection label="KI-Zusammenfassung">
                  <p style={{ fontSize: '0.81rem', color: '#888', lineHeight: 1.6, background: '#0a0a0a', borderRadius: 8, padding: '0.85rem', margin: 0 }}>{selectedLead.ai_summary}</p>
                </CollapsibleSection>
              )}

              {/* AI Next Action */}
              {selectedLead.ai_next_action && (
                <div style={{ background: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.15)', borderRadius: 8, padding: '0.85rem' }}>
                  <label style={{ ...lbl, color: 'rgba(234,179,8,0.7)', marginBottom: '0.4rem', display: 'block' }}>Empfohlene Aktion</label>
                  <p style={{ fontSize: '0.81rem', color: '#ccc', lineHeight: 1.5, margin: 0 }}>{selectedLead.ai_next_action}</p>
                </div>
              )}

              {/* ── KI-Scoring ── */}
              <CollapsibleSection label="KI-Scoring">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {(() => {
                    const sb = (cf?.score_breakdown ?? DUMMY_CF.score_breakdown) as Record<string, number>;
                    const barLabels: Record<string, string> = {
                      kontakt_vertrauen: 'Kontakt & Vertrauen', kaufbereitschaft: 'Kaufbereitschaft',
                      unternehmensfit: 'Unternehmensfit', abzuege: 'Abzüge',
                    };
                    const barColors: Record<string, string> = {
                      kontakt_vertrauen: '#818cf8', kaufbereitschaft: '#4ade80',
                      unternehmensfit: '#fb923c', abzuege: '#f87171',
                    };
                    return Object.entries(sb).map(([k, v]) => {
                      const maxVal = SCORE_MAX[k] ?? 35;
                      const pct = Math.min(Math.abs(v) / maxVal * 100, 100);
                      const color = barColors[k] ?? '#818cf8';
                      return (
                        <div key={k}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '0.3rem' }}>
                            <span style={{ color: '#666' }}>{barLabels[k] ?? k}</span>
                            <span style={{ color, fontWeight: 700 }}>{v > 0 ? '+' : ''}{v}</span>
                          </div>
                          <div style={{ height: 4, borderRadius: 2, background: '#1a1a1a' }}>
                            <div style={{ height: '100%', borderRadius: 2, width: `${pct}%`, background: color, opacity: 0.75, transition: 'width 0.5s ease' }} />
                          </div>
                        </div>
                      );
                    });
                  })()}
                  <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span style={{ color: '#555' }}>Gesamt-Score</span>
                    <span style={{ fontWeight: 700, color: getScoreColor(selectedLead.score).fg }}>{selectedLead.score ?? '—'} / 100</span>
                  </div>
                  {/* Stärken & Bedenken — 2-col */}
                  {(() => {
                    const strengths = ((cf?.strengths ?? DUMMY_CF.strengths) as string[]) ?? [];
                    const concerns = ((cf?.concerns ?? DUMMY_CF.concerns) as string[]) ?? [];
                    if (strengths.length === 0 && concerns.length === 0) return null;
                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.25rem' }}>
                        <div>
                          <div style={{ fontSize: '0.67rem', color: '#4ade80', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>Stärken</div>
                          {strengths.map((s, i) => (
                            <div key={i} style={{ display: 'flex', gap: '0.35rem', fontSize: '0.76rem', color: '#888', marginBottom: '0.3rem', lineHeight: 1.4 }}>
                              <span style={{ color: '#4ade80', flexShrink: 0 }}>✓</span>{s}
                            </div>
                          ))}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.67rem', color: '#fde047', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>Bedenken</div>
                          {concerns.map((s, i) => (
                            <div key={i} style={{ display: 'flex', gap: '0.35rem', fontSize: '0.76rem', color: '#888', marginBottom: '0.3rem', lineHeight: 1.4 }}>
                              <span style={{ color: '#fde047', flexShrink: 0 }}>⚠</span>{s}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  {/* Red flags */}
                  {((cf?.red_flags ?? DUMMY_CF.red_flags) as string[])?.length > 0 && (
                    <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 7, padding: '0.6rem 0.8rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      {((cf?.red_flags ?? DUMMY_CF.red_flags) as string[]).map((s, i) => (
                        <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.78rem', color: '#888' }}>
                          <span style={{ color: '#f87171', flexShrink: 0 }}>✕</span>{s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CollapsibleSection>

              {/* ── Firmenprofil — 2-col grid ── */}
              <CollapsibleSection label="Firmenprofil">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 0.75rem', background: '#0a0a0a', borderRadius: 8, padding: '0.85rem' }}>
                  {[
                    { label: 'Branche', val: cf?.industry },
                    { label: 'Typ', val: cf?.company_type },
                    { label: 'Größe', val: cf?.company_size },
                    { label: 'Mitarbeiter', val: cf?.employee_count ? String(cf.employee_count) : undefined },
                    { label: 'Budget', val: cf?.budget_estimate, highlight: true },
                    { label: 'Jahresumsatz', val: cf?.annual_revenue },
                  ].filter(r => r.val).map(r => (
                    <div key={r.label}>
                      <div style={{ fontSize: '0.67rem', color: '#444', marginBottom: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{r.label}</div>
                      <div style={{ fontSize: '0.81rem', color: r.highlight ? '#4ade80' : '#ccc', fontWeight: r.highlight ? 600 : 400 }}>{r.val as string}</div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              {/* ── Qualitätssignale — 2-col grid ── */}
              <CollapsibleSection label="Qualitätssignale">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {[
                    { label: 'Firmen-E-Mail', val: cf?.is_company_email as boolean | undefined },
                    { label: 'Telefon gültig', val: cf?.has_valid_phone as boolean | undefined },
                    { label: 'Website erreichbar', val: cf?.website_loaded as boolean | undefined },
                    { label: 'Kein Free-Mail', val: cf?.is_free_email !== undefined ? !(cf.is_free_email as boolean) : undefined },
                  ].filter(r => r.val !== undefined).map(r => {
                    const ok = r.val as boolean;
                    return (
                      <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: ok ? 'rgba(74,222,128,0.06)' : 'rgba(248,113,113,0.06)', border: `1px solid ${ok ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)'}`, borderRadius: 7, padding: '0.4rem 0.65rem' }}>
                        <span style={{ fontSize: '0.8rem', color: ok ? '#4ade80' : '#f87171', flexShrink: 0 }}>{ok ? '✓' : '✕'}</span>
                        <span style={{ fontSize: '0.74rem', color: '#777' }}>{r.label}</span>
                      </div>
                    );
                  })}
                  {!!(cf?.message_quality) && (() => {
                    const mq = (cf.message_quality as string).toLowerCase();
                    const c = MESSAGE_QUALITY_COLORS[mq] ?? { bg: 'rgba(255,255,255,0.04)', fg: '#555' };
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: c.bg, border: `1px solid ${c.fg}22`, borderRadius: 7, padding: '0.4rem 0.65rem', gridColumn: 'span 2' }}>
                        <span style={{ fontSize: '0.74rem', color: c.fg }}>✉ Nachricht: {cf.message_quality as string}</span>
                      </div>
                    );
                  })()}
                </div>
              </CollapsibleSection>

              {/* Technologies */}
              {(cf?.technologies as string[])?.length > 0 && (
                <CollapsibleSection label="Technologien">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {(cf!.technologies as string[]).map(t => (
                      <span key={t} style={{ background: 'rgba(107,122,255,0.1)', color: '#818cf8', borderRadius: 999, padding: '2px 8px', fontSize: '0.73rem' }}>{t}</span>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {/* AI Tags */}
              {selectedLead.ai_tags && selectedLead.ai_tags.length > 0 && (
                <div>
                  <label style={lbl}>KI-Tags</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
                    {selectedLead.ai_tags.map(tag => (
                      <span key={tag} style={{ background: '#1a1a1a', borderRadius: 999, padding: '2px 8px', fontSize: '0.74rem', color: '#555' }}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedLead.notes && (
                <CollapsibleSection label="Nachricht / Notiz">
                  <p style={{ fontSize: '0.81rem', color: '#888', lineHeight: 1.6, background: '#0a0a0a', borderRadius: 8, padding: '0.85rem', margin: 0 }}>{selectedLead.notes}</p>
                </CollapsibleSection>
              )}

              {/* Activities */}
              <CollapsibleSection label={`Aktivitätsverlauf${displayActivities.length > 0 ? ` (${displayActivities.length})` : ''}`}>
                {activitiesLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[1,2,3].map(i => (
                      <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <div style={{ width: 26, height: 26, borderRadius: 7, background: '#1a1a1a', flexShrink: 0 }} />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          <div style={{ height: 10, borderRadius: 4, background: '#1a1a1a', width: '60%' }} />
                          <div style={{ height: 8, borderRadius: 4, background: '#141414', width: '40%' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : displayActivities.length === 0 ? (
                  <p style={{ fontSize: '0.79rem', color: '#333', textAlign: 'center', padding: '1rem 0' }}>Keine Aktivitäten vorhanden.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[...displayActivities].sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0)).map(act => (
                      <ActivityItem key={act.id} act={act} />
                    ))}
                  </div>
                )}
              </CollapsibleSection>
            </div>
            </div>
          </div>
        )}
      </div>
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </>
  );
}

// ── Dashboard Page ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  useEffect(() => { setUser(parseCookieUser()); }, []);
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
    }
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh', backgroundColor:'#000', color:'#fff' }}>
      <style>{`* { box-sizing: border-box; } @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      <Sidebar active={activePage} onNav={setActivePage} user={user} onLogout={handleLogout} />

      <main style={{ flex:1, overflowY:'auto', padding:'2.5rem 2.75rem' }}>
        {renderContent()}
      </main>
    </div>
  );
}
