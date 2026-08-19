"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

type Kind = "ctx" | "del" | "add";

const LINES: { n: number; marker: string; text: string; kind: Kind }[] = [
  { n: 11, marker: " ", text: "## Backend engineering", kind: "ctx" },
  { n: 12, marker: "−", text: "Experienced backend engineer with strong Python skills.", kind: "del" },
  { n: 12, marker: "+", text: "Designed DevLeap's repository ingestion path: URL validation", kind: "add" },
  { n: 13, marker: "+", text: "against SSRF, 500k-char source analysis through Gemini, and a", kind: "add" },
  { n: 14, marker: "+", text: "5-run hourly budget on the most expensive call.", kind: "add" },
];

export default function EvidenceReview() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduce) {
        gsap.set("[data-rv]", { opacity: 1, x: 0, y: 0, scale: 1 });
        gsap.set("[data-wash]", { scaleX: 1 });
        return;
      }

      // Every step is a fromTo with an explicit end state. A bare `from` can
      // leave an element stranded at opacity 0 if the tween is interrupted
      // (React's double-mount in development does exactly that).
      const tl = gsap.timeline({ delay: 0.35, defaults: { ease: "power2.out" } });

      tl.fromTo(
        "[data-rv='line']",
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.3, stagger: 0.07 }
      )
        .fromTo(
          "[data-wash]",
          { scaleX: 0 },
          { scaleX: 1, duration: 0.45, stagger: 0.09, ease: "power3.inOut" },
          "-=0.35"
        )
        .fromTo(
          "[data-rv='note']",
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.4 },
          "-=0.1"
        )
        .fromTo(
          "[data-rv='verdict']",
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2.2)" },
          "-=0.25"
        );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="w-full max-w-xl">
      <div data-rv="panel" className="review shadow-[var(--shadow)]">
        <div className="review-head">
          <span data-rv="head" className="flex items-center gap-2 text-[0.75rem] text-text-dim">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M9 1.5H3.5A1.5 1.5 0 0 0 2 3v10A1.5 1.5 0 0 0 3.5 14.5h9A1.5 1.5 0 0 0 14 13V6.5L9 1.5Z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <path d="M9 1.5V6.5H14" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
            profile/summary.md
          </span>

          <span data-rv="verdict" className="badge badge-success ml-auto">
            <span className="dot" />
            evidence-backed
          </span>
        </div>

        <div className="py-3">
          {LINES.map((line, i) => (
            <div
              key={i}
              data-rv="line"
              className={`review-line ${
                line.kind === "del" ? "review-line-del" : line.kind === "add" ? "review-line-add" : ""
              }`}
            >
              {line.kind !== "ctx" && (
                <span
                  data-wash
                  className="review-wash"
                  style={{ background: line.kind === "del" ? "var(--err-wash)" : "var(--ok-wash)" }}
                />
              )}
              <span className="review-gutter">{line.n}</span>
              <span className="review-marker">{line.marker}</span>
              <span className="review-code">{line.text}</span>
            </div>
          ))}
        </div>

        <div data-rv="note" className="px-4 pb-4">
          <div className="annotation">
            Rewritten from the repository, not from adjectives. Every claim above resolves
            to a line you can open.
            <div className="mt-2">
              <span className="citation">backend/profiler/github_ingest.py:41</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
