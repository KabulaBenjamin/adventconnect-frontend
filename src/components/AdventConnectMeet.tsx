import React, { useEffect, useState, useRef } from 'react';
import { BookOpen, Music, Vote, Video, Users, CheckCircle } from 'lucide-react';
import SabbathSchoolLesson from './SabbathSchoolLesson';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export default function AdventConnectMeet({ roomId = "SabbathSchool", user }: { roomId?: string, user?: any }) {
  const meetContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null); // Dynamic reference pointer to prevent stale closure hooks
  const [activeSidebar, setActiveSidebar] = useState<'none' | 'lesson' | 'hymnal' | 'vote'>('none');

  // Voting Poll State
  const [pollVoted, setPollVoted] = useState(false);
  const [pollResults, setPollResults] = useState({ yes: 14, no: 2 });

  const initMeeting = async () => {
    try {
      const res = await fetch(`https://adventconnect-7jfq.onrender.com/api/library/meet/session?roomId=${roomId}`);
      const data = await res.json();

      if (meetContainerRef.current && window.JitsiMeetExternalAPI) {
        const api = new window.JitsiMeetExternalAPI(data.domain, {
          roomName: data.roomName,
          width: '100%',
          height: '100%',
          parentNode: meetContainerRef.current,
          configOverwrite: data.configOverwrite,
          interfaceConfigOverwrite: data.interfaceConfigOverwrite,
          userInfo: {
            displayName: user?.name || "Church Member"
          }
        });
        jitsiApiRef.current = api;
      }
    } catch (err) {
      console.error("Failed launching AdventConnect Meet Engine:", err);
    }
  };

  useEffect(() => {
    // Dynamically inject Jitsi External API Script
    const script = document.createElement('script');
    script.src = "https://meet.jit.si/external_api.js";
    script.async = true;
    script.onload = () => initMeeting();
    document.body.appendChild(script);

    return () => {
      // Safely access current memory pointer during unmounting phase
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }
      script.remove();
    };
  }, [roomId]); // Dependencies trace structural room shifts cleanly

  const castVote = (type: 'yes' | 'no') => {
    setPollResults(prev => ({ ...prev, [type]: prev[type] + 1 }));
    setPollVoted(true);
  };

  return (
    <div className="w-full h-[calc(100vh-80px)] bg-slate-900 rounded-2xl overflow-hidden flex flex-col border border-slate-800 shadow-2xl">

      {/* Upper Control Strip */}
      <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-sm font-black tracking-wide uppercase">AdventConnect Meet Rooms</h2>
        </div>

        {/* Custom Adventist Integration Hotkeys */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSidebar(activeSidebar === 'lesson' ? 'none' : 'lesson')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition ${activeSidebar === 'lesson' ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
          >
            <BookOpen size={14} /> Split Study Guide
          </button>

          <button
            onClick={() => setActiveSidebar(activeSidebar === 'hymnal' ? 'none' : 'hymnal')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition ${activeSidebar === 'hymnal' ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
          >
            <Music size={14} /> Shared Hymnal
          </button>

          <button
            onClick={() => setActiveSidebar(activeSidebar === 'vote' ? 'none' : 'vote')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition ${activeSidebar === 'vote' ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
          >
            <Vote size={14} /> Board Vote
          </button>
        </div>
      </div>

      {/* Main Layout Split-Canvas Window */}
      <div className="flex-1 flex overflow-hidden w-full relative">

        {/* Left Side: Video Stream Window Frame */}
        <div className="flex-1 h-full bg-slate-950" ref={meetContainerRef} />

        {/* Right Side: Smart Interactive Slide-Out Panels */}
        {activeSidebar !== 'none' && (
          <div className="w-96 h-full bg-white border-l border-slate-200 overflow-y-auto flex flex-col animate-in slide-in-from-right duration-200 z-10">

            {/* Panel Title Strip */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                {activeSidebar === 'lesson' && <><BookOpen size={14} className="text-blue-600" /> Lesson Study Pane</>}
                {activeSidebar === 'hymnal' && <><Music size={14} className="text-blue-600" /> Chorister Hymnal Desk</>}
                {activeSidebar === 'vote' && <><Vote size={14} className="text-blue-600" /> Secure Board Ballot</>}
              </span>
              <button onClick={() => setActiveSidebar('none')} className="text-xs font-bold text-slate-400 hover:text-slate-600">Hide Panel</button>
            </div>

            {/* Panel Dynamic Internal Layout Components */}
            <div className="p-4 flex-1">

              {/* Option A: Live Split-Screen Sabbath School Lesson */}
              {activeSidebar === 'lesson' && (
                <div className="zoom-lesson-container text-xs scale-95 origin-top">
                  <SabbathSchoolLesson />
                </div>
              )}

              {/* Option B: Synchronized Church Hymnal Audio Panel */}
              {activeSidebar === 'hymnal' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 font-medium">Select a hymn to broadcast lyrics and instrumentals instantly to the room.</p>
                  <input
                    type="text"
                    placeholder="Search Hymn Number or Title..."
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  />
                  <div className="border border-slate-100 rounded-xl divide-y divide-slate-50">
                    <div className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>Hymn 341 - To God Be the Glory</span>
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md">Queue Track</span>
                    </div>
                    <div className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>Hymn 100 - Great Is Thy Faithfulness</span>
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md">Queue Track</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Option C: Church Board & Business Session Polling Window */}
              {activeSidebar === 'vote' && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                    <h4 className="text-xs font-black text-slate-800 leading-snug mb-2">
                      Motion: To accept the proposed Q3 evangelistic budget allocations.
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium mb-3">Organized by: Church Board Executive Committee</p>

                    {!pollVoted ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => castVote('yes')}
                          className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-black text-xs hover:bg-emerald-700 transition"
                        >
                          Accept (Yes)
                        </button>
                        <button
                          onClick={() => castVote('no')}
                          className="flex-1 py-2 bg-rose-600 text-white rounded-lg font-black text-xs hover:bg-rose-700 transition"
                        >
                          Reject (No)
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 mb-1">
                          <CheckCircle size={14} /> Vote Cast Safely
                        </div>
                        <div className="text-[11px] font-bold text-slate-600 space-y-1">
                          <div className="flex justify-between">
                            <span>Total Accepted (Yes):</span>
                            <span>{pollResults.yes} votes</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Rejected (No):</span>
                            <span>{pollResults.no} votes</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
