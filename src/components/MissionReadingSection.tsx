import { useState, useEffect } from "react";
import { Loader, Globe, ShieldAlert } from "lucide-react";
import { apiFetch } from "../lib/api";

export default function MissionReadingSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiFetch("/library/mission/current")
      .then((res) => {
        if (!res || res.error) setError(true);
        else setData(res);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white border border-gray-100 rounded-3xl">
        <Loader className="animate-spin text-blue-600" size={28} />
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Opening Mission Reports...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center text-center justify-center py-16 p-6 bg-white border border-gray-100 rounded-3xl gap-2">
        <ShieldAlert className="text-amber-500" size={32} />
        <h4 className="font-black text-sm text-slate-800">Missionary Index Synced Offline</h4>
        <p className="text-xs text-gray-400 max-w-sm">The global readings are updating on the main network server. Please view standard lesson study guides or try again shortly.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-300">
      <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row gap-6 items-center">
        <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-6 opacity-5 pointer-events-none">
          <Globe size={240} />
        </div>
        {data.cover && (
          <img 
            src={data.cover} 
            alt="Quarterly Cover" 
            className="w-24 h-32 rounded-xl object-cover shadow-md border border-white/10 shrink-0" 
          />
        )}
        <div className="space-y-1.5 text-center md:text-left min-w-0 flex-1">
          <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 border border-white/20 text-blue-300 px-3 py-1 rounded-full">
            {data.quarter}
          </span>
          <h2 className="text-lg md:text-xl font-black tracking-tight truncate pt-1">{data.title}</h2>
          <p className="text-xs font-semibold text-indigo-200 leading-relaxed">Weekly report from frontline fields and cross-cultural outposts across the global church family.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm">
        <div 
          className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed font-medium font-serif
            prose-headings:font-sans prose-headings:font-black prose-headings:text-slate-900
            prose-p:mb-4 prose-strong:font-black prose-strong:text-blue-600"
          dangerouslySetInnerHTML={{ __html: data.story }}
        />
      </div>
    </div>
  );
}
