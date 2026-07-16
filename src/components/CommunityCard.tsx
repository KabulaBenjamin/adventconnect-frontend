import React, { useState } from "react";
import MusicChallenges from "./MusicChallenges";
import RemixStudio from "./RemixStudio";
import { PlusCircle, Music, Video, Sparkles } from "lucide-react";

export const ChallengeManager: React.FC = () => {
  const [activeRemixTrack, setActiveRemixTrack] = useState<any | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // State variables for capturing new challenge form inputs
  const [songTitle, setSongTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Safely extract the currently authenticated user session from LocalStorage
  const currentUserJson = localStorage.getItem("user");
  const currentUser = currentUserJson ? JSON.parse(currentUserJson) : null;
  const currentUsername = currentUser?.username || currentUser?.name || "Inspirational Creator";

  const handlePostNewChallengeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    // Payload tracking mapping matching backend expectations
    try {
      // Form delivery payload logic can be injected here safely linking to your /api/challenges route
      alert("Launching new original sound track creation deployment!");
      setIsCreateModalOpen(false);
      setSongTitle("");
      setArtistName("");
      setCaption("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  // If a user clicks 'Remix', pivot completely to the Studio workspace view
  if (activeRemixTrack) {
    const rawUrl = activeRemixTrack.audioSourceUrl || activeRemixTrack.videoUrl || "";
    const sanitizedUrl = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
    const fullAudioUrl = `https://adventconnect-7jfq.onrender.com${sanitizedUrl}`;

    return (
      <RemixStudio
        parentChallengeId={activeRemixTrack._id}
        audioUrl={fullAudioUrl}
        songTitle={activeRemixTrack.songTitle || "Original Production Track"}
        onClose={() => setActiveRemixTrack(null)}
      />
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50/50 pb-12">
      
      {/* ─── RESTORED REEL HEADER BANNER SECTION ─── */}
      <div className="bg-slate-900 text-white relative overflow-hidden shadow-xl rounded-b-[40px] mb-6">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Music size={140} className="transform rotate-12" />
        </div>
        
        <div className="max-w-xl mx-auto px-6 pt-10 pb-8 text-center relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full mb-3">
            <Sparkles size={10} /> AdventConnect Studio Spaces
          </div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Inspirational Audio Feed
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed">
            Welcome back, <span className="text-emerald-400 font-bold">@{currentUsername}</span>! Explore tracks, analyze reach metrics, or record a production layer remix.
          </p>

          {/* CENTRAL CREATION TRIGGER PLATFORM BUTTON */}
          <div className="mt-5 flex justify-center">
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black px-6 py-3 rounded-full flex items-center gap-2 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <PlusCircle size={15} /> Post Original Challenge
            </button>
          </div>
        </div>
      </div>

      {/* ─── DYNAMIC FEED PLATFORM VIEW ─── */}
      <div className="w-full">
        <MusicChallenges onRemixSelect={(track) => setActiveRemixTrack(track)} />
      </div>

      {/* ─── NEW CHALLENGE UPLOAD CONTAINER MODAL ─── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-[32px] max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Video className="text-blue-600" size={18} />
                <h3 className="font-black text-sm text-gray-900">Launch New Audio Challenge</h3>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-black transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePostNewChallengeSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Song Track Title</label>
                <input 
                  type="text" 
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  placeholder="e.g., Side by Side Hymnal Arrangement" 
                  className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Choir / Artist Identity</label>
                <input 
                  type="text" 
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="e.g., Youth Choir Ensemble" 
                  className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Production Caption</label>
                <textarea 
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Share the spiritual motivation behind this beautiful vocal arrangement layer..." 
                  className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50 h-20 resize-none font-medium"
                  required
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-1/2 bg-gray-100 text-gray-600 font-black text-xs py-3 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isUploading}
                  className="w-1/2 bg-blue-600 text-white font-black text-xs py-3 rounded-xl hover:bg-blue-700 shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isUploading ? "Publishing Production..." : "Publish Challenge"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengeManager;