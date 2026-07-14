import React, { useEffect, useState } from "react";
import { Heart, Trash2, Edit2, Share2, Globe, Plus, Flame } from "lucide-react";
import axios from "axios";

const ASSET_BASE_URL = "http://localhost:4000";

interface ChallengeUser {
  _id: string;
  name?: string;
  username?: string;
  email?: string;
  displayName?: string;
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
  parentChallengeId: string | any; // Updated to handle nested object populate
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

interface MusicChallengesProps {
  onRemixSelect: (challenge: Challenge) => void;
  onStartChallengeClick?: () => void; // New prop to open creation form/modal
}

const MusicChallenges: React.FC<MusicChallengesProps> = ({ 
  onRemixSelect,
  onStartChallengeClick 
}) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [trendingChallenges, setTrendingChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedFilter, setFeedFilter] = useState<"all" | "originals" | "remixes">("all");
  const [activeInsightsId, setActiveInsightsId] = useState<string | null>(null);
  const [activeReactionMenuId, setActiveReactionMenuId] = useState<string | null>(null);

  const currentUserJson = localStorage.getItem("user");
  const currentUser = currentUserJson ? JSON.parse(currentUserJson) : null;
  const currentUserId = currentUser?.id || currentUser?._id || "";

  // Dynamic uploader name parser with support for populated and raw structures
  const getUploaderName = (ch: Challenge): string => {
    if (!ch) return "Creator";
    
    if (ch.user && typeof ch.user === "object") {
      if (ch.user.username && ch.user.username.trim()) return ch.user.username;
      if (ch.user.displayName && ch.user.displayName.trim()) return ch.user.displayName;
      if (ch.user.name && ch.user.name.trim()) return ch.user.name;
    }
    
    if (ch.username && ch.username.trim()) return ch.username;
    return "Creator";
  };

  // Helper to extract the source/original artist name when displaying a remix
  const getOriginalCreatorName = (ch: Challenge): string => {
    if (!ch.parentChallengeId) return "";
    if (typeof ch.parentChallengeId === "object") {
      return getUploaderName(ch.parentChallengeId);
    }
    return "Original Creator";
  };

  const fetchChallenges = async () => {
    try {
      // 1. Fetch Main Feed Stream
      const response = await axios.get(`${ASSET_BASE_URL}/api/challenges/feed`).catch(() => {
        return axios.get(`${ASSET_BASE_URL}/challenges/feed`);
      });
      
      if (Array.isArray(response.data)) {
        setChallenges(response.data);
      } else if (response.data && Array.isArray(response.data.challenges)) {
        setChallenges(response.data.challenges);
      }

      // 2. Fetch Trending Stream
      const trendingResponse = await axios.get(`${ASSET_BASE_URL}/api/challenges/trending`).catch(() => {
        return axios.get(`${ASSET_BASE_URL}/challenges/trending`).catch(() => null);
      });

      if (trendingResponse && Array.isArray(trendingResponse.data)) {
        setTrendingChallenges(trendingResponse.data);
      } else if (trendingResponse && Array.isArray(trendingResponse.data?.challenges)) {
        setTrendingChallenges(trendingResponse.data.challenges);
      }
    } catch (err) {
      console.error("Feed processing failure:", err);
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
      const config = { headers: { "x-user-location": timezoneName.split("/")[1] || timezoneName } };
      
      const response = await axios.post(`${ASSET_BASE_URL}/api/challenges/${challengeId}/view`, {}, config).catch(() => {
        return axios.post(`${ASSET_BASE_URL}/challenges/${challengeId}/view`, {}, config);
      });
      
      const updated = response.data?.challenge || response.data?.data || response.data;
      if (updated && typeof updated.views === "number") {
        setChallenges(prev => prev.map(ch => ch._id === challengeId ? { 
          ...ch, 
          views: updated.views, 
          uniqueReach: updated.uniqueReach || ch.uniqueReach, 
          locationBreakdown: updated.locationBreakdown || ch.locationBreakdown
        } : ch));
      }
    } catch (e) { console.error(e); }
  };

  const handleToggleLike = async (challengeId: string) => {
    try {
      const response = await axios.post(`${ASSET_BASE_URL}/api/challenges/${challengeId}/like`).catch(() => {
        return axios.post(`${ASSET_BASE_URL}/challenges/${challengeId}/like`);
      });
      
      const updated = response.data?.challenge || response.data?.data || response.data;
      if (updated && updated.likes) {
        setChallenges(prev => prev.map(ch => ch._id === challengeId ? { 
          ...ch, 
          likes: updated.likes, 
          user: updated.user && typeof updated.user === 'object' ? updated.user : ch.user,
          username: updated.username || ch.username
        } : ch));
      }
    } catch (e) { console.error("Like tracking failed:", e); }
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    if (!window.confirm("Are you sure you want to delete this track permanently?")) return;
    try {
      await axios.delete(`${ASSET_BASE_URL}/api/challenges/${challengeId}`).catch(() => {
        return axios.delete(`${ASSET_BASE_URL}/challenges/${challengeId}`);
      });
      setChallenges(prev => prev.filter(ch => ch._id !== challengeId));
    } catch (err) {
      setChallenges(prev => prev.filter(ch => ch._id !== challengeId));
    }
  };

  const triggerReaction = async (challengeId: string, typeKey: "hot" | "praise" | "love" | "anointed") => {
    setActiveReactionMenuId(null);
    try {
      const response = await axios.post(`${ASSET_BASE_URL}/api/challenges/${challengeId}/reaction`, { type: typeKey }).catch(() => {
        return axios.post(`${ASSET_BASE_URL}/challenges/${challengeId}/reaction`, { type: typeKey });
      });
      
      const updated = response.data?.challenge || response.data?.data || response.data;
      if (updated && updated.reactions) {
        setChallenges(prev => prev.map(ch => ch._id === challengeId ? { 
          ...ch, 
          reactions: updated.reactions, 
          user: updated.user && typeof updated.user === 'object' ? updated.user : ch.user,
          username: updated.username || ch.username
        } : ch));
      }
    } catch (err) { console.error("Reaction processing failed:", err); }
  };

  if (loading) return <div className="text-center p-10 font-bold text-gray-500">Loading Production Stream...</div>;

  return (
    <div className="max-w-xl mx-auto p-4 text-slate-800 min-h-screen space-y-6">
      
      {/* HEADER WITH NEW CHALLENGE BUTTON */}
      <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-900">Music Arena</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Praise & Worship Challenges</p>
        </div>
        <button 
          onClick={onStartChallengeClick || (() => alert("Open upload modal handler not registered yet in parent page component!"))}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-4 py-2.5 rounded-full transition-transform active:scale-95 shadow-sm cursor-pointer"
        >
          <Plus size={14} strokeWidth={3} /> Start Challenge
        </button>
      </div>

      {/* TRENDING CAROUSEL HEADER SECTION */}
      {trendingChallenges.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-[28px] border border-amber-100/60 p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Flame size={16} className="text-amber-500 animate-pulse" />
            <h3 className="text-xs font-black uppercase text-amber-800 tracking-wider">Trending Right Now</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {trendingChallenges.map((tc) => {
              const trendName = getUploaderName(tc);
              return (
                <div key={tc._id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 border border-amber-200/50 min-w-[160px] max-w-[160px] flex-shrink-0 shadow-sm">
                  <p className="text-[10px] font-black text-gray-900 truncate">@{trendName}</p>
                  <p className="text-[9px] font-bold text-gray-500 truncate mt-0.5">{tc.songTitle || "Worship Anthem"}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-[10px]">🔥</span>
                    <span className="text-[10px] font-black text-amber-600">{tc.views || 0} loops</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FILTER CONTROLLERS */}
      <div className="flex gap-2 border-b pb-3 items-center">
        <button onClick={() => setFeedFilter("all")} className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${feedFilter === "all" ? "bg-slate-900 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>All</button>
        <button onClick={() => setFeedFilter("originals")} className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${feedFilter === "originals" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>Originals</button>
        <button onClick={() => setFeedFilter("remixes")} className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${feedFilter === "remixes" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>Remixes</button>
      </div>

      {/* CHALLENGES STREAM */}
      <div className="space-y-6">
        {challenges.filter(ch => feedFilter === "all" || (feedFilter === "originals" ? ch.isOriginalSound : !ch.isOriginalSound)).map((ch) => {
          const displayName = getUploaderName(ch);
          const originalCreator = getOriginalCreatorName(ch);
          const totalReactionCount = (ch.reactions?.hot || 0) + (ch.reactions?.praise || 0) + (ch.reactions?.love || 0) + (ch.reactions?.anointed || 0);
          const isReactionMenuOpen = activeReactionMenuId === ch._id;
          const isInsightsOpen = activeInsightsId === ch._id;
          const reachCount = ch.uniqueReach?.length || 0;
          const locations = ch.locationBreakdown || [];

          const targetUploaderId = ch.user && typeof ch.user === "object" ? ch.user._id : ch.user;
          const isOwner = targetUploaderId === currentUserId;

          const cleanVideoUrl = ch.videoUrl?.startsWith("http") ? ch.videoUrl : `${ASSET_BASE_URL}${ch.videoUrl}`;

          return (
            <div key={ch._id} className="bg-white rounded-[24px] border border-gray-200 p-4 shadow-sm">
              
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h4 className="font-black text-xs text-gray-900">@{displayName}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{ch.choirOrArtist || "Studio Artist"}</span>
                    <span className="text-[8px] font-black text-gray-300">•</span>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md ${ch.isOriginalSound ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {ch.isOriginalSound ? '🎵 Original' : `🎛️ Remix of @${originalCreator}`}
                    </span>
                  </div>
                </div>
                <div>
                  <button 
                    onClick={() => setActiveInsightsId(isInsightsOpen ? null : ch._id)}
                    className={`text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all ${isInsightsOpen ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'}`}
                  >
                    <Globe size={11} /> Analytics
                  </button>
                </div>
              </div>

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

              <div className="relative bg-black rounded-xl overflow-hidden h-80 flex items-center justify-center">
                <video 
                  src={cleanVideoUrl} 
                  className="w-full h-full object-contain" 
                  controls 
                  loop
                  onPlay={() => handleTrackPlaybackStart(ch._id)}
                />
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t text-[11px] font-black text-gray-600 relative">
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggleLike(ch._id)} className="flex items-center gap-1 text-red-500 cursor-pointer active:scale-95 transition-transform">
                    <Heart size={12} fill={ch.likes?.includes(currentUserId) ? "currentColor" : "none"} /> Like
                  </button>

                  <button onClick={() => onRemixSelect(ch)} className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full cursor-pointer active:scale-95 transition-transform">
                    <Share2 size={12} className="rotate-180" /> Remix
                  </button>

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
                            onClick={() => triggerReaction(ch._id, item.k)} 
                            className="hover:scale-130 active:scale-90 transition-transform cursor-pointer text-sm"
                          >
                            <span>{item.e}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {isOwner && (
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1 shadow-sm">
                    <button onClick={() => alert("Metadata modifications")} className="flex items-center gap-0.5 text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer">
                      <Edit2 size={11} /> <span>Edit</span>
                    </button>
                    <div className="w-[1px] h-3 bg-slate-200" />
                    <button onClick={() => handleDeleteChallenge(ch._id)} className="flex items-center gap-0.5 text-red-500 hover:text-red-700 transition-colors cursor-pointer">
                      <Trash2 size={11} /> <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
              
              <p className="text-xs font-medium text-gray-700 mt-2"><span className="font-black text-gray-900 mr-1">@{displayName}</span> {ch.caption}</p>
              {ch.songTitle && <p className="text-[10px] font-bold text-indigo-600 mt-1">🎵 {ch.songTitle}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MusicChallenges;