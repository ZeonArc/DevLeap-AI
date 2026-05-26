"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { SoundProvider } from "@/context/SoundContext";
import LenisProvider from "./LenisProvider";
import CustomCursor from "./CustomCursor";
import Preloader from "./Preloader";
import Navigation from "./Navigation";
import Footer from "./Footer";

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const [preloaderComplete, setPreloaderComplete] = useState(false);
  const pathname = usePathname();
  
  const isDashboardRoute = pathname?.startsWith('/dashboard') || 
                           pathname?.startsWith('/profiler') || 
                           pathname?.startsWith('/broker') || 
                           pathname?.startsWith('/profile') || 
                           pathname?.startsWith('/history');

  return (
    <SoundProvider>
      <LenisProvider>
        <CustomCursor />
        {!preloaderComplete && (
          <Preloader onComplete={() => setPreloaderComplete(true)} />
        )}
        <div style={{ opacity: preloaderComplete ? 1 : 0, transition: 'opacity 0.5s ease', pointerEvents: preloaderComplete ? 'auto' : 'none', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {!isDashboardRoute && <Navigation />}
          <div className="flex-1">
            {children}
          </div>
          {!isDashboardRoute && <Footer />}
        </div>
      </LenisProvider>
    </SoundProvider>
  );
}
