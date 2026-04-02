'use client';

import { useState, useEffect } from 'react';

interface LeadAvatarProps {
  website?: string;
  companyName: string;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

const getDomain = (url: string | null | undefined): string | null => {
  if (!url) return null;
  try {
    const withProtocol = url.startsWith('http') ? url : `https://${url}`;
    const parsed = new URL(withProtocol);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return (
      url
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0] || null
    );
  }
};

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function getScoreStyle(score?: number) {
  if (score === undefined || score === null)
    return { bg: 'rgba(51,65,85,0.5)', color: 'rgba(148,163,184,0.7)', border: 'rgba(51,65,85,0.8)' };
  if (score >= 70) return { bg: 'rgba(127,29,29,0.5)', color: '#f87171', border: 'rgba(153,27,27,0.6)' };
  if (score >= 40) return { bg: 'rgba(120,53,15,0.4)', color: '#fbbf24', border: 'rgba(146,64,14,0.5)' };
  return { bg: 'rgba(51,65,85,0.5)', color: 'rgba(148,163,184,0.7)', border: 'rgba(51,65,85,0.8)' };
}

const SIZES = { sm: 24, md: 32, lg: 48 };

export default function LeadAvatar({ website, companyName, score, size = 'md' }: LeadAvatarProps) {
  const px = SIZES[size];
  const domain = getDomain(website);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'initials'>(domain ? 'loading' : 'initials');

  useEffect(() => {
    setStatus(getDomain(website) ? 'loading' : 'initials');
  }, [website]);

  const s = getScoreStyle(score);
  const initialsEl = (
    <div
      style={{
        width: px,
        height: px,
        borderRadius: '50%',
        background: s.bg,
        border: `1px solid ${s.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size === 'lg' ? 16 : px * 0.32,
        fontWeight: 500,
        color: s.color,
        flexShrink: 0,
        fontFamily: 'var(--font-dm-mono)',
      }}
    >
      {getInitials(companyName || '?')}
    </div>
  );

  if (status === 'initials' || !domain) return initialsEl;

  return (
    <div style={{ position: 'relative', width: px, height: px, flexShrink: 0 }}>
      {status === 'loading' && initialsEl}
      <img
        key={domain}
        src={`/api/favicon?domain=${domain}`}
        alt={companyName}
        width={px}
        height={px}
        onLoad={(e) => {
          const img = e.currentTarget;
          if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
            setStatus('initials');
          } else {
            setStatus('loaded');
          }
        }}
        onError={() => setStatus('initials')}
        style={{
          width: px,
          height: px,
          borderRadius: '50%',
          objectFit: 'cover',
          background: 'rgba(30,41,59,0.8)',
          padding: 2,
          position: 'absolute',
          top: 0,
          left: 0,
          opacity: status === 'loaded' ? 1 : 0,
        }}
      />
    </div>
  );
}
