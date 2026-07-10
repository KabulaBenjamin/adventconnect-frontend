import React, { useEffect, useState } from "react";
import { Heart, Eye, Trash2, Edit2, Share2, Globe } from "lucide-react";
import { apiFetch } from "../lib/api";

interface ChallengeUser {
  _id: string;
  name?: string;
  username?: string;
  email?: string;
}

interface LocationBreakdown {
  locationName: string;
  count: number;
}

interface Challenge {
  _id: string;
  user: ChallengeUser | string | any;
  username: string;
  videoUrl: string;
  caption: string;
  songTitle: string;
  choirOrArtist: string;
  isOriginalSound: boolean;
  parentChallengeId: string | null;
  audioSourceUrl: string;
  likes: string[];
  views: number;
  uniqueReach: string[];
  locationBreakdown?: LocationBreakdown[];
  reactions: {
    hot: number;
    praise: number;
    love: number;
    anointed: number;
  };
  createdAt: string;
}

const MusicChallenges: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedFilter, setFeedFilter] = useState<"all" | "originals" | "remixes">("all");
  const [activeInsightsId, setActiveInsightsId] = useState<string | null>(null);
  const [activeReactionMenuId, setActiveReactionMenuId] = useState<string | null>(null);

  const currentUserJson = localStorage.getItem("user");
  const currentUser = currentUserJson ? JSON.parse(currentUserJson) : null;
  const currentUserId = currentUser?.id || currentUser?._id || "";

  const getUploaderName = (ch: Challenge): string => {
    if (!ch) return "User";
    if (ch.user && typeof ch.user === "object") {
      if (ch.user.name && ch.user.name.trim()) return ch.user.name;
      if (ch.user.username && ch.user.username.trim()) return ch.user.username;
      if (ch.user.email && ch.user.email.includes("@")) {
        return ch.user.email.split("@")[0];
      }
    }
    if (ch.username && ch.username.trim()) return ch.username;
    return "User";
  };

  const fetchChallenges = async () => {
    try {
      const data = await apiFetch("/challenges/feed");
      if (Array.isArray(data)) setChallenges(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const handleTrackPlaybackStart = async (challengeId: string) => {
    setChallenges(prev => prev.map(ch => ch._id === challengeId ? { ...ch, views: (ch.views || 0) + 1 } : ch));
    try {
      const timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone || "Kenya";
      const updated = await apiFetch(`/challenges/${challengeId}/view`, { 
        method: "POST",
        headers: { "x-user-location": timezoneName.split("/")[1] || timezoneName }
      });
      if (updated && typeof updated.views === "number") {
        setChallenges(prev => prev.map(ch => ch._id === challengeId ? { 
          ...ch, 
          views: updated.views, 
          uniqueReach: updated.uniqueReach || ch.uniqueReach, 
          locationBreakdown: updated.locationBreakdown || ch.locationBreakdown
        } : ch));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleLike = async (challengeId: string) => {
    try {
      const updated = await apiFetch(`/challenges/${challengeId}/like`, { method: "POST" });
      if (updated && updated._id) {
        setChallenges(prev => prev.map(ch => ch._id === challengeId ? { ...ch, likes: updated.likes } : ch));
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    if (!window.confirm("Are you sure you want to delete this track entry permanently?")) return;
    try {
      await apiFetch(`/challenges/${challengeId}`, { method: "DELETE" });
      setChallenges(prev => prev.filter(ch => ch._id !== challengeId));
    } catch (err) {
      setChallenges(prev => prev.filter(ch => ch._id !== challengeId));
    }
  };

  const triggerReaction = async (challengeId: string, emoji: string, typeKey: "hot" | "praise" | "love" | "anointed") => {
    setActiveReactionMenuId(null);
    try {
      const updated = await apiFetch(`/challenges/${challengeId}/reaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: typeKey })
      });
      if (updated?._id) setChallenges(prev => prev.map(ch => ch._id === challengeId ? { ...ch, reactions: updated.reactions } : ch));
    } catch (err) {}
  };

  if (loading) return <div className="text-center p-10 font-bold text-gray-500">Loading Tracks...</div>;

  return (
    <div className="max-w-xl mx-auto p-4 text-slate-800 min-h-screen">
      
      {/* FILTER TABS */}
      <div className="flex gap-2 mb-6 border-b pb-3">
        <button onClick={() => setFeedFilter("all")} className={`px-4 py-1.5 rounded-full text-xs font-black ${feedFilter === "all" ? "bg-slate-900 text-white" : "bg-gray-100 text-gray-500"}`}>All</button>
        <button onClick={() => setFeedFilter("originals")} className={`px-4 py-1.5 rounded-full text-xs font-black ${feedFilter === "originals" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}>Originals</button>
        <button onClick={() => setFeedFilter("remixes")} className={`px-4 py-1.5 rounded-full text-xs font-black ${feedFilter === "remixes" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500"}`}>Remixes</button>
      </div>

      <div className="space-y-6">
        {challenges.filter(ch => feedFilter === "all" || (feedFilter === "originals" ? ch.isOriginalSound : !ch.isOriginalSound)).map((ch) => {
          const displayName = getUploaderName(ch);
          const totalReactionCount = (ch.reactions?.hot || 0) + (ch.reactions?.praise || 0) + (ch.reactions?.love || 0) + (ch.reactions?.anointed || 0);
          const isReactionMenuOpen = activeReactionMenuId === ch._id;
          const isInsightsOpen = activeInsightsId === ch._id;
          const reachCount = ch.uniqueReach?.length || 0;
          const locations = ch.locationBreakdown || [];

          return (
            <div key={ch._id} className="bg-white rounded-[24px] border border-gray-200 p-4 shadow-sm">
              
              {/* TOP HEADER HEADER ACTION BAR */}
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h4 className="font-black text-xs text-gray-900">@{displayName}</h4>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{ch.choirOrArtist}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setActiveInsightsId(isInsightsOpen ? null : ch._id)}
                    className={`text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all ${isInsightsOpen ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'}`}
                  >
                    <Globe size={11} /> Analytics
                  </button>
                </div>
              </div>

              {/* ANALYTICS SLIDEOUT OVERLAY */}
              {isInsightsOpen && (
                <div className="mb-3 bg-slate-900 text-white p-3.5 rounded-2xl text-xs space-y-3 border border-slate-800">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="font-black text-slate-400 text-[10px] uppercase tracking-wider">Audience Reach Profile</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center bg-slate-950/40 p-2 rounded-xl">
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold">Gross Loops</p>
                      <p className="text-sm font-black text-sky-400">{ch.views || 0}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold">Unique Reach</p>
                      <p className="text-sm font-black text-emerald-400">{reachCount} users</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mb-2">Regional Insights</p>
                    {locations.length === 0 ? (
                      <p className="text-[10px] text-gray-500 italic">Gathering regional footprints...</p>
                    ) : (
                      <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                        {locations.map((loc, idx) => (
                          <div key={idx} className="flex justify-between text-[10px] font-bold">
                            <span className="text-gray-200">📍 {loc.locationName}</span>
                            <span className="text-gray-400">{loc.count} views</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VIDEO FRAME BOX */}
              <div className="relative bg-black rounded-xl overflow-hidden h-80 flex items-center justify-center">
                <video 
                  src={`http://localhost:4000${ch.videoUrl}`} 
                  className="w-full h-full object-contain" 
                  controls 
                  loop
                  onPlay={() => handleTrackPlaybackStart(ch._id)}
                />
              </div>

              {/* ACTION TOOLSTRIP BAR */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t text-[11px] font-black text-gray-600 relative">
                <div className="flex items-center gap-3">
                  <button onClick={() => handleToggleLike(ch._id)} className="flex items-center gap-1 text-red-500 cursor-pointer active:scale-95 transition-transform">
                    <Heart size={12} fill={ch.likes?.includes(currentUserId) ? "currentColor" : "none"} /> Like
                  </button>

                  {/* UNIFIED REACTION COMPONENT SELECTION PILL */}
                  <div className="relative py-1">
                    <button 
                      onClick={() => setActiveReactionMenuId(isReactionMenuOpen ? null : ch._id)}
                      onMouseEnter={() => setActiveReactionMenuId(ch._id)}
                      className="flex items-center gap-1 text-amber-500 cursor-pointer bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100"
                    >
                      🙌 React <span className="text-[9px] font-bold text-amber-600">({totalReactionCount})</span>
                    </button>
                    
                    {isReactionMenuOpen && (
                      <div 
                        className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 shadow-xl rounded-full px-2.5 py-1 flex items-center gap-3 z-50"
                        onMouseLeave={() => setActiveReactionMenuId(null)}
                      >
                        {([
                          { k: "hot", e: "🔥" },
                          { k: "praise", e: "🙌" },
                          { k: "love", e: "❤️" },
                          { k: "anointed", e: "⚡" }
                        ] as const).map((item) => (
                          <button 
                            key={item.k} 
                            onClick={() => triggerReaction(ch._id, item.e, item.k)} 
                            className="hover:scale-130 active:scale-90 transition-transform cursor-pointer text-sm"
                          >
                            <span>{item.e}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* VISIBLE MANAGEMENT OPERATIONS */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1 shadow-sm">
                  <button onClick={() => alert("Metadata modifications")} className="flex items-center gap-0.5 text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer">
                    <Edit2 size={11} /> <span>Edit</span>
                  </button>
                  <div className="w-[1px] h-3 bg-slate-200" />
                  <button onClick={() => handleDeleteChallenge(ch._id)} className="flex items-center gap-0.5 text-red-500 hover:text-red-700 transition-colors cursor-pointer">
                    <Trash2 size={11} /> <span>Delete</span>
                  </button>
                </div>
              </div>
              
              <p className="text-xs font-medium text-gray-700 mt-2"><span className="font-black text-gray-900 mr-1">@{displayName}</span> {ch.caption}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MusicChallenges;
