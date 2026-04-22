'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { C, SvgIcon, ICONS, showToast } from '../_shared';
import LeadPicker from './_lead-picker';
import PhaseConfig from './_phase-config';
import { addMeeting, PHASE_TEMPLATES, totalPhaseDuration, nextPhaseId } from './_meeting-store';
import type { MeetingType, MeetingPhase, SmartSuggestion } from './_meeting-store';
import { ACCOUNT } from '../_lead-data';
import type { Lead } from '../_lead-data';

// ─── MEETING TYPE OPTIONS ───────────────────────────────────────────────────

const MEETING_TYPES: { value: MeetingType; label: string; icon: string; color: string }[] = [
  { value: 'Video', label: 'Video-Call', icon: ICONS.play, color: '#818CF8' },
  { value: 'Telefon', label: 'Telefon', icon: ICONS.mic, color: '#FBBF24' },
  { value: 'Vor Ort', label: 'Vor Ort', icon: ICONS.globe, color: '#34D399' },
];

const DURATION_PRESETS = [15, 30, 45, 60];

// ─── HELPERS ────────────────────────────────────────────────────────────────

function generateTitle(lead: Lead | null, type: MeetingType): string {
  if (!lead) return '';
  const prefix =
    lead.status === 'Neu'
      ? 'Discovery Call'
      : lead.status === 'In Kontakt'
        ? 'Follow-Up'
        : lead.status === 'Qualifiziert'
          ? 'Demo Präsentation'
          : 'Gespräch';
  return `${prefix} — ${lead.company}`;
}

function suggestMeetingType(lead: Lead): MeetingType {
  // Qualifizierte Leads → Demo per Video
  if (lead.status === 'Qualifiziert') return 'Video';
  // Leads mit Stadt in der Nähe → Vor Ort (heuristic: hat Stadt-Daten)
  if (lead.city && lead.status !== 'Neu') return 'Vor Ort';
  // Neue Leads → erst mal Telefon (niedrigere Hürde)
  if (lead.status === 'Neu') return 'Telefon';
  return 'Video';
}

function suggestPhaseTemplate(lead: Lead): string {
  if (lead.status === 'Qualifiziert') return 'Demo';
  if (lead.status === 'In Kontakt') return 'Follow-Up';
  return 'Discovery Call';
}

function buildAutoNotes(lead: Lead): string {
  const parts: string[] = [];
  if (lead.nextAction) parts.push(`Nächster Schritt: ${lead.nextAction}`);
  if (lead.emailDraftSubject) parts.push(`Letzte E-Mail: "${lead.emailDraftSubject}"`);
  if (lead.aiSummary) parts.push(`Analyse: ${lead.aiSummary}`);
  return parts.join('\n\n');
}

function buildAutoProduct(lead: Lead): string {
  const tags = lead.aiTags ?? [];
  const relevant = tags.filter((t) => !['b2b', 'email', 'kontakt'].includes(t.toLowerCase()) && t.length > 2);
  if (relevant.length > 0) return `${ACCOUNT.companyName} — ${relevant.slice(0, 2).join(', ')}`;
  return ACCOUNT.description;
}

function todayDate(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function nowTime(): string {
  const d = new Date();
  const h = d.getHours().toString().padStart(2, '0');
  const m = ((Math.ceil(d.getMinutes() / 15) * 15) % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

// ─── CREATE MEETING MODAL ───────────────────────────────────────────────────

export default function CreateMeetingModal({
  open,
  onClose,
  prefill,
}: {
  open: boolean;
  onClose: () => void;
  prefill?: SmartSuggestion | null;
}) {
  // Form state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [meetingType, setMeetingType] = useState<MeetingType>('Video');
  const [date, setDate] = useState(todayDate());
  const [time, setTime] = useState(nowTime());
  const [duration, setDuration] = useState(25);
  const [customDuration, setCustomDuration] = useState(false);
  const [title, setTitle] = useState('');
  const [titleManual, setTitleManual] = useState(false);
  const [notes, setNotes] = useState('');
  const [product, setProduct] = useState('');
  const [phases, setPhases] = useState<MeetingPhase[]>(
    PHASE_TEMPLATES['Discovery Call'].map((p) => ({ ...p, id: nextPhaseId() }))
  );
  const [step, setStep] = useState<'form' | 'confirm'>('form');

  // Prefill from smart suggestion
  useEffect(() => {
    if (prefill && open) {
      setMeetingType(prefill.suggestedType);
      setDuration(prefill.suggestedDuration);
      setNotes(`Vorschlag: ${prefill.reason}`);
      setTitle(`Gespräch — ${prefill.company}`);
    }
  }, [prefill, open]);

  // Auto-generate title when lead changes
  useEffect(() => {
    if (selectedLead && !titleManual) {
      setTitle(generateTitle(selectedLead, meetingType));
    }
  }, [selectedLead, meetingType, titleManual]);

  // Update total duration from phases
  useEffect(() => {
    const phaseTotal = totalPhaseDuration(phases);
    if (phaseTotal > 0) setDuration(phaseTotal);
  }, [phases]);

  const handleLeadSelect = (lead: Lead | null) => {
    setSelectedLead(lead);
    setSelectedLeadId(lead?.id ?? null);

    if (lead) {
      // Auto-fill alles aus Lead-Daten
      const type = suggestMeetingType(lead);
      setMeetingType(type);

      if (!titleManual) {
        setTitle(generateTitle(lead, type));
      }

      const template = suggestPhaseTemplate(lead);
      setPhases(PHASE_TEMPLATES[template].map((p) => ({ ...p, id: nextPhaseId() })));

      const autoNotes = buildAutoNotes(lead);
      if (autoNotes) setNotes(autoNotes);

      const autoProduct = buildAutoProduct(lead);
      if (autoProduct) setProduct(autoProduct);
    } else {
      // Reset bei Abwahl
      setMeetingType('Video');
      setNotes('');
      setProduct('');
      setPhases(PHASE_TEMPLATES['Discovery Call'].map((p) => ({ ...p, id: nextPhaseId() })));
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      showToast('Bitte gib einen Titel ein', 'error');
      return;
    }

    await addMeeting({
      leadId: selectedLead?.id ?? '',
      leadName: selectedLead?.name ?? prefill?.leadName ?? '',
      company: selectedLead?.company ?? prefill?.company ?? '',
      contact: selectedLead?.name ?? prefill?.leadName ?? '',
      title: title.trim(),
      type: meetingType,
      date,
      time,
      duration,
      phases,
      notes: notes.trim(),
      product: product.trim(),
      fromSuggestion: !!prefill,
    });

    setStep('confirm');
    showToast('Meeting erstellt', 'success', ICONS.check);
  };

  const handleClose = () => {
    setStep('form');
    setSelectedLead(null);
    setSelectedLeadId(null);
    setTitle('');
    setTitleManual(false);
    setNotes('');
    setProduct('');
    setMeetingType('Video');
    setDate(todayDate());
    setTime(nowTime());
    setDuration(25);
    setCustomDuration(false);
    setPhases(PHASE_TEMPLATES['Discovery Call'].map((p) => ({ ...p, id: nextPhaseId() })));
    onClose();
  };

  if (!open) return null;

  // ─── CONFIRMATION SCREEN ────────────────────────────────────────────────

  if (step === 'confirm') {
    return createPortal(
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease both',
        }}
        onClick={handleClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 440,
            background: C.surface,
            border: `1px solid ${C.borderLight}`,
            borderRadius: 16,
            padding: '36px 32px',
            textAlign: 'center',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
            animation: 'scaleIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
          }}
        >
          {/* Success icon */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: C.successBg,
              border: `1px solid ${C.successBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <SvgIcon d={ICONS.check} size={24} color={C.success} />
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 600, color: C.text1, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Meeting geplant
          </h2>
          <p style={{ fontSize: 13, color: C.text3, margin: '0 0 24px', lineHeight: 1.6 }}>{title}</p>

          {/* Summary */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              padding: '16px',
              borderRadius: 10,
              background: C.surface2,
              border: `1px solid ${C.border}`,
              marginBottom: 24,
              textAlign: 'left',
            }}
          >
            {[
              {
                label: 'Datum',
                value: new Date(date).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' }),
              },
              { label: 'Uhrzeit', value: time + ' Uhr' },
              { label: 'Dauer', value: duration + ' min' },
              { label: 'Typ', value: meetingType },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.04em', marginBottom: 3 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 13, color: C.text1, fontWeight: 500 }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button
              onClick={handleClose}
              className="s-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '10px 20px',
                borderRadius: 9,
                background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
                border: 'none',
                color: '#fff',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 2px 12px rgba(99,102,241,0.3)',
              }}
            >
              Fertig
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // ─── FORM ─────────────────────────────────────────────────────────────────

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.2s ease both',
      }}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 620,
          maxHeight: 'calc(100vh - 80px)',
          overflowY: 'auto',
          background: C.surface,
          border: `1px solid ${C.borderLight}`,
          borderRadius: 16,
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          animation: 'scaleIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: `1px solid ${C.border}`,
            position: 'sticky',
            top: 0,
            background: C.surface,
            zIndex: 10,
            borderRadius: '16px 16px 0 0',
          }}
        >
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: C.text1, margin: 0, letterSpacing: '-0.02em' }}>
              Neues Meeting
            </h2>
            <p style={{ fontSize: 12, color: C.text3, margin: '4px 0 0' }}>
              {prefill ? 'Aus Vorschlag erstellt' : 'Meeting manuell planen'}
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <SvgIcon d={ICONS.x} size={14} color={C.text3} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Lead Picker */}
          {!prefill && <LeadPicker selectedLeadId={selectedLeadId} onSelect={handleLeadSelect} />}

          {/* Prefill Lead Info */}
          {prefill && (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 10,
                background: C.successBg,
                border: `1px solid ${C.successBorder}`,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <SvgIcon d={ICONS.spark} size={14} color={C.success} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.text1 }}>
                  {prefill.leadName} · {prefill.company}
                </div>
                <div style={{ fontSize: 11, color: C.success, marginTop: 2 }}>{prefill.reason}</div>
              </div>
            </div>
          )}

          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: C.text3, letterSpacing: '0.06em' }}>
              MEETING-TITEL
            </label>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setTitleManual(true);
              }}
              placeholder="z.B. Discovery Call — Firma GmbH"
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: C.surface2,
                border: `1px solid ${C.border}`,
                color: C.text1,
                fontSize: 13,
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
          </div>

          {/* Meeting Type */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: C.text3, letterSpacing: '0.06em' }}>
              MEETING-TYP
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {MEETING_TYPES.map((t) => {
                const active = meetingType === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setMeetingType(t.value)}
                    className="s-chip"
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 7,
                      padding: '10px 14px',
                      borderRadius: 9,
                      background: active ? `${t.color}10` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${active ? `${t.color}30` : C.border}`,
                      color: active ? t.color : C.text3,
                      fontSize: 12,
                      fontWeight: active ? 500 : 400,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <SvgIcon d={t.icon} size={13} color={active ? t.color : C.text3} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date + Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 500, color: C.text3, letterSpacing: '0.06em' }}>DATUM</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: C.surface2,
                  border: `1px solid ${C.border}`,
                  color: C.text1,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  outline: 'none',
                  colorScheme: 'dark',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 500, color: C.text3, letterSpacing: '0.06em' }}>UHRZEIT</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: C.surface2,
                  border: `1px solid ${C.border}`,
                  color: C.text1,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  outline: 'none',
                  colorScheme: 'dark',
                }}
              />
            </div>
          </div>

          {/* Duration */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: C.text3, letterSpacing: '0.06em' }}>DAUER</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DURATION_PRESETS.map((d) => {
                const active = duration === d && !customDuration;
                return (
                  <button
                    key={d}
                    onClick={() => {
                      setDuration(d);
                      setCustomDuration(false);
                    }}
                    className="s-chip"
                    style={{
                      padding: '7px 14px',
                      borderRadius: 7,
                      background: active ? C.accentGhost : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${active ? C.borderAccent : C.border}`,
                      color: active ? C.accentBright : C.text3,
                      fontSize: 12,
                      fontWeight: active ? 500 : 400,
                      cursor: 'pointer',
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    }}
                  >
                    {d} min
                  </button>
                );
              })}
              <button
                onClick={() => setCustomDuration(true)}
                className="s-chip"
                style={{
                  padding: '7px 14px',
                  borderRadius: 7,
                  background: customDuration ? C.accentGhost : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${customDuration ? C.borderAccent : C.border}`,
                  color: customDuration ? C.accentBright : C.text3,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Custom
              </button>
              {customDuration && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={duration}
                    onChange={(e) => setDuration(Math.max(5, parseInt(e.target.value) || 5))}
                    style={{
                      width: 56,
                      padding: '7px 10px',
                      borderRadius: 7,
                      background: C.surface2,
                      border: `1px solid ${C.border}`,
                      color: C.text1,
                      fontSize: 12,
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      textAlign: 'center',
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: 11, color: C.text3 }}>min</span>
                </div>
              )}
            </div>
          </div>

          {/* Phase Config */}
          <PhaseConfig phases={phases} onChange={setPhases} />

          {/* Product / Angebot */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: C.text3, letterSpacing: '0.06em' }}>
              DEIN PRODUKT / ANGEBOT
            </label>
            <input
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="Was möchtest du dem Kunden anbieten?"
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: C.surface2,
                border: `1px solid ${C.border}`,
                color: C.text1,
                fontSize: 13,
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
          </div>

          {/* Notes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: C.text3, letterSpacing: '0.06em' }}>
              NOTIZEN / KONTEXT
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Worüber soll gesprochen werden? Besondere Hinweise?"
              rows={3}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: C.surface2,
                border: `1px solid ${C.border}`,
                color: C.text1,
                fontSize: 13,
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'vertical',
                lineHeight: 1.6,
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderTop: `1px solid ${C.border}`,
            position: 'sticky',
            bottom: 0,
            background: C.surface,
            borderRadius: '0 0 16px 16px',
          }}
        >
          <div style={{ fontSize: 12, color: C.text3 }}>
            {phases.length} Phasen · {totalPhaseDuration(phases)} min
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleClose}
              className="s-ghost"
              style={{
                padding: '9px 18px',
                borderRadius: 9,
                background: 'transparent',
                border: `1px solid ${C.border}`,
                color: C.text2,
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Abbrechen
            </button>
            <button
              onClick={handleCreate}
              className="s-primary-glow"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 20px',
                borderRadius: 9,
                background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
                border: 'none',
                color: '#fff',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 2px 12px rgba(99,102,241,0.3)',
              }}
            >
              <SvgIcon d={ICONS.calendar} size={13} color="#fff" />
              Meeting erstellen
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
