import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/tenant-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await createServerSupabaseClient();

  const [blogsRes] = await Promise.all([
    supabase
      .from('blogposts')
      .select('id, title, tags, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const blogs = blogsRes.data || [];
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const blogsThisMonth = blogs.filter((b) => new Date(b.created_at) >= thisMonthStart).length;
  const blogsLastMonth = blogs.filter((b) => {
    const d = new Date(b.created_at);
    return d >= lastMonthStart && d < thisMonthStart;
  }).length;

  const tagMap: Record<string, number> = {};
  blogs.forEach((b) => {
    if (b.tags)
      b.tags
        .split(',')
        .map((t: string) => t.trim())
        .filter(Boolean)
        .forEach((t: string) => {
          tagMap[t] = (tagMap[t] || 0) + 1;
        });
  });
  const topTags = Object.entries(tagMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  return NextResponse.json({
    blogs: {
      total: blogs.length,
      thisMonth: blogsThisMonth,
      lastMonth: blogsLastMonth,
      recent: blogs.slice(0, 8),
      topTags,
    },
  });
}
