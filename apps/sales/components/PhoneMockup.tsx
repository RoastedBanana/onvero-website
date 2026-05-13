export function PhoneMockup() {
  return (
    <div className="relative mx-auto select-none" style={{ width: 260 }}>
      {/* Glow halo */}
      <div
        style={{
          position: 'absolute',
          inset: '-20%',
          background:
            'radial-gradient(ellipse at 50% 60%, rgba(99,102,241,0.18) 0%, rgba(56,189,248,0.08) 40%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Phone shell */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          background: 'linear-gradient(145deg, #1c1c2e, #141422)',
          borderRadius: 48,
          padding: 10,
          boxShadow:
            '0 0 0 1px rgba(255,255,255,0.08), 0 0 0 2px rgba(0,0,0,0.6), 0 40px 80px rgba(0,0,0,0.5), 0 10px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Side buttons */}
        <div
          style={{
            position: 'absolute',
            left: -3,
            top: 90,
            width: 3,
            height: 32,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '2px 0 0 2px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: -3,
            top: 132,
            width: 3,
            height: 50,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '2px 0 0 2px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: -3,
            top: 192,
            width: 3,
            height: 50,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '2px 0 0 2px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: -3,
            top: 140,
            width: 3,
            height: 70,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '0 2px 2px 0',
          }}
        />

        {/* Screen */}
        <div
          style={{
            background: '#0a0a14',
            borderRadius: 40,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Dynamic Island */}
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 90,
              height: 24,
              background: '#000',
              borderRadius: 12,
              zIndex: 10,
            }}
          />

          {/* Status bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 20px 0',
              fontSize: 9,
              color: 'rgba(255,255,255,0.6)',
              fontFamily: 'ui-sans-serif, system-ui, sans-serif',
              fontWeight: 600,
            }}
          >
            <span>9:41</span>
            <div style={{ width: 90 }} />
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                <rect x="0" y="3" width="2" height="6" rx="0.5" fill="rgba(255,255,255,0.6)" />
                <rect x="3" y="2" width="2" height="7" rx="0.5" fill="rgba(255,255,255,0.6)" />
                <rect x="6" y="1" width="2" height="8" rx="0.5" fill="rgba(255,255,255,0.6)" />
                <rect x="9" y="0" width="2" height="9" rx="0.5" fill="rgba(255,255,255,0.6)" />
              </svg>
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                <path
                  d="M7 2C9.2 2 11.1 3 12.4 4.6L13.8 3.1C12.1 1.2 9.7 0 7 0C4.3 0 1.9 1.2 0.2 3.1L1.6 4.6C2.9 3 4.8 2 7 2Z"
                  fill="rgba(255,255,255,0.6)"
                />
                <path
                  d="M7 5C8.3 5 9.5 5.6 10.3 6.5L11.7 5C10.5 3.8 8.8 3 7 3C5.2 3 3.5 3.8 2.3 5L3.7 6.5C4.5 5.6 5.7 5 7 5Z"
                  fill="rgba(255,255,255,0.6)"
                />
                <circle cx="7" cy="9" r="1.5" fill="rgba(255,255,255,0.6)" />
              </svg>
              <svg width="22" height="11" viewBox="0 0 22 11" fill="none">
                <rect x="0.5" y="0.5" width="18" height="10" rx="2.5" stroke="rgba(255,255,255,0.35)" />
                <rect x="1.5" y="1.5" width="15" height="8" rx="1.5" fill="rgba(255,255,255,0.8)" />
                <path
                  d="M20 3.5V7.5C20.8 7.2 21.5 6.2 21.5 5.5C21.5 4.8 20.8 3.8 20 3.5Z"
                  fill="rgba(255,255,255,0.4)"
                />
              </svg>
            </div>
          </div>

          {/* App content */}
          <div
            style={{
              padding: '8px 14px 20px',
              fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
            }}
          >
            {/* App header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 8.5,
                    color: 'rgba(255,255,255,0.35)',
                    letterSpacing: '0.1em',
                    marginBottom: 2,
                    fontWeight: 600,
                  }}
                >
                  ONVERO SALES
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Willkommen</div>
              </div>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4F46E5, #818CF8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#fff',
                  boxShadow: '0 0 12px rgba(99,102,241,0.4)',
                }}
              >
                H
              </div>
            </div>

            {/* KPI Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 7,
                marginBottom: 10,
              }}
            >
              {[
                { label: 'LEADS', value: '247', color: '#818CF8', delta: '+12' },
                { label: 'SCORE Ø', value: '73', color: '#38BDF8', delta: '↑5' },
                { label: 'HOT', value: '41', color: '#34D399', delta: 'aktiv' },
                { label: 'E-MAILS', value: '189', color: '#FBBF24', delta: 'verifiziert' },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 11,
                    padding: '9px 10px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 1,
                      background: `linear-gradient(90deg, transparent, ${kpi.color}50, transparent)`,
                    }}
                  />
                  <div
                    style={{
                      fontSize: 7.5,
                      color: 'rgba(255,255,255,0.35)',
                      letterSpacing: '0.08em',
                      marginBottom: 5,
                      fontWeight: 600,
                    }}
                  >
                    {kpi.label}
                  </div>
                  <div
                    style={{
                      fontSize: 21,
                      fontWeight: 700,
                      color: kpi.color,
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      letterSpacing: '-0.03em',
                      lineHeight: 1,
                      textShadow: `0 0 20px ${kpi.color}50`,
                    }}
                  >
                    {kpi.value}
                  </div>
                  <div style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>{kpi.delta}</div>
                </div>
              ))}
            </div>

            {/* Top Leads List */}
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: '10px 11px',
                marginBottom: 9,
              }}
            >
              <div
                style={{
                  fontSize: 8,
                  color: 'rgba(255,255,255,0.35)',
                  letterSpacing: '0.08em',
                  fontWeight: 600,
                  marginBottom: 9,
                }}
              >
                TOP LEADS
              </div>
              {[
                { name: 'Müller GmbH', role: 'CEO', score: 94, hot: true },
                { name: 'Tech Solutions AG', role: 'CTO', score: 87, hot: true },
                { name: 'Innovate KG', role: 'VP Sales', score: 71, hot: false },
              ].map((lead, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    paddingBottom: i < 2 ? 7 : 0,
                    marginBottom: i < 2 ? 7 : 0,
                    borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 7,
                      background: lead.hot
                        ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(129,140,248,0.1))'
                        : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${lead.hot ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 8,
                      fontWeight: 700,
                      color: lead.hot ? '#818CF8' : 'rgba(255,255,255,0.4)',
                      flexShrink: 0,
                    }}
                  >
                    {lead.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 10,
                        color: 'rgba(255,255,255,0.85)',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {lead.name}
                    </div>
                    <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{lead.role}</div>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: lead.hot ? '#818CF8' : '#FBBF24',
                      fontFamily: 'ui-monospace, monospace',
                      textShadow: `0 0 12px ${lead.hot ? 'rgba(129,140,248,0.5)' : 'rgba(251,191,36,0.4)'}`,
                    }}
                  >
                    {lead.score}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {[
                { label: 'Leads', color: '#818CF8' },
                { label: 'Generate', color: '#A78BFA' },
                { label: 'Meetings', color: '#38BDF8' },
              ].map((action) => (
                <div
                  key={action.label}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 9,
                    padding: '8px 6px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 7,
                      background: `${action.color}15`,
                      border: `1px solid ${action.color}25`,
                      margin: '0 auto 5px',
                      boxShadow: `0 0 8px ${action.color}20`,
                    }}
                  />
                  <div style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{action.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
