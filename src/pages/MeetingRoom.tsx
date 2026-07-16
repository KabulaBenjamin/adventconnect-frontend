import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, FolderOpen, ShieldAlert, BookOpen, Music, BookMarked } from 'lucide-react';

export default function MeetingRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);

  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [showResources, setShowResources] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [meetingTitle, setMeetingTitle] = useState<string>('Live Gathering');

  const [libraryTab, setLibraryTab] = useState<'hymns' | 'lessons' | 'books'>('hymns');
  const [libraryItems, setLibraryItems] = useState<any[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);

  // Dynamically determine the active port context so sharing URLs are always flawless
  const currentFrontendOrigin = window.location.origin;

  useEffect(() => {
    const verifyAndLoad = async () => {
      try {
        const token = localStorage.getItem('token');
        // Targets your exact backend process running on port 4000
        const res = await fetch(`https://adventconnect-7jfq.onrender.com/api/meetings/verify/${roomId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
          const data = await res.json();
          setRoomError(data.msg || 'Unauthorized Entry');
          return;
        }

        const data = await res.json();
        setMeetingTitle(data.title);

        if (!window.hasOwnProperty('JitsiMeetExternalAPI')) {
          const script = document.createElement('script');
          script.src = 'https://meet.jit.si/external_api.js';
          script.async = true;
          script.onload = () => initJitsiSession(data.isHost);
          document.body.appendChild(script);
        } else {
          initJitsiSession(data.isHost);
        }
      } catch (err) {
        setRoomError('Could not establish secure platform connection');
      }
    };

    if (roomId) verifyAndLoad();

    return () => {
      if (apiRef.current) apiRef.current.dispose();
    };
  }, [roomId]);

  const initJitsiSession = (isHost: boolean) => {
    if (!jitsiContainerRef.current || !roomId) return;
    if (apiRef.current) apiRef.current.dispose();

    const cleanRoomId = roomId.trim().toLowerCase();
    const domain = 'meet.jit.si';

    apiRef.current = new (window as any).JitsiMeetExternalAPI(domain, {
      roomName: `AdventConnect-FellowshipRoom-${cleanRoomId}`,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainerRef.current,
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        prejoinPageEnabled: false,
        enableWelcomePage: false,
        disableDeepLinking: true,
        remoteVideoMenu: {
          disableKick: !isHost,
          disableGrantModerator: !isHost
        },
        disableRemoteMute: !isHost,
        hideModeratorRightsButton: !isHost
      },
      interfaceConfigOverwrite: {
        AUDIO_LEVEL_PRIMARY_COLOR: 'rgba(59, 130, 246, 1)',
        DEFAULT_BACKGROUND: '#020617',
        SHOW_JITSI_WATERMARK: false
      }
    });
  };

  const handleShareToFeed = async () => {
    try {
      setShareStatus('broadcasting');
      const token = localStorage.getItem('token');
      const response = await fetch('https://adventconnect-7jfq.onrender.com/api/meetings/share-feed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: `🎥 **Live Gathering Session**\n\nWe are currently gathered in fellowship for **${meetingTitle}**! Click below to join directly:\n\n👉 ${currentFrontendOrigin}/meeting/${roomId}`,
          scope: 'global'
        })
      });
      if (!response.ok) throw new Error();
      setShareStatus('success');
      setTimeout(() => setShareStatus(null), 4000);
    } catch (err) {
      setShareStatus('error');
      setTimeout(() => setShareStatus(null), 4000);
    }
  };

  if (roomError) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md shadow-2xl flex flex-col items-center gap-4">
          <ShieldAlert size={48} className="text-rose-500 animate-pulse" />
          <h2 className="text-white font-black text-lg uppercase tracking-wide">Access Restricted</h2>
          <p className="text-slate-400 text-sm leading-relaxed">{roomError}</p>
          <button onClick={() => navigate('/meetings')} className="mt-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden text-left">
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/meetings')} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-white font-black text-sm tracking-wide uppercase">{meetingTitle}</h1>
            <p className="text-xs text-blue-400 font-bold tracking-wider">ROOM INDEX: {roomId}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleShareToFeed} disabled={shareStatus === 'broadcasting'} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-800 text-white font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer">
            <Share2 size={14} />
            {shareStatus === 'broadcasting' ? 'Posting...' : shareStatus === 'success' ? 'Shared!' : 'Share to Feed'}
          </button>
          <button onClick={() => setShowResources(!showResources)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer">
            <FolderOpen size={14} />
            Library & Devotion
          </button>
        </div>
      </div>

      <div className="flex flex-1 relative overflow-hidden">
        <div className="flex-1 h-full relative bg-black">
          <div ref={jitsiContainerRef} className="w-full h-full" allow="camera; microphone; display-capture; geolocation; speaker" />
        </div>
      </div>
    </div>
  );
}
