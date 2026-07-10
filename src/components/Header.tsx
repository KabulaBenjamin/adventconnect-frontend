import React, { useState, useEffect } from 'react';
import { Plus, Sliders, LogOut, UserCheck, UserPlus, X, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';

interface HeaderProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

interface FriendItem {
  _id: string;
  username: string;
  status?: string;
}

interface SuggestionItem {
  _id: string;
  username: string;
  localChurch?: string;
}

export default function Header({ isCollapsed, setIsCollapsed }: HeaderProps) {
  const { user } = useAuth();
  const [activeDropdown, setActiveDropdown] = useState<'friends' | 'suggestions' | null>(null);
  const [friendTab, setFriendTab] = useState<'list' | 'requests'>('requests');

  // Live Data States
  const [friendsList, setFriendsList] = useState<FriendItem[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendItem[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Securely logs out the user and redirects to login view
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Fetch Friends and Friend Requests from matching backend routes
  const fetchFriendsData = async () => {
    setLoading(true);
    try {
      // Endpoint 3: GET api/users/friend-requests/pending
      const requestsData = await apiFetch('/users/friend-requests/pending');
      if (Array.isArray(requestsData)) setFriendRequests(requestsData);

      // Endpoint 7: GET api/users/me (extracts mutual friends list)
      const workspaceResponse = await apiFetch('/users/me');
      if (workspaceResponse?.status === 'success' && workspaceResponse?.space?.friends) {
        setFriendsList(workspaceResponse.space.friends);
      }
    } catch (err) {
      console.error("Failed to fetch friends context data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch People You May Know suggestions
  const fetchSuggestionsData = async () => {
    setLoading(true);
    try {
      // Endpoint 1: GET api/users/suggestions
      const data = await apiFetch('/users/suggestions');
      if (Array.isArray(data)) setSuggestions(data);
    } catch (err) {
      console.error("Failed to retrieve system user recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger loading state on demand when menus open
  const toggleDropdown = (type: 'friends' | 'suggestions') => {
    if (activeDropdown === type) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(type);
      if (type === 'friends') fetchFriendsData();
      if (type === 'suggestions') fetchSuggestionsData();
    }
  };

  // Accept incoming friend connection request
  const handleAcceptRequest = async (requestId: string) => {
    try {
      // Endpoint 4: POST api/users/friend-request/accept/:id
      await apiFetch(`/users/friend-request/accept/${requestId}`, { method: 'POST' });
      setFriendRequests(prev => prev.filter(req => req._id !== requestId));
      fetchFriendsData(); // Refresh list automatically
    } catch (err) {
      console.error("Error accepting connection:", err);
    }
  };

  // Decline/Remove incoming friend request
  const handleRejectRequest = async (requestId: string) => {
    try {
      // Endpoint 5: POST api/users/friend-request/reject/:id
      await apiFetch(`/users/friend-request/reject/${requestId}`, { method: 'POST' });
      setFriendRequests(prev => prev.filter(req => req._id !== requestId));
    } catch (err) {
      console.error("Error declining connection request:", err);
    }
  };

  // Send friend invitation request to recommended profile
  const handleSendConnection = async (targetUserId: string) => {
    try {
      // Endpoint 2: POST api/users/friend-request/:id
      await apiFetch(`/users/friend-request/${targetUserId}`, { method: 'POST' });
      setSuggestions(prev => prev.filter(sug => sug._id !== targetUserId));
    } catch (err) {
      console.error("Failed to dispatch friend connection request:", err);
    }
  };

  return (
    <header className="w-full h-16 bg-slate-50/70 backdrop-blur-xl border-b border-gray-200/40 px-6 flex items-center justify-between sticky top-0 z-50 transition-all duration-300">

      {/* COLUMN 1: BRAND LOGO & SYSTEM TOGGLE */}
      <div className="flex items-center gap-3 min-w-[220px]">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/60 transition cursor-pointer"
        >
          <Sliders size={16} className="rotate-90 text-slate-700" />
        </button>
        <div className="flex flex-col select-none">
          <h1 className="font-sans font-black text-sm tracking-tight text-slate-900 leading-none">
            advent<span className="text-blue-600">connect</span>
          </h1>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            Realtime Engine v2
          </span>
        </div>
      </div>

      {/* COLUMN 2: CENTER SANCTUARY GLOW PILL */}
      <div className="hidden md:flex items-center justify-center flex-1">
        <div className="bg-white/80 backdrop-blur-md border border-white shadow-xs px-5 py-1.5 rounded-full flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="text-[10px] font-black text-slate-700 tracking-widest uppercase">
            Sanctuary Mode
          </span>
        </div>
      </div>

      {/* COLUMN 3: ACCOUNT IDENTIFIER HUB */}
      <div className="flex items-center justify-end gap-3 min-w-[320px] relative">
        
        {/* INDEPENDENT FRIEND LIST BUTTON & DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('friends')}
            title="Friends & Requests"
            className={`p-2 rounded-xl border transition duration-150 flex items-center justify-center cursor-pointer relative shadow-xs ${
              activeDropdown === 'friends' 
                ? 'bg-blue-50 border-blue-200 text-blue-600' 
                : 'bg-white/80 border-slate-200/60 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserCheck size={14} strokeWidth={2.5} />
            {friendRequests.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            )}
          </button>

          {activeDropdown === 'friends' && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200/80 rounded-2xl shadow-xl py-2 flex flex-col max-h-[400px] z-50 animate-in fade-in slide-in-from-top-1">
              <div className="flex border-b border-slate-100 px-4 text-[11px] font-black tracking-wider uppercase">
                <button
                  onClick={() => setFriendTab('requests')}
                  className={`flex-1 pb-2 pt-1 border-b-2 text-center transition ${
                    friendTab === 'requests' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'
                  }`}
                >
                  Requests ({friendRequests.length})
                </button>
                <button
                  onClick={() => setFriendTab('list')}
                  className={`flex-1 pb-2 pt-1 border-b-2 text-center transition ${
                    friendTab === 'list' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'
                  }`}
                >
                  My Friends ({friendsList.length})
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-2 max-h-[300px]">
                {loading ? (
                  <div className="flex items-center justify-center py-6 text-slate-400 gap-2 text-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" /> Pulling dynamic data...
                  </div>
                ) : friendTab === 'requests' ? (
                  <div className="space-y-1.5">
                    {friendRequests.length === 0 ? (
                      <p className="text-[11px] text-slate-400 text-center py-4">No pending friend requests.</p>
                    ) : friendRequests.map((req) => (
                      <div key={req._id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                          {req.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{req.username}</p>
                          <p className="text-[10px] text-slate-400 truncate">{req.localChurch || 'Fellow Believer'}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => handleAcceptRequest(req._id)} className="p-1 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition cursor-pointer"><Check size={12} /></button>
                          <button onClick={() => handleRejectRequest(req._id)} className="p-1 bg-slate-100 text-slate-400 rounded-lg hover:bg-slate-200 transition cursor-pointer"><X size={12} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {friendsList.length === 0 ? (
                      <p className="text-[11px] text-slate-400 text-center py-4">Your friend directory is empty.</p>
                    ) : friendsList.map((friend) => (
                      <div key={friend._id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                          {friend.username?.[0]?.toUpperCase() || 'F'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{friend.username}</p>
                          <p className="text-[9px] text-emerald-500 font-semibold uppercase tracking-wider">{friend.status || 'Connected'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* INDEPENDENT SUGGESTIONS BUTTON (PEOPLE YOU MAY KNOW) */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('suggestions')}
            title="People You May Know"
            className={`p-2 rounded-xl border transition duration-150 flex items-center justify-center cursor-pointer shadow-xs ${
              activeDropdown === 'suggestions'
                ? 'bg-purple-50 border-purple-200 text-purple-600'
                : 'bg-white/80 border-slate-200/60 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserPlus size={14} strokeWidth={2.5} />
          </button>

          {activeDropdown === 'suggestions' && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200/80 rounded-2xl shadow-xl py-2 flex flex-col max-h-[400px] z-50 animate-in fade-in slide-in-from-top-1">
              <div className="px-4 py-1.5 border-b border-slate-100">
                <h3 className="text-[10px] font-black tracking-wider uppercase text-purple-600">People You May Know</h3>
              </div>
              <div className="overflow-y-auto flex-1 p-2 space-y-1.5 max-h-[300px]">
                {loading ? (
                  <div className="flex items-center justify-center py-6 text-slate-400 gap-2 text-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" /> Discovering paths...
                  </div>
                ) : suggestions.length === 0 ? (
                  <p className="text-[11px] text-slate-400 text-center py-4">No suggestions available right now.</p>
                ) : suggestions.map((sug) => (
                  <div key={sug._id} className="flex items-center justify-between gap-3 p-2 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {sug.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{sug.username}</p>
                        <p className="text-[10px] text-slate-400 truncate">{sug.localChurch || 'AdventConnect Member'}</p>
                      </div>
                    </div>
                    <button onClick={() => handleSendConnection(sug._id)} className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-600 text-[10px] font-bold rounded-lg transition shrink-0 cursor-pointer">
                      Connect
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-[1px] h-4 bg-slate-200/80 mx-0.5" />

        {/* ACCOUNT PROFILE IDENTIFIER */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-500 p-[2px] shadow-xs select-none">
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[10px] font-black text-slate-800">
            {user?.username?.[0] || 'U'}
          </div>
        </div>

        <button className="p-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl transition duration-200 flex items-center justify-center cursor-pointer">
          <Plus size={14} strokeWidth={2.5} />
        </button>

        {/* 🚪 QUICK ACCESS LOGOUT TRIGGER */}
        <button
          type="button"
          onClick={handleLogout}
          title="Logout Session"
          className="p-2 bg-white/80 hover:bg-rose-50 border border-slate-200/60 hover:border-rose-100 text-slate-500 hover:text-rose-600 rounded-xl transition duration-150 flex items-center justify-center cursor-pointer shadow-xs"
        >
          <LogOut size={14} strokeWidth={2.5} />
        </button>
      </div>

    </header>
  );
}
