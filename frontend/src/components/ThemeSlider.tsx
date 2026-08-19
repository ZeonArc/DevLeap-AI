"use client";

import { useTheme, THEMES, type Theme } from "@/lib/theme";

const SWATCH = 26; // px, matches .theme-swatch
const GAP = 2;     // px, matches .theme-slider gap
const STRIDE = SWATCH + GAP;

export default function ThemeSlider({ showLabel = false }: { showLabel?: boolean }) {
  const { theme, setTheme } = useTheme();
  const index = Math.max(0, THEMES.findIndex((t) => t.id === theme));
  const active = THEMES[index];

  const move = (delta: number) => {
    const next = (index + delta + THEMES.length) % THEMES.length;
    setTheme(THEMES[next].id as Theme);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    }
  };

  return (
    <div className="flex items-center gap-2.5">
      <div
        className="theme-slider"
        role="radiogroup"
        aria-label="Colour theme"
        onKeyDown={onKeyDown}
      >
        <span
          className="theme-thumb"
          aria-hidden="true"
          style={{ left: 3, width: SWATCH, transform: `translateX(${index * STRIDE}px)` }}
        />
        {THEMES.map((t) => {
          const selected = t.id === theme;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${t.label} theme — ${t.hint}`}
              title={`${t.label} · ${t.hint}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setTheme(t.id as Theme)}
              className="theme-swatch"
            >
              <span
                style={{
                  background: t.swatch,
                  boxShadow: selected ? `0 0 0 2px ${t.base}, 0 0 10px ${t.swatch}` : "none",
                }}
              />
            </button>
          );
        })}
      </div>

      {showLabel && (
        <span className="eyebrow hidden sm:inline-block min-w-[4.5rem]">{active.label}</span>
      )}
    </div>
  );
}
