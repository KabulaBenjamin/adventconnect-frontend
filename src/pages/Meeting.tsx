import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  MessageSquare, Hand, Smile, X, Send, FileText, Circle, Users, Check, AlertCircle, Maximize2, Minimize2, UserCheck, ShieldAlert, Share2, FolderOpen, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { exportSermonArchive } from '../utils/archiveService';

const Meeting = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);

  const [knockStatus, setKnockStatus] = useState<'idle' | 'pending' | 'approved' | 'rejected'>('idle');
  const [knockMessage, setKnockMessage] = useState('');
  const [knockingUsers, setKnockingUsers] = useState<any[]>([]);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [meetingTitle, setMeetingTitle] = useState<string>('Live Gathering');

  const [activeParticipants, setActiveParticipants] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);

  const [showChat, setShowChat] = useState(false);
  const [showApprovals, setShowApprovals] = useState(false);
  const [showPeople, setShowPeople] = useState(false);
  const [showEmojiTray, setShowEmojiTray] = useState(false);
  const [isCinematic, setIsCinematic] = useState(false);

  const [showResources, setShowResources] = useState(false);
  const [libraryTab, setLibraryTab] = useState<'hymns' | 'lessons' | 'books'>('hymns');
  const [libraryItems, setLibraryItems] = useState<any[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [reactions, setReactions] = useState<{id: number, type: string}[]>([]);
  const [seconds, setSeconds] = useState(0);

  const socketRef = useRef<Socket | null>(null);

  // 1. Verify Authorization Credentials and Authority via Backend API
  useEffect(() => {
    const verifyRoomAuthority = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`https://adventconnect-7jfq.onrender.com/api/meetings/verify/${roomId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setIsHost(data.isHost);
          setMeetingTitle(data.title || 'Live Gathering');
          
          if (data.isHost) {
            setKnockStatus('approved');
          }
        } else {
          setKnockStatus('rejected');
          setKnockMessage('Unauthorized room entry credentials.');
        }
      } catch (err) {
        console.error("Authority evaluation error:", err);
        setKnockStatus('rejected');
      }
    };
    if (roomId) verifyRoomAuthority();
  }, [roomId]);

  // 2. Real-time Socket Handshake Lifecycle Connection
  useEffect(() => {
    socketRef.current = io('https://adventconnect-7jfq.onrender.com');

    if (roomId && user) {
      socketRef.current.emit('knock_room', { roomId, user });
    }

    socketRef.current.on('knock_status', ({ status, message }) => {
      setKnockStatus(status);
      if (message) setKnockMessage(message);
      if (status === 'approved') {
        socketRef.current?.emit('join_meeting', roomId);
      }
    });

    socketRef.current.on('user_knocking', (knocker) => {
      setKnockingUsers(prev => [...prev, knocker]);
    });

    socketRef.current.on('update_room_roster', (rosterList: any[]) => {
      setActiveParticipants(rosterList || []);
    });

    socketRef.current.on('load_chat_history', (historyLogs: any[]) => {
      setMessages(historyLogs);
    });

    socketRef.current.on('receive_meeting_chat', (msg: any) => {
      setMessages(prev => [...prev, msg]);
    });

    socketRef.current.on('receive_reaction', ({ emoji, id }: any) => {
      setReactions(prev => [...prev, { id, type: emoji }]);
      setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 3000);
    });

    const timer = setInterval(() => setSeconds(s => s + 1), 1000);

    return () => {
      socketRef.current?.disconnect();
      clearInterval(timer);
      if (jitsiApiRef.current) jitsiApiRef.current.dispose();
    };
  }, [roomId, user]);

  // 3. Inject Jitsi Session cleanly inside container upon Approval
  useEffect(() => {
    if (knockStatus === 'approved') {
      if (!window.hasOwnProperty('JitsiMeetExternalAPI')) {
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => initJitsiSession(isHost);
        document.body.appendChild(script);
      } else {
        initJitsiSession(isHost);
      }
    }
    return () => {
      if (jitsiApiRef.current) jitsiApiRef.current.dispose();
    };
  }, [knockStatus, isHost]);

  const initJitsiSession = (hostFlag: boolean) => {
    if (!jitsiContainerRef.current || !roomId) return;
    if (jitsiApiRef.current) jitsiApiRef.current.dispose();

    const cleanRoomId = roomId.trim().toLowerCase();
    const domain = 'meet.jit.si';

    jitsiApiRef.current = new (window as any).JitsiMeetExternalAPI(domain, {
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
          disableKick: !hostFlag,
          disableGrantModerator: !hostFlag
        },
        disableRemoteMute: !hostFlag,
        hideModeratorRightsButton: !hostFlag
      },
      interfaceConfigOverwrite: {
        AUDIO_LEVEL_PRIMARY_COLOR: 'rgba(59, 130, 246, 1)',
        DEFAULT_BACKGROUND: '#0a0a0a',
        SHOW_JITSI_WATERMARK: false
      }
    });
  };

  const fetchLibraryData = async () => {
    setLoadingLibrary(true);
    try {
      let url = 'https://adventconnect-7jfq.onrender.com/api/library/hymns';
      if (libraryTab === 'lessons') url = 'https://adventconnect-7jfq.onrender.com/api/library/devotional/lesson';
      if (libraryTab === 'books') url = 'https://adventconnect-7jfq.onrender.com/api/library/egw-search';

      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLibraryItems(Array.isArray(data) ? data : data.results || data.lessons || []);
    } catch (err) {
      console.error("Failed loading library data:", err);
      setLibraryItems([]);
    }
    setLoadingLibrary(false);
  };

  useEffect(() => {
    if (showResources) fetchLibraryData();
  }, [libraryTab, showResources]);

  const handleAcceptUser = (targetSocketId: string, targetUserId: string) => {
    socketRef.current?.emit('accept_knock', { roomId, targetSocketId, targetUserId });
    setKnockingUsers(prev => prev.filter(u => u.userId !== targetUserId));
  };

  const handleRejectUser = (targetSocketId: string, targetUserId: string) => {
    socketRef.current?.emit('reject_knock', { roomId, targetSocketId, targetUserId });
    setKnockingUsers(prev => prev.filter(u => u.userId !== targetUserId));
  };

  const sendMessage = () => {
    if (!inputText.trim()) return;
    socketRef.current?.emit('send_meeting_chat', { roomId, text: inputText, sender: user?.username, time: new Date() });
    setInputText('');
  };

  const shareResourceToChat = (item: any) => {
    const title = item.title || item.name || item.titleNo || 'Library Asset';
    socketRef.current?.emit('send_meeting_chat', {
      roomId,
      text: `📚 [SHARED RESOURCE] Open Resource: "${title}" (${item.author || item.category || 'Vault Asset'})`,
      sender: user?.username,
      time: new Date()
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
          content: `🎥 **Live Gathering Session**\n\nWe are currently gathered in fellowship for **${meetingTitle}**! Join directly:\n\n👉 ${window.location.origin}/meeting/${roomId}`,
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

  const triggerReaction = (emoji: string) => {
    const id = Date.now();
    socketRef.current?.emit('send_reaction', { roomId, emoji, id });
    setShowEmojiTray(false);
  };

  const openSidebar = (panel: 'chat' | 'approvals' | 'people' | 'resources') => {
    setShowChat(panel === 'chat' ? !showChat : false);
    setShowApprovals(panel === 'approvals' ? !showApprovals : false);
    setShowPeople(panel === 'people' ? !showPeople : false);
    setShowResources(panel === 'resources' ? !showResources : false);
  };

  if (knockStatus === 'pending') {
    return (
      <div className="w-full h-[calc(100vh-64px)] bg-[#0a0a0a] flex flex-col items-center justify-center text-white p-6">
        <div className="max-w-md w-full bg-[#121212] border border-zinc-900 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-blue-600/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto animate-pulse border border-blue-500/20">
            <Users size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold tracking-wide">Knocking on Gathering Gate...</h3>
            <p className="text-xs text-zinc-500">Waiting for host approval into room <span className="text-blue-400 font-mono font-bold">{roomId}</span>.</p>
          </div>
          <button onClick={() => navigate('/meetings')} className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold cursor-pointer transition">Cancel and Return</button>
        </div>
      </div>
    );
  }

  if (knockStatus === 'rejected') {
    return (
      <div className="w-full h-[calc(100vh-64px)] bg-[#0a0a0a] flex flex-col items-center justify-center text-white p-6">
        <div className="max-w-md w-full bg-[#121212] border border-red-500/10 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-red-600/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20">
            <AlertCircle size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold tracking-wide text-red-400">Access Denied</h3>
            <p className="text-xs text-zinc-500">{knockMessage || "You cannot enter this room at this time."}</p>
          </div>
          <button onClick={() => navigate('/meetings')} className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold cursor-pointer transition">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-64px)] bg-[#0a0a0a] text-white flex flex-col overflow-hidden relative font-sans antialiased">
      {/* Upper Control Bar */}
      <div className={`px-6 flex items-center justify-between bg-[#121212] border-b border-zinc-900 z-20 transition-all duration-300 ${isCinematic ? 'h-0 opacity-0 pointer-events-none overflow-hidden' : 'h-16'}`}>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/meetings')} className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xs font-bold tracking-wide uppercase">{meetingTitle}</h1>
            <p className="text-[10px] text-blue-400 font-bold tracking-wider">ROOM INDEX: {roomId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleShareToFeed} disabled={shareStatus === 'broadcasting'} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl transition text-[10px] font-bold uppercase cursor-pointer disabled:bg-zinc-800">
            <Share2 size={12} /> {shareStatus === 'broadcasting' ? 'Posting...' : shareStatus === 'success' ? 'Shared!' : 'Share to Feed'}
          </button>
          {isHost && knockingUsers.length > 0 && (
            <button onClick={() => openSidebar('approvals')} className="flex items-center gap-1.5 bg-amber-500 text-black px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase animate-pulse cursor-pointer">
              <Users size={12} /> Requests ({knockingUsers.length})
            </button>
          )}
          <button onClick={() => exportSermonArchive(meetingTitle, messages, user?.username || 'Guest')} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl transition text-[10px] font-bold uppercase cursor-pointer">
            <FileText size={12} /> Archive PDF
          </button>
        </div>
      </div>

      {/* Main Stream Area */}
      <div className="flex-1 flex overflow-hidden relative bg-[#0a0a0a]">
        <div className="absolute bottom-24 right-10 z-[100] flex flex-col gap-4 pointer-events-none">
          {reactions.map(r => <div key={r.id} className="text-5xl animate-bounce">{r.type}</div>)}
        </div>
        
        <button onClick={() => setIsCinematic(!isCinematic)} className="absolute top-6 right-6 z-40 p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white backdrop-blur-md transition cursor-pointer">
          {isCinematic ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>

        {/* Embedded Jitsi Stream Window */}
        <div className="flex-1 p-4 flex flex-col relative z-10 bg-black">
          <div ref={jitsiContainerRef} className={`w-full h-full ${isCinematic ? 'rounded-none' : 'rounded-2xl border border-zinc-900 overflow-hidden'}`} allow="camera; microphone; display-capture; geolocation; speaker" />
        </div>

        {/* Directory Sidebar */}
        {showPeople && (
          <div className="w-72 bg-[#121212] border-l border-zinc-900 flex flex-col z-20">
            <div className="p-4 border-b border-zinc-900 flex justify-between items-center text-[10px] text-zinc-500 uppercase font-bold">
              Directory ({activeParticipants.length || 1}) <button onClick={() => setShowPeople(false)} className="cursor-pointer"><X size={16}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {activeParticipants.map((p, i) => (
                <div key={i} className="flex items-center gap-2.5 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/40">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">{p.username?.[0].toUpperCase()}</div>
                  <div className="flex-1 min-w-0"><p className="text-xs font-semibold truncate">{p.username}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gate Entry Approvals Sidebar */}
        {showApprovals && knockingUsers.length > 0 && (
          <div className="w-72 bg-[#121212] border-l border-zinc-900 flex flex-col z-20">
            <div className="p-4 border-b border-zinc-900 flex justify-between items-center text-[10px] text-amber-400 uppercase font-bold">
              Queue <button onClick={() => setShowApprovals(false)} className="cursor-pointer"><X size={16}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {knockingUsers.map((u, i) => (
                <div key={i} className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 flex items-center justify-between gap-2">
                  <p className="text-xs font-bold truncate">{u.username}</p>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => handleAcceptUser(u.socketId, u.userId)} className="p-1.5 bg-emerald-600 rounded-lg cursor-pointer"><Check size={12}/></button>
                    <button onClick={() => handleRejectUser(u.socketId, u.userId)} className="p-1.5 bg-zinc-800 rounded-lg cursor-pointer"><X size={12}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sync Chat Logs Sidebar */}
        {showChat && (
          <div className="w-72 bg-[#121212] border-l border-zinc-900 flex flex-col z-20">
            <div className="p-4 border-b border-zinc-900 flex justify-between items-center text-[10px] text-blue-400 uppercase font-bold">
              Chat <button onClick={() => setShowChat(false)} className="cursor-pointer"><X size={16}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {messages.map((m, i) => (
                <div key={i} className="bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800/50">
                  <p className="text-[9px] font-bold text-blue-400 uppercase">{m.sender}</p>
                  <p className="text-xs text-zinc-200 break-words">{m.text}</p>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-zinc-900 flex gap-1.5">
              <input value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 text-xs text-white focus:outline-none" placeholder="Type a message..." />
              <button onClick={sendMessage} className="bg-blue-600 p-2 rounded-xl cursor-pointer"><Send size={14}/></button>
            </div>
          </div>
        )}

        {/* Resources Vault Sidebar */}
        {showResources && (
          <div className="w-72 bg-[#121212] border-l border-zinc-900 flex flex-col z-20">
            <div className="p-4 border-b border-zinc-900 flex justify-between items-center text-[10px] text-emerald-400 uppercase font-bold">
              Vault <button onClick={() => setShowResources(false)} className="cursor-pointer"><X size={16}/></button>
            </div>
            <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 mx-3 mt-3 rounded-xl border border-zinc-900 text-[9px] font-black uppercase">
              <button onClick={() => setLibraryTab('hymns')} className={`py-2 rounded-lg transition text-center ${libraryTab === 'hymns' ? 'bg-blue-600 text-white' : 'text-zinc-500'}`}>Hymns</button>
              <button onClick={() => setLibraryTab('lessons')} className={`py-2 rounded-lg transition text-center ${libraryTab === 'lessons' ? 'bg-blue-600 text-white' : 'text-zinc-500'}`}>Lessons</button>
              <button onClick={() => setLibraryTab('books')} className={`py-2 rounded-lg transition text-center ${libraryTab === 'books' ? 'bg-blue-600 text-white' : 'text-zinc-500'}`}>Books</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loadingLibrary ? (
                <div className="text-center py-12 text-xs text-zinc-600">Loading...</div>
              ) : (
                libraryItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl flex flex-col gap-2">
                    <p className="text-zinc-200 font-bold text-xs line-clamp-2">{item.title || item.name || 'Asset'}</p>
                    <button onClick={() => shareResourceToChat(item)} className="w-full bg-blue-600 text-white font-black text-[9px] uppercase py-1.5 rounded-lg cursor-pointer">Share</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Media Overlay Controller Row */}
      <div className={`flex items-center justify-center bg-[#0a0a0a] border-t border-zinc-900/60 z-20 transition-all duration-300 ${isCinematic ? 'h-0 opacity-0 pointer-events-none overflow-hidden' : 'h-24'}`}>
        <div className="flex items-center gap-2 px-6 py-3 rounded-2xl">
          <button onClick={() => setIsHandRaised(!isHandRaised)} className={`w-11 h-11 rounded-xl flex items-center justify-center cursor-pointer ${isHandRaised ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-zinc-900 text-zinc-400'}`}><Hand size={18}/></button>
          <button onClick={() => setShowEmojiTray(!showEmojiTray)} className={`w-11 h-11 rounded-xl flex items-center justify-center cursor-pointer ${showEmojiTray ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400'}`}><Smile size={18}/></button>
          {showEmojiTray && (
            <div className="absolute bottom-24 bg-zinc-900 border border-zinc-800 p-2 rounded-xl flex gap-2 z-50">
              {['👍', '👏', '🙏', '❤️', '😮'].map(e => <button key={e} onClick={() => triggerReaction(e)} className="text-xl hover:scale-125 transition cursor-pointer">{e}</button>)}
            </div>
          )}
          <div className="w-[1px] h-6 bg-zinc-900 mx-1" />
          <button onClick={() => openSidebar('chat')} className={`w-11 h-11 rounded-xl flex items-center justify-center cursor-pointer ${showChat ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400'}`}><MessageSquare size={18}/></button>
          <button onClick={() => openSidebar('people')} className={`w-11 h-11 rounded-xl flex items-center justify-center cursor-pointer ${showPeople ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400'}`}><Users size={18}/></button>
          <button onClick={() => openSidebar('resources')} className={`w-11 h-11 rounded-xl flex items-center justify-center cursor-pointer ${showResources ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400'}`}><FolderOpen size={18}/></button>
          <button onClick={() => navigate('/meetings')} className="w-11 h-11 rounded-xl bg-red-600 text-white hover:bg-red-500 flex items-center justify-center cursor-pointer transition ml-4"><PhoneOff size={18}/></button>
        </div>
      </div>
    </div>
  );
};

export default Meeting;
