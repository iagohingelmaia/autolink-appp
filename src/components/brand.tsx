import Link from "next/link";

export function BrandMark({ inverse = false, compact = false }: { inverse?: boolean; compact?: boolean }) {
  return (
    <Link className={`brand-lockup${inverse ? " brand-inverse" : ""}${compact ? " brand-compact" : ""}`} href="/" aria-label="AutoLink, início">
      <span className="brand-symbol" aria-hidden="true">
        <svg viewBox="0 0 44 44" fill="none">
          <rect x="1" y="1" width="42" height="42" rx="13" fill="currentColor" />
          <path d="M9 25.5h3.2l2.3-6.2c.5-1.3 1.7-2.1 3.1-2.1h9.1c1.4 0 2.6.8 3.1 2.1l2.3 6.2H35v6.2h-3.4a3.3 3.3 0 0 1-6.5 0h-6.2a3.3 3.3 0 0 1-6.5 0H9v-6.2Z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
          <path d="M16.5 23.1h12.1M14.1 28h.1m15.6 0h.1" stroke="#F28C28" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M19.4 13.5h5.2" stroke="#F28C28" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </span>
      {!compact && <span className="brand-word">AUTO<span>LINK</span></span>}
    </Link>
  );
}

export function Wordmark({ inverse = false }: { inverse?: boolean }) {
  return <span className={`wordmark${inverse ? " wordmark-inverse" : ""}`}>AUTO<span>LINK</span></span>;
}
