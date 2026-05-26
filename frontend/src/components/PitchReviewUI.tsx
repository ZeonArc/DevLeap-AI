"use client";

import { useState, useEffect } from "react";

export interface DraftedPitch {
  job_title: string;
  company: string;
  pitch_message: string;
  status: "pending" | "approved" | "rejected";
}

export default function PitchReviewUI({ pitches }: { pitches: DraftedPitch[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pitchList, setPitchList] = useState<DraftedPitch[]>([]);

  useEffect(() => {
    setPitchList(pitches);
  }, [pitches]);

  if (pitchList.length === 0) {
    return (
      <div className="glass-panel p-8 text-center rounded-lg mt-8">
        <h2 className="text-2xl font-bold text-primary mb-4">No Pitches Available</h2>
        <p className="text-gray-400">The Broker Agent has not generated any new pitches.</p>
      </div>
    );
  }

  if (currentIndex >= pitchList.length) {
    return (
      <div className="glass-panel p-8 text-center rounded-lg mt-8">
        <h2 className="text-2xl font-bold text-gray-200 mb-4">All Caught Up!</h2>
        <p className="text-gray-400">You have reviewed all pending pitches.</p>
      </div>
    );
  }

  const currentPitch = pitchList[currentIndex];

  const handleAction = (status: "approved" | "rejected") => {
    // In a real app, send API request to update status in backend
    const updated = [...pitchList];
    updated[currentIndex].status = status;
    setPitchList(updated);
    setCurrentIndex(currentIndex + 1);
  };

  return (
    <div className="space-y-6 mt-8 animate-fade-in">
      <div className="glass-panel p-6 rounded-lg relative overflow-hidden">
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/50"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/50"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/50"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/50"></div>
        
        <div className="flex justify-between items-end mb-6 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-primary">{currentPitch.job_title}</h2>
            <p className="text-xl text-gray-400">@ {currentPitch.company}</p>
          </div>
          <div className="text-sm text-gray-500">
            Pitch {currentIndex + 1} of {pitchList.length}
          </div>
        </div>
        
        <div className="bg-black/40 p-4 rounded-lg min-h-[150px] mb-6 whitespace-pre-wrap font-mono text-sm border border-gray-800">
          {currentPitch.pitch_message}
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => handleAction("rejected")}
            className="flex-1 py-3 border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white transition-all rounded font-bold tracking-widest cursor-pointer"
          >
            REJECT
          </button>
          <button 
            onClick={() => handleAction("approved")}
            className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white transition-all rounded font-bold tracking-widest cursor-pointer"
          >
            APPROVE & SEND
          </button>
        </div>
      </div>
    </div>
  );
}
