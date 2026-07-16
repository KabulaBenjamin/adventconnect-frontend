import React, { useState, useEffect, useRef } from 'react';
import { Search, User, LogOut, Clock, X, Users, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown.js';
import { apiFetch } from '../lib/api.js';

const Topbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  // Dropdown & Deleting States
  const [activeDropdown, setActiveDropdown] = useState<'account' | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load search history safely on initialization
  useEffect(() => {
    const history = localStorage.getItem('sanctuary_searches');
    if (history) setRecentSearches(JSON.parse(history));
  }, []);

  // Handle outside click closures for search overlay and account dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFocused(false);
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

  const toggleDropdown = (type: 'account') => {
    setActiveDropdown(activeDropdown === type ? null : type);
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

  // Check if we are currently on the Friends Hub page
  const isFriendsActive = location.pathname === '/friends';

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
        
        {/* 👥 FRIENDS HUB BUTTON */}
        <button
          onClick={() => navigate('/friends')}
          className={`p-2.5 rounded-xl border transition duration-150 flex items-center justify-center cursor-pointer ${
            isFriendsActive 
              ? 'bg-blue-50 border-blue-200 text-blue-600' 
              : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700'
          }`}
          title="Friends Hub"
        >
          <Users size={18} />
        </button>

        <NotificationDropdown />

        {/* ⚙️ USER SETTINGS & DESTRUCTION HUB */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-100 relative" ref={accountRef}>
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