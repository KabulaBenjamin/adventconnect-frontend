import React, { useState, useEffect } from 'react';
import { useSocial } from '../context/SocialContext.js';
import { apiFetch } from '../lib/api.js';
import { 
  Users, UserPlus, Check, X, Search, MessageSquare, UserMinus, ShieldAlert 
} from 'lucide-react';

interface SuggestionUser {
  _id: string;
  username: string;
  avatar?: string;
  currentCity?: string;
  localChurch?: string;
}

const FriendsHub: React.FC = () => {
  const { 
    friends, 
    requests, 
    loading, 
    acceptFriendRequest, 
    declineFriendRequest, 
    sendFriendRequest,
    unfriend,
    fetchFriends,
    fetchRequests
  } = useSocial();

  const [suggestions, setSuggestions] = useState<SuggestionUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'recent'>('all');

  // Load suggestions from the backend suggestions pipeline
  const fetchSuggestions = async () => {
    try {
      const data = await apiFetch('/users/suggestions');
      if (Array.isArray(data)) {
        setSuggestions(data);
      }
    } catch (err) {
      console.error('Failed to load connection suggestions:', err);
    }
  };

  useEffect(() => {
    fetchFriends();
    fetchRequests();
    fetchSuggestions();
  }, [fetchFriends, fetchRequests]);

  // Handle adding a suggested friend
  const handleAddFriend = async (targetUserId: string) => {
    try {
      await sendFriendRequest(targetUserId);
      // Remove from suggestions list locally after request is sent
      setSuggestions(prev => prev.filter(user => user._id !== targetUserId));
    } catch (err) {
      console.error("Failed to transmit connection request:", err);
    }
  };

  // Filter friends based on search bar query
  const filteredFriends = friends.filter(friend => 
    friend.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.localChurch?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
              <Users className="text-blue-500" size={28} />
              Friends Hub
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Manage your connections, respond to invitations, and find members in your community.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-blue-600/10 text-blue-400 border border-blue-500/20 text-xs font-bold px-3 py-1.5 rounded-xl">
              {friends.length} Active Connections
            </span>
          </div>
        </div>

        {/* --- SECTION 1: PENDING REQUESTS --- */}
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            Incoming Invitations 
            {requests.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                {requests.length}
              </span>
            )}
          </h2>
          
          {requests.length === 0 ? (
            <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-8 text-center">
              <UserPlus className="mx-auto text-zinc-700 mb-2" size={36} />
              <p className="text-sm text-zinc-400 font-semibold">No pending friend requests</p>
              <p className="text-xs text-zinc-600 mt-1">When others send you a request, it will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {requests.map(req => (
                <div key={req._id} className="bg-[#121212] border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-zinc-700/50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-sm font-bold border border-zinc-700/40">
                      {req.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm truncate">{req.username}</h3>
                      <p className="text-xs text-zinc-500 truncate">{req.localChurch || "AdventConnect Member"}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button
                      onClick={() => acceptFriendRequest(req._id)}
                      className="py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Check size={14} /> Accept
                    </button>
                    <button
                      onClick={() => declineFriendRequest(req._id)}
                      className="py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1 border border-zinc-800"
                    >
                      <X size={14} /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- GRID SPLIT: SUGGESTIONS & FRIENDS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* --- SECTION 2: ACTIVE FRIENDS GRID (Takes up 2 Columns) --- */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-bold">Connected Friends Directory</h2>
              
              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                <input
                  type="text"
                  placeholder="Search by name or church..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-zinc-700 transition"
                />
              </div>
            </div>

            {filteredFriends.length === 0 ? (
              <div className="bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl p-12 text-center">
                <Users className="mx-auto text-zinc-800 mb-3" size={40} />
                <p className="text-sm text-zinc-400 font-semibold">No matches found</p>
                <p className="text-xs text-zinc-600 mt-1">Try expanding your search query or finding community suggestions.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredFriends.map(friend => (
                  <div key={friend._id} className="bg-[#121212] border border-zinc-800/80 hover:border-zinc-700/50 rounded-2xl p-4 flex items-center justify-between gap-4 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center justify-center text-sm font-bold shrink-0">
                        {friend.username?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm truncate text-zinc-200">{friend.username}</h3>
                        <p className="text-xs text-zinc-500 truncate">{friend.localChurch || friend.currentCity || "Connected Partner"}</p>
                      </div>
                    </div>

                    {/* Quick Tools */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => unfriend(friend._id)}
                        className="p-2 bg-zinc-900 hover:bg-rose-950/30 text-zinc-400 hover:text-rose-500 border border-zinc-800 hover:border-rose-900/50 rounded-xl transition cursor-pointer"
                        title="Remove Connection"
                      >
                        <UserMinus size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* --- SECTION 3: PEOPLE YOU MAY KNOW (Takes up 1 Column) --- */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold">People You May Know</h2>
            
            <div className="bg-[#121212] border border-zinc-800/80 rounded-2xl p-4 divide-y divide-zinc-850">
              {suggestions.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-zinc-500">No suggestions available at this time.</p>
                </div>
              ) : (
                suggestions.map(suggest => (
                  <div key={suggest._id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold shrink-0 text-zinc-400">
                        {suggest.username?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold truncate">{suggest.username}</h4>
                        <p className="text-[10px] text-zinc-500 truncate">{suggest.localChurch || "Local Member"}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddFriend(suggest._id)}
                      className="py-1.5 px-3 bg-zinc-900 hover:bg-blue-600 border border-zinc-850 text-xs font-semibold rounded-lg text-zinc-300 hover:text-white transition cursor-pointer shrink-0"
                    >
                      Connect
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default FriendsHub;