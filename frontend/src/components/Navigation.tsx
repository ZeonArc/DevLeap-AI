"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import ThemeSlider from "./ThemeSlider";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu when the route changes, without the extra render
  // an effect-based reset would cost.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled
          ? "bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] backdrop-blur-xl border-b border-[var(--line)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="DevLeap AI home">
          <Mark />
          <span className="font-display text-[1.05rem]">DevLeap</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7" aria-label="Main">
          {LINKS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`text-sm transition-colors ${
                  active ? "text-text" : "text-text-dim hover:text-text"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeSlider />

          <div className="hidden sm:flex items-center gap-2.5">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="btn btn-ghost px-3">Log in</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="btn btn-primary">Start a review</button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard" className="text-sm text-accent hover:opacity-80 transition-opacity mr-1">
                Dashboard
              </Link>
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-8 h-8 rounded-md border border-[var(--line)]",
                  },
                }}
              />
            </Show>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden btn btn-ghost px-2 py-2"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              {menuOpen ? (
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              ) : (
                <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden border-t border-[var(--line)] bg-[var(--surface)] px-6 py-5 space-y-4"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="py-2 text-sm text-text-dim hover:text-text transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="hairline" />

          <div className="flex flex-col gap-2.5">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="btn btn-secondary w-full">Log in</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="btn btn-primary w-full">Start a review</button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard" className="btn btn-primary w-full">
                Dashboard
              </Link>
            </Show>
          </div>
        </div>
      )}
    </header>
  );
}

/* Two brackets closing on a line — a reviewed change, reduced to a mark. */
function Mark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="22" height="22" rx="6" fill="var(--accent-wash)" stroke="var(--line-strong)" />
      <path d="M9 8.5 5.5 12 9 15.5" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 8.5 18.5 12 15 15.5" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 7.5v9" stroke="var(--alt)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
