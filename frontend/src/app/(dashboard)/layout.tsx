"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeSlider from "@/components/ThemeSlider";

const NAV_LINKS = [
  { href: "/dashboard", label: "Overview", icon: "◆" },
  { href: "/profiler", label: "Profiler", icon: "◈" },
  { href: "/broker", label: "Broker", icon: "◎" },
  { href: "/profile", label: "My Profile", icon: "◐" },
  { href: "/history", label: "History", icon: "▤" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex w-60 flex-col border-r border-[var(--line)] bg-[var(--surface)] fixed inset-y-0 left-0 z-40">
        <div className="px-6 h-16 flex items-center border-b border-[var(--line)]">
          <Link href="/" className="flex items-center gap-2.5">
            <Mark />
            <span className="font-display text-sm">DevLeap</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1" aria-label="Dashboard">
          {NAV_LINKS.map(({ href, label, icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-sm transition-colors ${
                  isActive
                    ? "bg-[var(--accent-wash)] text-accent"
                    : "text-text-dim hover:text-text hover:bg-[var(--surface-2)]"
                }`}
              >
                <span className="text-sm w-4 text-center">{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-[var(--line)]">
          <p className="eyebrow mb-3">theme</p>
          <ThemeSlider />
        </div>

        <div className="p-4 border-t border-[var(--line)] flex items-center gap-3">
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "w-8 h-8 rounded-md border border-[var(--line)]",
                userButtonPopoverCard:
                  "bg-[var(--surface)] border border-[var(--line)] shadow-2xl",
                userButtonPopoverActionButtonText: "text-sm",
                userButtonPopoverFooter: "hidden",
              },
            }}
          />
          <span className="text-xs text-text-dim">Account</span>
        </div>
      </aside>

      {/* Top bar — mobile */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 bg-[var(--surface)] border-b border-[var(--line)]">
        <div className="h-14 px-4 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Mark />
            <span className="font-display text-sm">DevLeap</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <ThemeSlider />
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: "w-7 h-7 rounded-md border border-[var(--line)]",
                },
              }}
            />
          </div>
        </div>

        <nav
          className="flex gap-1 px-3 pb-2 overflow-x-auto custom-scrollbar"
          aria-label="Dashboard"
        >
          {NAV_LINKS.map(({ href, label, icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-[var(--accent-wash)] text-accent"
                    : "text-text-dim hover:text-text"
                }`}
              >
                <span aria-hidden="true">{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="flex-1 md:ml-60 min-h-screen pt-28 md:pt-0">
        <div className="max-w-6xl p-6 md:p-12">{children}</div>
      </main>
    </div>
  );
}

function Mark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="22" height="22" rx="6" fill="var(--accent-wash)" stroke="var(--line-strong)" />
      <path d="M9 8.5 5.5 12 9 15.5" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 8.5 18.5 12 15 15.5" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 7.5v9" stroke="var(--alt)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
