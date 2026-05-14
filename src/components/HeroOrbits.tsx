/**
 * Decorative background mesh used on the hero. Pure SVG + CSS — no images.
 * Layers a soft gradient mesh, a faint grid overlay, and a diagonal accent
 * sweep so the dark backdrop never feels flat.
 */
export function HeroOrbits() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Soft mesh blobs */}
      <div
        className="absolute -top-40 -left-40 w-[640px] h-[640px] rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(closest-side, rgba(0,160,220,0.45), rgba(0,160,220,0))",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute -top-20 right-[-120px] w-[700px] h-[700px] rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(closest-side, rgba(163,230,53,0.42), rgba(163,230,53,0))",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute bottom-[-220px] left-1/2 -translate-x-1/2 w-[900px] h-[420px] rounded-full opacity-30"
        style={{
          background:
            "radial-gradient(closest-side, rgba(0,160,220,0.35), rgba(0,160,220,0))",
          filter: "blur(60px)",
        }}
      />

      {/* Faint grid overlay */}
      <div className="absolute inset-0 grid-overlay opacity-60" />

      {/* Diagonal accent sweep */}
      <svg
        className="absolute inset-0 w-full h-full opacity-40"
        viewBox="0 0 1200 800"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A3E635" stopOpacity="0" />
            <stop offset="50%" stopColor="#A3E635" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#A3E635" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M-100,500 L500,-100 L1300,300 L800,900 Z" fill="url(#sweep)" />
      </svg>

      {/* Top fade so header area stays clean */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-bg-dark to-transparent" />
    </div>
  );
}
