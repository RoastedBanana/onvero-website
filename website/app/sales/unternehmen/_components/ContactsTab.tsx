'use client';

import { useState, useMemo } from 'react';
import { TOKENS } from '../_tokens';
import type { Role } from '../_lib/role-matcher';
import { filterByRoleAndFreetext } from '../_lib/role-matcher';
import { useContacts } from '../_hooks/useContacts';
import { useContactSearch } from '../_hooks/useContactSearch';
import { useContactEnrich } from '../_hooks/useContactEnrich';
import RolePicker from './RolePicker';
import SearchResultCard from './SearchResultCard';
import EnrichedContactCard from './EnrichedContactCard';
import EmptyState from './EmptyState';

export default function ContactsTab({ leadId }: { leadId: string }) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [freetext, setFreetext] = useState('');
  const { contacts: savedContacts, refetch: refetchContacts } = useContacts(leadId);
  const { searchResults, searchLoading, searchError, search, clearResults } = useContactSearch(leadId);
  const { enrichingContactId, enrich, error: enrichError } = useContactEnrich(leadId);

  // Filter search results by role/freetext, and exclude already-saved contacts
  const savedIds = useMemo(
    () => new Set(savedContacts.map((c) => c.apollo_person_id).filter(Boolean)),
    [savedContacts]
  );

  const filteredResults = useMemo(() => {
    const unsaved = searchResults.filter((p) => !savedIds.has(p.apollo_person_id));
    return filterByRoleAndFreetext(unsaved, selectedRole, freetext);
  }, [searchResults, savedIds, selectedRole, freetext]);

  const hasResults = searchResults.length > 0;
  const unsavedCount = searchResults.filter((p) => !savedIds.has(p.apollo_person_id)).length;

  async function handleEnrich(
    person: (typeof searchResults)[0],
    opts: { email: boolean; phone: boolean; draft: boolean }
  ) {
    if (!person.apollo_person_id || !person.raw_apollo_person) return;
    await enrich({
      apolloPersonId: person.apollo_person_id,
      rawApolloPerson: person.raw_apollo_person as Record<string, unknown>,
      getEmail: opts.email,
      getPhone: opts.phone,
      generateEmail: opts.draft,
    });
    await refetchContacts();
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontFamily: TOKENS.font.family }}>
      {/* Status line */}
      <div style={{ fontSize: 12, color: TOKENS.color.textTertiary }}>
        {savedContacts.length > 0 && (
          <span>
            <strong style={{ color: TOKENS.color.textSecondary }}>{savedContacts.length}</strong> gespeichert
          </span>
        )}
        {savedContacts.length > 0 && hasResults && (
          <span style={{ margin: '0 6px', color: TOKENS.color.textMuted }}>&middot;</span>
        )}
        {hasResults && (
          <span>
            <strong style={{ color: TOKENS.color.textSecondary }}>{unsavedCount}</strong> gefunden
          </span>
        )}
      </div>

      {/* Role picker */}
      <RolePicker
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
        freetext={freetext}
        onFreetextChange={setFreetext}
        onSearchClick={search}
        searchLoading={searchLoading}
      />

      {/* Error states */}
      {searchError && (
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
          {searchError}
        </div>
      )}
      {enrichError && (
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

      {/* Saved contacts section */}
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
            BEREITS GESPEICHERT
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

      {/* Search results section */}
      {hasResults && unsavedCount > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.06em',
                color: TOKENS.color.textMuted,
              }}
            >
              SUCHERGEBNISSE
            </span>
            {filteredResults.length !== unsavedCount && (
              <span style={{ fontSize: 11, color: TOKENS.color.textMuted }}>
                {filteredResults.length} von {unsavedCount} gezeigt
              </span>
            )}
          </div>

          {filteredResults.length === 0 ? (
            <div
              style={{
                padding: '24px 16px',
                borderRadius: TOKENS.radius.card,
                textAlign: 'center',
                background: TOKENS.color.bgCard,
                border: `1px solid ${TOKENS.color.borderSubtle}`,
              }}
            >
              <span style={{ fontSize: 13, color: TOKENS.color.textTertiary }}>
                Kein Treffer für die ausgewählte Rolle.{' '}
              </span>
              <button
                onClick={() => {
                  setSelectedRole(null);
                  setFreetext('');
                }}
                style={{
                  fontSize: 13,
                  color: TOKENS.color.indigo,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: TOKENS.font.family,
                  textDecoration: 'underline',
                }}
              >
                Alle {unsavedCount} Kontakte anzeigen
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                gap: 12,
              }}
            >
              {filteredResults.map((p) => (
                <SearchResultCard
                  key={p.apollo_person_id ?? `${p.first_name}-${p.title}`}
                  person={p}
                  isEnriching={enrichingContactId === p.apollo_person_id}
                  onEnrich={(opts) => handleEnrich(p, opts)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {savedContacts.length === 0 && !hasResults && !searchLoading && !searchError && (
        <EmptyState
          title="Noch keine Ansprechpartner"
          subtitle="Wähle eine Rolle oder beschreibe freitextlich, wen du kontaktieren willst."
        />
      )}
    </div>
  );
}
