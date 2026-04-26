'use client';

import { useEffect, useState } from 'react';
import { Confetti } from '@onvero/ui/effects/confetti';
import { C, PageHeader } from './_shared';
import {
  BlogForm,
  BlogPreview,
  ErrorBanner,
  emptyForm,
  polishWithAI,
  SplitLayout,
  SuccessBanner,
  useAuthorFromCookie,
  type FormState,
  type SubmitState,
} from './_blog';

export default function CreateBlogPostPage() {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [confetti, setConfetti] = useState(false);
  const [aiPolishing, setAiPolishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const author = useAuthorFromCookie();
  useEffect(() => {
    if (author) setForm((p) => (p.author ? p : { ...p, author }));
  }, [author]);

  async function submit() {
    setSubmitState('loading');
    setErrorMsg(null);
    try {
      const fd = new FormData();
      fd.set('action', 'create');
      fd.set('title', form.title.trim());
      fd.set('content', form.content.trim());
      fd.set('tags', form.tags.join(','));
      fd.set('author', form.author.trim());
      if (form.imageFile) fd.set('image', form.imageFile);

      const res = await fetch('/api/n8n', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Erstellen fehlgeschlagen.');

      setSubmitState('success');
      setConfetti(true);
      setTimeout(() => setConfetti(false), 4000);
      setForm(emptyForm(form.author));
    } catch (e) {
      setSubmitState('error');
      setErrorMsg(e instanceof Error ? e.message : 'Erstellen fehlgeschlagen.');
    }
  }

  return (
    <>
      <Confetti active={confetti} />
      <PageHeader title="Erstellen" subtitle="Neuen Blog-Beitrag schreiben und veröffentlichen." />

      {errorMsg && <ErrorBanner text={errorMsg} />}

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
            {submitState === 'success' && <SuccessBanner text="Beitrag wurde erfolgreich erstellt." />}
            <BlogForm
              form={form}
              setForm={setForm}
              onSubmit={submit}
              submitting={submitState === 'loading'}
              submitLabel="Beitrag erstellen"
              onAiPolish={() => polishWithAI(form, setForm, setAiPolishing, setErrorMsg)}
              aiPolishing={aiPolishing}
            />
          </div>
        }
        preview={<BlogPreview form={form} />}
      />
    </>
  );
}
