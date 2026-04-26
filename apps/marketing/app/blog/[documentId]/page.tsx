import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Clock, Calendar, User } from 'lucide-react';
import { BackButton } from './back-button';
import { calcReadTime } from '@/lib/utils';
import { Navbar } from '@onvero/ui/marketing/navbar';
import { FooterComponent } from '@onvero/ui/marketing/flickering-footer';
import { Badge } from '@onvero/ui/primitives/badge';

interface BlogPost {
  id: number;
  document_id: string;
  title: string;
  content: string;
  tags: string | null;
  writer: string | null;
  cover_image_url: string | null;
  created_at: string;
}

function encodeImageUrl(url: string | null): string | null {
  if (!url) return null;
  let fixed = url.replace(
    '/storage/v1/object/public/blogpost-images/blogpost-images/',
    '/storage/v1/object/public/blogpost-images/'
  );
  if (fixed.endsWith('/blogpost-images/')) return null;
  try { return encodeURI(decodeURI(fixed)); } catch { return fixed; }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

async function getPost(documentId: string): Promise<BlogPost | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase
    .from('blogposts')
    .select('*')
    .eq('document_id', documentId)
    .single();
  return data ?? null;
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const post = await getPost(documentId);

  if (!post) notFound();

  const tags = post.tags ? post.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  const imageUrl = encodeImageUrl(post.cover_image_url);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f0f0f', color: '#fff' }}>
      <Navbar />

      {/* Cover image — full-width, Notion-style */}
      {imageUrl && (
        <div style={{ width: '100%', height: 'clamp(220px, 40vh, 480px)', position: 'relative', overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={post.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
          {/* bottom fade into page background */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, #0f0f0f 100%)' }} />
        </div>
      )}

      <main style={{ maxWidth: 760, margin: '0 auto', padding: imageUrl ? '2.5rem 1.5rem 5rem' : '7rem 1.5rem 5rem' }}>

        {/* Back button — goes to previous page (projects or blog section) */}
        <BackButton />

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {tags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="bg-white/10 text-white/70 border-white/10">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: '1.5rem' }}>
          {post.title}
        </h1>

        {/* Meta */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center', marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)' }}>
            <User size={14} />
            {post.writer ?? 'Onvero'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)' }}>
            <Calendar size={14} />
            {formatDate(post.created_at)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)' }}>
            <Clock size={14} />
            {calcReadTime(post.content)}
          </span>
        </div>

        {/* Content */}
        <div style={{ fontSize: '1.05rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.8)', whiteSpace: 'pre-wrap' }}>
          {post.content}
        </div>

      </main>

      <FooterComponent />
    </div>
  );
}
