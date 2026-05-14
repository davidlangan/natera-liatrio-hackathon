import Image from "next/image";

/**
 * Official brand marks. Both PNGs ship with transparent backgrounds and are
 * "reverse-preferred" — i.e. designed to sit on a dark surface (the Liatrio
 * mark is a white wordmark + green flame). Render them inside a dark strip
 * regardless of the surrounding page tone.
 */
export function NateraLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <Image
      src="/logos/natera.png"
      alt="Natera"
      width={1024}
      height={266}
      className={className}
      priority
    />
  );
}

export function LiatrioLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <Image
      src="/logos/liatrio.png"
      alt="Liatrio"
      width={1024}
      height={362}
      className={className}
      priority
    />
  );
}
