export default function WorkflowsPage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
        textAlign: 'center',
        gap: '0.75rem',
        padding: '2.5rem 2.75rem',
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
          marginBottom: '0.5rem',
        }}
      >
        <div style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(255,255,255,0.12)' }} />
      </div>
      <h2 style={{ fontWeight: 600, fontSize: '1.05rem', color: '#fff' }}>Workflows</h2>
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', maxWidth: 320 }}>
        Automatisiere deine Prozesse und verbinde deine Tools.
      </p>
    </div>
  );
}
