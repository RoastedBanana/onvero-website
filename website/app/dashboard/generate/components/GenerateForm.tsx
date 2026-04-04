'use client';

import { useState, useRef } from 'react';

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
  initialData?: FormData;
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
  const ref = useRef<HTMLInputElement>(null);
  const add = () => {
    const v = input.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setInput('');
  };
  return (
    <div
      onClick={() => ref.current?.focus()}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 5,
        background: '#0d0d0d',
        border: '0.5px solid #222',
        borderRadius: 8,
        padding: '6px 10px',
        minHeight: 38,
        cursor: 'text',
      }}
    >
      {value.map((t) => (
        <span
          key={t}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            background: '#1a1a1a',
            border: '0.5px solid #2a2a2a',
            color: '#bbb',
            padding: '3px 8px 3px 10px',
            borderRadius: 6,
          }}
        >
          {t}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChange(value.filter((x) => x !== t));
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#555',
              cursor: 'pointer',
              fontSize: 11,
              padding: '0 2px',
              lineHeight: 1,
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#555')}
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={ref}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            add();
          }
          if (e.key === 'Backspace' && input === '' && value.length > 0) onChange(value.slice(0, -1));
        }}
        placeholder={value.length === 0 ? placeholder : ''}
        style={{
          flex: 1,
          minWidth: 120,
          background: 'transparent',
          border: 'none',
          fontSize: 12,
          color: '#e0e0e0',
          outline: 'none',
          padding: '3px 0',
          fontFamily: 'var(--font-dm-sans)',
        }}
      />
    </div>
  );
}

const S = {
  input: {
    width: '100%' as const,
    background: '#0d0d0d',
    border: '0.5px solid #222',
    borderRadius: 8,
    padding: '9px 12px',
    fontSize: 13,
    color: '#e0e0e0',
    outline: 'none',
    fontFamily: 'var(--font-dm-sans)',
  },
  label: { fontSize: 13, color: '#888', display: 'block' as const, marginBottom: 6 },
};

export default function GenerateForm({ initialData, onSubmit }: Props) {
  const [industry, setIndustry] = useState(initialData?.industry ?? '');
  const [empMin, setEmpMin] = useState(initialData?.employeeMin ?? 10);
  const [empMax, setEmpMax] = useState(initialData?.employeeMax ?? 500);
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [keywords, setKeywords] = useState<string[]>(initialData?.keywords ?? []);
  const canSubmit = industry !== '';

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <div
        style={{
          background: '#111',
          border: '0.5px solid #1a1a1a',
          borderRadius: 10,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <div>
          <label style={S.label}>Industrie / Branche</label>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            style={{ ...S.input, color: industry ? '#e0e0e0' : '#555' }}
          >
            <option value="">Branche auswählen...</option>
            {INDUSTRIES.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={S.label}>Mitarbeiteranzahl</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="number"
              value={empMin}
              onChange={(e) => setEmpMin(Number(e.target.value))}
              style={{ ...S.input, flex: 1, fontFamily: 'var(--font-dm-mono)', textAlign: 'right' as const }}
            />
            <span style={{ color: '#444', fontSize: 12 }}>bis</span>
            <input
              type="number"
              value={empMax}
              onChange={(e) => setEmpMax(Number(e.target.value))}
              style={{ ...S.input, flex: 1, fontFamily: 'var(--font-dm-mono)', textAlign: 'right' as const }}
            />
          </div>
        </div>
        <div>
          <label style={S.label}>Tags / Suchbegriffe</label>
          <ChipInput
            value={tags}
            onChange={setTags}
            placeholder="z.B. bulk shipping, fulfillment — Enter zum Hinzufügen"
          />
        </div>
        <div>
          <label style={S.label}>Keywords / Technologien</label>
          <ChipInput value={keywords} onChange={setKeywords} placeholder="z.B. Shopify, SAP, Warenwirtschaft" />
        </div>
        <div>
          <label style={S.label}>Lead-Quelle</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <div
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 8,
                border: '0.5px solid #333',
                background: '#1a1a1a',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 500, color: '#e0e0e0' }}>Apollo</div>
            </div>
            <div
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 8,
                border: '0.5px solid #1a1a1a',
                opacity: 0.35,
                cursor: 'not-allowed',
              }}
            >
              <div style={{ fontSize: 13, color: '#666' }}>Google Maps</div>
              <div style={{ fontSize: 10, color: '#444', marginTop: 1 }}>Bald verfügbar</div>
            </div>
          </div>
        </div>
        <button
          onClick={() =>
            canSubmit &&
            onSubmit({ industry, employeeMin: empMin, employeeMax: empMax, tags, keywords, leadSource: 'apollo' })
          }
          disabled={!canSubmit}
          style={{
            width: '100%',
            padding: 12,
            borderRadius: 8,
            border: 'none',
            background: canSubmit ? '#e0e0e0' : '#222',
            color: canSubmit ? '#080808' : '#555',
            fontSize: 14,
            fontWeight: 500,
            cursor: canSubmit ? 'pointer' : 'default',
            fontFamily: 'var(--font-dm-sans)',
            transition: 'background 0.2s',
          }}
        >
          KI-Analyse starten →
        </button>
      </div>
    </div>
  );
}
