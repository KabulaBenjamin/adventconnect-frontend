import React, { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import { Video, Radio, Calendar } from "lucide-react";

const Live = () => {
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/live")
      .then((data) => setStreams(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const statusColor: Record<string, string> = {
    live: "bg-red-500 animate-pulse",
    upcoming: "bg-yellow-500",
    ended: "bg-gray-400",
  };

  return (
    <div className="max-w-4xl mx-auto pt-8 px-4 pb-20">
      <div className="flex items-center gap-3 mb-6">
        <Radio className="text-red-500" size={28} />
        <h1 className="text-2xl font-black text-gray-900">Live and Upcoming</h1>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      )}

      {error && <div className="text-center py-20 text-red-500 font-medium">{error}</div>}

      {!loading && !error && streams.length === 0 && (
        <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300">
          <Video size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-medium">No live or upcoming streams right now.</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {streams.map((s) => (
          <div key={s._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition">
            {s.thumbnail ? (
              <img src={s.thumbnail} alt={s.title} className="w-full h-48 object-cover" />
            ) : (
              <div className="w-full h-48 bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center">
                <Video size={56} className="text-white opacity-40" />
              </div>
            )}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${statusColor[s.status] || "bg-gray-400"}`}>
                  {s.status}
                </span>
                <span className="text-[10px] text-gray-500 font-bold bg-gray-100 px-2.5 py-1 rounded-md uppercase tracking-wider">
                  {s.category}
                </span>
              </div>
              <h3 className="font-black text-lg text-gray-900 leading-tight">{s.title}</h3>
              {s.description && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{s.description}</p>}
              
              {s.scheduledAt && (
                <div className="flex items-center gap-1.5 mt-4 text-xs font-bold text-gray-400">
                  <Calendar size={14} />
                  {new Date(s.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              )}

              {s.streamUrl && s.status === "live" && (
                <a
                  href={s.streamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-xl transition shadow-lg shadow-red-600/20"
                >
                  <Radio size={18} /> WATCH LIVE NOW
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Live;
