import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { Search, User, BookOpen, MessageSquare, ShieldCheck, Compass, UserPlus, Check, Sparkles, Church, MapPin } from 'lucide-react';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Suggestions & Action states
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<Record<string, boolean>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const [results, setResults] = useState({
    users: [] as any[],
    devotionals: [] as any[],
    rooms: [] as any[]
  });

  // Pull "People You May Know" recommendations pool on component mount
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const data = await apiFetch('/users/suggestions');
        setSuggestions(data || []);
      } catch (err) {
        console.error("Failed fetching discovery user suggestions:", err);
      }
    };
    fetchSuggestions();
  }, []);

  useEffect(() => {
    if (!query.trim()) return;

    const pullSearchResults = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiFetch(`/search?q=${encodeURIComponent(query)}`);
        setResults({
          users: data.users || [],
          devotionals: data.devotionals || [],
          rooms: data.rooms || []
        });
      } catch (err: any) {
        console.error("Search pipeline drop:", err);
        setError("Failed to fetch matches from Sanctuary engine records.");
      } finally {
        setLoading(false);
      }
    };

    pullSearchResults();
  }, [query]);

  // Click handler to transmit a friend request link
  const handleSendRequest = async (targetUserId: string) => {
    setActionLoading(prev => ({ ...prev, [targetUserId]: true }));
    try {
      await apiFetch('/users/friend-request/send', {
        method: 'POST',
        body: JSON.stringify({ targetUserId })
      });
      setSentRequests(prev => ({ ...prev, [targetUserId]: true }));
    } catch (err: any) {
      alert(err.message || "Failed to transmit connection request.");
    } finally {
      setActionLoading(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  const tabs = [
    { id: 'all', label: 'All Results' },
    { id: 'people', label: 'People' },
    { id: 'library', label: 'Feed Content' },
    { id: 'rooms', label: 'Chat & Groups' }
  ];

  const totalCount = results.users.length + results.devotionals.length + results.rooms.length;

  return (
    <div className="min-h-screen bg-transparent p-6 md:p-10 max-w-5xl mx-auto mt-4 text-left grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* LEFT & MIDDLE MAIN CONTAINER LAYOUT COLUMN */}
      <div className="lg:col-span-2 space-y-6">
        {/* Search Metadata Header */}
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Search size={22} className="text-blue-600" />
            Search Results for <span className="text-blue-600">"{query || 'Discover'}"</span>
          </h1>
          {query.trim() && (
            error ? (
              <p className="text-xs font-bold text-rose-500 mt-1">{error}</p>
            ) : (
              <p className="text-xs font-bold text-slate-400 mt-1">
                Found {totalCount} matching entries inside the Sanctuary cloud engine
              </p>
            )
          )}
        </div>

        {/* Content Filters */}
        <div className="flex border-b border-slate-200/60 gap-2 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 font-bold text-xs whitespace-nowrap transition-all border-b-2 -mb-px cursor-pointer ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Querying Sanctuary Engines...</p>
          </div>
        ) : (!query.trim() || totalCount === 0) ? (
          <div className="bg-white border border-slate-200/60 rounded-2xl p-12 text-center max-w-md mx-auto shadow-xs">
            <Compass size={40} className="text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-black text-slate-800">No query active or results missing</h3>
            <p className="text-xs font-medium text-slate-400 mt-1">Type matching keywords in your search bar to parse user records or church resources.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* MATCHED USERS RENDER PIECE */}
            {(activeTab === 'all' || activeTab === 'people') && results.users.length > 0 && (
              <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-xs">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User size={14} /> Matching People
                </h2>
                <div className="divide-y divide-slate-100">
                  {results.users.map(u => {
                    const userIdString = u.id || u._id;
                    const hasSent = sentRequests[userIdString];
                    return (
                      <div key={userIdString} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs overflow-hidden shrink-0">
                            {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : u.username[0]}
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1">
                              {u.username} <ShieldCheck size={12} className="text-blue-500" />
                            </h4>
                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                              {u.localChurch ? <><Church size={10} /> {u.localChurch}</> : (u.role || 'Brother')}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={hasSent || actionLoading[userIdString]}
                          onClick={() => handleSendRequest(userIdString)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer disabled:opacity-60 ${
                            hasSent 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {actionLoading[userIdString] ? (
                            <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                          ) : hasSent ? (
                            <><Check size={12} /> Sent</>
                          ) : (
                            <><UserPlus size={12} /> Connect</>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* DEVOTIONALS / FEEDS CONTENT MATCHES */}
            {(activeTab === 'all' || activeTab === 'library') && results.devotionals.length > 0 && (
              <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-xs">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BookOpen size={14} /> Content Posts
                </h2>
                <div className="space-y-3">
                  {results.devotionals.map(d => (
                    <Link to={`/feed`} key={d.id || d._id} className="block p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition">
                      <h4 className="text-xs font-bold text-slate-800">"{d.title || d.content}"</h4>
                      <p className="text-[10px] font-black text-blue-600 mt-0.5">Shared by {d.author || 'Brethren'}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* CHAT CHANNELS MATCHES */}
            {(activeTab === 'all' || activeTab === 'rooms') && results.rooms.length > 0 && (
              <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-xs">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MessageSquare size={14} /> Chat Groups
                </h2>
                <div className="space-y-3">
                  {results.rooms.map(r => (
                    <div key={r.id || r._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/60 border border-slate-100">
                      <div>
                        <h4 className="text-xs font-black text-slate-800">#{r.name}</h4>
                        <p className="text-[10px] font-bold text-blue-600 mt-0.5">{r.members || 0} active members</p>
                      </div>
                      <Link to="/chat" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black transition cursor-pointer">
                        Open Room
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR LAYOUT COLUMN: PEOPLE YOU MAY KNOW DISCOVERY */}
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white border border-slate-800 rounded-2xl p-5 shadow-sm">
          <h2 className="text-xs font-black uppercase tracking-wider mb-4 flex items-center gap-2 text-indigo-300">
            <Sparkles size={14} /> People You May Know
          </h2>
          
          {suggestions.length === 0 ? (
            <p className="text-[10px] text-slate-400 font-medium py-4 text-center">
              All active church registries are currently connected into your fellowship.
            </p>
          ) : (
            <div className="space-y-4">
              {suggestions.map(s => {
                const suggestionId = s._id || s.id;
                const hasSent = sentRequests[suggestionId];
                return (
                  <div key={suggestionId} className="flex items-center justify-between gap-2 border-b border-white/5 pb-3 last:border-none last:pb-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white/10 text-indigo-200 flex items-center justify-center font-black text-xs shrink-0 overflow-hidden">
                        {s.avatar ? <img src={s.avatar} alt="" className="w-full h-full object-cover" /> : s.username[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-white truncate">{s.username}</p>
                        <p className="text-[9px] font-bold text-slate-400 truncate mt-0.5 flex items-center gap-0.5">
                          <MapPin size={8} /> {s.currentCity || 'Global Base'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={hasSent || actionLoading[suggestionId]}
                      onClick={() => handleSendRequest(suggestionId)}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                        hasSent
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-white hover:bg-slate-100 text-slate-950'
                      }`}
                    >
                      {hasSent ? 'Sent' : 'Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
