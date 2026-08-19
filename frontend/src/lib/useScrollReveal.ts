"use client";

import { RefObject, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Fades/lifts every `.reveal-up` element inside the container into view as it
 * scrolls into the viewport. Elements start hidden via the `.reveal-up` CSS
 * class (see globals.css) so there's no flash of unstyled content before JS runs.
 * Respects prefers-reduced-motion by skipping straight to the visible state.
 */
export function useScrollReveal(containerRef: RefObject<HTMLElement | null>, deps: unknown[] = []) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      const targets = container.querySelectorAll<HTMLElement>(".reveal-up");
      if (reduceMotion) {
        gsap.set(targets, { opacity: 1, y: 0 });
        return;
      }
      targets.forEach((el) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power2.out",
          delay: Number(el.dataset.revealDelay || 0),
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            // Reveal once and stay revealed. Reversing on scroll-up would
            // blank out content the reader has already seen.
            once: true,
          },
        });
      });
    }, container);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
