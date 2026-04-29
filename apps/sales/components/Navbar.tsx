'use client';

import Link from 'next/link';

const navLinks = [
  { label: 'Produkt', href: '#produkt' },
  { label: 'Lösungen', href: '#loesungen' },
  { label: 'Preise', href: '#preise' },
];

export function Navbar() {
  return (
    <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 md:px-10 lg:px-16 py-6">
      <Link
        href="/"
        className="text-[22px] font-extrabold tracking-tight text-[#0A2540] lowercase"
      >
        onvero
      </Link>

      <div className="hidden md:flex items-center gap-8">
        {navLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="text-[15px] font-medium text-[#425466] hover:text-[#0A2540] transition-colors"
          >
            {link.label}
          </a>
        ))}
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <a
          href="#kontakt"
          className="hidden sm:inline-flex items-center px-4 py-2 text-[15px] font-medium text-[#0A2540] hover:text-[#4F46E5] transition-colors"
        >
          Kontakt
        </a>
        <a
          href="#demo"
          className="inline-flex items-center px-5 py-2.5 text-[15px] font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] rounded-lg transition-colors"
        >
          Demo anfragen
        </a>
      </div>
    </nav>
  );
}
