import React, { useState, useEffect, useRef } from 'react';
import { Search, User, LogOut, Clock, X, UserCheck, UserPlus, Check, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';
import { apiFetch } from '../lib/api';

interface FriendItem {
  _id: string;
  username: string;
  localChurch?: string;
  status?: string;
}

interface SuggestionItem {
  _id: string;
  username: string;
  localChurch?: string;
}

const Topbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const friendsRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  // Independent Dropdown States
  const [activeDropdown, setActiveDropdown] = useState<'friends' | 'suggestions' | 'account' | null>(null);
  const [friendTab, setFriendTab] = useState<'requests' | 'list'>('requests');

  // Live Data States
  const [friendsList, setFriendsList] = useState<FriendItem[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendItem[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load search history safely on initialization
  useEffect(() => {
    const history = localStorage.getItem('sanctuary_searches');
    if (history) setRecentSearches(JSON.parse(history));
  }, []);

  // Handle outside click closures for search overlay and custom dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
      if (friendsRef.current && !friendsRef.current.contains(event.target as Node)) {
        if (activeDropdown === 'friends') setActiveDropdown(null);
      }
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        if (activeDropdown === 'suggestions') setActiveDropdown(null);
      }
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        if (activeDropdown === 'account') setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.confirm("🚨 WARNING: Are you absolutely sure you want to delete your AdventConnect account? This action is permanent and cannot be undone.");
    if (!confirmation) return;

    setDeleting(true);
    try {
      await apiFetch('/users/account', { method: 'DELETE' });
      alert("Your account records have been successfully wiped from our database.");
      handleLogout();
    } catch (err) {
      console.error("Failed to delete account profile structure:", err);
      alert("Error deleting account. Please verify connectivity or terminal states.");
    } finally {
      setDeleting(false);
    }
  };

  const fetchFriendsData = async () => {
    setLoading(true);
    try {
      const requestsData = await apiFetch('/users/friend-requests/pending');
      if (Array.isArray(requestsData)) setFriendRequests(requestsData);

      const workspaceResponse = await apiFetch('/users/me');
      if (workspaceResponse?.status === 'success' && workspaceResponse?.space?.friends) {
        setFriendsList(workspaceResponse.space.friends);
      }
    } catch (err) {
      console.error("Failed to fetch friends data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestionsData = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/users/suggestions');
      if (Array.isArray(data)) setSuggestions(data);
    } catch (err) {
      console.error("Failed to retrieve suggestions:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = (type: 'friends' | 'suggestions' | 'account') => {
    if (activeDropdown === type) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(type);
      if (type === 'friends') fetchFriendsData();
      if (type === 'suggestions') fetchSuggestionsData();
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await apiFetch(`/users/friend-request/accept/${requestId}`, { method: 'POST' });
      setFriendRequests(prev => prev.filter(req => req._id !== requestId));
      fetchFriendsData();
    } catch (err) {
      console.error("Error accepting request:", err);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await apiFetch(`/users/friend-request/reject/${requestId}`, { method: 'POST' });
      setFriendRequests(prev => prev.filter(req => req._id !== requestId));
    } catch (err) {
      console.error("Error declining request:", err);
    }
  };

  const handleSendConnection = async (targetUserId: string) => {
    try {
      await apiFetch(`/users/friend-request/${targetUserId}`, { method: 'POST' });
      setSuggestions(prev => prev.filter(sug => sug._id !== targetUserId));
    } catch (err) {
      console.error("Failed to send connection request:", err);
    }
  };

  const executeSearch = (queryStr: string) => {
    const cleanQuery = queryStr.trim();
    if (!cleanQuery) return;

    const updated = [cleanQuery, ...recentSearches.filter(s => s !== cleanQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('sanctuary_searches', JSON.stringify(updated));

    setIsFocused(false);
    setSearchQuery(cleanQuery);
    navigate(`/search?q=${encodeURIComponent(cleanQuery)}`);
  };

  const clearHistoryItem = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== item);
    setRecentSearches(updated);
    localStorage.setItem('sanctuary_searches', JSON.stringify(updated));
  };

  return (
    <div className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-40">

      {/* 🔍 SEARCH FRAMEWORK */}
      <div className="flex-1 max-w-xl relative" ref={dropdownRef}>
        <div className="relative group">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isFocused ? 'text-blue-600' : 'text-gray-400'}`} size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={(e) => e.key === 'Enter' && executeSearch(searchQuery)}
            placeholder="Search Sanctuary (Brethren, Devotionals, Rooms)..."
            className="w-full bg-gray-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-100 transition-all outline-none"
          />
        </div>

        {isFocused && (
          <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 shadow-xl rounded-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            {searchQuery.trim() ? (
              <div
                onClick={() => executeSearch(searchQuery)}
                className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition text-xs font-bold text-slate-700"
              >
                <Search size={14} className="text-blue-600" />
                <span>Search network records for "<span className="text-blue-600">{searchQuery}</span>"</span>
              </div>
            ) : (
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 mb-2">Recent Searches</p>
                {recentSearches.length === 0 ? (
                  <p className="text-xs font-medium text-slate-400 px-2 py-2 italic">No recent lookups recorded</p>
                ) : (
                  <div className="space-y-0.5">
                    {recentSearches.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => executeSearch(item)}
                        className="flex items-center justify-between px-2 py-2 rounded-xl hover:bg-slate-50 cursor-pointer transition group"
                      >
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-600 group-hover:text-slate-900">
                          <Clock size={14} className="text-slate-400" />
                          <span>{item}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => clearHistoryItem(e, item)}
                          className="p-1 rounded-md text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        
        {/* FRIENDS DIRECTORY ACCORDION */}
        <div className="relative" ref={friendsRef}>
          <button
            onClick={() => toggleDropdown('friends')}
            className={`p-2.5 rounded-xl border transition relative duration-150 flex items-center justify-center cursor-pointer ${
              activeDropdown === 'friends' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'
            }`}
          >
            <UserCheck size={18} />
            {friendRequests.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full animate-pulse" />}
          </button>

          {activeDropdown === 'friends' && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-100 shadow-2xl rounded-2xl py-3 flex flex-col max-h-[400px] z-50">
              <div className="flex border-b border-gray-50 px-4 text-[10px] font-black tracking-wider uppercase mb-1">
                <button onClick={() => setFriendTab('requests')} className={`flex-1 pb-2 pt-1 border-b-2 text-center ${friendTab === 'requests' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>Requests ({friendRequests.length})</button>
                <button onClick={() => setFriendTab('list')} className={`flex-1 pb-2 pt-1 border-b-2 text-center ${friendTab === 'list' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>Friends ({friendsList.length})</button>
              </div>
              <div className="overflow-y-auto flex-1 p-2 max-h-[280px]">
                {loading ? <div className="text-center py-6 text-xs text-gray-400">Loading...</div> : friendTab === 'requests' ? (
                  friendRequests.length === 0 ? <p className="text-xs text-gray-400 text-center py-6 italic">No pending requests.</p> : friendRequests.map(req => (
                    <div key={req._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">{req.username?.[0]?.toUpperCase()}</div>
                      <div className="flex-1 min-w-0"><p className="text-xs font-bold text-gray-800 truncate">{req.username}</p></div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => handleAcceptRequest(req._id)} className="p-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Check size={12} /></button>
                        <button onClick={() => handleRejectRequest(req._id)} className="p-1 bg-gray-100 text-gray-400 rounded-lg hover:bg-gray-200"><X size={12} /></button>
                      </div>
                    </div>
                  ))
                ) : (
                  friendsList.length === 0 ? <p className="text-xs text-gray-400 text-center py-6 italic">No friends connected yet.</p> : friendsList.map(friend => (
                    <div key={friend._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">{friend.username?.[0]?.toUpperCase()}</div>
                      <div className="flex-1 min-w-0"><p className="text-xs font-bold text-gray-800 truncate">{friend.username}</p></div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* RECS DROP PANEL */}
        <div className="relative" ref={suggestionsRef}>
          <button
            onClick={() => toggleDropdown('suggestions')}
            className={`p-2.5 rounded-xl border transition duration-150 flex items-center justify-center cursor-pointer ${
              activeDropdown === 'suggestions' ? 'bg-purple-50 border-purple-200 text-purple-600' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'
            }`}
          >
            <UserPlus size={18} />
          </button>

          {activeDropdown === 'suggestions' && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-100 shadow-2xl rounded-2xl py-3 flex flex-col max-h-[400px] z-50">
              <div className="px-4 py-1 border-b border-gray-50 mb-1"><h3 className="text-[10px] font-black tracking-wider uppercase text-purple-600">People You May Know</h3></div>
              <div className="overflow-y-auto flex-1 p-2 space-y-1 max-h-[280px]">
                {loading ? <div className="text-center py-6 text-xs text-gray-400">Loading...</div> : suggestions.length === 0 ? <p className="text-xs text-gray-400 text-center py-6 italic">No suggestions.</p> : suggestions.map(sug => (
                  <div key={sug._id} className="flex items-center justify-between gap-3 p-2 hover:bg-gray-50 rounded-xl transition">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs shrink-0">{sug.username?.[0]?.toUpperCase()}</div>
                      <p className="text-xs font-bold text-gray-800 truncate">{sug.username}</p>
                    </div>
                    <button onClick={() => handleSendConnection(sug._id)} className="px-3 py-1 bg-purple-50 text-purple-600 text-[10px] font-bold rounded-lg hover:bg-purple-100">Connect</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <NotificationDropdown />

        {/* ⚙️ USER SETTINGS & DESTRUCTION HUB */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-100" ref={accountRef}>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-gray-900 leading-none">{user?.username || 'Brethren'}</p>
            <button
              type="button"
              onClick={() => toggleDropdown('account')}
              className="text-[9px] font-black text-gray-400 hover:text-blue-600 uppercase tracking-widest mt-1.5 cursor-pointer border-none bg-transparent block ml-auto transition-colors"
            >
              Account Actions Options
            </button>
          </div>

          <button
            onClick={() => toggleDropdown('account')}
            className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100 border-none cursor-pointer"
          >
            <User size={20} />
          </button>

          {activeDropdown === 'account' && (
            <div className="absolute right-0 top-full mt-3 w-56 bg-white border border-gray-100 shadow-2xl rounded-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full px-4 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition cursor-pointer"
              >
                <LogOut size={14} className="text-gray-400" />
                Logout Session
              </button>
              
              <div className="h-[1px] bg-gray-50 my-1" />
              
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteAccount}
                className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Wiping Data...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Delete My Account
                  </>
                )}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Topbar;
