"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import PortfolioRenderer, { DeveloperProfile } from "@/components/PortfolioRenderer";
import PitchReviewUI, { DraftedPitch } from "@/components/PitchReviewUI";
import { getMe, MeResponse } from "@/lib/api";

export default function DashboardOverview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { getToken } = useAuth();
  const [data, setData] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const token = await getToken();
        if (!token) return;
        const me = await getMe(token);
        setData(me);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [getToken]);

  useEffect(() => {
    if (!containerRef.current || loading) return;
    
    const ctx = gsap.context(() => {
      gsap.fromTo(".dash-card",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power2.out" }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [loading]);

  // Parse the latest profile from DB JSON strings into a DeveloperProfile
  const latestProfile: DeveloperProfile | null = (() => {
    if (!data?.profiles?.length) return null;
    const p = data.profiles[0];
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

  // Map pitches from DB format to component format
  const pitches: DraftedPitch[] = (data?.pitches || []).map(p => ({
    job_title: p.job_title,
    company: p.company,
    pitch_message: p.pitch_message,
    status: p.status,
  }));

  return (
    <div ref={containerRef} className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-white mb-2">Overview</h1>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-bold">
            {data?.user?.tier === "Pro Broker" ? "Pro Broker Account" : "Welcome back, Developer"}
          </p>
        </div>
        <Link href="/profiler" className="hover-button bg-white text-black px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2">
          <span>+</span> New Ingestion
        </Link>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 py-3 px-4 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "Repos Ingested", value: String(data?.stats?.repos_ingested ?? 0), accent: "text-primary", border: "border-primary/20" },
              { label: "Pitches Drafted", value: String(data?.stats?.pitches_drafted ?? 0), accent: "text-magenta", border: "border-magenta/20" },
              { label: "Pitches Pending", value: String(data?.stats?.pitches_pending ?? 0), accent: "text-white", border: "border-white/20" },
            ].map((stat, i) => (
              <div key={i} className={`dash-card glass-panel p-6 rounded-2xl border ${stat.border} relative overflow-hidden group`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full pointer-events-none" />
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500 mb-2">{stat.label}</p>
                <p className={`text-5xl font-black ${stat.accent}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pt-4">
            {/* Recent Profile */}
            <div className="dash-card space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase text-gray-400 flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Latest Profile
                </h2>
                <Link href="/profiler" className="text-[9px] uppercase tracking-[0.2em] text-primary hover:text-white transition-colors">
                  {latestProfile ? "View All" : "Create One"}
                </Link>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-black/50">
                {latestProfile ? (
                  <PortfolioRenderer profile={latestProfile} />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm mb-4">No profiles yet. Ingest a repository to get started.</p>
                    <Link href="/profiler" className="text-primary text-xs uppercase tracking-widest hover:text-white transition-colors">
                      Go to Profiler &rarr;
                    </Link>
                  </div>
                )}
              </div>
            </div>
            
            {/* Pending Pitches */}
            <div className="dash-card space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase text-gray-400 flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-magenta animate-pulse" />
                  Pending Pitches
                </h2>
                <Link href="/broker" className="text-[9px] uppercase tracking-[0.2em] text-magenta hover:text-white transition-colors">Review All</Link>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-black/50">
                {pitches.length > 0 ? (
                  <PitchReviewUI pitches={pitches} />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm mb-4">No pitches drafted yet.</p>
                    <Link href="/broker" className="text-magenta text-xs uppercase tracking-widest hover:text-white transition-colors">
                      Go to Broker &rarr;
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
