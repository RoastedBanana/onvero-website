'use client';

export interface ReasoningResult {
  success: boolean;
  reasoning: string;
  strategy: string;
  apollo_keywords: string[];
  apollo_industries: string[];
  refined_employee_min: number;
  refined_employee_max: number;
  confidence: number;
  why_contact_even_if_low_score: string;
}

interface Props {
  result: ReasoningResult;
  onAdjust: () => void;
  onGenerate: () => void;
}

export default function ReasoningDisplay({ result, onAdjust, onGenerate }: Props) {
  const confColor = result.confidence >= 80 ? '#22C55E' : result.confidence >= 60 ? '#F59E0B' : '#6b7280';

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 28 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 20 }}>🧠</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>KI-Analyse abgeschlossen</span>
        </div>

        {/* Reasoning */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.25)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
              marginBottom: 6,
            }}
          >
            Analyse
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, margin: 0 }}>{result.reasoning}</p>
        </div>

        {/* Strategy */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.25)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
              marginBottom: 6,
            }}
          >
            Strategie
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, margin: 0 }}>{result.strategy}</p>
        </div>

        {/* Refined Search */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, marginBottom: 16 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.25)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
              marginBottom: 10,
            }}
          >
            Verfeinerte Apollo-Suche
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', width: 80, flexShrink: 0 }}>Keywords:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {result.apollo_keywords.map((k) => (
                  <span
                    key={k}
                    style={{
                      fontSize: 10,
                      background: 'rgba(107,122,255,0.12)',
                      color: '#6B7AFF',
                      padding: '2px 8px',
                      borderRadius: 10,
                    }}
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', width: 80, flexShrink: 0 }}>
                Industrien:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {result.apollo_industries.map((i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 10,
                      background: 'rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.6)',
                      padding: '2px 8px',
                      borderRadius: 10,
                    }}
                  >
                    {i}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', width: 80, flexShrink: 0 }}>
                Mitarbeiter:
              </span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-dm-mono)' }}>
                {result.refined_employee_min} – {result.refined_employee_max}
              </span>
            </div>
          </div>

          {/* Confidence */}
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', width: 80, flexShrink: 0 }}>Konfidenz:</span>
            <div
              style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${result.confidence}%`,
                  background: confColor,
                  borderRadius: 3,
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: confColor, fontFamily: 'var(--font-dm-mono)' }}>
              {result.confidence}%
            </span>
          </div>
        </div>

        {/* Why contact */}
        {result.why_contact_even_if_low_score && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 13, flexShrink: 0 }}>💡</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                  Auch bei niedrigem Score:
                </div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: 0 }}>
                  {result.why_contact_even_if_low_score}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
          <button
            onClick={onAdjust}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.6)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            Anpassen
          </button>
          <button
            onClick={onGenerate}
            style={{
              flex: 2,
              padding: '10px',
              borderRadius: 8,
              border: 'none',
              background: '#6B7AFF',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            Leads generieren →
          </button>
        </div>
      </div>
    </div>
  );
}
