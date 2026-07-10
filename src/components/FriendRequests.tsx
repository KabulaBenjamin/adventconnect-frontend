import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Check, X, BellDot } from 'lucide-react';

const FriendRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;

    const fetchRequests = async () => {
      try {
        const response = await apiFetch('/users/friend-requests/pending');
        if (Array.isArray(response)) {
          setRequests(response);
        } else if (response?.requests) {
          setRequests(response.requests);
        }
      } catch (error) {
        console.log("Friend requests skipped or pending session verification.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user?._id]);

  if (!user?._id || loading || requests.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20 rounded-2xl p-4 text-left shadow-2xs">
      <div className="flex items-center gap-2 text-amber-600">
        <BellDot size={13} className="animate-pulse" />
        <span className="text-[10px] uppercase font-mono font-black tracking-wider">Pending Connection</span>
      </div>
      <div className="mt-3 space-y-2">
        {requests.map((req: any) => (
          <div key={req._id} className="flex items-center justify-between gap-2 bg-white/80 backdrop-blur-xs p-2 rounded-xl border border-amber-500/10">
            <span className="text-xs font-bold text-slate-800 truncate max-w-[110px]">
              {req.sender?.username || 'New User'}
            </span>
            <div className="flex gap-1 shrink-0">
              <button className="p-1 bg-slate-900 text-white rounded-lg hover:bg-blue-600 transition cursor-pointer flex items-center justify-center">
                <Check size={11} strokeWidth={2.5} />
              </button>
              <button className="p-1 bg-slate-100 text-slate-400 hover:text-slate-800 rounded-lg transition cursor-pointer flex items-center justify-center">
                <X size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendRequests;
