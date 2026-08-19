"use client";

import Link from "next/link";
import ThemeSlider from "./ThemeSlider";

const COLUMNS = [
  {
    heading: "product",
    links: [
      { href: "/pricing", label: "Pricing" },
      { href: "/profiler", label: "Profiler" },
      { href: "/broker", label: "Broker" },
    ],
  },
  {
    heading: "company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-[var(--line)] mt-auto">
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_auto]">
          <div>
            <p className="font-display text-lg">DevLeap</p>
            <p className="mt-2 text-sm text-text-dim max-w-[15rem] leading-relaxed">
              Reads the repository. Cites the line. Waits for your approval.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <p className="eyebrow mb-4">{col.heading}</p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-dim hover:text-text transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <p className="eyebrow mb-4">theme</p>
            <ThemeSlider showLabel />
          </div>
        </div>

        <div className="hairline my-10" />

        <div className="flex flex-col sm:flex-row justify-between gap-3 font-mono text-[0.7rem] text-text-faint">
          <span>© {new Date().getFullYear()} DevLeap AI</span>
          <span>Drafts only. Nothing sends without you.</span>
        </div>
      </div>
    </footer>
  );
}
