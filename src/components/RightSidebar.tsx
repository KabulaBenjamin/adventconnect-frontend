import React, { useState } from 'react';
import { Compass, Calendar, ArrowUpRight, Sliders, ShieldCheck } from 'lucide-react';
import FriendRequests from './FriendRequests';

export default function RightSidebar() {
  const [engineActive, setEngineActive] = useState(true);

  // Clean event timeline mirroring our design target
  const upcomingEvents = [
    { id: 1, title: 'Thursdays of Thriving Event', date: 'January 21, 2026' },
    { id: 2, title: 'Global Youth Devotion Day', date: 'June 18, 2026' },
  ];

  return (
    <div className="w-full space-y-4 sticky top-20 h-fit max-h-[calc(100vh-100px)] overflow-y-auto custom-scrollbar pr-1 pb-10 text-left select-none">
      
      {/* 🧠 HIGHTECH RADAR CAPSULE */}
      <div className="bg-white/70 backdrop-blur-md border border-white rounded-2xl p-4 text-center flex flex-col items-center shadow-2xs">
        <button
          type="button"
          onClick={() => setEngineActive(!engineActive)}
          className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 transition-all duration-300 border cursor-pointer ${
            engineActive 
              ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-600' 
              : 'bg-slate-100 border-slate-200 text-slate-400'
          }`}
        >
          <Compass size={18} className={engineActive ? "animate-spin" : ""} style={{ animationDuration: '25s' }} />
        </button>
        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wide">
          {engineActive ? 'Self-Levitating Active Engine' : 'Engine Idle State'}
        </h4>
      </div>

      {/* 🔔 LIVE REQ INTERCEPTOR */}
      <FriendRequests />

      {/* 📅 REPLACEMENT: UPCOMING UTILITY TIMELINE */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white shadow-xs p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100/80 pb-2">
          <div className="flex items-center gap-2 text-slate-800">
            <Calendar size={13} className="text-blue-600" />
            <h3 className="font-black text-slate-800 text-[10px] uppercase tracking-wider">Upcoming Events</h3>
          </div>
          <button className="text-[9px] font-bold text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer">
            View All <ArrowUpRight size={10} />
          </button>
        </div>

        <div className="space-y-2.5">
          {upcomingEvents.map((event) => (
            <div key={event.id} className="p-2.5 bg-slate-50/50 hover:bg-white rounded-xl border border-slate-100/50 transition group">
              <span className="text-[9px] font-mono font-bold text-slate-400 block">{event.date}</span>
              <h5 className="text-xs font-bold text-slate-700 mt-0.5 group-hover:text-blue-600 transition truncate">
                {event.title}
              </h5>
            </div>
          ))}
        </div>
      </div>

      {/* ⚙️ ENGINE MONITOR FOOTER */}
      <div className="p-3 bg-slate-50/40 rounded-xl border border-slate-100/60 flex items-center justify-between text-[9px] font-mono font-bold text-slate-400">
        <div className="flex items-center gap-1">
          <Sliders size={11} className="text-slate-400" />
          <span>Layout Workspace</span>
        </div>
        <span className="text-[8px] bg-slate-200/60 px-1.5 py-0.5 rounded-md text-slate-500">v2.4.0</span>
      </div>

    </div>
  );
}
