import Image from "next/image";

export function NateraLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <Image
      src="/logos/natera.svg"
      alt="Natera"
      width={340}
      height={96}
      className={className}
      priority
    />
  );
}

export function LiatrioLogo({
  className = "h-8 w-auto",
  variant = "color",
}: {
  className?: string;
  variant?: "color" | "white";
}) {
  // The color SVG has currentColor on the wordmark so it adapts to text color.
  return (
    <Image
      src="/logos/liatrio.svg"
      alt="Liatrio"
      width={320}
      height={96}
      className={className}
      style={variant === "white" ? { color: "#ffffff" } : { color: "#0f172a" }}
      priority
    />
  );
}
