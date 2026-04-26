'use client';

import { useCallback, useEffect, useState } from 'react';
import { Confetti } from '@onvero/ui/effects/confetti';
import { C, GhostButton, PageHeader } from '../_shared';
import {
  BlogForm,
  BlogPreview,
  ErrorBanner,
  emptyForm,
  getImageUrl,
  mapRawPost,
  polishWithAI,
  PostGrid,
  SplitLayout,
  SuccessBanner,
  type BlogPost,
  type FormState,
  type SubmitState,
} from '../_blog';

export default function EditBlogPostPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedRaw, setSelectedRaw] = useState<{
    id: string | number;
    image_id: string | null;
    created_at: string | null;
  } | null>(null);

  const [form, setForm] = useState<FormState>(emptyForm());
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [confetti, setConfetti] = useState(false);
  const [aiPolishing, setAiPolishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setPostsLoading(true);
    try {
      const res = await fetch('/api/posts');
      if (!res.ok) throw new Error('load failed');
      const raw = await res.json();
      setPosts((raw as Array<Record<string, unknown>>).map(mapRawPost));
    } catch {
      setErrorMsg('Beiträge konnten nicht geladen werden.');
    } finally {
      setPostsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  async function selectPost(documentId: string) {
    setSelectedDocId(documentId);
    setSubmitState('idle');
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/posts/${documentId}`);
      if (!res.ok) throw new Error('load failed');
      const r = (await res.json()) as Record<string, unknown>;
      const tags = ((r.tags as string) ?? '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      setSelectedRaw({
        id: (r.id as string | number) ?? '',
        image_id: (r.cover_image_id as string | null) ?? null,
        created_at: (r.created_at as string | null) ?? null,
      });
      setForm({
        title: (r.title as string) ?? '',
        content: (r.content as string) ?? '',
        tags,
        author: (r.writer as string) ?? '',
        imageFile: null,
        existingImageUrl: getImageUrl(r.cover_image_url as string | null),
        imageRemoved: false,
      });
    } catch {
      setErrorMsg('Beitrag konnte nicht geladen werden.');
    }
  }

  function backToList() {
    setSelectedDocId(null);
    setSelectedRaw(null);
    setForm(emptyForm());
    setSubmitState('idle');
    setErrorMsg(null);
  }

  async function submit() {
    if (!selectedDocId || !selectedRaw) return;
    setSubmitState('loading');
    setErrorMsg(null);
    try {
      const fd = new FormData();
      fd.set('action', 'update');
      fd.set('documentId', selectedDocId);
      fd.set('id', String(selectedRaw.id));
      if (selectedRaw.image_id) fd.set('imageId', selectedRaw.image_id);
      fd.set('title', form.title.trim());
      fd.set('content', form.content.trim());
      fd.set('tags', form.tags.join(','));
      fd.set('author', form.author.trim());
      if (form.imageFile) fd.set('image', form.imageFile);
      if (form.imageRemoved) fd.set('imageRemoved', 'true');

      const res = await fetch('/api/n8n', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Update fehlgeschlagen.');

      setPosts((p) =>
        p.map((post) =>
          post.documentId === selectedDocId
            ? {
                ...post,
                title: form.title,
                content: form.content,
                tags: form.tags.join(','),
                author: form.author,
                imageUrl: form.imageRemoved ? null : form.existingImageUrl ?? post.imageUrl,
              }
            : post
        )
      );

      setSubmitState('success');
      setConfetti(true);
      setTimeout(() => setConfetti(false), 4000);
    } catch (e) {
      setSubmitState('error');
      setErrorMsg(e instanceof Error ? e.message : 'Update fehlgeschlagen.');
    }
  }

  return (
    <>
      <Confetti active={confetti} />
      <PageHeader
        title="Bearbeiten"
        subtitle="Bestehende Blog-Beiträge auswählen und aktualisieren."
        actions={
          selectedDocId ? <GhostButton onClick={backToList}>← Zurück zur Übersicht</GhostButton> : null
        }
      />

      {errorMsg && <ErrorBanner text={errorMsg} />}

      {!selectedDocId && (
        <div style={{ animation: 'tabIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both' }}>
          <PostGrid posts={posts} selectedId={selectedDocId} onSelect={selectPost} loading={postsLoading} />
        </div>
      )}

      {selectedDocId && (
        <SplitLayout
          form={
            <div
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: 24,
                animation: 'tabIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
              }}
            >
              {submitState === 'success' && <SuccessBanner text="Beitrag wurde aktualisiert." />}
              <BlogForm
                form={form}
                setForm={setForm}
                onSubmit={submit}
                submitting={submitState === 'loading'}
                submitLabel="Änderungen speichern"
                onAiPolish={(prompt) => polishWithAI(form, setForm, setAiPolishing, setErrorMsg, prompt)}
                aiPolishing={aiPolishing}
              />
            </div>
          }
          preview={<BlogPreview form={form} createdAt={selectedRaw?.created_at ?? undefined} />}
        />
      )}
    </>
  );
}
