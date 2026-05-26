"use client";

import { createContext, useContext, useEffect } from "react";

interface SoundContextType {
  playHover: () => void;
  playClick: () => void;
  initAudio: () => void;
}

const SoundContext = createContext<SoundContextType>({
  playHover: () => {},
  playClick: () => {},
  initAudio: () => {},
});

export function SoundProvider({ children }: { children: React.ReactNode }) {
  let audioCtx: AudioContext | null = null;

  const initAudio = () => {
    if (typeof window === "undefined") return;
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  };

  const playHover = () => {
    if (!audioCtx || audioCtx.state !== 'running') return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.05);
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  };

  const playClick = () => {
    if (!audioCtx || audioCtx.state !== 'running') return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = "triangle";
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  };

  useEffect(() => {
    const handleGlobalClick = () => {
      initAudio();
    };
    
    const handleGlobalMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName.toLowerCase() === "a" || 
        target.tagName.toLowerCase() === "button" ||
        target.classList.contains("hover-button") ||
        target.closest("a") ||
        target.closest("button")
      ) {
        playHover();
      }
    };

    const handleGlobalMouseClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName.toLowerCase() === "a" || 
        target.tagName.toLowerCase() === "button" ||
        target.classList.contains("hover-button") ||
        target.closest("a") ||
        target.closest("button")
      ) {
        playClick();
      }
    };

    document.addEventListener('click', handleGlobalClick, { once: true });
    document.addEventListener('mouseover', handleGlobalMouseOver);
    document.addEventListener('click', handleGlobalMouseClick);

    return () => {
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('mouseover', handleGlobalMouseOver);
      document.removeEventListener('click', handleGlobalMouseClick);
    };
  }, []);

  return (
    <SoundContext.Provider value={{ playHover, playClick, initAudio }}>
      {children}
    </SoundContext.Provider>
  );
}

export const useSoundEffects = () => useContext(SoundContext);
