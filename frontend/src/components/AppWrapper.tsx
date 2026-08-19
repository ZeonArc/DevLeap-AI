"use client";

import { usePathname } from "next/navigation";
import Navigation from "./Navigation";
import Footer from "./Footer";
import SmoothScroll from "./SmoothScroll";

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isDashboardRoute = pathname?.startsWith('/dashboard') ||
                           pathname?.startsWith('/profiler') ||
                           pathname?.startsWith('/broker') ||
                           pathname?.startsWith('/profile') ||
                           pathname?.startsWith('/history');

  if (isDashboardRoute) {
    return <div className="min-h-screen flex flex-col">{children}</div>;
  }

  return (
    <>
      <Navigation />
      <SmoothScroll>
        <div className="min-h-screen flex flex-col">
          <div className="flex-1 flex flex-col">{children}</div>
          <Footer />
        </div>
      </SmoothScroll>
    </>
  );
}
