'use client';

import Link from 'next/link';
import { TOKENS } from '../_tokens';

interface BreadcrumbSegment {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ segments }: { segments: BreadcrumbSegment[] }) {
  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        return (
          <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <span style={{ fontSize: 11, color: TOKENS.color.textMuted, userSelect: 'none' }}>/</span>}
            {seg.href && !isLast ? (
              <Link
                href={seg.href}
                style={{
                  fontSize: 11,
                  color: TOKENS.color.textMuted,
                  textDecoration: 'none',
                  fontFamily: TOKENS.font.family,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = TOKENS.color.textSecondary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = TOKENS.color.textMuted;
                }}
              >
                {seg.label}
              </Link>
            ) : (
              <span
                style={{
                  fontSize: 11,
                  color: isLast ? TOKENS.color.textSecondary : TOKENS.color.textMuted,
                  fontFamily: TOKENS.font.family,
                }}
              >
                {seg.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
