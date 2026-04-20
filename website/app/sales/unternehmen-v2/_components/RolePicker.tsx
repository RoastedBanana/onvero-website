'use client';

import { TOKENS } from '../_tokens';
import type { Role } from '../_lib/role-matcher';
import { ROLES } from '../_lib/role-matcher';

export default function RolePicker({
  selectedRole,
  onRoleChange,
  freetext,
  onFreetextChange,
  onSearchClick,
  searchLoading,
}: {
  selectedRole: Role | null;
  onRoleChange: (role: Role | null) => void;
  freetext: string;
  onFreetextChange: (v: string) => void;
  onSearchClick: () => void;
  searchLoading: boolean;
}) {
  return (
    <div
      style={{
        background: TOKENS.color.bgCard,
        border: `1px solid ${TOKENS.color.borderSubtle}`,
        borderRadius: TOKENS.radius.card,
        padding: '20px 22px',
        fontFamily: TOKENS.font.family,
        marginBottom: 16,
      }}
    >
      <div style={{ marginBottom: 4 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: TOKENS.color.textPrimary }}>Ansprechpartner finden</span>
        <p style={{ fontSize: 12, color: TOKENS.color.textTertiary, margin: '4px 0 14px', lineHeight: 1.5 }}>
          Wähle eine Rolle oder beschreibe freitextlich, wen du suchst.
        </p>
      </div>

      {/* Role chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {ROLES.map((role) => {
          const active = selectedRole?.id === role.id;
          return (
            <button
              key={role.id}
              onClick={() => onRoleChange(active ? null : role)}
              style={{
                fontSize: 11,
                fontWeight: 500,
                padding: '6px 14px',
                borderRadius: TOKENS.radius.pill,
                cursor: 'pointer',
                fontFamily: TOKENS.font.family,
                border: `1px solid ${active ? TOKENS.color.indigoBorderMedium : TOKENS.color.borderSubtle}`,
                background: active ? TOKENS.color.indigoBgSoft : TOKENS.color.bgSubtle,
                color: active ? TOKENS.color.indigoLight : TOKENS.color.textTertiary,
                transition: 'all 0.15s',
              }}
            >
              {role.label}
            </button>
          );
        })}
      </div>

      {/* Freetext + search button */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          value={freetext}
          onChange={(e) => onFreetextChange(e.target.value)}
          placeholder="Eigene Rolle eingeben..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSearchClick();
          }}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: TOKENS.radius.button,
            background: TOKENS.color.bgSubtle,
            border: `1px solid ${TOKENS.color.borderSubtle}`,
            color: TOKENS.color.textPrimary,
            fontSize: 12,
            fontFamily: TOKENS.font.family,
            outline: 'none',
          }}
        />
        <button
          onClick={onSearchClick}
          disabled={searchLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 18px',
            borderRadius: TOKENS.radius.button,
            background: searchLoading ? TOKENS.color.bgSubtle : TOKENS.color.indigo,
            border: searchLoading ? `1px solid ${TOKENS.color.borderSubtle}` : 'none',
            color: searchLoading ? TOKENS.color.textMuted : '#0a0a0a',
            fontSize: 12,
            fontWeight: 600,
            cursor: searchLoading ? 'default' : 'pointer',
            fontFamily: TOKENS.font.family,
            whiteSpace: 'nowrap',
          }}
        >
          {searchLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ animation: 'skeleton-pulse 1.2s ease-in-out infinite' }}>Suche läuft...</span>
            </span>
          ) : (
            <>
              Kontakte finden
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 500,
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: 'rgba(0,0,0,0.15)',
                  color: 'rgba(0,0,0,0.6)',
                }}
              >
                2 Cr
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
