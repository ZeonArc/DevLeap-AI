"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

const NAV_LINKS = [
  { href: "/dashboard", label: "Overview", icon: "❖" },
  { href: "/profiler", label: "Profiler Agent", icon: "⎔" },
  { href: "/broker", label: "Broker Agent", icon: "⌖" },
  { href: "/profile", label: "My Profile", icon: "◒" },
  { href: "/history", label: "Pitch History", icon: "◩" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-black">
      {/* Sidebar Navigation */}
      <aside className="w-64 flex flex-col border-r border-white/5 bg-black/40 backdrop-blur-xl pt-6 z-40 fixed inset-y-0 left-0">
        <div className="px-6 mb-12">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/logo.png"
              alt="DevLeap AI"
              width={24}
              height={24}
              className="rounded-md group-hover:scale-110 transition-all duration-300"
            />
            <span className="font-black tracking-[0.2em] uppercase text-[10px] text-white group-hover:text-primary transition-colors">
              DevLeap AI
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {NAV_LINKS.map(({ href, label, icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  isActive
                    ? "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10"
                    : "text-gray-500 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <span className={`text-lg transition-transform duration-300 ${isActive ? "text-primary scale-110" : "group-hover:text-primary"}`}>
                  {icon}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest">
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-6 border-t border-white/5 mt-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserButton 
              appearance={{
                elements: {
                  userButtonAvatarBox: "w-8 h-8 rounded-lg border border-white/10 hover:border-primary transition-colors",
                  userButtonPopoverCard: "bg-black/90 border border-white/10 backdrop-blur-xl shadow-2xl",
                  userButtonPopoverActionButtonText: "text-gray-300 font-bold uppercase text-[10px] tracking-widest",
                  userButtonPopoverActionButtonIcon: "text-primary",
                  userButtonPopoverFooter: "hidden",
                }
              }}
            />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-widest text-white">Account</span>
              <span className="text-[9px] uppercase tracking-widest text-primary">Pro Tier</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 relative overflow-hidden bg-[url('/grid.svg')] bg-center">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/90 to-primary/10 pointer-events-none" />
        <div className="relative z-10 w-full h-full p-8 md:p-12 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
