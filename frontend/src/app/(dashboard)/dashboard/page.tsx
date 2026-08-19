"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import PortfolioRenderer, { DeveloperProfile } from "@/components/PortfolioRenderer";
import PitchReviewUI, { DraftedPitch } from "@/components/PitchReviewUI";
import { getMe, MeResponse } from "@/lib/api";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { getErrorMessage } from "@/lib/errors";

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
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load dashboard data."));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [getToken]);

  useScrollReveal(containerRef, [loading]);

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

  const pitches: DraftedPitch[] = (data?.pitches || []).map(p => ({
    job_title: p.job_title,
    company: p.company,
    pitch_message: p.pitch_message,
    status: p.status as DraftedPitch["status"],
  }));

  return (
    <div ref={containerRef} className="space-y-10 pb-12">
      <div className="reveal-up flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--line)] pb-6">
        <div>
          <p className="eyebrow mb-2">overview</p>
          <h1 className="font-display text-2xl md:text-3xl">
            {data?.user?.tier === "Pro Broker" ? "Pro Broker account" : "Welcome back"}
          </h1>
        </div>
        <Link href="/profiler" className="btn btn-primary">
          + New ingestion
        </Link>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <span className="w-5 h-5 border-2 border-signal border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="reveal-up text-sm bg-[var(--danger-wash)] border border-[rgba(217,112,95,0.25)] text-[var(--danger)] py-3 px-4 rounded-[var(--radius-sm)]">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { label: "Repos ingested", value: data?.stats?.repos_ingested ?? 0, accent: "text-signal" },
              { label: "Pitches drafted", value: data?.stats?.pitches_drafted ?? 0, accent: "text-circuit" },
              { label: "Pitches pending", value: data?.stats?.pitches_pending ?? 0, accent: "text-paper" },
            ].map((stat) => (
              <div key={stat.label} className="reveal-up panel p-6">
                <p className="eyebrow mb-3">{stat.label}</p>
                <p className={`font-display text-4xl ${stat.accent}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="reveal-up space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <h2 className="eyebrow">latest profile</h2>
                <Link href="/profiler" className="text-xs text-signal hover:text-[#edb555] transition-colors">
                  {latestProfile ? "View all" : "Create one"}
                </Link>
              </div>
              <div className="panel p-6">
                {latestProfile ? (
                  <PortfolioRenderer profile={latestProfile} />
                ) : (
                  <div className="text-center py-10">
                    <p className="text-sm text-muted mb-4">No profiles yet. Ingest a repository to get started.</p>
                    <Link href="/profiler" className="text-signal text-sm hover:text-[#edb555] transition-colors">
                      Go to Profiler →
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div className="reveal-up space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <h2 className="eyebrow">pending pitches</h2>
                <Link href="/broker" className="text-xs text-signal hover:text-[#edb555] transition-colors">Review all</Link>
              </div>
              <div className="panel p-6">
                {pitches.length > 0 ? (
                  <PitchReviewUI pitches={pitches} />
                ) : (
                  <div className="text-center py-10">
                    <p className="text-sm text-muted mb-4">No pitches drafted yet.</p>
                    <Link href="/broker" className="text-signal text-sm hover:text-[#edb555] transition-colors">
                      Go to Broker →
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
