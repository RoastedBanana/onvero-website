'use client';

import { useState, useEffect } from 'react';

interface LeadAvatarProps {
  website?: string | null;
  companyName: string;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  logoUrl?: string | null;
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

// ─── Module-level cache: remembers which domains have working favicons ──────
const _cache = new Map<string, 'ok' | 'fail'>();

export default function LeadAvatar({ website, companyName, score, size = 'md', logoUrl }: LeadAvatarProps) {
  const px = SIZES[size];
  const domain = getDomain(website);
  const cached = domain ? _cache.get(domain) : null;

  // If we have a direct logoUrl, prefer it over favicon
  const [logoFailed, setLogoFailed] = useState(false);
  const hasLogo = !!logoUrl && !logoFailed;

  // Skip loading if we already know this domain fails
  const initialStatus = !domain || cached === 'fail' ? 'initials' : cached === 'ok' ? 'loaded' : 'loading';
  const [status, setStatus] = useState<'loading' | 'loaded' | 'initials'>(initialStatus);

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

  useEffect(() => {
    const d = getDomain(website);
    const c = d ? _cache.get(d) : null;
    if (!d || c === 'fail') {
      setStatus('initials');
    } else if (c === 'ok') {
      setStatus('loaded');
    } else {
      setStatus('loading');
    }
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

  // 1. Direct logo from DB (Apollo/Zenprospect) — best quality
  if (hasLogo) {
    return (
      <div style={{ position: 'relative', width: px, height: px, flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl!}
          alt={companyName}
          width={px}
          height={px}
          onError={() => setLogoFailed(true)}
          style={{
            width: px,
            height: px,
            borderRadius: '50%',
            objectFit: 'contain',
            background: '#fff',
            border: `1px solid rgba(255,255,255,0.1)`,
            flexShrink: 0,
          }}
        />
      </div>
    );
  }

  // 2. Fallback: favicon from website domain
  if (status === 'initials' || !domain) return initialsEl;

  return (
    <div style={{ position: 'relative', width: px, height: px, flexShrink: 0 }}>
      {status === 'loading' && initialsEl}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={domain}
        src={`/api/favicon?domain=${domain}`}
        alt={companyName}
        width={px}
        height={px}
        onLoad={(e) => {
          const img = e.currentTarget;
          if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
            _cache.set(domain, 'fail');
            setStatus('initials');
          } else {
            _cache.set(domain, 'ok');
            setStatus('loaded');
          }
        }}
        onError={() => {
          _cache.set(domain, 'fail');
          setStatus('initials');
        }}
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
