"use client";

import { useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { ingestRepository, quickProfile, ProfileResponse } from "@/lib/api";
import PortfolioRenderer from "@/components/PortfolioRenderer";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { getErrorMessage } from "@/lib/errors";

export default function Profiler() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ingestMode, setIngestMode] = useState<"username" | "repo">("username");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const { getToken, userId } = useAuth();

  useScrollReveal(containerRef);

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setLoading(true);
    setError(null);
    setProfileData(null);

    try {
      const token = await getToken();
      if (!token || !userId) throw new Error("Not authenticated");

      let res;
      if (ingestMode === "username") {
        res = await quickProfile(inputValue.trim(), token, userId);
      } else {
        res = await ingestRepository(inputValue.trim(), token, userId);
      }
      setProfileData(res);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to generate profile."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="space-y-10 pb-12 max-w-4xl">
      <div className="reveal-up border-b border-[var(--line)] pb-6">
        <p className="eyebrow mb-2">profiler</p>
        <h1 className="font-display text-2xl md:text-3xl">Connect a repository</h1>
      </div>

      <div className="reveal-up panel p-8 md:p-10">
        <div className="max-w-xl mx-auto text-center space-y-7">
          <div className="space-y-2">
            <h2 className="font-display text-xl">Ingest your code</h2>
            <p className="text-sm text-muted">
              We clone, read, and analyze your repository to build a technical profile from
              the source itself.
            </p>
          </div>

          <div className="flex items-center justify-center gap-1 bg-[var(--ink-well)] p-1 rounded-[var(--radius-sm)] border border-[var(--line)] max-w-xs mx-auto">
            <button
              onClick={() => setIngestMode("username")}
              className={`flex-1 text-xs py-2 rounded-[calc(var(--radius-sm)-2px)] transition-colors ${ingestMode === "username" ? "bg-signal text-[#17130a]" : "text-muted hover:text-paper"}`}
            >
              Username
            </button>
            <button
              onClick={() => setIngestMode("repo")}
              className={`flex-1 text-xs py-2 rounded-[calc(var(--radius-sm)-2px)] transition-colors ${ingestMode === "repo" ? "bg-signal text-[#17130a]" : "text-muted hover:text-paper"}`}
            >
              Repository URL
            </button>
          </div>

          <form onSubmit={handleIngest} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={ingestMode === "username" ? "e.g. torvalds" : "https://github.com/user/repo"}
              className="field flex-1"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="btn btn-primary min-w-[120px]"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                "Ingest"
              )}
            </button>
          </form>

          {error && (
            <div className="text-sm bg-[var(--danger-wash)] border border-[rgba(217,112,95,0.25)] text-[var(--danger)] py-3 px-4 rounded-[var(--radius-sm)]">
              {error}
            </div>
          )}
        </div>
      </div>

      {profileData && (
        <div className="reveal-up space-y-5">
          <h3 className="flex items-center gap-2.5 text-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            Analysis complete
          </h3>
          <div className="panel p-7">
            <PortfolioRenderer profile={JSON.parse(profileData.profile)} />
          </div>
        </div>
      )}
    </div>
  );
}
