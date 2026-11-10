import Link from "next/link";

// Logotipo próprio: moldura de fotograma (película) com um play dourado
// cujo "corte" forma a letra C de CineMatch.
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="3" y="6" width="42" height="36" rx="7" stroke="#d4a64a" strokeWidth="2.5" />
      {[10, 19, 28, 37].map((y) => (
        <g key={y}>
          <rect x="6.5" y={y - 1.5} width="3" height="3" rx="0.8" fill="#d4a64a" opacity="0.55" />
          <rect x="38.5" y={y - 1.5} width="3" height="3" rx="0.8" fill="#d4a64a" opacity="0.55" />
        </g>
      ))}
      <path d="M20 15.5 L33 24 L20 32.5 Z" fill="#d4a64a" />
      <circle cx="35.5" cy="14" r="2.4" fill="#b3202a" />
    </svg>
  );
}

export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="CineMatch — página inicial">
      <LogoMark size={size} />
      <span className="font-display text-xl font-semibold tracking-wide text-white">
        Cine<span className="text-gold transition group-hover:text-gold-soft">Match</span>
      </span>
    </Link>
  );
}
