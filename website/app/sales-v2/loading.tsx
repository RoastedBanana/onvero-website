export default function SalesLoading() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 300,
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          border: '2px solid rgba(129,140,248,0.15)',
          borderTopColor: '#818CF8',
          animation: 'gradient-spin 0.8s linear infinite',
        }}
      />
    </div>
  );
}
