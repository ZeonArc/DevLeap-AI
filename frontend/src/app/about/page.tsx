"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Hero3D from "@/components/Hero3D";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const TEAM = [
  { role: "AI Architecture", desc: "LLM pipeline design, prompt engineering, and structured output generation using Gemini." },
  { role: "Full-Stack Engineering", desc: "Next.js frontends, FastAPI backends, Docker orchestration, and cloud deployment." },
  { role: "Data Intelligence", desc: "GitHub API ingestion, code parsing, and developer skill extraction algorithms." },
];

const VALUES = [
  { num: "01", title: "Code Over Keywords", text: "We evaluate developers by their actual code contributions, not resume buzzwords." },
  { num: "02", title: "Autonomous First", text: "Every workflow we build aims to eliminate manual steps from the hiring pipeline." },
  { num: "03", title: "Privacy by Design", text: "We only analyze public repositories. Your private code stays private, always." },
];

export default function About() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Hero text clip-up
      gsap.fromTo(".about-hero-word",
        { y: "110%", opacity: 0 },
        { y: "0%", opacity: 1, duration: 1.6, stagger: 0.12, ease: "expo.out", delay: 0.3 }
      );

      gsap.fromTo(".about-hero-sub",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1.2, ease: "power2.out", delay: 1.0 }
      );

      // Scroll reveals
      containerRef.current!.querySelectorAll("[data-reveal]").forEach((el) => {
        gsap.fromTo(el,
          { opacity: 0, y: 80, rotateX: -8 },
          {
            opacity: 1, y: 0, rotateX: 0, duration: 1.4, ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 82%", toggleActions: "play none none reverse" },
          }
        );
      });

      // Grid stagger
      gsap.fromTo(".value-card",
        { opacity: 0, y: 60 },
        {
          opacity: 1, y: 0, duration: 1, stagger: 0.15, ease: "power3.out",
          scrollTrigger: { trigger: ".values-grid", start: "top 70%", toggleActions: "play none none reverse" },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <main ref={containerRef} className="relative w-full text-white" style={{ perspective: "1200px" }}>
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <Hero3D />
      </div>

      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 relative">
        <div className="absolute top-[25%] right-[12%] w-24 h-24 border border-primary/10 rounded-full glow-shape" />
        <div className="absolute bottom-[30%] left-[8%] w-16 h-16 border border-magenta/10 rotate-45 rounded-lg glow-shape" style={{ animationDelay: "2s" }} />

        <div className="max-w-5xl text-center space-y-6 z-10">
          <p className="about-hero-sub text-[10px] tracking-[0.5em] uppercase font-bold text-gray-500">
            ( about us )
          </p>
          <h1 className="overflow-hidden">
            <span className="about-hero-word inline-block text-[clamp(3rem,10vw,9rem)] font-black uppercase tracking-tighter leading-[0.9]">
              Built by
            </span>
          </h1>
          <h1 className="overflow-hidden -mt-4">
            <span className="about-hero-word inline-block text-[clamp(3rem,10vw,9rem)] font-black uppercase tracking-tighter leading-[0.9] gradient-text">
              Engineers
            </span>
          </h1>
          <p className="about-hero-sub text-lg md:text-2xl font-light text-gray-400 pt-4 max-w-2xl mx-auto">
            Developers should spend time building, not applying.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="min-h-screen flex items-center justify-center px-6 md:px-20">
        <div data-reveal className="max-w-5xl text-center">
          <h2 className="text-3xl md:text-6xl lg:text-7xl font-bold leading-[1.1]">
            The modern hiring process is{" "}
            <span className="gradient-text font-black italic">broken</span>.
            <br className="hidden md:block" />
            Brilliant engineers are filtered by keyword scanners while their actual code sits unread.
          </h2>
        </div>
      </section>

      {/* Team Capabilities */}
      <section className="py-32 px-8 md:px-24 lg:px-32 border-y border-white/[0.04] bg-black/30 backdrop-blur-sm">
        <div data-reveal className="mb-20">
          <p className="section-number mb-4">( capabilities )</p>
          <h2 className="text-4xl md:text-7xl font-black uppercase leading-[0.95]">
            What we<br />bring
          </h2>
        </div>

        <div className="line-divider mb-16" />

        <div className="grid md:grid-cols-3 gap-12 md:gap-16">
          {TEAM.map((item, i) => (
            <div key={i} data-reveal className="space-y-5">
              <span className="font-mono text-sm text-primary/60">0{i + 1}</span>
              <h3 className="text-2xl md:text-3xl font-bold uppercase">{item.role}</h3>
              <p className="text-gray-400 leading-relaxed text-sm md:text-base">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="values-grid py-32 px-8 md:px-24 lg:px-32">
        <div data-reveal className="mb-20">
          <p className="section-number mb-4">( values )</p>
          <h2 className="text-4xl md:text-7xl font-black uppercase leading-[0.95]">
            Our<br />principles
          </h2>
        </div>

        <div className="line-divider mb-16" />

        <div className="grid md:grid-cols-3 gap-12 md:gap-16">
          {VALUES.map(({ num, title, text }) => (
            <div key={num} className="value-card glass-panel p-10 rounded-2xl hover:border-primary/30 transition-colors duration-500 space-y-5">
              <span className="font-mono text-sm text-primary/60">{num}</span>
              <h3 className="text-xl md:text-2xl font-bold uppercase">{title}</h3>
              <p className="text-gray-400 leading-relaxed text-sm">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
