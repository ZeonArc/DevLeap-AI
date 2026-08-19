"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
}

/**
 * Wraps marketing pages in GSAP ScrollSmoother for inertia scrolling and
 * data-speed/data-lag parallax (see the grid-field layers on the landing
 * page). Skipped under prefers-reduced-motion so the page just scrolls
 * natively instead of a disabled effect pretending to be there.
 *
 * Fixed-position chrome (the nav bar) must live outside this wrapper --
 * ScrollSmoother drives scroll via a transform on #smooth-content, which
 * breaks position: sticky for anything nested inside it.
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const smoother = ScrollSmoother.create({
      wrapper: wrapperRef.current,
      content: contentRef.current,
      smooth: 1.1,
      effects: true,
      normalizeScroll: true,
    });

    return () => smoother.kill();
  }, []);

  // Route changes swap {children} in place rather than remounting this
  // wrapper, so the smoother's cached page height goes stale on navigation.
  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return (
    <div id="smooth-wrapper" ref={wrapperRef}>
      <div id="smooth-content" ref={contentRef}>
        {children}
      </div>
    </div>
  );
}
