"use client";

import { useRef } from "react";
import { useScrollReveal } from "@/lib/useScrollReveal";

const CAPABILITIES = [
  { num: "01", title: "AI architecture", desc: "LLM pipeline design, prompt engineering, and structured output generation using Gemini 2.5 Flash." },
  { num: "02", title: "Full-stack engineering", desc: "Next.js frontends, FastAPI backends, and infrastructure that stays boring and reliable." },
  { num: "03", title: "Data intelligence", desc: "GitHub ingestion, code parsing, and skill-extraction that reads structure, not keywords." },
];

const VALUES = [
  { title: "Code over keywords", text: "We evaluate developers by what they actually built, not resume buzzwords or a keyword scanner's pattern match." },
  { title: "Cite everything", text: "Every claim a pitch makes about you points at a real repository. If we can't point at the code, we don't say it." },
  { title: "Public repos only", text: "We analyze public repositories you connect. Your private code is never touched, read, or stored." },
];

export default function About() {
  const containerRef = useRef<HTMLDivElement>(null);
  useScrollReveal(containerRef);

  return (
    <main ref={containerRef} className="w-full">
      <section className="max-w-4xl mx-auto px-6 md:px-8 pt-20 md:pt-28 pb-16">
        <p className="reveal-up eyebrow mb-5">( about )</p>
        <h1 className="reveal-up font-display text-[clamp(2rem,4.5vw,3.25rem)] leading-tight mb-6">
          Built by engineers tired of the keyword-scanner era.
        </h1>
        <p className="reveal-up text-muted text-lg leading-relaxed max-w-2xl">
          The modern hiring process filters brilliant engineers through resume parsers
          while their actual code — the strongest evidence of what they can do — sits
          unread in a repository nobody opened. We built DevLeap to fix the order of
          operations: let the code speak first.
        </p>
      </section>

      <section className="border-t border-[var(--line)]">
        <div className="max-w-4xl mx-auto px-6 md:px-8 py-16 md:py-20">
          <p className="reveal-up eyebrow mb-4">( capabilities )</p>
          <h2 className="reveal-up font-display text-2xl md:text-3xl mb-12">What we bring</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {CAPABILITIES.map((item) => (
              <div key={item.num} className="reveal-up">
                <span className="font-mono text-xs text-signal">{item.num}</span>
                <h3 className="font-display text-xl mt-3 mb-2">{item.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] bg-[var(--ink-raised)]/40">
        <div className="max-w-4xl mx-auto px-6 md:px-8 py-16 md:py-20">
          <p className="reveal-up eyebrow mb-4">( principles )</p>
          <h2 className="reveal-up font-display text-2xl md:text-3xl mb-12">How we operate</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className="reveal-up panel p-7">
                <h3 className="font-display text-lg mb-2">{v.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
