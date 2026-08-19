"use client";

import { useId, useState } from "react";

export interface DisclosureItem {
  q: string;
  a: string;
}

export default function Disclosure({ items }: { items: DisclosureItem[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
      {items.map((item, i) => {
        const isOpen = open === i;
        const panelId = `${baseId}-panel-${i}`;
        const btnId = `${baseId}-btn-${i}`;

        return (
          <div key={i}>
            <h3>
              <button
                id={btnId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center gap-4 py-5 text-left group"
              >
                <span
                  className={`font-mono text-[0.7rem] shrink-0 transition-colors ${
                    isOpen ? "text-accent" : "text-text-faint"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                <span className="flex-1 text-[0.95rem] font-medium group-hover:text-accent transition-colors">
                  {item.q}
                </span>

                <span
                  aria-hidden="true"
                  className={`shrink-0 text-text-dim transition-transform duration-300 ${
                    isOpen ? "rotate-45" : ""
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </span>
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              className={`grid transition-[grid-template-rows,opacity] duration-400 ease-out ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="pl-9 pr-8 pb-5 text-sm leading-relaxed text-text-dim">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
