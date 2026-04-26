export default function Loading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0f0f0f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          border: "2px solid rgba(255,255,255,0.1)",
          borderTopColor: "rgba(255,255,255,0.5)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
