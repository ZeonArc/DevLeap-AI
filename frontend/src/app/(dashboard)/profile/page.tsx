"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useAuth } from "@clerk/nextjs";
import PortfolioRenderer, { DeveloperProfile } from "@/components/PortfolioRenderer";
import { getMe, DashboardProfile } from "@/lib/api";

export default function Profile() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { getToken } = useAuth();
  const [profiles, setProfiles] = useState<DashboardProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        if (!token) return;
        const me = await getMe(token);
        setProfiles(me.profiles);
      } catch (err) {
        console.error("Failed to load profiles:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [getToken]);

  useEffect(() => {
    if (!containerRef.current || loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".anim-up",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power2.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [loading]);

  const parsedProfile: DeveloperProfile | null = (() => {
    if (!profiles.length) return null;
    const p = profiles[selectedIdx];
    try {
      return {
        skills: JSON.parse(p.skills_json || "[]"),
        architecture_diagrams: JSON.parse(p.architecture_json || "[]"),
        summary: JSON.parse(p.summary_json || "{}"),
      };
    } catch {
      return null;
    }
  })();

  return (
    <div ref={containerRef} className="space-y-8 animate-fade-in pb-12 max-w-5xl mx-auto">
      <div className="border-b border-white/10 pb-6 anim-up">
        <h1 className="text-3xl font-black uppercase tracking-widest text-white mb-2">My Profile</h1>
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-bold">Extracted Developer Matrix</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && profiles.length === 0 && (
        <div className="anim-up glass-panel p-12 rounded-2xl border border-white/5 text-center">
          <p className="text-gray-500 text-sm mb-4">No profiles generated yet. Head to the Profiler to ingest a repository.</p>
        </div>
      )}

      {!loading && profiles.length > 0 && (
        <>
          {/* Profile selector if multiple profiles */}
          {profiles.length > 1 && (
            <div className="anim-up flex items-center gap-3 flex-wrap">
              {profiles.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedIdx(i)}
                  className={`text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-lg border transition-all ${
                    selectedIdx === i
                      ? "bg-primary text-white border-primary"
                      : "text-gray-500 border-white/10 hover:text-white hover:border-white/30"
                  }`}
                >
                  {p.github_username || `Profile ${i + 1}`}
                </button>
              ))}
            </div>
          )}

          <div className="anim-up glass-panel p-8 rounded-2xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="relative z-10">
              {parsedProfile ? (
                <PortfolioRenderer profile={parsedProfile} />
              ) : (
                <p className="text-gray-500 text-sm">Could not parse profile data.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
