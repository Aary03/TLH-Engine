// Clean layout for /journey — no sidebar, no top nav, full-width
export default function JourneyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "#FFFFFC" }}>
      {children}
    </div>
  );
}
