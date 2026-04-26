'use client';

import { useState, useEffect } from 'react';

interface WidgetData {
  total: number;
  hot: number;
  avg: number;
  recent: number;
}

function useAnimatedNumber(target: number, duration = 800, steps = 20): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }
    let step = 0;
    const interval = duration / steps;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setValue(Math.round(target * progress));
      if (step >= steps) {
        clearInterval(timer);
        setValue(target);
      }
    }, interval);
    return () => clearInterval(timer);
  }, [target, duration, steps]);
  return value;
}

function Widget({ label, value, color, context }: { label: string; value: number; color: string; context: string }) {
  const animatedValue = useAnimatedNumber(value);
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10,
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: 'rgba(255,255,255,0.3)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          fontFamily: 'var(--font-dm-mono)',
          color,
          lineHeight: 1.2,
          marginBottom: 4,
        }}
      >
        {animatedValue}
      </div>
      <div
        style={{
          fontSize: 10,
          color: 'rgba(255,255,255,0.2)',
        }}
      >
        {context}
      </div>
    </div>
  );
}

export function DashboardWidgets() {
  const [data, setData] = useState<WidgetData>({ total: 0, hot: 0, avg: 0, recent: 0 });

  useEffect(() => {
    fetch('/api/leads')
      .then((r) => r.json())
      .then((d) => {
        const leads = d.leads ?? [];
        const total = leads.length;
        const hot = leads.filter((l: Record<string, number>) => (l.score ?? 0) >= 70).length;
        const avg =
          total > 0
            ? Math.round(leads.reduce((s: number, l: Record<string, number>) => s + (l.score ?? 0), 0) / total)
            : 0;
        const now7d = Date.now() - 7 * 86400000;
        const recent = leads.filter((l: Record<string, string>) => new Date(l.created_at).getTime() > now7d).length;
        setData({ total, hot, avg, recent });
      })
      .catch(() => {});
  }, []);

  const avgColor = data.avg >= 60 ? '#F59E0B' : 'rgba(255,255,255,0.4)';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10,
        width: '100%',
      }}
    >
      <Widget label="KONTAKTE" value={data.total} color="#fff" context="gesamt im System" />
      <Widget label="HOT LEADS" value={data.hot} color="#FF5C2E" context="Score \u2265 70" />
      <Widget label="\u00D8 SCORE" value={data.avg} color={avgColor} context="Durchschnitt" />
      <Widget label="DIESE WOCHE" value={data.recent} color="#22C55E" context="neue Kontakte" />
    </div>
  );
}
