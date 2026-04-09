'use client';

import { useState, useRef, useEffect } from 'react';

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
  freetext: string;
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
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
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
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: '9px 12px',
    fontSize: 13,
    color: '#e0e0e0',
    outline: 'none',
    fontFamily: 'var(--font-dm-sans)',
  },
  label: { fontSize: 13, color: 'rgba(255,255,255,0.35)', display: 'block' as const, marginBottom: 6 },
};

export default function GenerateForm({ initialData, onSubmit }: Props) {
  const [freetext, setFreetext] = useState(initialData?.freetext ?? '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [industry, setIndustry] = useState(initialData?.industry ?? '');
  const [empMin, setEmpMin] = useState(initialData?.employeeMin ?? 10);
  const [empMax, setEmpMax] = useState(initialData?.employeeMax ?? 500);
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [keywords, setKeywords] = useState<string[]>(initialData?.keywords ?? []);
  // Sync freetext when parent changes it (e.g. history click)
  useEffect(() => {
    if (initialData?.freetext && initialData.freetext !== freetext) {
      setFreetext(initialData.freetext);
    }
  }, [initialData?.freetext]); // eslint-disable-line react-hooks/exhaustive-deps

  const canSubmit = freetext.trim().length > 10;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(255,255,255,0.05)',
          borderRadius: 14,
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {/* Main freetext input */}
        <div>
          <label style={{ fontSize: 14, color: '#ccc', display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Wen suchst du?
          </label>
          <textarea
            value={freetext}
            onChange={(e) => setFreetext(e.target.value)}
            placeholder="Beschreibe in eigenen Worten welche Kunden du suchst…&#10;&#10;z.B. 'Mittelständische E-Commerce Unternehmen mit 50-200 Mitarbeitern die Shopify oder WooCommerce nutzen und einen Fulfillment-Partner brauchen'"
            rows={5}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              padding: '14px 16px',
              fontSize: 14,
              color: '#e0e0e0',
              outline: 'none',
              resize: 'vertical',
              lineHeight: 1.6,
              fontFamily: 'var(--font-dm-sans)',
            }}
          />
          <div style={{ fontSize: 11, color: '#444', marginTop: 4 }}>
            Deine Beschreibung wird automatisch in eine optimale Suchanfrage übersetzt.
          </div>
        </div>

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            background: 'none',
            border: 'none',
            color: '#555',
            fontSize: 12,
            cursor: 'pointer',
            textAlign: 'left' as const,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            style={{
              fontSize: 10,
              transition: 'transform 0.2s',
              transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0)',
            }}
          >
            ▶
          </span>
          Erweiterte Optionen
        </button>

        {/* Advanced fields (hidden by default) */}
        {showAdvanced && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              paddingTop: 4,
              borderTop: '0.5px solid #1a1a1a',
            }}
          >
            <div>
              <label style={S.label}>Industrie / Branche (optional)</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                style={{ ...S.input, color: industry ? '#e0e0e0' : '#555' }}
              >
                <option value="">Automatisch erkennen</option>
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
              <ChipInput value={tags} onChange={setTags} placeholder="z.B. bulk shipping, fulfillment" />
            </div>
            <div>
              <label style={S.label}>Keywords / Technologien</label>
              <ChipInput value={keywords} onChange={setKeywords} placeholder="z.B. Shopify, SAP" />
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={() =>
            canSubmit &&
            onSubmit({
              freetext,
              industry,
              employeeMin: empMin,
              employeeMax: empMax,
              tags,
              keywords,
              leadSource: 'apollo',
            })
          }
          disabled={!canSubmit}
          style={{
            width: '100%',
            padding: 13,
            borderRadius: 12,
            border: 'none',
            background: canSubmit ? 'rgba(255,255,255,0.9)' : '#222',
            color: canSubmit ? '#050505' : '#555',
            fontSize: 14,
            fontWeight: 500,
            cursor: canSubmit ? 'pointer' : 'default',
            fontFamily: 'var(--font-dm-sans)',
            transition: 'background 0.2s',
          }}
        >
          Analyse starten →
        </button>
      </div>
    </div>
  );
}
