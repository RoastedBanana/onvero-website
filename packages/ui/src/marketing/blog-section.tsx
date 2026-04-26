import { createClient } from '@supabase/supabase-js';
import { GlassBlogCard } from '../marketing/glass-blog-card';
import { calcReadTime } from '@/lib/utils';

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

function encodeImageUrl(url: string | null): string {
  if (!url) return '';
  let fixed = url.replace(
    '/storage/v1/object/public/blogpost-images/blogpost-images/',
    '/storage/v1/object/public/blogpost-images/'
  );
  if (fixed.endsWith('/blogpost-images/')) return '';
  try { return encodeURI(decodeURI(fixed)); } catch { return fixed; }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

async function getPosts(): Promise<BlogPost[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase
    .from('blogposts')
    .select('id, document_id, title, content, tags, writer, cover_image_url, created_at')
    .order('created_at', { ascending: false })
    .limit(6);
  return data ?? [];
}

export async function BlogSection() {
  const posts = await getPosts();

  if (posts.length === 0) return null;

  return (
    <section
      id="blog"
      style={{ position: 'relative', zIndex: 1, backgroundColor: '#0f0f0f' }}
      className="px-6 py-24 md:px-12 lg:px-24"
    >
      {/* Header */}
      <div className="mb-14 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
          Wissen & Einblicke
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
          Aktuelle Artikel
        </h2>
        <p className="mt-3 text-base text-white/45">
          Einblicke in KI, Automatisierung und den digitalen Mittelstand.
        </p>
      </div>

      {/* Grid */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => {
          const tags = post.tags
            ? post.tags.split(',').map((t) => t.trim()).filter(Boolean)
            : [];
          const excerpt = post.content
            ? post.content.replace(/<[^>]*>/g, '').slice(0, 120) + '…'
            : '';

          return (
            <GlassBlogCard
              key={post.id}
              title={post.title}
              excerpt={excerpt}
              image={encodeImageUrl(post.cover_image_url) || undefined}
              author={{ name: post.writer ?? 'Onvero' }}
              date={formatDate(post.created_at)}
              readTime={calcReadTime(post.content)}
              tags={tags}
              href={`/blog/${post.document_id}`}
            />
          );
        })}
      </div>
    </section>
  );
}
