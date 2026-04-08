'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { EmploymentEntry } from '@/lib/leads-client';

interface Props {
  entries: EmploymentEntry[];
}

const MIN_NODE_SPACING = 180; // px between nodes when paginated
const NODE_RADIUS = 7;

function formatDate(d: string | null): string {
  if (!d) return '—';
  // Accept yyyy-mm-dd, yyyy-mm, or full ISO
  const parts = d.split('-');
  if (parts.length >= 2) {
    const year = parts[0];
    const month = parts[1];
    const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    const m = months[Math.max(0, Math.min(11, Number(month) - 1))];
    return `${m} ${year}`;
  }
  return d;
}

export default function EmploymentTimeline({ entries }: Props) {
  // Sort: oldest → newest by start date
  const sorted = [...entries].sort((a, b) => {
    const sa = a.startDate ?? '';
    const sb = b.startDate ?? '';
    return sa.localeCompare(sb);
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [page, setPage] = useState(0);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Close popover on outside click
  useEffect(() => {
    if (activeIdx === null) return;
    const onDocClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-emp-node]')) setActiveIdx(null);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [activeIdx]);

  if (sorted.length === 0) return null;

  // Determine if pagination is needed
  const usableWidth = Math.max(0, containerWidth - 80); // leave room for chevrons
  const fitsAll = sorted.length * MIN_NODE_SPACING <= usableWidth || containerWidth === 0;
  const perPage = fitsAll ? sorted.length : Math.max(1, Math.floor(usableWidth / MIN_NODE_SPACING));
  const totalPages = fitsAll ? 1 : Math.ceil(sorted.length / perPage);
  const safePage = Math.min(page, totalPages - 1);
  const pageStart = safePage * perPage;
  const visible = sorted.slice(pageStart, pageStart + perPage);
  const showChevrons = !fitsAll && totalPages > 1;

  return (
    <div
      style={{
        background: '#111',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
        padding: '20px 24px 24px',
        marginTop: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 18,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.25)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Berufsverlauf
        </div>
        {showChevrons && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-dm-mono)' }}>
            {safePage + 1} / {totalPages}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {showChevrons && (
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            aria-label="Zurück"
            style={{
              flexShrink: 0,
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: safePage === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.6)',
              cursor: safePage === 0 ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            <ChevronLeft size={16} />
          </button>
        )}

        <div ref={containerRef} style={{ flex: 1, position: 'relative', minHeight: 180 }}>
          {/* Horizontal line */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '50%',
              height: 1,
              background: 'rgba(255,255,255,0.08)',
            }}
          />

          {/* Nodes */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              justifyContent: visible.length === 1 ? 'center' : 'space-between',
              alignItems: 'center',
              minHeight: 180,
              padding: '0 10px',
            }}
          >
            {visible.map((entry, i) => {
              const globalIdx = pageStart + i;
              const isAbove = globalIdx % 2 === 0;
              const isActive = activeIdx === globalIdx;
              return (
                <div
                  key={globalIdx}
                  data-emp-node
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flex: visible.length === 1 ? '0 0 auto' : '1 1 0',
                    maxWidth: 220,
                  }}
                >
                  {/* Top label */}
                  {isAbove && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 'calc(50% + 14px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        textAlign: 'center',
                        width: 160,
                        pointerEvents: 'none',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'rgba(255,255,255,0.9)',
                          marginBottom: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={entry.name}
                      >
                        {entry.name || '—'}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'rgba(255,255,255,0.4)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={entry.title}
                      >
                        {entry.title}
                      </div>
                      {/* Connector line */}
                      <div
                        style={{
                          position: 'absolute',
                          left: '50%',
                          bottom: -10,
                          width: 1,
                          height: 8,
                          background: 'rgba(255,255,255,0.12)',
                        }}
                      />
                    </div>
                  )}

                  {/* Node dot */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIdx(isActive ? null : globalIdx);
                    }}
                    aria-label={`${entry.name} – ${entry.title}`}
                    style={{
                      width: NODE_RADIUS * 2,
                      height: NODE_RADIUS * 2,
                      borderRadius: '50%',
                      background: entry.current ? '#22C55E' : '#6B7AFF',
                      border: isActive
                        ? '2px solid rgba(255,255,255,0.9)'
                        : '2px solid rgba(255,255,255,0.15)',
                      boxShadow: isActive ? '0 0 0 4px rgba(107,122,255,0.2)' : 'none',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'all 0.15s',
                      zIndex: 2,
                    }}
                  />

                  {/* Bottom label */}
                  {!isAbove && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(50% + 14px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        textAlign: 'center',
                        width: 160,
                        pointerEvents: 'none',
                      }}
                    >
                      {/* Connector line */}
                      <div
                        style={{
                          position: 'absolute',
                          left: '50%',
                          top: -10,
                          width: 1,
                          height: 8,
                          background: 'rgba(255,255,255,0.12)',
                        }}
                      />
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'rgba(255,255,255,0.9)',
                          marginBottom: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={entry.name}
                      >
                        {entry.name || '—'}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'rgba(255,255,255,0.4)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={entry.title}
                      >
                        {entry.title}
                      </div>
                    </div>
                  )}

                  {/* Date popover */}
                  {isActive && (
                    <div
                      data-emp-node
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, 24px)',
                        background: '#0a0a0a',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: 8,
                        padding: '8px 12px',
                        whiteSpace: 'nowrap',
                        zIndex: 10,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                        fontSize: 11,
                        fontFamily: 'var(--font-dm-mono)',
                        color: 'rgba(255,255,255,0.85)',
                        marginTop: isAbove ? 0 : 60,
                      }}
                    >
                      {formatDate(entry.startDate)} – {entry.current ? 'Heute' : formatDate(entry.endDate)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {showChevrons && (
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
            aria-label="Weiter"
            style={{
              flexShrink: 0,
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: safePage >= totalPages - 1 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.6)',
              cursor: safePage >= totalPages - 1 ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
