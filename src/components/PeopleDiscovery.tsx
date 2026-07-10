import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Sparkles } from 'lucide-react';

const PeopleDiscovery = () => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;

    const fetchSuggestions = async () => {
      try {
        const response = await apiFetch('/users/suggestions');
        if (Array.isArray(response)) {
          setSuggestions(response);
        } else if (response?.suggestions) {
          setSuggestions(response.suggestions);
        }
      } catch (error) {
        console.log("Discovery pipeline waiting for user token mapping.");
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [user?._id]);

  if (!user?._id || loading) return <div className="text-[10px] text-slate-400 font-bold tracking-wide animate-pulse p-2">Syncing recommendations...</div>;

  return (
    <div className="w-full text-left">
      {suggestions.length === 0 ? (
        <p className="text-slate-400 text-[11px] font-medium py-1">No new recommendations right now</p>
      ) : (
        <div className="space-y-2 mt-1">
          {suggestions.map((person: any) => (
            <div key={person._id} className="flex items-center justify-between p-2 bg-slate-50/50 hover:bg-white rounded-xl border border-slate-100/80 transition group">
              <div className="flex items-center gap-2 truncate">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-black group-hover:bg-blue-600 group-hover:text-white transition duration-200 shrink-0">
                  {person.username?.[0] || 'U'}
                </div>
                <span className="text-xs font-bold text-slate-700 truncate max-w-[110px]">{person.username}</span>
              </div>
              <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer">
                <UserPlus size={13} strokeWidth={2.5} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PeopleDiscovery;
