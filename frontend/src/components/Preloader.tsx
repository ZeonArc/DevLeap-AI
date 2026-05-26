"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useSoundEffects } from "@/context/SoundContext";

export default function Preloader({ onComplete }: { onComplete: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const { initAudio } = useSoundEffects();
  const [canEnter, setCanEnter] = useState(false);

  const COLS = 6;
  const ROWS = 4;
  const squares = Array.from({ length: COLS * ROWS });

  useEffect(() => {
    // Animate the text in
    if (textRef.current) {
      gsap.fromTo(textRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.2, ease: "power3.out", delay: 0.5 }
      );
    }
    const timer = setTimeout(() => setCanEnter(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  const handleEnter = () => {
    initAudio();

    if (!gridRef.current || !containerRef.current) return;

    const allSquares = Array.from(gridRef.current.children);

    // Phase 1: Squares shrink with stagger from center outward
    gsap.to(allSquares, {
      scale: 0,
      opacity: 0,
      duration: 0.6,
      stagger: {
        each: 0.04,
        from: "center",
        grid: [ROWS, COLS],
      },
      ease: "power3.inOut",
      onComplete: () => {
        // Phase 2: Container fades
        gsap.to(containerRef.current, {
          opacity: 0,
          duration: 0.4,
          ease: "power2.out",
          onComplete: onComplete,
        });
      },
    });
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[99999] flex items-center justify-center pointer-events-auto"
    >
      {/* Grid overlay */}
      <div
        ref={gridRef}
        className="absolute inset-0 grid gap-0"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        }}
      >
        {squares.map((_, i) => (
          <div
            key={i}
            className="w-full h-full bg-[#060606]"
            style={{ borderRight: "1px solid rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.03)" }}
          />
        ))}
      </div>

      {/* Center content */}
      <div ref={textRef} className="relative z-10 flex flex-col items-center gap-8 opacity-0">
        <p className="text-[10px] tracking-[0.5em] uppercase text-gray-600 font-bold">
          DevLeap AI
        </p>

        {!canEnter ? (
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border border-primary/40 rounded-full animate-ping" />
            <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <button
            onClick={handleEnter}
            className="hover-button group relative px-12 py-4 overflow-hidden"
          >
            <span className="absolute inset-0 border border-white/20 rounded-full group-hover:border-primary/60 transition-colors duration-500" />
            <span className="absolute inset-0 bg-white/0 group-hover:bg-primary/10 rounded-full transition-colors duration-500" />
            <span className="relative text-xs tracking-[0.4em] uppercase font-bold text-white/70 group-hover:text-white transition-colors duration-300">
              Enter Experience
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
