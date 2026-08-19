"use client";

const STAGES = [
  {
    id: "01",
    name: "Ingest",
    body: "Validate the URL, clone the repository, and read the files — not the README's claims about them.",
    meta: "git clone · 142 files",
  },
  {
    id: "02",
    name: "Profile",
    body: "Extract the stack, the architecture, and the decisions worth defending, each tied to a source location.",
    meta: "gemini · 500k chars",
  },
  {
    id: "03",
    name: "Match",
    body: "Cross-reference the profile against live postings and rank them by what you have actually shipped.",
    meta: "search · ranked",
  },
  {
    id: "04",
    name: "Pitch",
    body: "Draft the outreach, citing the repository and line that backs every sentence. You approve before it sends.",
    meta: "draft · you approve",
  },
];

/**
 * The numbering here is load-bearing: each stage consumes the previous one's
 * output, so the order is information rather than decoration.
 */
export default function PipelineStrip() {
  return (
    <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--line)] border border-[var(--line)] rounded-[var(--radius-lg)] overflow-hidden">
      {STAGES.map((stage) => (
        <li key={stage.id} className="group relative bg-[var(--surface)] p-6 lg:p-7 flex flex-col gap-3">
          <div className="flex items-baseline gap-2.5">
            <span className="font-mono text-[0.7rem] text-accent tracking-[0.14em]">{stage.id}</span>
            <h3 className="font-display text-lg">{stage.name}</h3>
          </div>

          <p className="text-sm leading-relaxed text-text-dim flex-1">{stage.body}</p>

          <span className="font-mono text-[0.68rem] text-text-faint">{stage.meta}</span>

          {/* Progress hairline that fills on hover — the stage "running". */}
          <span
            aria-hidden="true"
            className="absolute left-0 bottom-0 h-px w-full origin-left scale-x-0 bg-accent transition-transform duration-500 ease-out group-hover:scale-x-100"
          />
        </li>
      ))}
    </ol>
  );
}
