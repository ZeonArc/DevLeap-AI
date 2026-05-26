"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Hero3D from "@/components/Hero3D";
import StripeCheckoutButton from "@/components/StripeCheckoutButton";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const TIERS = [
  {
    name: "Starter",
    price: "$0",
    period: "/mo",
    desc: "Perfect for maintaining a live technical portfolio.",
    features: [
      { text: "1 GitHub Repository Sync", included: true },
      { text: "Basic Profile Generation", included: true },
      { text: "Autonomous Pitching", included: false },
      { text: "LinkedIn Matching", included: false },
    ],
    cta: "Get Started",
    accent: "border-white/10 hover:border-white/30",
    ctaStyle: "border border-white/20 text-white hover:bg-white hover:text-black",
  },
  {
    name: "Pro Broker",
    price: "$29",
    period: "/mo",
    desc: "The ultimate autonomous job hunting toolkit.",
    badge: "Popular",
    features: [
      { text: "Unlimited GitHub Repos", included: true },
      { text: "Architecture Extraction", included: true },
      { text: "Live LinkedIn Job Matching", included: true },
      { text: "100 Autonomous Pitches/mo", included: true },
    ],
    cta: "Upgrade to Pro",
    accent: "border-primary hover:border-magenta",
    ctaStyle: "bg-primary hover:bg-magenta text-white",
  },
];

export default function Pricing() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(".pricing-hero-word",
        { y: "110%", opacity: 0 },
        { y: "0%", opacity: 1, duration: 1.6, stagger: 0.12, ease: "expo.out", delay: 0.3 }
      );

      gsap.fromTo(".pricing-hero-sub",
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

      gsap.fromTo(".pricing-card",
        { opacity: 0, y: 60 },
        {
          opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: "power3.out",
          scrollTrigger: { trigger: ".pricing-grid", start: "top 75%", toggleActions: "play none none reverse" },
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
      <section className="min-h-[80vh] flex flex-col items-center justify-center px-6 relative">
        <div className="absolute top-[30%] left-[10%] w-20 h-20 border border-primary/10 rounded-full glow-shape" />

        <div className="max-w-5xl text-center space-y-6 z-10">
          <p className="pricing-hero-sub text-[10px] tracking-[0.5em] uppercase font-bold text-gray-500">
            ( pricing )
          </p>
          <h1 className="overflow-hidden">
            <span className="pricing-hero-word inline-block text-[clamp(3rem,10vw,9rem)] font-black uppercase tracking-tighter leading-[0.9]">
              Simple
            </span>
          </h1>
          <h1 className="overflow-hidden -mt-4">
            <span className="pricing-hero-word inline-block text-[clamp(3rem,10vw,9rem)] font-black uppercase tracking-tighter leading-[0.9] gradient-text">
              Pricing
            </span>
          </h1>
          <p className="pricing-hero-sub text-lg md:text-xl font-light text-gray-400 pt-4 max-w-xl mx-auto">
            Whether you are actively hunting for your next Senior role or just keeping your portfolio up-to-date.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pricing-grid pb-32 px-8 md:px-24 lg:px-32 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          {TIERS.map((tier) => (
            <div key={tier.name} className={`pricing-card glass-panel p-10 md:p-12 rounded-2xl border ${tier.accent} transition-colors duration-500 relative overflow-hidden group`}>
              {tier.badge && (
                <div className="absolute top-0 right-0 bg-primary text-white text-[9px] font-bold tracking-[0.3em] uppercase px-5 py-1.5 rounded-bl-xl">
                  {tier.badge}
                </div>
              )}

              <p className="section-number mb-4">( {tier.name.toLowerCase()} )</p>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider mb-2">{tier.name}</h2>
              <p className="text-gray-500 text-sm mb-10">{tier.desc}</p>

              <div className="mb-10">
                <span className="text-5xl md:text-6xl font-black">{tier.price}</span>
                <span className="text-xl text-gray-500 font-light">{tier.period}</span>
              </div>

              <div className="line-divider mb-8" />

              <ul className="space-y-5 mb-12">
                {tier.features.map((f, i) => (
                  <li key={i} className={`flex items-center gap-4 text-sm ${f.included ? "text-gray-300" : "text-gray-600"}`}>
                    <span className={`text-xs ${f.included ? "text-primary" : "text-gray-700"}`}>
                      {f.included ? "✓" : "✗"}
                    </span>
                    {f.text}
                  </li>
                ))}
              </ul>

              {tier.name === "Pro Broker" ? (
                <StripeCheckoutButton 
                  planId="price_pro_broker" 
                  label={tier.cta} 
                  className={`hover-button w-full py-4 rounded-xl font-bold tracking-[0.2em] uppercase text-xs transition-colors duration-300 ${tier.ctaStyle}`}
                />
              ) : (
                <button className={`hover-button w-full py-4 rounded-xl font-bold tracking-[0.2em] uppercase text-xs transition-colors duration-300 ${tier.ctaStyle}`}>
                  {tier.cta}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Enterprise CTA */}
      <section className="py-32 px-6 border-t border-white/[0.04]">
        <div data-reveal className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-6xl font-black uppercase">
            Need <span className="gradient-text">Enterprise</span>?
          </h2>
          <p className="text-gray-400 text-lg font-light max-w-xl mx-auto">
            Custom LLM tuning, dedicated infrastructure, and white-label solutions for recruitment agencies.
          </p>
          <button className="hover-button px-10 py-4 border border-white/20 rounded-xl text-xs tracking-[0.3em] uppercase font-bold hover:bg-white hover:text-black transition-colors duration-300">
            Contact Sales
          </button>
        </div>
      </section>
    </main>
  );
}
