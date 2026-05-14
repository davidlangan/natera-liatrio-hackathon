/**
 * Decorative orbs that echo the proposal cover. Pure SVG, no images.
 * Rendered absolutely so they never affect layout.
 */
export function HeroOrbits() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <svg
        viewBox="0 0 800 800"
        className="absolute -right-32 -top-24 w-[700px] h-[700px] opacity-30"
      >
        <defs>
          <radialGradient id="g1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#A3E635" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#A3E635" stopOpacity="0.05" />
          </radialGradient>
          <radialGradient id="g2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00A0DC" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#00A0DC" stopOpacity="0.05" />
          </radialGradient>
        </defs>
        <circle cx="350" cy="300" r="230" fill="url(#g1)" />
        <circle cx="500" cy="320" r="240" fill="url(#g2)" />
        <circle cx="370" cy="470" r="230" fill="url(#g2)" />
        <circle cx="520" cy="490" r="230" fill="url(#g1)" />
      </svg>
    </div>
  );
}
