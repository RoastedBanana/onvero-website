'use client';

import { TOKENS } from '../_tokens';

export type TabKey = 'uebersicht' | 'analyse' | 'kontakte' | 'outreach' | 'aktivitaet';

const TABS: { key: TabKey; label: string; badgeKey?: 'contacts' }[] = [
  { key: 'uebersicht', label: 'Übersicht' },
  { key: 'analyse', label: 'KI-Analyse' },
  { key: 'kontakte', label: 'Ansprechpartner', badgeKey: 'contacts' },
  { key: 'outreach', label: 'Outreach' },
  { key: 'aktivitaet', label: 'Aktivität' },
];

export default function TabBar({
  activeTab,
  onTabChange,
  contactsCount,
}: {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  contactsCount: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 0,
        borderBottom: `0.5px solid ${TOKENS.color.borderSubtle}`,
        marginBottom: 20,
        marginTop: 16,
        fontFamily: TOKENS.font.family,
      }}
    >
      {TABS.map((tab) => {
        const active = activeTab === tab.key;
        const badge = tab.badgeKey === 'contacts' && contactsCount > 0 ? contactsCount : null;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            style={{
              padding: '10px 18px',
              fontSize: 13.5,
              fontWeight: active ? 500 : 400,
              color: active ? TOKENS.color.textPrimary : TOKENS.color.textTertiary,
              background: 'transparent',
              border: 'none',
              borderBottom: active ? `1.5px solid ${TOKENS.color.indigo}` : '1.5px solid transparent',
              marginBottom: active ? '-0.5px' : 0,
              cursor: 'pointer',
              fontFamily: TOKENS.font.family,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'color 0.15s',
            }}
          >
            {tab.label}
            {badge !== null && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  background: 'rgba(107,122,255,0.2)',
                  color: TOKENS.color.indigoLight,
                  fontFamily: TOKENS.font.mono,
                }}
              >
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
