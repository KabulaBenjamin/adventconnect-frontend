import { useState, useEffect } from "react";
import { Search, Music, Languages, Loader } from "lucide-react";
import { apiFetch } from "../lib/api";

export default function HymnViewer() {
  const [hymns, setHymns] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHymn, setSelectedHymn] = useState<any>(null);
  const [lang, setLang] = useState<"en" | "sw">("en");
  const [loading, setLoading] = useState(false);

  // Fetch hymns when typing or on load
  useEffect(() => {
    setLoading(true);
    const delayDebounce = setTimeout(() => {
      apiFetch(`/library/hymns?q=${encodeURIComponent(searchQuery)}`)
        .then((data) => {
          if (Array.isArray(data)) {
            setHymns(data);
          }
        })
        .catch((err) => console.error("Error loading hymns:", err))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto p-4 animate-in fade-in">
      
      {/* LEFT COLUMN: SEARCH & LIST */}
      <div className="md:col-span-1 space-y-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-800 text-sm tracking-tight flex items-center gap-2">
              <Music className="text-blue-600" size={16} />
              Hymnal Archive
            </h3>
            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === "en" ? "sw" : "en")}
              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-slate-100 hover:bg-blue-50 hover:text-blue-600 px-2.5 py-1.5 rounded-lg transition-all"
            >
              <Languages size={12} />
              {lang === "en" ? "English" : "Kiswahili"}
            </button>
          </div>

          {/* Search Input Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search by number or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 pl-9 pr-4 py-2 rounded-xl text-xs font-medium border border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all"
            />
          </div>
        </div>

        {/* Hymns Render List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm max-h-[60vh] overflow-y-auto divide-y divide-gray-50 p-2 space-y-1">
          {loading ? (
            <div className="flex justify-center py-8"><Loader className="animate-spin text-blue-600" size={20} /></div>
          ) : hymns.length === 0 ? (
            <p className="text-center text-[11px] font-bold text-gray-400 py-6">No hymns found matching query</p>
          ) : (
            hymns.map((hymn) => {
              // Safely dig into translations fallback patterns
              const hymnDetails = hymn.translations?.[lang] || hymn.translations?.["en"] || {};
              return (
                <button
                  key={hymn._id || hymn.number}
                  onClick={() => setSelectedHymn(hymn)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all ${
                    selectedHymn?.number === hymn.number
                      ? "bg-blue-600 text-white shadow-sm"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span className={`text-xs font-black px-2 py-1 rounded-md shrink-0 ${
                    selectedHymn?.number === hymn.number ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    {hymn.number}
                  </span>
                  <div className="truncate">
                    <p className="text-xs font-black truncate">{hymnDetails.title || `Hymn ${hymn.number}`}</p>
                    <p className={`text-[10px] truncate opacity-70 font-medium`}>
                      {hymnDetails.lyrics?.split('\n')[0] || "Open to view lyrics"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: LYRIC DISPLAY CANVAS */}
      <div className="md:col-span-2">
        {selectedHymn ? (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Header Banner */}
            <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md">
                  Hymn {selectedHymn.number}
                </span>
                <h2 className="text-lg font-black text-slate-800 mt-1.5">
                  {(selectedHymn.translations?.[lang]?.title) || `Hymn ${selectedHymn.number}`}
                </h2>
              </div>

              {/* MIDI Audio Stream Element */}
              {selectedHymn.midiUrl && (
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center gap-2 w-full sm:w-auto justify-between">
                  <span className="text-[10px] font-black text-slate-500 px-1 uppercase tracking-wider">Audio Backing Track</span>
                  <audio 
                    src={selectedHymn.midiUrl} 
                    controls 
                    className="h-7 max-w-[180px] text-xs outline-none"
                    title="Audio player accompaniment"
                  />
                </div>
              )}
            </div>

            {/* Lyrics Body Sheet */}
            <div className="whitespace-pre-line text-slate-700 font-bold text-sm leading-relaxed tracking-wide bg-slate-50/50 p-6 rounded-2xl border border-slate-100/60 font-serif">
              {(selectedHymn.translations?.[lang]?.lyrics) || "Lyrics template pending revision."}
            </div>
          </div>
        ) : (
          <div className="bg-white/60 border border-dashed border-gray-200 rounded-2xl h-64 flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <Music size={28} className="stroke-1 mb-2 text-gray-300" />
            <p className="text-xs font-black uppercase tracking-wider">Select a hymn from the list</p>
            <p className="text-[10px] font-medium mt-0.5">Type numbers or words to search the index</p>
          </div>
        )}
      </div>

    </div>
  );
}
