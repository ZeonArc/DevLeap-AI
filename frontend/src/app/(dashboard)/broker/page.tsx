"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import PitchReviewUI, { DraftedPitch } from "@/components/PitchReviewUI";
import { getMe, draftPitch, findMatchingJobs, RecommendedJob } from "@/lib/api";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { getErrorMessage } from "@/lib/errors";

export default function Broker() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [jobUrl, setJobUrl] = useState("");
  const { getToken } = useAuth();
  const [pitches, setPitches] = useState<DraftedPitch[]>([]);
  const [fetchingPitches, setFetchingPitches] = useState(true);
  const [recommendedJobs, setRecommendedJobs] = useState<RecommendedJob[]>([]);
  const [findingJobs, setFindingJobs] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [searchedJobs, setSearchedJobs] = useState(false);

  useEffect(() => {
    async function loadPitches() {
      try {
        const token = await getToken();
        if (!token) return;
        const me = await getMe(token);
        setPitches(
          me.pitches.map(p => ({
            job_title: p.job_title,
            company: p.company,
            pitch_message: p.pitch_message,
            status: p.status as DraftedPitch["status"],
          }))
        );
      } catch (err) {
        console.error("Failed to load pitches:", err);
      } finally {
        setFetchingPitches(false);
      }
    }
    loadPitches();
  }, [getToken]);

  useScrollReveal(containerRef, [fetchingPitches]);

  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobUrl.trim()) return;
    setLoading(true);

    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const response = await draftPitch(jobUrl.trim(), token);

      setPitches((prev) => [
        {
          job_title: response.pitch.job_title,
          company: response.pitch.company,
          pitch_message: response.pitch.pitch_message,
          status: response.pitch.status as "pending" | "approved" | "rejected",
        },
        ...prev
      ]);
      setJobUrl("");
    } catch (err) {
      alert(getErrorMessage(err, "Failed to draft pitch. Do you have a profile ingested yet?"));
    } finally {
      setLoading(false);
    }
  };

  const handleFindJobs = async () => {
    setFindingJobs(true);
    setJobsError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const res = await findMatchingJobs(token);
      setRecommendedJobs(res.jobs);
      setSearchedJobs(true);
    } catch (err) {
      setJobsError(getErrorMessage(err, "Failed to find jobs."));
    } finally {
      setFindingJobs(false);
    }
  };

  const handleDraftFromJob = async (url: string) => {
    setJobUrl(url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div ref={containerRef} className="space-y-10 pb-12 max-w-4xl">
      <div className="reveal-up border-b border-[var(--line)] pb-6">
        <p className="eyebrow mb-2">broker</p>
        <h1 className="font-display text-2xl md:text-3xl">Match & pitch a role</h1>
      </div>

      <div className="reveal-up panel p-8 md:p-10">
        <div className="max-w-xl mx-auto text-center space-y-7">
          <div className="space-y-2">
            <h2 className="font-display text-xl">Target a role</h2>
            <p className="text-sm text-muted">
              Paste a job URL. We’ll cross-reference it against your profile and draft a
              pitch that cites the exact repos that fit.
            </p>
          </div>

          <form onSubmit={handleMatch} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input
              type="url"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://linkedin.com/jobs/view/..."
              className="field flex-1"
              disabled={loading}
              required
            />
            <button
              type="submit"
              disabled={loading || !jobUrl.trim()}
              className="btn btn-primary min-w-[130px]"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                "Draft pitch"
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="reveal-up space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
          <h3 className="eyebrow">auto-match jobs</h3>
          <button
            onClick={handleFindJobs}
            disabled={findingJobs}
            className="btn btn-secondary text-xs py-2 px-3.5"
          >
            {findingJobs ? (
              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : null}
            {findingJobs ? "Searching…" : "Find jobs for me"}
          </button>
        </div>

        {jobsError && (
          <div className="panel-well p-5 space-y-1">
            <p className="text-sm text-[var(--danger)]">{jobsError}</p>
            <p className="text-xs text-muted">
              Job discovery needs a web search backend. You can still paste a job URL above —
              that reads the posting directly.
            </p>
          </div>
        )}

        {!jobsError && searchedJobs && recommendedJobs.length === 0 && (
          <p className="text-sm text-muted">
            No matching roles came back. Try again later, or paste a job URL above.
          </p>
        )}

        {recommendedJobs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedJobs.map((job, idx) => (
              <div key={idx} className="panel p-6 flex flex-col h-full">
                <div className="mb-3">
                  <h4 className="font-display text-lg mb-1">{job.title}</h4>
                  <p className="text-sm text-circuit font-mono">{job.company}</p>
                </div>
                <p className="text-sm text-muted mb-6 flex-grow">{job.match_rationale}</p>
                <div className="flex gap-3 mt-auto">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary flex-1 text-xs py-2.5"
                  >
                    View role
                  </a>
                  <button
                    onClick={() => handleDraftFromJob(job.url)}
                    className="btn btn-primary flex-1 text-xs py-2.5"
                  >
                    Draft pitch
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="reveal-up space-y-5">
        <h3 className="eyebrow border-b border-[var(--line)] pb-4">your pitches</h3>
        <div className="panel p-7">
          {fetchingPitches ? (
            <div className="flex items-center justify-center py-8">
              <span className="w-5 h-5 border-2 border-signal border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pitches.length > 0 ? (
            <PitchReviewUI pitches={pitches} />
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted">No pitches drafted yet. Target a role above to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
