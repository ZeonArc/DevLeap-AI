"use client";

import { useState } from "react";

export interface DraftedPitch {
  job_title: string;
  company: string;
  pitch_message: string;
  status: "pending" | "approved" | "rejected";
}

export default function PitchReviewUI({ pitches }: { pitches: DraftedPitch[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pitchList, setPitchList] = useState<DraftedPitch[]>(pitches);
  const [syncedPitches, setSyncedPitches] = useState(pitches);

  // Re-sync local (mutable) copy whenever the parent hands us a new pitches
  // array, without the extra render an effect-based sync would cost.
  if (pitches !== syncedPitches) {
    setSyncedPitches(pitches);
    setPitchList(pitches);
    setCurrentIndex(0);
  }

  if (pitchList.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted">No pitches available yet.</p>
      </div>
    );
  }

  if (currentIndex >= pitchList.length) {
    return (
      <div className="text-center py-8">
        <p className="font-display text-lg mb-1">All caught up</p>
        <p className="text-sm text-muted">You’ve reviewed all pending pitches.</p>
      </div>
    );
  }

  const currentPitch = pitchList[currentIndex];

  const handleAction = (status: "approved" | "rejected") => {
    const updated = [...pitchList];
    updated[currentIndex] = { ...updated[currentIndex], status };
    setPitchList(updated);
    setCurrentIndex(currentIndex + 1);
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-end border-b border-[var(--line)] pb-4">
        <div>
          <h2 className="font-display text-xl">{currentPitch.job_title}</h2>
          <p className="text-sm text-muted">@ {currentPitch.company}</p>
        </div>
        <span className="text-xs text-faint font-mono">
          {currentIndex + 1} / {pitchList.length}
        </span>
      </div>

      <div className="terminal p-5 whitespace-pre-wrap text-[13px] leading-6 text-muted max-h-64 overflow-y-auto custom-scrollbar">
        {currentPitch.pitch_message}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => handleAction("rejected")}
          className="btn btn-secondary flex-1"
        >
          Reject
        </button>
        <button
          onClick={() => handleAction("approved")}
          className="btn btn-primary flex-1"
        >
          Approve & send
        </button>
      </div>
    </div>
  );
}
