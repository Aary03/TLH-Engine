// Full-screen override for /demo — covers the main app sidebar and nav
// with a fixed-position layer at z-index 9999.
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#00111B",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}
