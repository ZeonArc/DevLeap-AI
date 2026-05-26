"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Hero3D from "@/components/Hero3D";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const COMPANIES = ["Google", "Meta", "Amazon", "Netflix", "Apple", "Stripe", "OpenAI", "Vercel"];

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // ─── Hero Title: words clip up one by one ───
      gsap.fromTo(".hero-word",
        { y: "110%", opacity: 0 },
        {
          y: "0%",
          opacity: 1,
          duration: 1.6,
          stagger: 0.12,
          ease: "expo.out",
          delay: 0.3,
        }
      );

      gsap.fromTo(".hero-sub",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1.2, ease: "power2.out", delay: 1.0 }
      );

      // ─── Scroll-driven section reveals ───
      const sections = containerRef.current!.querySelectorAll("[data-reveal]");
      sections.forEach((el) => {
        gsap.fromTo(el,
          { opacity: 0, y: 100, rotateX: -8 },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 1.4,
            ease: "expo.out",
            scrollTrigger: {
              trigger: el,
              start: "top 82%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });

      // ─── Big text scrub animations ───
      gsap.utils.toArray<HTMLElement>(".scrub-text").forEach((el) => {
        gsap.fromTo(el,
          { opacity: 0, y: 120, scale: 0.85 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top 90%",
              end: "top 40%",
              scrub: 1.5, // TRUE scrub — tied to scroll position
            },
          }
        );
      });

      // ─── Company marquee fade-in ───
      gsap.fromTo(".marquee-container",
        { opacity: 0 },
        {
          opacity: 1,
          duration: 1,
          scrollTrigger: {
            trigger: ".marquee-container",
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // ─── Grid items stagger ───
      gsap.fromTo(".grid-item",
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".grid-section",
            start: "top 70%",
            toggleActions: "play none none reverse",
          },
        }
      );

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <main ref={containerRef} className="relative w-full text-white" style={{ perspective: "1200px" }}>
      {/* ═══ WebGL Background ═══ */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <Hero3D />
      </div>

      {/* ═══ Section 1: Hero ═══ */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 relative">
        {/* Floating decorators */}
        <div className="absolute top-[20%] left-[8%] w-20 h-20 border border-primary/10 rounded-full glow-shape" />
        <div className="absolute bottom-[25%] right-[10%] w-28 h-28 border border-magenta/10 rotate-45 rounded-xl glow-shape" style={{ animationDelay: "2s" }} />
        <div className="absolute top-[60%] left-[15%] w-3 h-3 bg-primary/30 rounded-full float-anim" />
        <div className="absolute top-[30%] right-[20%] w-2 h-2 bg-magenta/20 rounded-full float-anim" style={{ animationDelay: "3s" }} />

        <div className="max-w-5xl w-full flex flex-col items-center justify-center text-center space-y-6 z-10">
          <p className="hero-sub text-[10px] md:text-xs tracking-[0.5em] uppercase font-bold text-gray-500">
            DevLeap AI — Autonomous Profiler
          </p>

          <div className="flex flex-col items-center justify-center w-full">
            <h1 className="overflow-hidden">
              <span className="hero-word inline-block text-[clamp(3rem,12vw,11rem)] font-black uppercase tracking-tighter leading-[0.9] hover-button">
                Autonomous
              </span>
            </h1>
            <h1 className="overflow-hidden -mt-4">
              <span className="hero-word inline-block text-[clamp(3rem,12vw,11rem)] font-black uppercase tracking-tighter leading-[0.9] gradient-text hover-button">
                Outreach
              </span>
            </h1>
          </div>

          <p className="hero-sub text-lg md:text-2xl font-light text-gray-400 pt-4">
            at every stage.
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 hero-sub">
          <span className="text-[9px] tracking-[0.4em] uppercase text-gray-600">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-gray-600 to-transparent animate-pulse" />
        </div>
      </section>

      {/* ═══ Section 2: Statement ═══ */}
      <section className="min-h-screen flex items-center justify-center px-6 md:px-20 relative">
        <div className="absolute top-1/3 left-[5%] w-40 h-40 border border-primary/5 rounded-full glow-shape" />
        <div className="absolute bottom-1/4 right-[8%] w-32 h-px bg-gradient-to-r from-transparent via-magenta/20 to-transparent" />

        <div data-reveal className="max-w-5xl text-center z-10">
          <h2 className="text-3xl md:text-6xl lg:text-7xl font-bold leading-[1.1]">
            We are DevLeap AI, a platform <br className="hidden md:block" />
            blending{" "}
            <span className="gradient-text font-black italic">LLM Intelligence</span>
            <br className="hidden md:block" />
            {" "}with GitHub extraction.
          </h2>
        </div>
      </section>

      {/* ═══ Section 3: Company Marquee ═══ */}
      <section className="py-24 relative border-y border-white/[0.04] bg-black/30 backdrop-blur-sm marquee-container">
        <p className="text-[10px] tracking-[0.4em] uppercase text-gray-600 font-bold text-center mb-14">
          Our developers have been hired at
        </p>

        <div className="overflow-hidden">
          <div className="marquee-track">
            {[...COMPANIES, ...COMPANIES].map((c, i) => (
              <span
                key={i}
                className="text-3xl md:text-5xl font-black text-white/[0.08] hover:text-white/60 transition-colors duration-500 px-8 md:px-14 whitespace-nowrap hover-button"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Section 4: Profile / Match / Pitch ═══ */}
      <section className="min-h-screen flex flex-col justify-center px-8 md:px-24 lg:px-32 py-20">
        <div className="space-y-6">
          {[
            { word: "Profile", color: "hover:text-primary" },
            { word: "Match", color: "hover:text-magenta" },
            { word: "Pitch", color: "hover:text-white" },
          ].map(({ word, color }) => (
            <div key={word} className="overflow-hidden">
              <h2 className={`scrub-text text-[clamp(3rem,10vw,9rem)] font-black uppercase tracking-tighter leading-[1] ${color} transition-colors duration-300 hover-button`}>
                {word}
              </h2>
            </div>
          ))}
        </div>
        <div data-reveal className="max-w-lg pt-12">
          <p className="text-gray-400 text-base md:text-lg leading-relaxed">
            We develop custom Blueprints to strategically leverage AI, enhancing every aspect of your developer portfolio and outreach pipeline.
          </p>
        </div>
      </section>

      {/* ═══ Section 5: Augment / Supercharge / Automate ═══ */}
      {[
        { word: "Augment", desc: "your existing portfolio", sub: "Our approach involves identifying relevant repos and providing bespoke customization to" },
        { word: "Supercharge", desc: "job discovery", sub: "We analyze market trends and match your exact skillset to" },
        { word: "Automate", desc: "routine applications", sub: "We generate highly personalized, context-aware emails to" },
      ].map(({ word, desc, sub }) => (
        <section key={word} className="min-h-[70vh] flex items-center justify-center text-center px-6">
          <div className="space-y-5">
            <p data-reveal className="text-gray-500 uppercase tracking-[0.3em] text-[10px] md:text-xs font-medium">
              {sub}
            </p>
            <h2 className="scrub-text text-[clamp(3.5rem,12vw,10rem)] font-black uppercase gradient-text leading-none">
              {word}
            </h2>
            <p data-reveal className="text-xl md:text-2xl font-light italic text-gray-300">{desc}</p>
          </div>
        </section>
      ))}

      {/* ═══ Section 6: The Future ═══ */}
      <section className="min-h-screen flex items-center justify-center px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-transparent pointer-events-none" />
        <div data-reveal className="max-w-4xl text-center space-y-10 z-10">
          <h2 className="text-5xl md:text-8xl font-black leading-[0.95] uppercase">
            The Future<br />
            <span className="gradient-text">is Autonomous</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-400 font-light max-w-2xl mx-auto">
            As the future blends developer expertise with AI, we lead this transition — ensuring you thrive in an evolving job market.
          </p>
        </div>
      </section>

      {/* ═══ Section 7: What We Do ═══ */}
      <section className="grid-section min-h-screen py-32 px-8 md:px-24 lg:px-32 relative">
        <div className="absolute inset-0 bg-black/60 pointer-events-none" />

        <div className="relative z-10">
          <div data-reveal className="mb-20">
            <p className="section-number mb-4">( services )</p>
            <h2 className="text-4xl md:text-7xl font-black uppercase leading-[0.95]">
              What we do<br />and how
            </h2>
          </div>

          <div className="line-divider mb-16" />

          <div className="grid md:grid-cols-3 gap-12 md:gap-16">
            {[
              {
                num: "01",
                title: "Deep Profiling",
                desc: "We ingest your GitHub repositories, analyzing code architecture, language usage, and commit history to build a comprehensive technical fingerprint.",
                accent: "text-primary",
              },
              {
                num: "02",
                title: "Market Matching",
                desc: "Our Broker engine scrapes LinkedIn and other job boards, cross-referencing requirements with your profile to find high-probability matches.",
                accent: "text-magenta",
              },
              {
                num: "03",
                title: "Autonomous Pitching",
                desc: "We synthesize custom cover letters and emails, citing your specific repos that solve the employer's problems, and automate the outreach process.",
                accent: "text-white",
              },
            ].map(({ num, title, desc, accent }) => (
              <div key={num} className="grid-item space-y-5">
                <span className={`font-mono text-sm ${accent} opacity-60`}>{num}</span>
                <h3 className="text-2xl md:text-3xl font-bold uppercase">{title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm md:text-base">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
