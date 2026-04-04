'use client';

import { useState } from 'react';

const INDUSTRIES = [
  { value: 'ecommerce', label: 'E-Commerce / Online-Handel' },
  { value: 'retail', label: 'Einzelhandel' },
  { value: 'wholesale', label: 'Großhandel' },
  { value: 'manufacturing', label: 'Produktion & Fertigung' },
  { value: 'logistics_and_supply_chain', label: 'Logistik & Supply Chain' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'food_and_beverages', label: 'Lebensmittel & Getränke' },
  { value: 'consumer_goods', label: 'Konsumgüter' },
  { value: 'information_technology_and_services', label: 'IT & Software' },
  { value: 'marketing_and_advertising', label: 'Marketing & Werbung' },
  { value: 'real_estate', label: 'Immobilien' },
  { value: 'construction', label: 'Bau & Handwerk' },
  { value: 'healthcare', label: 'Gesundheitswesen' },
  { value: 'financial_services', label: 'Finanzdienstleistungen' },
  { value: 'education', label: 'Bildung' },
  { value: 'hospitality', label: 'Gastgewerbe & Hotels' },
  { value: 'transportation_and_trucking', label: 'Transport & Spedition' },
  { value: 'staffing_and_recruiting', label: 'Personalvermittlung' },
  { value: 'legal_services', label: 'Rechtsberatung' },
  { value: 'insurance', label: 'Versicherungen' },
];

export interface FormData {
  industry: string;
  employeeMin: number;
  employeeMax: number;
  tags: string[];
  keywords: string[];
  leadSource: 'apollo' | 'google_maps';
}

interface Props {
  initial?: Partial<FormData>;
  onSubmit: (data: FormData) => void;
}

function ChipInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setInput('');
  };
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: value.length > 0 ? 6 : 0 }}>
        {value.map((t) => (
          <span
            key={t}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              background: 'rgba(107,122,255,0.12)',
              color: '#6B7AFF',
              padding: '3px 8px',
              borderRadius: 12,
            }}
          >
            {t}
            <button
              onClick={() => onChange(value.filter((x) => x !== t))}
              style={{
                background: 'none',
                border: 'none',
                color: '#6B7AFF',
                cursor: 'pointer',
                fontSize: 10,
                padding: 0,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            add();
          }
        }}
        placeholder={placeholder}
        style={{
          width: '100%',
          background: '#0a0a0a',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          padding: '9px 12px',
          fontSize: 12,
          color: '#fff',
          outline: 'none',
          fontFamily: 'var(--font-dm-sans)',
        }}
      />
    </div>
  );
}

export default function GenerateForm({ initial, onSubmit }: Props) {
  const [industry, setIndustry] = useState(initial?.industry ?? '');
  const [empMin, setEmpMin] = useState(initial?.employeeMin ?? 10);
  const [empMax, setEmpMax] = useState(initial?.employeeMax ?? 500);
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [keywords, setKeywords] = useState<string[]>(initial?.keywords ?? []);
  const [source] = useState<'apollo' | 'google_maps'>(initial?.leadSource ?? 'apollo');

  const canSubmit = industry !== '';

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div
        style={{
          background: '#111',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14,
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Industry */}
        <div>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 5 }}>
            Industrie / Branche *
          </label>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            style={{
              width: '100%',
              background: '#0a0a0a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              padding: '9px 12px',
              fontSize: 12,
              color: industry ? '#fff' : 'rgba(255,255,255,0.35)',
              outline: 'none',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            <option value="">Branche auswählen...</option>
            {INDUSTRIES.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </select>
        </div>

        {/* Employee Range */}
        <div>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 5 }}>
            Mitarbeiter-Bereich
          </label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="number"
              value={empMin}
              onChange={(e) => setEmpMin(Number(e.target.value))}
              style={{
                flex: 1,
                background: '#0a0a0a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '9px 12px',
                fontSize: 12,
                color: '#fff',
                outline: 'none',
                fontFamily: 'var(--font-dm-mono)',
              }}
            />
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>bis</span>
            <input
              type="number"
              value={empMax}
              onChange={(e) => setEmpMax(Number(e.target.value))}
              style={{
                flex: 1,
                background: '#0a0a0a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '9px 12px',
                fontSize: 12,
                color: '#fff',
                outline: 'none',
                fontFamily: 'var(--font-dm-mono)',
              }}
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 5 }}>
            Tags / Suchbegriffe
          </label>
          <ChipInput
            value={tags}
            onChange={setTags}
            placeholder="z.B. bulk shipping, fulfillment — Enter zum Hinzufügen"
          />
        </div>

        {/* Keywords */}
        <div>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 5 }}>
            Keywords / Technologien
          </label>
          <ChipInput value={keywords} onChange={setKeywords} placeholder="z.B. Shopify, SAP, Warenwirtschaft" />
        </div>

        {/* Source Toggle */}
        <div>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 5 }}>
            Lead-Quelle
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <div
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid rgba(107,122,255,0.3)',
                background: 'rgba(107,122,255,0.08)',
                cursor: 'default',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7AFF' }}>⚡ Apollo</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                B2B Entscheider-Datenbank
              </div>
            </div>
            <div
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
                opacity: 0.4,
                cursor: 'not-allowed',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>📍 Google Maps</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>Coming soon</div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={() =>
            canSubmit &&
            onSubmit({ industry, employeeMin: empMin, employeeMax: empMax, tags, keywords, leadSource: source })
          }
          disabled={!canSubmit}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 10,
            border: 'none',
            background: canSubmit ? '#6B7AFF' : 'rgba(107,122,255,0.2)',
            color: canSubmit ? '#fff' : 'rgba(255,255,255,0.3)',
            fontSize: 14,
            fontWeight: 600,
            cursor: canSubmit ? 'pointer' : 'default',
            transition: 'background 0.2s',
            fontFamily: 'var(--font-dm-sans)',
          }}
        >
          KI-Analyse starten →
        </button>
      </div>
    </div>
  );
}
