import Link from "next/link";

/** Siliconics mark: a chip outline on the brand gradient, plus the word mark. */
export function Logo({ label }: { label: string }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2" aria-label={label}>
      <span className="bg-brand-gradient inline-flex size-9 items-center justify-center rounded-xl text-white shadow-lift transition-transform duration-300 group-hover:rotate-6">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <rect x="6" y="6" width="12" height="12" rx="2.5" />
          <path d="M10 2v3m4-3v3m-4 14v3m4-3v3M2 10h3m-3 4h3m14-4h3m-3 4h3" strokeLinecap="round" />
          <path d="m11 9-1.5 3.5H13L11.5 15" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="hidden text-lg font-bold tracking-tight sm:inline">
        Silicon<span className="text-gradient">ics</span>
      </span>
    </Link>
  );
}
