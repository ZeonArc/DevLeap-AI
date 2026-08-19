"use client";

import { useRef } from "react";
import { useScrollReveal } from "@/lib/useScrollReveal";
import StripeCheckoutButton from "@/components/StripeCheckoutButton";

const TIERS = [
  {
    name: "Starter",
    price: "$0",
    period: "/mo",
    desc: "Keep a live technical profile without paying for it.",
    features: [
      { text: "1 GitHub repository sync", included: true },
      { text: "Basic profile generation", included: true },
      { text: "Autonomous pitching", included: false },
      { text: "Live job matching", included: false },
    ],
    cta: "Get started",
    style: "secondary",
  },
  {
    name: "Pro Broker",
    price: "$29",
    period: "/mo",
    desc: "The full pipeline: ingest, match, and pitch, on autopilot.",
    badge: "Most used",
    features: [
      { text: "Unlimited GitHub repos", included: true },
      { text: "Architecture extraction", included: true },
      { text: "Live job matching", included: true },
      { text: "100 autonomous pitches/mo", included: true },
    ],
    cta: "Upgrade to Pro",
    style: "primary",
  },
];

export default function Pricing() {
  const containerRef = useRef<HTMLDivElement>(null);
  useScrollReveal(containerRef);

  return (
    <main ref={containerRef} className="w-full">
      <section className="max-w-4xl mx-auto px-6 md:px-8 pt-20 md:pt-28 pb-14 text-center">
        <p className="reveal-up eyebrow mb-5">( pricing )</p>
        <h1 className="reveal-up font-display text-[clamp(2rem,4.5vw,3.25rem)] leading-tight mb-5">
          Simple pricing, no seat minimums.
        </h1>
        <p className="reveal-up text-muted text-lg max-w-xl mx-auto">
          Keep your profile current for free, or turn on autonomous matching and pitching
          when you’re actively looking.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-6 md:px-8 pb-24 md:pb-28">
        <div className="grid md:grid-cols-2 gap-6">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`reveal-up panel p-8 md:p-9 relative flex flex-col ${
                tier.style === "primary" ? "border-signal/40" : ""
              }`}
            >
              {tier.badge && (
                <span className="badge badge-signal absolute top-7 right-7">{tier.badge}</span>
              )}

              <h2 className="font-display text-2xl mb-1.5">{tier.name}</h2>
              <p className="text-sm text-muted mb-7">{tier.desc}</p>

              <div className="mb-7">
                <span className="font-display text-4xl">{tier.price}</span>
                <span className="text-muted text-sm">{tier.period}</span>
              </div>

              <div className="hairline mb-7" />

              <ul className="space-y-3.5 mb-9 flex-1">
                {tier.features.map((f) => (
                  <li
                    key={f.text}
                    className={`flex items-center gap-3 text-sm ${f.included ? "text-paper" : "text-faint"}`}
                  >
                    <span className={f.included ? "text-signal" : "text-faint"}>
                      {f.included ? "✓" : "–"}
                    </span>
                    {f.text}
                  </li>
                ))}
              </ul>

              {tier.name === "Pro Broker" ? (
                <StripeCheckoutButton planId="price_pro_broker" label={tier.cta} className="btn btn-primary w-full" />
              ) : (
                <button className="btn btn-secondary w-full">{tier.cta}</button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-[var(--line)]">
        <div className="max-w-2xl mx-auto px-6 md:px-8 py-20 text-center">
          <div className="reveal-up">
            <h2 className="font-display text-2xl md:text-3xl mb-4">Need something custom?</h2>
            <p className="text-muted mb-8">
              Dedicated infrastructure or white-label matching for recruitment teams — reach out and
              we’ll scope it with you directly.
            </p>
            <a href="/contact" className="btn btn-secondary">Contact us</a>
          </div>
        </div>
      </section>
    </main>
  );
}
