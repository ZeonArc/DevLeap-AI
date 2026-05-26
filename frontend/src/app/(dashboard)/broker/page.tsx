"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useAuth } from "@clerk/nextjs";
import PitchReviewUI, { DraftedPitch } from "@/components/PitchReviewUI";
import { getMe, draftPitch, findMatchingJobs, RecommendedJob } from "@/lib/api";

export default function Broker() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [jobUrl, setJobUrl] = useState("");
  const { getToken } = useAuth();
  const [pitches, setPitches] = useState<DraftedPitch[]>([]);
  const [fetchingPitches, setFetchingPitches] = useState(true);
  const [recommendedJobs, setRecommendedJobs] = useState<RecommendedJob[]>([]);
  const [findingJobs, setFindingJobs] = useState(false);

  // Fetch user's existing pitches on mount
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
            status: p.status,
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

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".anim-up",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power2.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobUrl.trim()) return;
    setLoading(true);
    
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      
      const response = await draftPitch(jobUrl.trim(), token);
      
      // Add the new pitch to the beginning of the list
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
    } catch (err: any) {
      alert(err.message || "Failed to draft pitch. Do you have a profile ingested yet?");
    } finally {
      setLoading(false);
    }
  };

  const handleFindJobs = async () => {
    setFindingJobs(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const res = await findMatchingJobs(token);
      setRecommendedJobs(res.jobs);
    } catch (err: any) {
      alert(err.message || "Failed to find jobs.");
    } finally {
      setFindingJobs(false);
    }
  };

  const handleDraftFromJob = async (url: string) => {
    setJobUrl(url);
    // Smooth scroll up to the input form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div ref={containerRef} className="space-y-8 animate-fade-in pb-12 max-w-5xl mx-auto">
      <div className="border-b border-white/10 pb-6 anim-up">
        <h1 className="text-3xl font-black uppercase tracking-widest text-white mb-2">Broker Agent</h1>
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-bold">Autonomous Match & Pitch</p>
      </div>

      <div className="glass-panel p-8 md:p-12 rounded-2xl border border-white/5 relative overflow-hidden anim-up">
        <div className="absolute top-0 left-0 w-64 h-64 bg-magenta/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="max-w-2xl mx-auto text-center space-y-8 relative z-10">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold uppercase tracking-widest">Target a Role</h2>
            <p className="text-sm text-gray-400">Paste a LinkedIn or Greenhouse job URL. The Broker will cross-reference your profile and draft a highly-technical pitch.</p>
          </div>

          <form onSubmit={handleMatch} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <input 
              type="url" 
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://linkedin.com/jobs/view/..." 
              className="flex-1 bg-black/60 border border-white/10 rounded-xl px-5 py-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-magenta/50 transition-colors"
              disabled={loading}
              required
            />
            <button 
              type="submit"
              disabled={loading || !jobUrl.trim()}
              className="hover-button bg-white hover:bg-magenta text-black hover:text-white px-8 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center justify-center min-w-[140px]"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                "Draft Pitch"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Auto Job Finder Section */}
      <div className="anim-up space-y-6 pt-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h3 className="text-xl font-bold uppercase tracking-widest flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Auto-Match Jobs
          </h3>
          <button
            onClick={handleFindJobs}
            disabled={findingJobs}
            className="text-[10px] uppercase tracking-[0.2em] bg-primary/20 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {findingJobs ? (
              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : null}
            {findingJobs ? "Searching..." : "Find Jobs For Me"}
          </button>
        </div>

        {recommendedJobs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedJobs.map((job, idx) => (
              <div key={idx} className="glass-panel p-6 rounded-xl border border-white/5 bg-black/40 hover:border-primary/50 transition-colors flex flex-col h-full">
                <div className="mb-4">
                  <h4 className="text-lg font-bold text-white mb-1">{job.title}</h4>
                  <p className="text-sm text-primary font-mono">{job.company}</p>
                </div>
                <p className="text-sm text-gray-400 mb-6 flex-grow">{job.match_rationale}</p>
                <div className="flex gap-3 mt-auto">
                  <a 
                    href={job.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 py-2 text-center border border-white/10 text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:text-white hover:border-white/30 rounded transition-colors"
                  >
                    View Role
                  </a>
                  <button 
                    onClick={() => handleDraftFromJob(job.url)}
                    className="flex-1 py-2 text-center bg-white text-black hover:bg-primary hover:text-white text-[10px] uppercase tracking-widest font-bold rounded transition-colors"
                  >
                    Draft Pitch
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="anim-up space-y-6 pt-8">
        <h3 className="text-xl font-bold uppercase tracking-widest flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-magenta animate-pulse" />
          Your Pitches
        </h3>
        <div className="glass-panel p-8 rounded-2xl border border-white/5">
          {fetchingPitches ? (
            <div className="flex items-center justify-center py-8">
              <span className="w-5 h-5 border-2 border-magenta border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pitches.length > 0 ? (
            <PitchReviewUI pitches={pitches} />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No pitches drafted yet. Target a role above to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
