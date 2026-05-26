"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useAuth } from "@clerk/nextjs";
import { getMe, DashboardPitch } from "@/lib/api";

export default function History() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { getToken } = useAuth();
  const [pitches, setPitches] = useState<DashboardPitch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        if (!token) return;
        const me = await getMe(token);
        setPitches(me.pitches);
      } catch (err) {
        console.error("Failed to load history:", err);
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

  const statusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "accepted": return "bg-green-500/10 text-green-500 border border-green-500/20";
      case "pending": return "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20";
      case "rejected": return "bg-red-500/10 text-red-500 border border-red-500/20";
      default: return "bg-gray-500/10 text-gray-500 border border-gray-500/20";
    }
  };

  return (
    <div ref={containerRef} className="space-y-8 animate-fade-in pb-12 max-w-5xl mx-auto">
      <div className="border-b border-white/10 pb-6 anim-up">
        <h1 className="text-3xl font-black uppercase tracking-widest text-white mb-2">Pitch History</h1>
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-bold">Past Applications & Outcomes</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <span className="w-6 h-6 border-2 border-magenta border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && pitches.length === 0 && (
        <div className="anim-up glass-panel p-12 rounded-2xl border border-white/5 text-center">
          <p className="text-gray-500 text-sm">No pitch history yet. Use the Broker to draft your first pitch.</p>
        </div>
      )}

      {!loading && pitches.length > 0 && (
        <div className="anim-up glass-panel p-8 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-magenta/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-gray-500">
                  <th className="py-4 px-4 font-bold">Date</th>
                  <th className="py-4 px-4 font-bold">Company</th>
                  <th className="py-4 px-4 font-bold">Role</th>
                  <th className="py-4 px-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {pitches.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="py-4 px-4 text-sm text-gray-400 font-mono">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 font-bold text-white group-hover:text-primary transition-colors">{item.company}</td>
                    <td className="py-4 px-4 text-sm text-gray-300">{item.job_title}</td>
                    <td className="py-4 px-4">
                      <span className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full ${statusStyle(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
