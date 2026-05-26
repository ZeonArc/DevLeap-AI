"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Image from "next/image";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";

export default function Navigation() {
  const navRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (navRef.current) {
      gsap.fromTo(navRef.current,
        { y: -80, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: "expo.out", delay: 1.2 }
      );
    }

    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { href: "/about", label: "About" },
    { href: "/pricing", label: "Services" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 w-full z-50 transition-all duration-700 ${
        scrolled
          ? "py-4 bg-black/70 backdrop-blur-xl border-b border-white/[0.04] shadow-2xl shadow-black/40"
          : "py-7 bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="hover-button flex items-center gap-3 group">
          <Image
            src="/logo.png"
            alt="DevLeap AI"
            width={scrolled ? 24 : 30}
            height={scrolled ? 24 : 30}
            className="rounded-md group-hover:scale-110 transition-all duration-300"
          />
          <span className={`font-black tracking-[0.2em] uppercase transition-all duration-300 ${scrolled ? "text-[10px]" : "text-xs"}`}>
            DevLeap AI
          </span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-8 md:gap-10">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="hover-button group relative py-1"
            >
              <span className="text-[10px] md:text-xs tracking-[0.25em] uppercase font-bold text-gray-400 group-hover:text-white transition-colors duration-300">
                {label}
              </span>
              <span className="absolute bottom-0 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-400 ease-out" />
            </Link>
          ))}
          
          {/* Clerk Auth Tabs */}
          <div className="flex items-center gap-4 ml-4">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="text-[10px] md:text-xs tracking-[0.15em] uppercase font-bold text-gray-400 hover:text-white transition-colors">
                  Log In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="text-[10px] md:text-xs tracking-[0.15em] uppercase font-bold bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-sm transition-colors">
                  Sign Up
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link
                href="/dashboard"
                className="text-[10px] md:text-xs tracking-[0.15em] uppercase font-bold text-primary hover:text-primary-hover mr-4 transition-colors"
              >
                Dashboard
              </Link>
              <UserButton 
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-8 h-8 rounded-sm border border-white/20",
                  }
                }}
              />
            </Show>
          </div>
        </div>
      </div>
    </nav>
  );
}
