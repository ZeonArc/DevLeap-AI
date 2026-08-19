"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import PortfolioRenderer, { DeveloperProfile } from "@/components/PortfolioRenderer";
import { getMe, DashboardProfile } from "@/lib/api";
import { useScrollReveal } from "@/lib/useScrollReveal";

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

  useScrollReveal(containerRef, [loading]);

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
    <div ref={containerRef} className="space-y-10 pb-12 max-w-4xl">
      <div className="reveal-up border-b border-[var(--line)] pb-6">
        <p className="eyebrow mb-2">profile</p>
        <h1 className="font-display text-2xl md:text-3xl">Your extracted profile</h1>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <span className="w-5 h-5 border-2 border-signal border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && profiles.length === 0 && (
        <div className="reveal-up panel p-12 text-center">
          <p className="text-sm text-muted">No profiles generated yet. Head to the Profiler to ingest a repository.</p>
        </div>
      )}

      {!loading && profiles.length > 0 && (
        <>
          {profiles.length > 1 && (
            <div className="reveal-up flex items-center gap-2 flex-wrap">
              {profiles.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedIdx(i)}
                  className={`text-xs px-3.5 py-2 rounded-[var(--radius-sm)] border transition-colors ${
                    selectedIdx === i
                      ? "bg-signal text-[#17130a] border-signal"
                      : "text-muted border-[var(--line)] hover:text-paper hover:border-[var(--line-strong)]"
                  }`}
                >
                  {p.github_username || `Profile ${i + 1}`}
                </button>
              ))}
            </div>
          )}

          <div className="reveal-up panel p-7">
            {parsedProfile ? (
              <PortfolioRenderer profile={parsedProfile} />
            ) : (
              <p className="text-sm text-muted">Could not parse profile data.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
