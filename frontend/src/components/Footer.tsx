"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.04] bg-black/60 backdrop-blur-md py-16 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          {/* Left */}
          <div className="space-y-3">
            <p className="text-xs font-black tracking-[0.2em] uppercase">DevLeap AI</p>
            <p className="text-[10px] tracking-[0.3em] text-gray-600 uppercase">
              Autonomous Recruiter Platform
            </p>
          </div>

          {/* Center links */}
          <div className="flex gap-8">
            {[
              { href: "/about", label: "About" },
              { href: "/pricing", label: "Services" },
              { href: "/contact", label: "Contact" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="hover-button text-[10px] tracking-[0.25em] uppercase font-bold text-gray-500 hover:text-white transition-colors duration-300"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right */}
          <div className="flex items-center gap-6">
            <span className="text-[10px] tracking-[0.2em] text-gray-600 uppercase">
              © {new Date().getFullYear()}
            </span>
            <button
              className="hover-button text-[10px] tracking-[0.25em] uppercase font-bold text-gray-500 hover:text-primary transition-colors"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              ↑ Top
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
