"use client";

export default function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1" style={{ background: "rgba(0,17,27,0.08)" }}>
      <div
        className="h-full transition-all duration-500 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: "#05A049" }}
      />
    </div>
  );
}
