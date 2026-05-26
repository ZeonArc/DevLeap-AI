"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useAuth } from "@clerk/nextjs";
import { ingestRepository, quickProfile, ProfileResponse } from "@/lib/api";
import PortfolioRenderer from "@/components/PortfolioRenderer";

export default function Profiler() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ingestMode, setIngestMode] = useState<"username" | "repo">("username");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const { getToken, userId } = useAuth();

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
    } catch (err: any) {
      setError(err.message || "Failed to generate profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="space-y-8 animate-fade-in pb-12 max-w-5xl mx-auto">
      <div className="border-b border-white/10 pb-6 anim-up">
        <h1 className="text-3xl font-black uppercase tracking-widest text-white mb-2">Profiler Agent</h1>
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-bold">Data Ingestion Pipeline</p>
      </div>

      <div className="glass-panel p-8 md:p-12 rounded-2xl border border-white/5 relative overflow-hidden anim-up">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="max-w-2xl mx-auto text-center space-y-8 relative z-10">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold uppercase tracking-widest">Connect GitHub</h2>
            <p className="text-sm text-gray-400">Our agent will clone, analyze, and build a technical matrix of your skills based on your code.</p>
          </div>

          <div className="flex items-center justify-center gap-4 bg-black/40 p-1.5 rounded-xl border border-white/10 max-w-xs mx-auto">
            <button 
              onClick={() => setIngestMode("username")}
              className={`flex-1 text-[10px] uppercase font-bold tracking-widest py-2 rounded-lg transition-all ${ingestMode === "username" ? "bg-primary text-white" : "text-gray-500 hover:text-white"}`}
            >
              Username
            </button>
            <button 
              onClick={() => setIngestMode("repo")}
              className={`flex-1 text-[10px] uppercase font-bold tracking-widest py-2 rounded-lg transition-all ${ingestMode === "repo" ? "bg-primary text-white" : "text-gray-500 hover:text-white"}`}
            >
              Repository URL
            </button>
          </div>

          <form onSubmit={handleIngest} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={ingestMode === "username" ? "e.g. torvalds" : "https://github.com/user/repo"} 
              className="flex-1 bg-black/60 border border-white/10 rounded-xl px-5 py-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
              disabled={loading}
            />
            <button 
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="hover-button bg-white hover:bg-primary text-black hover:text-white px-8 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center justify-center min-w-[140px]"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                "Ingest"
              )}
            </button>
          </form>

          {error && (
            <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 py-3 px-4 rounded-lg">
              {error}
            </div>
          )}
        </div>
      </div>

      {profileData && (
        <div className="anim-up space-y-6 pt-8">
          <h3 className="text-xl font-bold uppercase tracking-widest flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Analysis Complete
          </h3>
          <div className="glass-panel p-8 rounded-2xl border border-white/5">
             <PortfolioRenderer profile={JSON.parse(profileData.profile)} />
          </div>
        </div>
      )}
    </div>
  );
}
