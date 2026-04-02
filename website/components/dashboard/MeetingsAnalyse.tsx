'use client';

export function MeetingsAnalyse() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '40vh',
        textAlign: 'center',
        gap: '0.75rem',
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          marginBottom: '0.5rem',
        }}
      >
        📊
      </div>
      <h2 style={{ fontWeight: 600, fontSize: '1.05rem', color: '#fff' }}>Meeting-Analyse</h2>
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', maxWidth: 320 }}>
        Automatische Auswertung deiner Meetings — kommt bald.
      </p>
    </div>
  );
}
