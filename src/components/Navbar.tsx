import Link from "next/link";

const primaryLinks = [
  { label: "About Developper", href: "#" },
  { label: "Pricing", href: "#" },
  { label: "About", href: "#" },
  { label: "Docs", href: "#" },
];

export function Navbar() {
  const [firstLink, ...centerLinks] = primaryLinks;

  return (
    <nav
      aria-label="Primary navigation"
      className="absolute left-[168px] right-[377px] top-[27px] hidden h-[14px] md:block min-[1180px]:left-[206px] min-[1180px]:right-[414px]"
    >
      <ul className="flex items-center text-[9px] font-semibold uppercase leading-none tracking-[0.18em] text-white/60">
        <li className="flex items-center gap-4">
          <Link href="/" className="transition-opacity duration-300 hover:opacity-75 hover:text-white">
            <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
          <a
            className="transition-opacity duration-300 hover:opacity-75"
            href={firstLink.href}
          >
            {firstLink.label}
          </a>
        </li>
        <li className="ml-auto">
          <ul className="flex items-center gap-[29px]">
            {centerLinks.map((link) => (
              <li key={link.label}>
                <a
                  className="transition-opacity duration-300 hover:opacity-75"
                  href={link.href}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </li>
      </ul>
    </nav>
  );
}