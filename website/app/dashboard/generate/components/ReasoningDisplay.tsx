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
  onBack: () => void;
  onConfirm: () => void;
}

export default function ReasoningDisplay({ result, onBack, onConfirm }: Props) {
  const confColor = result.confidence >= 80 ? '#4ade80' : result.confidence >= 60 ? '#f59e0b' : '#444';

  return (
    <div style={{ maxWidth: 620, margin: '0 auto' }}>
      <style>{`@keyframes confBar{from{width:0%}}`}</style>
      <div style={{ background: '#111', border: '0.5px solid #1a1a1a', borderRadius: 10, padding: 24 }}>
        {/* Header */}
        <div
          style={{
            fontSize: 11,
            color: '#4a9a6a',
            letterSpacing: '0.04em',
            textTransform: 'uppercase' as const,
            marginBottom: 14,
          }}
        >
          KI-Analyse
        </div>

        {/* Reasoning */}
        <p style={{ fontSize: 14, color: '#ccc', lineHeight: 1.65, margin: '0 0 16px' }}>{result.reasoning}</p>

        {/* Strategy */}
        <div style={{ borderTop: '0.5px solid #1a1a1a', paddingTop: 14, marginBottom: 18 }}>
          <p style={{ fontSize: 14, color: '#888', lineHeight: 1.65, margin: 0 }}>{result.strategy}</p>
        </div>

        {/* Refined Search */}
        <div style={{ borderTop: '0.5px solid #1a1a1a', paddingTop: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 11,
                  color: '#555',
                  width: 80,
                  flexShrink: 0,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase' as const,
                }}
              >
                Keywords
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {result.apollo_keywords.map((k) => (
                  <span
                    key={k}
                    style={{
                      fontSize: 11,
                      background: '#1a1a2a',
                      border: '0.5px solid #2a2a3a',
                      color: '#7c9cef',
                      padding: '2px 8px',
                      borderRadius: 6,
                    }}
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 11,
                  color: '#555',
                  width: 80,
                  flexShrink: 0,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase' as const,
                }}
              >
                Industrien
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {result.apollo_industries.map((i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 11,
                      background: '#1a2a1a',
                      border: '0.5px solid #2a3a2a',
                      color: '#6dbf8a',
                      padding: '2px 8px',
                      borderRadius: 6,
                    }}
                  >
                    {i}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  color: '#555',
                  width: 80,
                  flexShrink: 0,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase' as const,
                }}
              >
                Mitarbeiter
              </span>
              <span style={{ fontSize: 13, color: '#aaa', fontFamily: 'var(--font-dm-mono)' }}>
                {result.refined_employee_min} – {result.refined_employee_max} Mitarbeiter
              </span>
            </div>
          </div>

          {/* Confidence */}
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontSize: 11,
                color: '#555',
                width: 80,
                flexShrink: 0,
                letterSpacing: '0.04em',
                textTransform: 'uppercase' as const,
              }}
            >
              Konfidenz
            </span>
            <div style={{ flex: 1, height: 4, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${result.confidence}%`,
                  background: confColor,
                  borderRadius: 2,
                  transition: 'width 0.6s ease',
                  animation: 'confBar 0.6s ease',
                }}
              />
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: confColor,
                fontFamily: 'var(--font-dm-mono)',
                width: 36,
                textAlign: 'right' as const,
              }}
            >
              {result.confidence}%
            </span>
          </div>
        </div>

        {/* Why contact */}
        {result.why_contact_even_if_low_score && (
          <div
            style={{
              background: '#0f1a10',
              border: '0.5px solid #1a2a1a',
              borderRadius: 8,
              padding: 14,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: '#4a7a4a',
                marginBottom: 4,
                letterSpacing: '0.04em',
                textTransform: 'uppercase' as const,
              }}
            >
              Auch bei niedrigem Score
            </div>
            <p style={{ fontSize: 13, color: '#6dbf8a', lineHeight: 1.55, margin: 0 }}>
              {result.why_contact_even_if_low_score}
            </p>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onBack}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 8,
              border: '0.5px solid #222',
              background: 'transparent',
              color: '#888',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'var(--font-dm-sans)',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#333')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#222')}
          >
            Anpassen
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 2,
              padding: '10px',
              borderRadius: 8,
              border: 'none',
              background: '#e0e0e0',
              color: '#080808',
              fontSize: 13,
              fontWeight: 500,
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
