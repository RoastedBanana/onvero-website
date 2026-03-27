'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        if (window.history.length > 1) {
          document.documentElement.style.scrollBehavior = 'auto';
          window.history.back();
          setTimeout(() => { document.documentElement.style.scrollBehavior = ''; }, 200);
        } else {
          router.push('/');
        }
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        color: 'rgba(255,255,255,0.4)',
        fontSize: '0.85rem',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        marginBottom: '2.5rem',
      }}
    >
      <ArrowLeft size={15} />
      Zurück
    </button>
  );
}
