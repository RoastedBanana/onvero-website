'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useOnboarding } from '../_onboarding';
import { useTheme, colors } from '../layout';

// ─── Animations ──────────────────────────────────────────────────────────────

const PULSE_STYLE = `
@keyframes onvero-pulse-ring {
  0%   { box-shadow: 0 0 0 0 rgba(79,70,229,0.4); }
  70%  { box-shadow: 0 0 0 7px rgba(79,70,229,0); }
  100% { box-shadow: 0 0 0 0 rgba(79,70,229,0); }
}
.onvero-pulse { animation: onvero-pulse-ring 2s ease-out infinite; }
.onvero-expand {
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transition: max-height 0.3s ease, opacity 0.2s ease;
}
.onvero-expand.open {
  max-height: 600px;
  opacity: 1;
}
`;

// ─── Types & Data ─────────────────────────────────────────────────────────────

interface SubTask {
  id: string;
  title: string;
}

interface Task {
  id: string;
  title: string;
  time: string;
  description: string;
  cta: string;
  ctaHref: string;
  subtasks: SubTask[];
}

interface TaskGroup {
  id: string;
  title: string;
  accent: string;
  step: string;
  tasks: Task[];
}

const INITIAL_GROUPS: TaskGroup[] = [
  {
    id: 'icp',
    title: 'Zielkunden definieren',
    accent: '#4F46E5',
    step: '01',
    tasks: [
      {
        id: 'icp-1',
        title: 'ICP konfigurieren',
        time: '2–3 Min.',
        description:
          'Lege fest welche Branchen, Shop-Systeme und Unternehmensgrößen für dich relevant sind. Das System filtert automatisch passende Leads.',
        cta: 'ICP öffnen',
        ctaHref: '/intelligence/settings',
        subtasks: [
          { id: 'icp-1-a', title: 'Branchen auswählen (z.B. Mode, Elektronik, Sport)' },
          { id: 'icp-1-b', title: 'Relevante Shop-Systeme einschränken' },
          { id: 'icp-1-c', title: 'Mindest-Umsatz & Mitarbeiterzahl festlegen' },
        ],
      },
      {
        id: 'icp-2',
        title: 'Scoring-Gewichte anpassen',
        time: '1–2 Min.',
        description:
          'Bestimme wie stark Fit, Volumen und Timing in den Lead Score einfließen. Standard ist 40 / 35 / 25.',
        cta: 'Score-Einstellungen',
        ctaHref: '/intelligence/settings',
        subtasks: [
          { id: 'icp-2-a', title: 'Fit-Gewicht setzen (Standard 40%)' },
          { id: 'icp-2-b', title: 'Volumen-Gewicht setzen (Standard 35%)' },
          { id: 'icp-2-c', title: 'Timing-Gewicht setzen (Standard 25%)' },
        ],
      },
      {
        id: 'icp-3',
        title: 'Ausschluss-Carrier festlegen',
        time: '1 Min.',
        description:
          'Leads die bereits bei deinem Wunsch-Carrier sind, kannst du automatisch aus der Pipeline ausfiltern.',
        cta: 'Carrier ausschließen',
        ctaHref: '/intelligence/settings',
        subtasks: [
          { id: 'icp-3-a', title: 'Carrier aus Liste auswählen' },
          { id: 'icp-3-b', title: 'Ausschluss-Filter aktivieren' },
        ],
      },
    ],
  },
  {
    id: 'data',
    title: 'Daten anreichern',
    accent: '#7C3AED',
    step: '02',
    tasks: [
      {
        id: 'data-1',
        title: 'Stammdaten prüfen',
        time: '2 Min.',
        description:
          'Überprüfe ob Firmenname, Adresse und Handelsregisternummer für alle Leads korrekt befüllt sind. Stammdaten sind die Grundlage für alle weiteren Analysen.',
        cta: 'Daten prüfen',
        ctaHref: '/intelligence/qualifizierung',
        subtasks: [
          { id: 'data-1-a', title: 'Abdeckungsrate der Stammdaten prüfen' },
          { id: 'data-1-b', title: 'Fehlende Pflichtfelder identifizieren' },
          { id: 'data-1-c', title: 'Lücken manuell oder per Import schließen' },
        ],
      },
      {
        id: 'data-2',
        title: 'Firmendaten vervollständigen',
        time: '3–4 Min.',
        description:
          'Umsatz, Mitarbeiterzahl und Entscheider-Kontakte werden automatisch für DACH-Unternehmen ergänzt. Prüfe die Vollständigkeit deiner Leads.',
        cta: 'Firmendaten prüfen',
        ctaHref: '/intelligence/qualifizierung',
        subtasks: [
          { id: 'data-2-a', title: 'Firmendaten für bestehende Leads abrufen' },
          { id: 'data-2-b', title: 'Abdeckungsrate prüfen (Ziel: >80%)' },
          { id: 'data-2-c', title: 'Entscheider-Kontakte validieren' },
        ],
      },
      {
        id: 'data-3',
        title: 'Technographics aktivieren',
        time: '2–3 Min.',
        description:
          'Erkenne welches Shop-System ein Lead nutzt — Shopify, Shopware, WooCommerce oder andere. Entscheidend für eine passgenaue Erstansprache.',
        cta: 'Quellen ansehen',
        ctaHref: '/intelligence/integrations',
        subtasks: [
          { id: 'data-3-a', title: 'Quellen-Status & Coverage prüfen' },
          { id: 'data-3-b', title: 'Shop-System-Erkennung aktivieren' },
          { id: 'data-3-c', title: 'Ergebnisse an 3 Test-Leads validieren' },
        ],
      },
    ],
  },
  {
    id: 'signals',
    title: 'Kaufsignale verstehen',
    accent: '#0891B2',
    step: '03',
    tasks: [
      {
        id: 'sig-1',
        title: 'Ersten Signal-Feed ansehen',
        time: '1–2 Min.',
        description:
          'Kaufsignale zeigen dir wann ein Lead aktiv wechselbereit ist — Jobpostings, Funding-Runden oder negative Carrier-Reviews.',
        cta: 'Signals ansehen',
        ctaHref: '/intelligence/intent',
        subtasks: [
          { id: 'sig-1-a', title: 'Signal-Typen kennenlernen (Job / Churn / Funding)' },
          { id: 'sig-1-b', title: 'Filter nach Signalstärke einstellen' },
          { id: 'sig-1-c', title: 'Ersten Hot Lead mit aktivem Signal öffnen' },
        ],
      },
      {
        id: 'sig-2',
        title: 'Benachrichtigungen einrichten',
        time: '1 Min.',
        description:
          'Lass dich per E-Mail oder Slack benachrichtigen wenn ein neuer Hot Lead erkannt wird oder ein Kaufsignal eintrifft.',
        cta: 'Benachrichtigungen',
        ctaHref: '/intelligence/settings',
        subtasks: [
          { id: 'sig-2-a', title: 'E-Mail-Alerts für Hot Leads aktivieren' },
          { id: 'sig-2-b', title: 'Slack-Integration verbinden' },
          { id: 'sig-2-c', title: 'Score-Schwellenwert für Alerts festlegen' },
        ],
      },
    ],
  },
  {
    id: 'pipeline',
    title: 'Erste Leads bearbeiten',
    accent: '#059669',
    step: '04',
    tasks: [
      {
        id: 'pipe-1',
        title: 'Top-Leads im Detail ansehen',
        time: '5–10 Min.',
        description:
          'Öffne deine Top-Leads und überprüfe Score, Datenvollständigkeit und Kaufsignale. Priorisiere die mit Score > 80.',
        cta: 'Leads öffnen',
        ctaHref: '/intelligence/leads',
        subtasks: [
          { id: 'pipe-1-a', title: 'Score-Filter auf >80 setzen' },
          { id: 'pipe-1-b', title: 'Lead-Detail öffnen & Datenvollständigkeit prüfen' },
          { id: 'pipe-1-c', title: 'Aktive Kaufsignale im Detail lesen' },
        ],
      },
      {
        id: 'pipe-2',
        title: 'Leads nach Status sortieren',
        time: '2 Min.',
        description:
          'Nutze die Kanban-Ansicht um Leads in Hot, Warm und Kalt einzuteilen. Du kannst Karten per Drag & Drop verschieben.',
        cta: 'Kanban öffnen',
        ctaHref: '/intelligence/leads',
        subtasks: [
          { id: 'pipe-2-a', title: 'Kanban-Ansicht öffnen' },
          { id: 'pipe-2-b', title: 'Lead per Drag & Drop in Hot verschieben' },
          { id: 'pipe-2-c', title: 'Kalt-Leads prüfen und aussortieren' },
        ],
      },
      {
        id: 'pipe-3',
        title: 'Leads exportieren',
        time: '1 Min.',
        description:
          'Exportiere deine gefilterten Leads als CSV oder direkt als CRM-Import — bereit für deine Outreach-Sequenz.',
        cta: 'Export starten',
        ctaHref: '/intelligence/export',
        subtasks: [
          { id: 'pipe-3-a', title: 'Status- und Score-Filter setzen' },
          { id: 'pipe-3-b', title: 'Export-Format wählen (CSV / HubSpot / Pipedrive)' },
          { id: 'pipe-3-c', title: 'Download starten' },
        ],
      },
    ],
  },
];

// ─── Task row ─────────────────────────────────────────────────────────────────

function TaskStatusIcon({
  done,
  active,
  accent,
  onToggle,
  c,
}: {
  done: boolean;
  active: boolean;
  accent: string;
  onToggle: () => void;
  c: ReturnType<typeof colors>;
}) {
  if (done) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: accent,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'transform 0.15s',
        }}
      >
        <svg
          width="11"
          height="11"
          viewBox="0 0 12 12"
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="2 6 5 9 10 3" />
        </svg>
      </button>
    );
  }
  if (active) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="onvero-pulse"
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: `${accent}18`,
          border: `2px solid ${accent}`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: accent }} />
      </button>
    );
  }
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      style={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        background: c.bgCard,
        border: `2px solid ${c.borderStrong}`,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'border-color 0.15s',
      }}
    />
  );
}

function SubTaskItem({
  sub,
  done,
  accent,
  c,
}: {
  sub: SubTask;
  done: boolean;
  accent: string;
  c: ReturnType<typeof colors>;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: done ? accent : c.bgHover,
          border: done ? 'none' : `1.5px solid ${c.borderStrong}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {done && (
          <svg
            width="8"
            height="8"
            viewBox="0 0 10 10"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="1.5 5 4 7.5 8.5 2.5" />
          </svg>
        )}
      </div>
      <span
        style={{
          fontSize: 11,
          color: done ? c.textMuted : c.textSub,
          fontWeight: 600,
          textDecoration: done ? 'line-through' : 'none',
        }}
      >
        {sub.title}
      </span>
    </div>
  );
}

function TaskRow({
  task,
  done,
  active,
  accent,
  onToggle,
  isLast,
  defaultExpanded,
  c,
  isDark,
}: {
  task: Task;
  done: boolean;
  active: boolean;
  accent: string;
  onToggle: (id: string) => void;
  isLast: boolean;
  defaultExpanded: boolean;
  c: ReturnType<typeof colors>;
  isDark: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [hovered, setHovered] = useState(false);

  const statusLabel = done ? 'Erledigt' : active ? 'Aktiv' : 'Ausstehend';
  const statusBg = done ? (isDark ? '#059669' + '20' : '#F0FDF4') : active ? `${accent}15` : c.bgHover;
  const statusColor = done ? '#059669' : active ? accent : c.textMuted;

  return (
    <div
      style={{
        borderBottom: isLast ? 'none' : `1px solid ${c.border}`,
        background: done ? c.bgPage : active && expanded ? `${accent}06` : hovered ? c.bgHover : c.bgCard,
        transition: 'background 0.15s',
        borderLeft: active && !done ? `3px solid ${accent}` : '3px solid transparent',
      }}
    >
      {/* Header row — always visible, click to expand */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => !done && setExpanded((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          padding: '14px 20px 14px 18px',
          cursor: done ? 'default' : 'pointer',
          userSelect: 'none',
        }}
      >
        {/* Icon + line */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginRight: 13,
            flexShrink: 0,
            alignSelf: 'stretch',
          }}
        >
          <TaskStatusIcon done={done} active={active} accent={accent} onToggle={() => onToggle(task.id)} c={c} />
          {!isLast && (
            <div
              style={{ width: 0, flex: 1, minHeight: 10, borderLeft: `1.5px dashed ${c.borderStrong}`, marginTop: 5 }}
            />
          )}
        </div>

        {/* Title + badges */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: done ? c.textMuted : c.text,
                textDecoration: done ? 'line-through' : 'none',
              }}
            >
              {task.title}
            </span>
            {/* Status pill */}
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                background: statusBg,
                color: statusColor,
                padding: '2px 8px',
                borderRadius: 99,
                letterSpacing: '0.03em',
              }}
            >
              {statusLabel}
            </span>
            {/* Time badge */}
            {!done && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 10,
                  color: c.textMuted,
                  fontWeight: 600,
                }}
              >
                <svg
                  width="9"
                  height="9"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <circle cx="8" cy="8" r="6.5" />
                  <polyline points="8 4.5 8 8.5 10.5 10.5" />
                </svg>
                {task.time}
              </span>
            )}
          </div>
        </div>

        {/* Expand chevron */}
        {!done && (
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="none"
            stroke={c.borderStrong}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              flexShrink: 0,
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          >
            <polyline points="4 6 8 10 12 6" />
          </svg>
        )}
      </div>

      {/* Expandable body */}
      <div className={`onvero-expand${expanded && !done ? ' open' : ''}`}>
        <div style={{ padding: '0 20px 16px 55px' }}>
          {/* Description */}
          <p style={{ fontSize: 12, color: c.textSub, lineHeight: 1.65, margin: '0 0 14px' }}>{task.description}</p>

          {/* Subtasks */}
          <div
            style={{
              background: c.bgPage,
              border: `1px solid ${c.border}`,
              borderRadius: 10,
              padding: '8px 14px',
              marginBottom: 14,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: c.textMuted,
                marginBottom: 4,
              }}
            >
              Teilschritte
            </div>
            {task.subtasks.map((sub, i) => (
              <div key={sub.id}>
                <SubTaskItem sub={sub} done={false} accent={accent} c={c} />
                {i < task.subtasks.length - 1 && (
                  <div style={{ marginLeft: 8, borderLeft: `1px dashed ${c.borderStrong}`, height: 4 }} />
                )}
              </div>
            ))}
          </div>

          {/* CTA */}
          <Link
            href={task.ctaHref}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 16px',
              background: accent,
              color: '#fff',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            {task.cta}
            <svg
              width="10"
              height="10"
              viewBox="0 0 12 12"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 6h8M6 2l4 4-4 4" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Task group card ──────────────────────────────────────────────────────────

function TaskGroupCard({
  group,
  doneIds,
  onToggleTask,
  open,
  onOpenToggle,
  stepIndex,
  c,
  isDark,
}: {
  group: TaskGroup;
  doneIds: Set<string>;
  onToggleTask: (id: string) => void;
  open: boolean;
  onOpenToggle: (id: string) => void;
  stepIndex: number;
  c: ReturnType<typeof colors>;
  isDark: boolean;
}) {
  const doneTasks = group.tasks.filter((t) => doneIds.has(t.id)).length;
  const total = group.tasks.length;
  const allDone = doneTasks === total;
  const firstPendingIdx = group.tasks.findIndex((t) => !doneIds.has(t.id));
  const pct = total ? Math.round((doneTasks / total) * 100) : 0;

  return (
    <div
      style={{
        background: c.bgCard,
        border: `1px solid ${open ? `${group.accent}30` : c.border}`,
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: open ? `0 4px 20px ${group.accent}0D` : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Colored top bar */}
      <div
        style={{
          height: 3,
          background: allDone ? '#059669' : open ? group.accent : c.border,
          transition: 'background 0.3s',
        }}
      />

      {/* Group header */}
      <button
        onClick={() => onOpenToggle(group.id)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '16px 22px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'var(--font-inter), sans-serif',
          borderBottom: open ? `1px solid ${c.border}` : 'none',
        }}
      >
        {/* Step number badge */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: allDone ? group.accent : open ? `${group.accent}15` : c.bgPage,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.2s',
          }}
        >
          {allDone ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="2 7 5.5 10.5 12 3.5" />
            </svg>
          ) : (
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: open ? group.accent : c.textMuted,
                letterSpacing: '0.02em',
                fontFamily: 'var(--font-inter), sans-serif',
              }}
            >
              {String(stepIndex + 1).padStart(2, '0')}
            </span>
          )}
        </div>

        {/* Title + subtitle */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: allDone ? '#059669' : c.text, lineHeight: 1.2 }}>
            {group.title}
          </div>
          <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2, fontWeight: 600 }}>
            {allDone ? 'Abgeschlossen' : `${doneTasks} von ${total} erledigt`}
          </div>
        </div>

        {/* Progress bar + pct */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 80, height: 4, background: c.bgHover, borderRadius: 99 }}>
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                background: allDone ? '#059669' : group.accent,
                borderRadius: 99,
                transition: 'width 0.35s ease',
              }}
            />
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: allDone ? '#059669' : pct > 0 ? group.accent : c.borderStrong,
              minWidth: 32,
              textAlign: 'right',
            }}
          >
            {pct}%
          </span>
        </div>

        {/* Chevron */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke={c.borderStrong}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}
        >
          <polyline points="4 6 8 10 12 6" />
        </svg>
      </button>

      {/* Tasks */}
      {open &&
        group.tasks.map((task, idx) => (
          <TaskRow
            key={task.id}
            task={task}
            done={doneIds.has(task.id)}
            active={idx === firstPendingIdx}
            accent={group.accent}
            onToggle={onToggleTask}
            isLast={idx === group.tasks.length - 1}
            defaultExpanded={idx === firstPendingIdx}
            c={c}
            isDark={isDark}
          />
        ))}
    </div>
  );
}

// ─── Progress ring ────────────────────────────────────────────────────────────

function ProgressRing({ pct, c }: { pct: number; c: ReturnType<typeof colors> }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);
  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <circle cx="48" cy="48" r={r} fill="none" stroke={c.bgHover} strokeWidth="7" />
      <circle
        cx="48"
        cy="48"
        r={r}
        fill="none"
        stroke={c.accent}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform="rotate(-90 48 48)"
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
      <text
        x="48"
        y="52"
        textAnchor="middle"
        fontSize="17"
        fontWeight="800"
        fill={c.text}
        fontFamily="var(--font-inter), sans-serif"
      >
        {pct}%
      </text>
    </svg>
  );
}

// ─── Integration logos ────────────────────────────────────────────────────────

const INTEGRATION_LOGOS: Record<string, React.ReactNode> = {
  slack: (
    <svg width="20" height="20" viewBox="0 0 122 122" xmlns="http://www.w3.org/2000/svg">
      <path d="M25.6 76.8c0 7.1-5.8 12.8-12.8 12.8S0 83.9 0 76.8s5.8-12.8 12.8-12.8H25.6v12.8z" fill="#E01E5A" />
      <path
        d="M32 76.8c0-7.1 5.8-12.8 12.8-12.8s12.8 5.8 12.8 12.8v32c0 7.1-5.8 12.8-12.8 12.8S32 115.9 32 108.8V76.8z"
        fill="#E01E5A"
      />
      <path d="M44.8 25.6c-7.1 0-12.8-5.8-12.8-12.8S37.7 0 44.8 0s12.8 5.8 12.8 12.8V25.6H44.8z" fill="#36C5F0" />
      <path
        d="M44.8 32c7.1 0 12.8 5.8 12.8 12.8S51.9 57.6 44.8 57.6H12.8C5.8 57.6 0 51.9 0 44.8S5.8 32 12.8 32h32z"
        fill="#36C5F0"
      />
      <path d="M96 44.8c0-7.1 5.8-12.8 12.8-12.8S121.6 37.7 121.6 44.8s-5.8 12.8-12.8 12.8H96V44.8z" fill="#2EB67D" />
      <path
        d="M89.6 44.8c0 7.1-5.8 12.8-12.8 12.8S64 51.9 64 44.8V12.8C64 5.8 69.8 0 76.8 0s12.8 5.8 12.8 12.8v32z"
        fill="#2EB67D"
      />
      <path d="M76.8 96c7.1 0 12.8 5.8 12.8 12.8s-5.8 12.8-12.8 12.8-12.8-5.8-12.8-12.8V96h12.8z" fill="#ECB22E" />
      <path
        d="M76.8 89.6c-7.1 0-12.8-5.8-12.8-12.8S69.7 64 76.8 64h32c7.1 0 12.8 5.8 12.8 12.8s-5.8 12.8-12.8 12.8h-32z"
        fill="#ECB22E"
      />
    </svg>
  ),
  gcal: (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="17" rx="2" fill="#fff" stroke="#E8ECF0" strokeWidth="1" />
      <rect x="3" y="4" width="18" height="5" rx="2" fill="#1A73E8" />
      <rect x="3" y="7" width="18" height="2" fill="#1A73E8" />
      <line x1="8" y1="4" x2="8" y2="7" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="4" x2="16" y2="7" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <rect x="6" y="12" width="3" height="2.5" rx=".5" fill="#EA4335" />
      <rect x="10.5" y="12" width="3" height="2.5" rx=".5" fill="#34A853" />
      <rect x="15" y="12" width="3" height="2.5" rx=".5" fill="#FBBC04" />
      <rect x="6" y="16" width="3" height="2.5" rx=".5" fill="#4285F4" />
      <rect x="10.5" y="16" width="3" height="2.5" rx=".5" fill="#EA4335" />
    </svg>
  ),
  teams: (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.5 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" fill="#5059C9" />
      <path
        d="M13.5 7h5a1.5 1.5 0 0 1 1.5 1.5v5A1.5 1.5 0 0 1 18.5 15H17v2.5L14.5 15H13.5A1.5 1.5 0 0 1 12 13.5v-5A1.5 1.5 0 0 1 13.5 7z"
        fill="#5059C9"
      />
      <circle cx="9" cy="5.5" r="2.5" fill="#7B83EB" />
      <path
        d="M2.5 9A1.5 1.5 0 0 1 4 7.5h10A1.5 1.5 0 0 1 15.5 9v6a1.5 1.5 0 0 1-1.5 1.5H9.5L6 19.5V16.5H4A1.5 1.5 0 0 1 2.5 15V9z"
        fill="#7B83EB"
      />
      <text x="9" y="14" textAnchor="middle" fontSize="6" fontWeight="800" fill="#fff" fontFamily="sans-serif">
        T
      </text>
    </svg>
  ),
  hubspot: (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.5 7.5V5a1.5 1.5 0 1 0-3 0v2.5A5 5 0 1 0 14.5 7.5z" fill="#FF7A59" />
      <circle cx="12" cy="14" r="3.2" fill="#fff" />
      <circle cx="12" cy="14" r="1.8" fill="#FF7A59" />
    </svg>
  ),
  zapier: (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#FF4A00" />
      <path
        d="M15.5 8.5H9l5.5 3.5H8.5"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M8.5 15.5H15l-5.5-3.5H16"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  webhook: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 3H6a2 2 0 0 0-2 2v4" stroke="#4F46E5" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M14 3h4a2 2 0 0 1 2 2v4" stroke="#4F46E5" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M12 3v7m0 0-3 5m3-5 3 5"
        stroke="#4F46E5"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="5" cy="18" r="2" stroke="#4F46E5" strokeWidth="1.6" />
      <circle cx="12" cy="20" r="2" stroke="#4F46E5" strokeWidth="1.6" />
      <circle cx="19" cy="18" r="2" stroke="#4F46E5" strokeWidth="1.6" />
    </svg>
  ),
};

// ─── Integration card ─────────────────────────────────────────────────────────

const TOP_INTEGRATIONS = [
  { id: 'slack', name: 'Slack', description: 'Hot-Lead-Alerts in deinen Channel', color: '#4A154B', bg: '#F5EEF5' },
  {
    id: 'gcal',
    name: 'Google Calendar',
    description: 'Termin-Sync und Meeting-Vorbereitung',
    color: '#4285F4',
    bg: '#EEF3FE',
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Meeting-Links direkt aus dem Lead',
    color: '#5059C9',
    bg: '#EEEEFF',
  },
  { id: 'hubspot', name: 'HubSpot', description: 'Leads automatisch ins CRM pushen', color: '#FF7A59', bg: '#FFF0EB' },
  { id: 'zapier', name: 'Zapier', description: 'Mit 5.000+ Apps verbinden', color: '#FF4A00', bg: '#FFF3EE' },
  {
    id: 'webhook',
    name: 'Webhook / API',
    description: 'Eigene Systeme per REST anbinden',
    color: '#4F46E5',
    bg: '#EEF0FF',
  },
];

function IntegrationRow({
  intg,
  connected,
  isLast,
  c,
  isDark,
}: {
  intg: (typeof TOP_INTEGRATIONS)[0];
  connected: boolean;
  isLast: boolean;
  c: ReturnType<typeof colors>;
  isDark: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        borderBottom: isLast ? 'none' : `1px solid ${c.border}`,
        background: connected ? c.bgPage : hovered && !expanded ? c.bgHover : expanded ? `${intg.color}05` : c.bgCard,
        transition: 'background 0.15s',
        borderLeft: !connected && expanded ? `3px solid ${intg.color}` : '3px solid transparent',
      }}
    >
      {/* Header row */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => !connected && setExpanded((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '14px 20px 14px 18px',
          gap: 0,
          cursor: connected ? 'default' : 'pointer',
          userSelect: 'none',
        }}
      >
        {/* Status icon + connecting line */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginRight: 13,
            flexShrink: 0,
            alignSelf: 'stretch',
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: connected ? '#059669' : c.bgPage,
              border: connected ? 'none' : `2px solid ${c.borderStrong}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {connected && (
              <svg
                width="11"
                height="11"
                viewBox="0 0 12 12"
                fill="none"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="2 6 5 9 10 3" />
              </svg>
            )}
          </div>
          {!isLast && (
            <div
              style={{ width: 0, flex: 1, minHeight: 10, borderLeft: `1.5px dashed ${c.borderStrong}`, marginTop: 5 }}
            />
          )}
        </div>

        {/* Logo */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: intg.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginRight: 12,
          }}
        >
          {INTEGRATION_LOGOS[intg.id]}
        </div>

        {/* Name + description */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: connected ? c.textMuted : c.text }}>{intg.name}</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                background: connected ? (isDark ? '#059669' + '20' : '#F0FDF4') : c.bgHover,
                color: connected ? '#059669' : c.textMuted,
                padding: '2px 8px',
                borderRadius: 99,
                letterSpacing: '0.03em',
              }}
            >
              {connected ? 'Verbunden' : 'Ausstehend'}
            </span>
          </div>
          <div style={{ fontSize: 11, color: c.textMuted, marginTop: 1, fontWeight: 600 }}>{intg.description}</div>
        </div>

        {/* Expand chevron */}
        {!connected && (
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="none"
            stroke={c.borderStrong}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              flexShrink: 0,
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          >
            <polyline points="4 6 8 10 12 6" />
          </svg>
        )}
      </div>

      {/* Expanded body */}
      <div className={`onvero-expand${expanded && !connected ? ' open' : ''}`}>
        <div style={{ padding: '0 20px 16px 69px' }}>
          <a
            href="/intelligence/integrations"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 16px',
              background: intg.color,
              color: '#fff',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Jetzt verbinden
            <svg
              width="10"
              height="10"
              viewBox="0 0 12 12"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 6h8M6 2l4 4-4 4" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

function IntegrationsGroupCard({
  open,
  onToggle,
  c,
  isDark,
}: {
  open: boolean;
  onToggle: () => void;
  c: ReturnType<typeof colors>;
  isDark: boolean;
}) {
  const connected = TOP_INTEGRATIONS.filter((_, i) => i < 0).length;
  const total = TOP_INTEGRATIONS.length;
  const pct = total ? Math.round((connected / total) * 100) : 0;

  return (
    <div
      style={{
        background: c.bgCard,
        border: `1px solid ${open ? 'rgba(8,145,178,0.2)' : c.border}`,
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: open ? '0 4px 20px rgba(8,145,178,0.06)' : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: 3, background: open ? '#0891B2' : c.border, transition: 'background 0.3s' }} />

      {/* Header */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '16px 22px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'var(--font-inter), sans-serif',
          borderBottom: open ? `1px solid ${c.border}` : 'none',
        }}
      >
        {/* Icon badge */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: open ? 'rgba(8,145,178,0.12)' : c.bgPage,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.2s',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke={open ? '#0891B2' : c.textMuted}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="3" cy="8" r="2" />
            <circle cx="13" cy="4" r="2" />
            <circle cx="13" cy="12" r="2" />
            <path d="M5 8h3l3-3.2M5 8h3l3 3.2" />
          </svg>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: c.text, lineHeight: 1.2 }}>Wichtige Verbindungen</div>
          <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2, fontWeight: 600 }}>
            {connected === 0 ? 'Noch keine Integration verbunden' : `${connected} von ${total} verbunden`}
          </div>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 80, height: 4, background: c.bgHover, borderRadius: 99 }}>
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                background: '#0891B2',
                borderRadius: 99,
                transition: 'width 0.35s ease',
              }}
            />
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: pct > 0 ? '#0891B2' : c.borderStrong,
              minWidth: 32,
              textAlign: 'right',
            }}
          >
            {pct}%
          </span>
        </div>

        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke={c.borderStrong}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}
        >
          <polyline points="4 6 8 10 12 6" />
        </svg>
      </button>

      {/* Integration rows */}
      {open &&
        TOP_INTEGRATIONS.map((intg, idx) => (
          <IntegrationRow
            key={intg.id}
            intg={intg}
            connected={false}
            isLast={idx === TOP_INTEGRATIONS.length - 1}
            c={c}
            isDark={isDark}
          />
        ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SetupPage() {
  const { theme } = useTheme();
  const c = colors(theme);
  const isDark = theme === 'dark';

  const { doneIds, toggleTask, refresh, doneCount, totalCount } = useOnboarding();
  const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
  const [openGroupId, setOpenGroupId] = useState<string>(INITIAL_GROUPS[0].id);

  useEffect(() => {
    refresh();
  }, [refresh]);
  const [integrationsOpen, setIntegrationsOpen] = useState(false);

  function handleOpenToggle(id: string) {
    setOpenGroupId((prev) => (prev === id ? '' : id));
  }

  return (
    <div
      style={{
        minHeight: '100%',
        background: c.bgPage,
        fontFamily: 'var(--font-inter), sans-serif',
        color: c.text,
      }}
    >
      <style>{PULSE_STYLE}</style>
      {/* Hero */}
      <div
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #1C1D26 0%, #13141A 100%)'
            : 'linear-gradient(135deg, #EEF0FF 0%, #F0F4FF 60%, #F7F8FC 100%)',
          borderBottom: `1px solid ${c.border}`,
          padding: '28px 40px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 32,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: isDark ? c.accent + '20' : '#EEF0FF',
              color: c.accent,
              borderRadius: 99,
              padding: '3px 10px',
              fontSize: 10,
              fontWeight: 700,
              marginBottom: 14,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: c.accent }} />
            Erste Schritte
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: c.text, margin: '0 0 8px', lineHeight: 1.25 }}>
            Dein personalisiertes Onboarding
          </h1>
          <p style={{ fontSize: 13, color: c.textSub, lineHeight: 1.6, margin: '0 0 20px', maxWidth: 460 }}>
            Schließe die folgenden Schritte ab um das volle Potenzial deines Lead-Systems zu nutzen.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, maxWidth: 300, height: 5, background: c.bgHover, borderRadius: 99 }}>
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${c.accent}, #7C3AED)`,
                  borderRadius: 99,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: c.accent }}>
              {doneCount} / {totalCount} abgeschlossen
            </span>
          </div>
        </div>

        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <ProgressRing pct={pct} c={c} />
          {pct === 100 && <span style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>Alles erledigt</span>}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '28px 40px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* ── Task groups ── */}
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: c.textSub,
              marginBottom: 12,
              margin: '0 0 12px',
            }}
          >
            Deine Aufgaben
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {INITIAL_GROUPS.map((group, idx) => (
              <TaskGroupCard
                key={group.id}
                group={group}
                doneIds={doneIds}
                onToggleTask={toggleTask}
                open={openGroupId === group.id}
                onOpenToggle={handleOpenToggle}
                stepIndex={idx}
                c={c}
                isDark={isDark}
              />
            ))}
          </div>
        </div>

        {/* ── Integrations ── */}
        <IntegrationsGroupCard
          open={integrationsOpen}
          onToggle={() => setIntegrationsOpen((v) => !v)}
          c={c}
          isDark={isDark}
        />

        {/* ── Mehr entdecken ── */}
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: c.textSub,
              marginBottom: 12,
              margin: '0 0 12px',
            }}
          >
            Mehr entdecken
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              {
                icon: (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="#4F46E5"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="8 1.5 1.5 5 8 8.5 14.5 5 8 1.5" />
                    <polyline points="1.5 11 8 14.5 14.5 11" />
                    <polyline points="1.5 8 8 11.5 14.5 8" />
                  </svg>
                ),
                bg: isDark ? '#4F46E5' + '20' : '#EEF0FF',
                color: '#4F46E5',
                title: 'Datenanreicherung',
                body: 'Verstehe wie Firmendaten, Technologie-Infos und Kaufsignale zusammenspielen und wie Leads bewertet werden.',
                href: '/intelligence/qualifizierung',
                cta: 'Mehr erfahren',
              },
              {
                icon: (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="#7C3AED"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="9 1.5 2 9.5 8 9.5 7 14.5 14 6.5 8 6.5 9 1.5" />
                  </svg>
                ),
                bg: isDark ? '#7C3AED' + '20' : '#F5F3FF',
                color: '#7C3AED',
                title: 'Kaufsignale lesen',
                body: 'Lerne wie du Jobpostings, Funding-Daten und Review-Signale nutzt um den perfekten Zeitpunkt für die Erstansprache zu finden.',
                href: '/intelligence/intent',
                cta: 'Signals ansehen',
              },
              {
                icon: (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="#059669"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <ellipse cx="8" cy="4" rx="5.5" ry="2" />
                    <path d="M2.5 4v3c0 1.1 2.46 2 5.5 2s5.5-.9 5.5-2V4" />
                    <path d="M2.5 7v3c0 1.1 2.46 2 5.5 2s5.5-.9 5.5-2V7" />
                  </svg>
                ),
                bg: isDark ? '#059669' + '20' : '#ECFDF5',
                color: '#059669',
                title: 'Datenquellen verwalten',
                body: 'Überblicke alle aktiven und geplanten Datenquellen. Sieh Coverage-Raten, Kosten und wann zuletzt synchronisiert wurde.',
                href: '/intelligence/integrations',
                cta: 'Quellen ansehen',
              },
            ].map((card) => (
              <DiscoverCard key={card.title} card={card} c={c} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Discover card ────────────────────────────────────────────────────────────

function DiscoverCard({
  card,
  c,
}: {
  card: {
    icon: React.ReactNode;
    bg: string;
    color: string;
    title: string;
    body: string;
    href: string;
    cta: string;
  };
  c: ReturnType<typeof colors>;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: c.bgCard,
        border: `1px solid ${hovered ? c.accent + '60' : c.border}`,
        borderRadius: 14,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: hovered ? '0 2px 12px rgba(79,70,229,0.07)' : 'none',
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: card.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {card.icon}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: c.text, marginBottom: 5 }}>{card.title}</div>
        <p style={{ fontSize: 12, color: c.textSub, lineHeight: 1.6, margin: 0 }}>{card.body}</p>
      </div>
      <Link
        href={card.href}
        style={{
          display: 'inline-block',
          padding: '6px 14px',
          background: c.accent,
          color: '#fff',
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 700,
          textDecoration: 'none',
          alignSelf: 'flex-start',
          marginTop: 'auto',
        }}
      >
        {card.cta}
      </Link>
    </div>
  );
}
