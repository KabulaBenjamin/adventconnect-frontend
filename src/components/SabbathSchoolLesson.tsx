import { useState, useEffect } from "react";
import { Loader, BookOpen, Calendar } from "lucide-react";
import { apiFetch } from "../lib/api";

export default function SabbathSchoolLesson() {
  const [lesson, setLesson] = useState<any>(null);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/library/devotional/lesson")
      .then((data) => {
        if (data && data.days && data.days.length > 0) {
          setLesson(data);
          // Auto-select today's date if possible, or default to first day
          setActiveDayIdx(0);
        } else {
          setError("No active lesson content returned from server.");
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to stream lesson data.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader className="animate-spin text-blue-600" size={32} />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Syncing Quarterly Guide...</p>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 text-center">
        <p className="text-sm font-black text-amber-900">{error || "Lesson temporarily unavailable"}</p>
      </div>
    );
  }

  const currentDay = lesson.days[activeDayIdx] || lesson.days[0];

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="space-y-1 text-center sm:text-left">
          <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-md">
            {lesson.quarterlyTitle || "Sabbath School Study"}
          </span>
          <h2 className="text-xl font-black tracking-tight mt-1">{lesson.weekTitle}</h2>
        </div>
        {lesson.cover && (
          <img src={lesson.cover} alt="Cover" className="w-16 h-24 object-cover rounded-lg shadow-md border border-white/10 hidden sm:block" />
        )}
      </div>

      {/* Days Navigation Tab Row */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none snap-x">
        {lesson.days.map((day: any, idx: number) => (
          <button
            key={day.id}
            onClick={() => setActiveDayIdx(idx)}
            className={`px-4 py-2.5 rounded-xl font-black text-xs shrink-0 transition-all text-center snap-center ${
              activeDayIdx === idx
                ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                : "bg-white hover:bg-gray-100 text-gray-600 border border-gray-100"
            }`}
          >
            {day.title.split(" ")[0] || `Day ${idx + 1}`}
          </button>
        ))}
      </div>

      {/* Active Day Content Canvas */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="border-b border-gray-50 pb-3 flex items-center justify-between">
          <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
            <BookOpen size={16} className="text-blue-600" />
            {currentDay.title}
          </h3>
          {currentDay.date && (
            <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
              <Calendar size={12} /> {currentDay.date}
            </span>
          )}
        </div>

        {/* Dynamic Reader Canvas rendering the full lesson description markups */}
        <div 
          className="prose prose-sm max-w-none text-slate-700 leading-relaxed font-medium 
            prose-headings:font-black prose-headings:text-slate-900 prose-p:mb-3 prose-strong:text-blue-700"
          dangerouslySetInnerHTML={{ __html: currentDay.htmlContent }}
        />
      </div>
    </div>
  );
}
