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
        background: 'linear-gradient(135deg, rgba(107,122,255,0.04) 0%, transparent 100%)',
        border: '0.5px solid rgba(107,122,255,0.15)',
        borderRadius: TOKENS.radius.hero,
        padding: 24,
        fontFamily: TOKENS.font.family,
        marginBottom: 16,
        boxShadow: 'inset 0 1px 0 0 rgba(107,122,255,0.08)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: TOKENS.radius.button,
            background: 'rgba(107,122,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={TOKENS.color.indigoLight}
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 500, color: TOKENS.color.textPrimary }}>Ansprechpartner finden</div>
          <div style={{ fontSize: 12.5, color: TOKENS.color.textTertiary, marginTop: 2 }}>
            Wähle eine Rolle oder beschreibe freitextlich, wen du suchst.
          </div>
        </div>
      </div>

      {/* Role chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '16px 0' }}>
        {ROLES.map((role) => {
          const active = selectedRole?.id === role.id;
          return (
            <button
              key={role.id}
              onClick={() => onRoleChange(active ? null : role)}
              style={{
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                padding: '8px 14px',
                borderRadius: TOKENS.radius.button,
                cursor: 'pointer',
                fontFamily: TOKENS.font.family,
                border: active ? `0.5px solid ${TOKENS.color.indigo}` : `0.5px solid ${TOKENS.color.borderDefault}`,
                background: active ? TOKENS.color.indigo : TOKENS.color.indigoBgSubtle,
                color: active ? TOKENS.color.textOnAccent : 'rgba(242,243,247,0.75)',
                boxShadow: active ? '0 0 0 3px rgba(107,122,255,0.15), 0 4px 12px rgba(107,122,255,0.25)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {role.label}
            </button>
          );
        })}
      </div>

      {/* Freetext + search */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
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
            padding: '12px 14px',
            borderRadius: TOKENS.radius.button,
            background: TOKENS.color.bgInset,
            border: `0.5px solid ${TOKENS.color.borderDefault}`,
            color: TOKENS.color.textPrimary,
            fontSize: 13.5,
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
            gap: 10,
            padding: '10px 18px',
            borderRadius: TOKENS.radius.button,
            background: searchLoading
              ? TOKENS.color.bgSubtle
              : `linear-gradient(135deg, ${TOKENS.color.indigo} 0%, #7A89FF 100%)`,
            border: searchLoading ? `0.5px solid ${TOKENS.color.borderSubtle}` : 'none',
            color: searchLoading ? TOKENS.color.textMuted : TOKENS.color.textOnAccent,
            fontSize: 13,
            fontWeight: 600,
            cursor: searchLoading ? 'default' : 'pointer',
            fontFamily: TOKENS.font.family,
            whiteSpace: 'nowrap',
            boxShadow: searchLoading ? 'none' : '0 2px 8px rgba(107,122,255,0.2)',
            transition: 'all 0.15s ease',
          }}
        >
          {searchLoading ? 'Suche läuft...' : 'Kontakte finden'}
          {!searchLoading && (
            <span
              style={{
                background: 'rgba(0,0,0,0.2)',
                color: TOKENS.color.textOnAccent,
                fontFamily: TOKENS.font.mono,
                fontSize: 10.5,
                fontWeight: 600,
                padding: '2px 7px',
                borderRadius: 4,
              }}
            >
              2 Cr
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
