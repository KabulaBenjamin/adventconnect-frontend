import { useState, useEffect } from "react";
import { Search, Loader, Languages } from "lucide-react";
import { apiFetch } from "../lib/api";

export default function HymnalSection({ isCompact }: { isCompact: boolean }) {
  const [search, setSearch] = useState("");
  const [hymns, setHymns] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [lang, setLang] = useState<"en" | "sw">("en");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const delayDebounce = setTimeout(() => {
      apiFetch(`/library/hymns?q=${encodeURIComponent(search)}`)
        .then((data) => setHymns(data || []))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-200">
      <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
        <div className="flex gap-2 items-center">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search Hymns by number or phrase..." 
              className="w-full py-2 pl-9 pr-3 rounded-xl bg-gray-50 border-none text-xs focus:ring-2 focus:ring-blue-500 outline-none font-medium" 
            />
          </div>
          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "sw" : "en")}
            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-slate-100 hover:bg-blue-50 hover:text-blue-600 px-3 py-2.5 rounded-xl transition-all shrink-0 shadow-sm"
          >
            <Languages size={12} />
            {lang === "en" ? "English" : "Swahili"}
          </button>
        </div>

        <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar p-1">
          {loading ? (
            <div className="flex justify-center py-4"><Loader className="animate-spin text-blue-600" size={16} /></div>
          ) : hymns.length === 0 ? (
            <p className="text-center text-[11px] font-bold text-gray-400 py-4">No matching hymns found</p>
          ) : (
            hymns.map((h) => {
              const localizedDetails = h.translations?.[lang] || h.translations?.en || {};
              return (
                <button 
                  key={h._id || h.number} 
                  onClick={() => setSelected(h)} 
                  className={`w-full text-left p-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                    selected?.number === h.number ? "bg-blue-600 text-white shadow-md" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${selected?.number === h.number ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>{h.number}</span> 
                  <span className="truncate">{localizedDetails.title || `Hymn ${h.number}`}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {selected && (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 space-y-4 shadow-sm">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md">
              Hymn {selected.number}
            </span>
            <h4 className="font-black text-sm text-slate-800 mt-1">
              {selected.translations?.[lang]?.title || selected.translations?.en?.title || `Hymn ${selected.number}`}
            </h4>
          </div>
          <pre className="whitespace-pre-wrap font-serif text-xs text-slate-700 leading-relaxed font-medium bg-slate-50/70 p-5 rounded-xl border border-slate-100/60 shadow-inner">
            {selected.translations?.[lang]?.lyrics || selected.translations?.en?.lyrics || "Lyrics are uncompiled for this track."}
          </pre>
          {selected.midiUrl && (
            <div className="bg-slate-50 border border-gray-100 p-2.5 rounded-xl flex items-center justify-between gap-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Audio Track</span>
              <audio src={selected.midiUrl} controls className="h-7 text-xs outline-none max-w-[200px]" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
