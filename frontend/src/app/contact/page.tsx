"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Hero3D from "@/components/Hero3D";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Contact() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(".contact-hero-word",
        { y: "110%", opacity: 0 },
        { y: "0%", opacity: 1, duration: 1.6, stagger: 0.12, ease: "expo.out", delay: 0.3 }
      );

      gsap.fromTo(".contact-hero-sub",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1.2, ease: "power2.out", delay: 1.0 }
      );

      containerRef.current!.querySelectorAll("[data-reveal]").forEach((el) => {
        gsap.fromTo(el,
          { opacity: 0, y: 80, rotateX: -8 },
          {
            opacity: 1, y: 0, rotateX: 0, duration: 1.4, ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 82%", toggleActions: "play none none reverse" },
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <main ref={containerRef} className="relative w-full text-white" style={{ perspective: "1200px" }}>
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <Hero3D />
      </div>

      {/* Hero */}
      <section className="min-h-[70vh] flex flex-col items-center justify-center px-6 relative">
        <div className="absolute bottom-[30%] right-[12%] w-28 h-28 border border-magenta/10 rounded-full glow-shape" />

        <div className="max-w-5xl text-center space-y-6 z-10">
          <p className="contact-hero-sub text-[10px] tracking-[0.5em] uppercase font-bold text-gray-500">
            ( contact )
          </p>
          <h1 className="overflow-hidden">
            <span className="contact-hero-word inline-block text-[clamp(3rem,10vw,9rem)] font-black uppercase tracking-tighter leading-[0.9]">
              Get in
            </span>
          </h1>
          <h1 className="overflow-hidden -mt-4">
            <span className="contact-hero-word inline-block text-[clamp(3rem,10vw,9rem)] font-black uppercase tracking-tighter leading-[0.9] gradient-text">
              Touch
            </span>
          </h1>
          <p className="contact-hero-sub text-lg md:text-xl font-light text-gray-400 pt-4 max-w-lg mx-auto">
            Questions about Enterprise licensing, custom LLM tuning, or partnership opportunities? Reach out below.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="pb-32 px-8 md:px-24 max-w-3xl mx-auto">
        <form data-reveal className="glass-panel p-10 md:p-14 rounded-2xl space-y-8 border border-white/[0.06] hover:border-primary/20 transition-colors duration-500">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] tracking-[0.3em] uppercase font-bold text-gray-500">First Name</label>
              <input
                type="text"
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-5 py-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="John"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] tracking-[0.3em] uppercase font-bold text-gray-500">Last Name</label>
              <input
                type="text"
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-5 py-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] tracking-[0.3em] uppercase font-bold text-gray-500">Email Address</label>
            <input
              type="email"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-5 py-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="john@company.com"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] tracking-[0.3em] uppercase font-bold text-gray-500">Message</label>
            <textarea
              rows={6}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-5 py-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors resize-none"
              placeholder="Tell us about your needs..."
            />
          </div>

          <button
            type="button"
            className="hover-button w-full py-4 bg-white hover:bg-primary text-black hover:text-white font-bold tracking-[0.2em] uppercase text-xs rounded-xl transition-colors duration-300"
          >
            Send Message
          </button>
        </form>
      </section>

      {/* Info Columns */}
      <section className="py-20 px-8 md:px-24 lg:px-32 border-t border-white/[0.04]">
        <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
          {[
            { label: "Email", value: "hello@devleap.ai" },
            { label: "Location", value: "Remote-first · Global" },
            { label: "Response Time", value: "Within 24 hours" },
          ].map(({ label, value }) => (
            <div key={label} data-reveal className="text-center space-y-3">
              <p className="text-[10px] tracking-[0.4em] uppercase text-gray-600 font-bold">{label}</p>
              <p className="text-lg font-medium">{value}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
