'use client';

import { useState } from 'react';

interface LeadAvatarProps {
  website?: string;
  companyName: string;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

function getDomain(url: string): string | null {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '');
  } catch {
    return null;
  }
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
  const domain = website ? getDomain(website) : null;

  const [imgState, setImgState] = useState<'clearbit' | 'google' | 'initials'>(domain ? 'clearbit' : 'initials');

  const initials = companyName
    .split(/[\s&+\-./]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (imgState === 'initials' || !domain) {
    const s = getScoreStyle(score);
    return (
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
          fontSize: px * 0.32,
          fontWeight: 500,
          color: s.color,
          flexShrink: 0,
          fontFamily: 'var(--font-dm-mono)',
        }}
      >
        {initials || '?'}
      </div>
    );
  }

  const src =
    imgState === 'clearbit'
      ? `https://logo.clearbit.com/${domain}`
      : `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  return (
    <img
      src={src}
      alt={companyName}
      width={px}
      height={px}
      onError={() => {
        if (imgState === 'clearbit') setImgState('google');
        else setImgState('initials');
      }}
      style={{
        width: px,
        height: px,
        borderRadius: '50%',
        objectFit: 'cover',
        flexShrink: 0,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    />
  );
}
