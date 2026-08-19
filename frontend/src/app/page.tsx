"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { SignUpButton, Show } from "@clerk/nextjs";
import EvidenceReview from "@/components/EvidenceReview";
import PipelineStrip from "@/components/PipelineStrip";
import Disclosure from "@/components/Disclosure";
import { useScrollReveal } from "@/lib/useScrollReveal";

const READS = [
  {
    label: "source",
    title: "Every file in the tree",
    body: "The whole repository gets parsed — not the README's summary of it. What you wrote is the input.",
  },
  {
    label: "architecture",
    title: "The shape of the system",
    body: "Module boundaries and data flow come back as diagrams you can drop straight into an interview.",
  },
  {
    label: "stack",
    title: "What you actually run",
    body: "Languages, frameworks, and services detected from imports and config, with the file that proves each one.",
  },
];

const SKILLS = [
  { name: "Async Python", level: "deep", cite: "backend/profiler/github_ingest.py" },
  { name: "FastAPI", level: "deep", cite: "backend/main.py" },
  { name: "PostgreSQL", level: "working", cite: "backend/db.py" },
  { name: "Rate limiting", level: "working", cite: "backend/core/rate_limit.py" },
  { name: "Next.js", level: "deep", cite: "frontend/src/app/layout.tsx" },
];

const FAQ = [
  {
    q: "Where does my code go?",
    a: "DevLeap clones the repository you point it at and sends the source text to Gemini for analysis, then stores the resulting profile against your account. Only public repositories are supported today.",
  },
  {
    q: "Can it claim something I did not build?",
    a: "Every sentence in a draft is generated from files in the repository you connected, and each claim carries the path it came from. If a citation looks wrong, the claim is wrong — reject it and the pitch is discarded.",
  },
  {
    q: "Does it email people for me?",
    a: "No. DevLeap drafts and stops. Each pitch waits in your queue until you approve it, and you can edit the text before anything leaves your hands.",
  },
  {
    q: "What are the limits?",
    a: "Ingestion is the expensive step, so it is capped at 5 runs an hour per account. Pitch drafting and job matching share a budget of 20 an hour.",
  },
];

export default function Home() {
  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useScrollReveal(pageRef);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(".hero-in", { opacity: 1, y: 0 });
        return;
      }
      gsap.to(".hero-in", {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.09,
        delay: 0.05,
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={pageRef}>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative overflow-hidden">
        <div
          aria-hidden="true"
          data-speed="0.85"
          className="absolute inset-0 grid-field fade-edges opacity-60 pointer-events-none"
        />

        <div className="relative max-w-6xl mx-auto px-6 md:px-8 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-14 lg:gap-16 items-center">
            <div>
              <p className="hero-in eyebrow translate-y-3">code review for your career</p>

              <h1 className="hero-in translate-y-3 font-display text-[2.6rem] leading-[1.03] sm:text-6xl lg:text-[4.1rem] mt-5">
                Your commits
                <br />
                already made
                <br />
                <span className="text-accent">the case.</span>
              </h1>

              <p className="hero-in translate-y-3 mt-7 text-[1.05rem] leading-relaxed text-text-dim max-w-lg">
                DevLeap reads your repositories, builds a technical profile from the source
                itself, and drafts outreach that cites the exact code behind every claim.
              </p>

              <div className="hero-in translate-y-3 mt-9 flex flex-col sm:flex-row gap-3">
                <Show when="signed-out">
                  <SignUpButton mode="modal">
                    <button className="btn btn-primary">Start a review</button>
                  </SignUpButton>
                </Show>
                <Show when="signed-in">
                  <Link href="/profiler" className="btn btn-primary">
                    Start a review
                  </Link>
                </Show>
                <a href="#reads" className="btn btn-secondary">
                  See what it reads
                </a>
              </div>

              <p className="hero-in translate-y-3 mt-7 font-mono text-[0.75rem] text-text-dim">
                No résumé upload. Point it at a repository and it does the reading.
              </p>
            </div>

            <div className="hero-in translate-y-3 lg:justify-self-end w-full flex justify-center lg:justify-end">
              <EvidenceReview />
            </div>
          </div>
        </div>
      </section>

      {/* ── Pipeline ─────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 md:px-8 py-20 md:py-24">
        <div className="reveal-up mb-10 max-w-2xl">
          <p className="eyebrow mb-3">the pass</p>
          <h2 className="font-display text-3xl md:text-4xl">
            Four stages, each one feeding the next.
          </h2>
        </div>

        <div className="reveal-up">
          <PipelineStrip />
        </div>
      </section>

      {/* ── What it reads ────────────────────────────────────── */}
      <section id="reads" className="border-y border-[var(--line)] bg-[var(--surface-2)]">
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-20 md:py-24">
          <div className="reveal-up mb-12 max-w-2xl">
            <p className="eyebrow mb-3">the evidence</p>
            <h2 className="font-display text-3xl md:text-4xl">
              A profile is only as good as what it read.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {READS.map((item, i) => (
              <article
                key={item.title}
                className="reveal-up panel panel-lift p-7 flex flex-col gap-3"
                data-reveal-delay={i * 0.08}
              >
                <span className="badge badge-circuit self-start">{item.label}</span>
                <h3 className="font-display text-xl mt-1">{item.title}</h3>
                <p className="text-sm leading-relaxed text-text-dim">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sample output ────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 md:px-8 py-20 md:py-24">
        <div className="reveal-up mb-12 max-w-2xl">
          <p className="eyebrow mb-3">sample output</p>
          <h2 className="font-display text-3xl md:text-4xl">
            Claims arrive with their receipts attached.
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <div className="reveal-up panel p-7">
            <div className="flex items-center justify-between mb-6">
              <h3 className="eyebrow">extracted skills</h3>
              <span className="badge badge-muted">5 of 23</span>
            </div>

            <ul className="space-y-0">
              {SKILLS.map((skill, i) => (
                <li
                  key={skill.name}
                  className={`flex items-center justify-between gap-4 py-3.5 ${
                    i !== SKILLS.length - 1 ? "border-b border-[var(--line)]" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{skill.name}</p>
                    <p className="citation mt-1 block overflow-hidden text-ellipsis">{skill.cite}</p>
                  </div>
                  <span
                    className={`badge shrink-0 ${
                      skill.level === "deep" ? "badge-signal" : "badge-muted"
                    }`}
                  >
                    {skill.level}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="reveal-up panel p-7 flex flex-col" data-reveal-delay="0.08">
            <div className="flex items-center justify-between mb-6">
              <h3 className="eyebrow">drafted pitch</h3>
              <span className="badge badge-success">
                <span className="dot" />
                awaiting your approval
              </span>
            </div>

            <div className="terminal p-5 text-[0.8125rem] leading-[1.75] text-text-dim flex-1">
              <p className="text-text">Re: Senior Backend Engineer</p>
              <p className="mt-3">
                I noticed the role leans on ingestion pipelines under real rate pressure. I
                built one: DevLeap clones a repository, pushes up to 500k characters of source
                through Gemini, and holds the whole path behind a 5-run hourly budget so a
                single account cannot exhaust the quota.
              </p>
              <p className="mt-3">
                The URL validation in front of it exists because <span className="text-accent">git clone</span>{" "}
                will happily read a local path if you let it.
              </p>
              <p className="mt-4 text-text-faint">
                — cites <span className="citation">profiler/github_ingest.py:41</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Honest limits ────────────────────────────────────── */}
      <section className="border-t border-[var(--line)]">
        <div className="max-w-3xl mx-auto px-6 md:px-8 py-20 md:py-24">
          <div className="reveal-up mb-10">
            <p className="eyebrow mb-3">before you connect anything</p>
            <h2 className="font-display text-3xl md:text-4xl">The parts worth asking about.</h2>
          </div>

          <div className="reveal-up">
            <Disclosure items={FAQ} />
          </div>
        </div>
      </section>

      {/* ── Close ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-[var(--line)]">
        <div
          aria-hidden="true"
          data-speed="0.85"
          className="absolute inset-0 grid-field fade-edges opacity-50 pointer-events-none"
        />
        <div className="relative max-w-3xl mx-auto px-6 md:px-8 py-24 md:py-28 text-center">
          <h2 className="reveal-up font-display text-4xl md:text-5xl">
            Point it at one repository.
          </h2>
          <p className="reveal-up mt-5 text-text-dim leading-relaxed max-w-md mx-auto">
            You will see the profile it builds before you send anything to anyone.
          </p>
          <div className="reveal-up mt-9 flex flex-col sm:flex-row gap-3 justify-center">
            <Show when="signed-out">
              <SignUpButton mode="modal">
                <button className="btn btn-primary">Start a review</button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link href="/profiler" className="btn btn-primary">
                Start a review
              </Link>
            </Show>
            <Link href="/pricing" className="btn btn-secondary">
              See pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
