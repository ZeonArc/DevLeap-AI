"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { getMe, DashboardPitch } from "@/lib/api";
import { useScrollReveal } from "@/lib/useScrollReveal";

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

  useScrollReveal(containerRef, [loading]);

  const statusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "accepted": return "badge-success";
      case "pending": return "badge-signal";
      case "rejected": return "badge-danger";
      default: return "badge-muted";
    }
  };

  return (
    <div ref={containerRef} className="space-y-10 pb-12 max-w-4xl">
      <div className="reveal-up border-b border-[var(--line)] pb-6">
        <p className="eyebrow mb-2">history</p>
        <h1 className="font-display text-2xl md:text-3xl">Pitch history</h1>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <span className="w-5 h-5 border-2 border-signal border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && pitches.length === 0 && (
        <div className="reveal-up panel p-12 text-center">
          <p className="text-sm text-muted">No pitch history yet. Use the Broker to draft your first pitch.</p>
        </div>
      )}

      {!loading && pitches.length > 0 && (
        <div className="reveal-up panel p-2 md:p-3 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs text-muted">
                <th className="py-3 px-4 font-normal">Date</th>
                <th className="py-3 px-4 font-normal">Company</th>
                <th className="py-3 px-4 font-normal">Role</th>
                <th className="py-3 px-4 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {pitches.map((item) => (
                <tr key={item.id} className="border-t border-[var(--line)] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 text-sm text-muted font-mono">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-sm">{item.company}</td>
                  <td className="py-3.5 px-4 text-sm text-muted">{item.job_title}</td>
                  <td className="py-3.5 px-4">
                    <span className={`badge ${statusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
