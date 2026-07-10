import { useState } from "react";
import { useLocation } from "react-router-dom";
import { BookOpen, Music, Compass, Bookmark, Globe } from "lucide-react";
import SabbathSchoolLesson from "./SabbathSchoolLesson";
import BibleSection from "./BibleSection";
import HymnalSection from "./HymnalSection";
import EgwSection from "./EgwSection";
import BookRepositorySection from "./BookRepositorySection";
import MissionReadingSection from "./MissionReadingSection";

const SectionTab = ({ icon: Icon, label, active, onClick }: any) => (
  <button onClick={onClick}
    className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-bold tracking-tight transition-all duration-200
      ${active ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100/70 hover:text-blue-600"}`}>
    <Icon size={14} className="shrink-0" />
    <span className="truncate">{label}</span>
  </button>
);

const SECTIONS = [
  { id: "sabbath_school", label: "Sabbath School", icon: BookOpen },
  { id: "mission_readings", label: "Mission Readings", icon: Globe },
  { id: "bible", label: "Bible Module", icon: BookOpen },
  { id: "hymnal", label: "Hymnal Module", icon: Music },
  { id: "egw_writings", label: "EGW Writings", icon: Compass },
  { id: "book_repository", label: "Book Repository", icon: Bookmark },
];

export default function SanctuaryLibrary() {
  const location = useLocation();
  const [active, setActive] = useState("sabbath_school");
  const isCompact = location.pathname !== "/library";

  if (isCompact) {
    return (
      <div className="w-full space-y-3">
        <div className="flex items-center gap-1 bg-slate-100/60 p-1 rounded-xl border border-slate-200/40 overflow-x-auto max-w-full scrollbar-none">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActive(s.id)} className={`flex-1 py-1.5 px-3 text-center rounded-lg font-black text-[9px] uppercase tracking-wider shrink-0 transition-all ${active === s.id ? "bg-white text-blue-600 shadow-2xs" : "text-slate-400"}`}>
              {s.label.split(" ")[0]}
            </button>
          ))}
        </div>
        <div className="w-full">
          {active === "sabbath_school" && <SabbathSchoolLesson />}
          {active === "mission_readings" && <MissionReadingSection />}
          {active === "bible" && <BibleSection isCompact={true} />}
          {active === "hymnal" && <HymnalSection isCompact={true} />}
          {active === "egw_writings" && <EgwSection />}
          {active === "book_repository" && <BookRepositorySection />}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white/70 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white shadow-xs min-h-[calc(100vh-120px)]">
      <header className="mb-6 border-b border-slate-100 pb-4">
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Sanctuary Library</h1>
        <p className="text-xs font-medium text-slate-400 mt-0.5">Explore devotions, history volumes, and scripture modules.</p>
      </header>

      <div className="w-full flex flex-col lg:flex-row gap-6 items-start">
        <aside className="w-full lg:w-56 shrink-0 space-y-1 bg-slate-100/40 p-2 rounded-2xl border border-slate-200/30">
          {SECTIONS.map(s => (
            <SectionTab key={s.id} icon={s.icon} label={s.label} active={active === s.id} onClick={() => setActive(s.id)} />
          ))}
        </aside>

        <main className="flex-1 w-full bg-white/50 rounded-2xl p-5 border border-slate-200/30 min-h-[450px]">
          {active === "sabbath_school" && <SabbathSchoolLesson />}
          {active === "mission_readings" && <MissionReadingSection />}
          {active === "bible" && <BibleSection isCompact={false} />}
          {active === "hymnal" && <HymnalSection isCompact={false} />}
          {active === "egw_writings" && <EgwSection />}
          {active === "book_repository" && <BookRepositorySection />}
        </main>
      </div>
    </div>
  );
}
