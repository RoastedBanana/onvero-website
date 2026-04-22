'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { TOKENS } from '../_tokens';
import { useContacts } from '../_hooks/useContacts';
import { useContactSearch } from '../_hooks/useContactSearch';
import { useContactEnrich } from '../_hooks/useContactEnrich';
import type { ApolloPerson } from '../_types';
import EnrichedContactCard from './EnrichedContactCard';

export default function ContactsTab({ leadId }: { leadId: string }) {
  const { contacts: savedContacts, refetch: refetchContacts } = useContacts(leadId);
  const { searchResults, searchLoading, searchError, search, clearResults } = useContactSearch(leadId);
  const { enrich, error: enrichError } = useContactEnrich(leadId);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<ApolloPerson | null>(null);
  const [opts, setOpts] = useState({ get_email: true, get_telephone: false, generate_email: true });
  const [enriching, setEnriching] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Open the modal and start the search
  async function handleOpenFinder() {
    setModalOpen(true);
    setSelectedPerson(null);
    setSuccessMsg(null);
    clearResults();
    await search();
  }

  function handleClose() {
    if (enriching) return;
    setModalOpen(false);
    setSelectedPerson(null);
    clearResults();
  }

  const savedIds = new Set(savedContacts.map((c) => c.apollo_person_id).filter(Boolean));
  const availableResults = searchResults.filter((p) => !savedIds.has(p.apollo_person_id));

  const cost = (opts.get_email ? 2 : 0) + (opts.get_telephone ? 8 : 0); // email draft is free
  const canEnrich =
    selectedPerson !== null &&
    selectedPerson.apollo_person_id !== null &&
    (opts.get_email || opts.get_telephone || opts.generate_email) &&
    !enriching;

  async function handleEnrich() {
    if (!selectedPerson?.apollo_person_id) return;
    setEnriching(true);
    try {
      const result = await enrich({
        apolloPersonId: selectedPerson.apollo_person_id,
        rawApolloPerson: (selectedPerson.raw_apollo_person as Record<string, unknown>) ?? {},
        getEmail: opts.get_email,
        getPhone: opts.get_telephone,
        generateEmail: opts.generate_email,
      });
      if (result && (result as { success?: boolean }).success !== false) {
        const msg = (result as { message?: string }).message ||
          `${selectedPerson.full_name ?? selectedPerson.first_name ?? 'Ansprechpartner'} gespeichert.`;
        setSuccessMsg(msg);
        await refetchContacts();
        setModalOpen(false);
        setSelectedPerson(null);
        clearResults();
      }
    } finally {
      setEnriching(false);
    }
  }

  async function handleGenerateEmail(contact: (typeof savedContacts)[0]) {
    if (!contact.apollo_person_id) return;
    await enrich({
      apolloPersonId: contact.apollo_person_id,
      rawApolloPerson: (contact.raw_apollo_person as Record<string, unknown>) ?? {},
      getEmail: false,
      getPhone: false,
      generateEmail: true,
    });
    await refetchContacts();
  }

  function handleOpenMail(contact: (typeof savedContacts)[0]) {
    if (contact.email) {
      const subject = encodeURIComponent(contact.email_draft_subject ?? '');
      const body = encodeURIComponent(contact.email_draft_body ?? '');
      window.open(`mailto:${contact.email}?subject=${subject}&body=${body}`, '_self');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: TOKENS.font.family }}>
      {/* Find Button */}
      <div
        style={{
          padding: 24,
          borderRadius: TOKENS.radius.card,
          background: TOKENS.color.bgCard,
          border: `1px solid ${TOKENS.color.borderSubtle}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          textAlign: 'center',
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 600,
              color: TOKENS.color.textPrimary,
              letterSpacing: '-0.01em',
            }}
          >
            Ansprechpartner finden
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: TOKENS.color.textTertiary }}>
            Suche Entscheider:innen bei diesem Unternehmen
          </p>
        </div>

        <button
          onClick={handleOpenFinder}
          disabled={searchLoading}
          style={{
            padding: '11px 28px',
            borderRadius: 10,
            background: 'linear-gradient(135deg, #6366F1, #818CF8)',
            border: 'none',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: TOKENS.font.family,
            cursor: searchLoading ? 'wait' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow:
              '0 2px 14px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
            animation: searchLoading ? 'none' : 'breatheGlow 2.5s ease infinite',
            transition: 'all 0.15s ease',
          }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          Ansprechpartner finden
        </button>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: TOKENS.radius.card,
            background: 'rgba(52,211,153,0.08)',
            border: '1px solid rgba(52,211,153,0.2)',
            fontSize: 13,
            color: '#34D399',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          {successMsg}
        </div>
      )}

      {/* Error */}
      {enrichError && !modalOpen && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: TOKENS.radius.card,
            background: TOKENS.color.amberBg,
            border: `1px solid ${TOKENS.color.amberBorder}`,
            fontSize: 13,
            color: TOKENS.color.amber,
          }}
        >
          {enrichError}
        </div>
      )}

      {/* Saved contacts */}
      {savedContacts.length > 0 && (
        <div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.06em',
              color: TOKENS.color.textMuted,
              display: 'block',
              marginBottom: 10,
            }}
          >
            ANSPRECHPARTNER ({savedContacts.length})
          </span>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: 12,
            }}
          >
            {savedContacts.map((c) => (
              <EnrichedContactCard
                key={c.id}
                contact={c}
                onGenerateEmail={() => handleGenerateEmail(c)}
                onOpenMail={() => handleOpenMail(c)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <FinderModal
          searchLoading={searchLoading}
          searchError={searchError}
          results={availableResults}
          selectedPerson={selectedPerson}
          onSelect={setSelectedPerson}
          opts={opts}
          onOptsChange={setOpts}
          enriching={enriching}
          cost={cost}
          canEnrich={canEnrich}
          onClose={handleClose}
          onEnrich={handleEnrich}
          onRetrySearch={search}
        />
      )}
    </div>
  );
}

// ─── Modal ──────────────────────────────────────────────────────────────────

function FinderModal({
  searchLoading,
  searchError,
  results,
  selectedPerson,
  onSelect,
  opts,
  onOptsChange,
  enriching,
  cost,
  canEnrich,
  onClose,
  onEnrich,
  onRetrySearch,
}: {
  searchLoading: boolean;
  searchError: string | null;
  results: ApolloPerson[];
  selectedPerson: ApolloPerson | null;
  onSelect: (p: ApolloPerson | null) => void;
  opts: { get_email: boolean; get_telephone: boolean; generate_email: boolean };
  onOptsChange: (fn: (prev: typeof opts) => typeof opts) => void;
  enriching: boolean;
  cost: number;
  canEnrich: boolean;
  onClose: () => void;
  onEnrich: () => void;
  onRetrySearch: () => void;
}) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <>
      <style>{`
        @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalSlideUp { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes modalShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          paddingTop: 48, paddingBottom: 48, overflowY: 'auto',
          animation: 'modalFadeIn 0.15s ease both',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 640,
            background: TOKENS.color.bgCard,
            border: `1px solid ${TOKENS.color.borderSubtle}`,
            borderRadius: 14,
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column',
            maxHeight: 'calc(100vh - 96px)',
            overflow: 'hidden',
            animation: 'modalSlideUp 0.22s cubic-bezier(0.22,1,0.36,1) both',
          }}
        >
          {/* Header */}
          <div style={{ padding: '18px 22px', borderBottom: `1px solid ${TOKENS.color.borderSubtle}`, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: TOKENS.color.textPrimary }}>Ansprechpartner finden</h2>
              <p style={{ margin: '2px 0 0', fontSize: 11.5, color: TOKENS.color.textTertiary }}>
                Wähle eine Person aus den Suchergebnissen und die gewünschten Daten.
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={enriching}
              style={{
                background: 'none', border: 'none', padding: 4, cursor: enriching ? 'default' : 'pointer',
                color: TOKENS.color.textTertiary, fontFamily: 'inherit', opacity: enriching ? 0.4 : 1,
              }}
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {/* Body: list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
            {searchLoading && <SearchSkeleton />}
            {!searchLoading && searchError && (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: TOKENS.color.amber, marginBottom: 10 }}>{searchError}</div>
                <button
                  onClick={onRetrySearch}
                  style={{ fontSize: 12, color: TOKENS.color.indigo, background: 'none', border: `1px solid ${TOKENS.color.borderSubtle}`, padding: '6px 14px', borderRadius: 7, cursor: 'pointer', fontFamily: TOKENS.font.family }}
                >
                  Erneut versuchen
                </button>
              </div>
            )}
            {!searchLoading && !searchError && results.length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: TOKENS.color.textTertiary }}>
                Keine Ansprechpartner gefunden.
              </div>
            )}
            {!searchLoading && results.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {results.map((p) => (
                  <PersonRow
                    key={p.apollo_person_id ?? `${p.first_name}-${p.title}`}
                    person={p}
                    selected={selectedPerson?.apollo_person_id === p.apollo_person_id}
                    onClick={() => onSelect(p)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer: options + CTA */}
          <div style={{ borderTop: `1px solid ${TOKENS.color.borderSubtle}`, padding: '14px 18px', background: 'rgba(255,255,255,0.015)' }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', color: TOKENS.color.textMuted, marginBottom: 8 }}>
              WAS MÖCHTEST DU BEKOMMEN?
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
              <OptionToggle
                label="E-Mail"
                credits={2}
                checked={opts.get_email}
                onChange={(v) => onOptsChange((s) => ({ ...s, get_email: v }))}
                disabled={enriching}
              />
              <OptionToggle
                label="Telefon"
                credits={8}
                checked={opts.get_telephone}
                onChange={(v) => onOptsChange((s) => ({ ...s, get_telephone: v }))}
                disabled={enriching}
              />
              <OptionToggle
                label="E-Mail-Entwurf"
                credits={0}
                checked={opts.generate_email}
                onChange={(v) => onOptsChange((s) => ({ ...s, generate_email: v }))}
                disabled={enriching}
              />
            </div>
            <button
              onClick={onEnrich}
              disabled={!canEnrich}
              style={{
                width: '100%',
                padding: '11px 20px',
                borderRadius: 10,
                background: canEnrich
                  ? 'linear-gradient(135deg, #6366F1, #818CF8)'
                  : 'rgba(255,255,255,0.04)',
                border: canEnrich ? 'none' : `1px solid ${TOKENS.color.borderSubtle}`,
                color: canEnrich ? '#fff' : TOKENS.color.textMuted,
                fontSize: 13, fontWeight: 600, fontFamily: TOKENS.font.family,
                cursor: canEnrich ? 'pointer' : 'not-allowed',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: canEnrich ? '0 2px 14px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.15)' : 'none',
                animation: canEnrich && !enriching ? 'breatheGlow 2.5s ease infinite' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {enriching ? (
                <>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff', animation: 'spinLoader 0.7s linear infinite', display: 'inline-block' }} />
                  Wird angereichert…
                </>
              ) : (
                <>
                  Finden
                  {cost > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.22)' }}>
                      {cost} Cr
                    </span>
                  )}
                </>
              )}
            </button>
            {!selectedPerson && results.length > 0 && !enriching && (
              <div style={{ fontSize: 10.5, color: TOKENS.color.textMuted, textAlign: 'center', marginTop: 8 }}>
                Bitte wähle zuerst einen Ansprechpartner aus.
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

// ─── Person Row (in modal) ──────────────────────────────────────────────────

function PersonRow({
  person,
  selected,
  onClick,
}: {
  person: ApolloPerson;
  selected: boolean;
  onClick: () => void;
}) {
  const name = person.full_name || [person.first_name, person.last_name].filter(Boolean).join(' ') || '—';
  const initials = name.split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';
  const hasEmail = !!person.email || person.raw_apollo_person?.has_email;
  const hasPhone = !!person.phone || person.raw_apollo_person?.has_direct_phone === 'Yes';
  const city = person.raw_apollo_person?.city ?? null;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!person.apollo_person_id}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 12px', borderRadius: 9,
        border: `1px solid ${selected ? 'rgba(99,102,241,0.45)' : TOKENS.color.borderSubtle}`,
        background: selected ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.015)',
        cursor: person.apollo_person_id ? 'pointer' : 'not-allowed',
        opacity: person.apollo_person_id ? 1 : 0.5,
        textAlign: 'left', fontFamily: TOKENS.font.family,
        transition: 'all 0.15s ease',
        width: '100%',
      }}
    >
      {/* Avatar */}
      {person.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={person.photo_url}
          alt=""
          style={{ width: 36, height: 36, borderRadius: 9, objectFit: 'cover', border: `1px solid ${TOKENS.color.borderSubtle}`, flexShrink: 0 }}
        />
      ) : (
        <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(99,102,241,0.04))', border: `1px solid rgba(99,102,241,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, color: '#818CF8' }}>
          {initials}
        </div>
      )}

      {/* Name + title */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 500, color: TOKENS.color.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
        <div style={{ fontSize: 11, color: TOKENS.color.textTertiary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {person.title ?? '—'}
          {city ? ` · ${city}` : ''}
        </div>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {hasEmail && <DataBadge label="@" color="#34D399" />}
        {hasPhone && <DataBadge label="☎" color="#38BDF8" />}
      </div>

      {/* Radio */}
      <div
        style={{
          width: 16, height: 16, borderRadius: '50%',
          border: `2px solid ${selected ? '#818CF8' : 'rgba(255,255,255,0.15)'}`,
          background: selected ? 'linear-gradient(135deg, #6366F1, #818CF8)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.15s ease',
        }}
      >
        {selected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
      </div>
    </button>
  );
}

function DataBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 18, height: 18, borderRadius: 5,
        background: `${color}14`, border: `1px solid ${color}30`,
        color, fontSize: 10, fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}

// ─── Options Toggle ─────────────────────────────────────────────────────────

function OptionToggle({
  label,
  credits,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  credits: number;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{
        padding: '8px 10px',
        borderRadius: 8,
        border: `1px solid ${checked ? 'rgba(99,102,241,0.45)' : TOKENS.color.borderSubtle}`,
        background: checked ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        textAlign: 'left',
        fontFamily: TOKENS.font.family,
        transition: 'all 0.15s ease',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <div
        style={{
          width: 14, height: 14, borderRadius: 3,
          background: checked ? 'linear-gradient(135deg, #6366F1, #818CF8)' : 'rgba(255,255,255,0.04)',
          border: checked ? 'none' : `1px solid ${TOKENS.color.borderSubtle}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {checked && (
          <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: checked ? '#A5B4FC' : TOKENS.color.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {label}
        </div>
        <div
          style={{
            fontSize: 9.5,
            color: credits === 0 ? '#34D399' : TOKENS.color.textMuted,
            fontFamily: credits === 0 ? TOKENS.font.family : 'ui-monospace, SFMono-Regular, monospace',
            fontWeight: credits === 0 ? 600 : 400,
            letterSpacing: credits === 0 ? '0.04em' : 'normal',
            textTransform: credits === 0 ? 'uppercase' : 'none',
          }}
        >
          {credits === 0 ? 'Gratis' : `${credits} Cr`}
        </div>
      </div>
    </button>
  );
}

// ─── Skeleton during search ─────────────────────────────────────────────────

function SearchSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <style>{`
        @keyframes skelShimmerFind {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .skel-find {
          background: linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.065) 50%, rgba(255,255,255,0.03) 100%);
          background-size: 200% 100%;
          animation: skelShimmerFind 1.6s ease-in-out infinite;
          border-radius: 6px;
        }
      `}</style>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 12px', borderRadius: 9,
            border: `1px solid ${TOKENS.color.borderSubtle}`,
            opacity: Math.max(0.4, 1 - i * 0.12),
          }}
        >
          <div className="skel-find" style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className="skel-find" style={{ height: 10, width: '60%' }} />
            <div className="skel-find" style={{ height: 8, width: '45%', opacity: 0.7 }} />
          </div>
          <div className="skel-find" style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0 }} />
        </div>
      ))}
      <div style={{ textAlign: 'center', fontSize: 11, color: TOKENS.color.textMuted, marginTop: 8 }}>
        Suche Ansprechpartner…
      </div>
    </div>
  );
}
