import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Peer } from 'peerjs';
import { useAuth } from '../context/AuthContext.js';
import { apiFetch } from '../lib/api.js';
import { useNavigate } from 'react-router-dom';
import {
  Send, Smile, PhoneOff, Info, Video, Search, Users, Image as ImageIcon
} from 'lucide-react';

// Safe imports for emoji-picker-react v4+
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';

// Ready-to-use vector sticker assets library
const STICKERS = [
  { id: 'stk1', name: 'Blessed', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f64f/512.webp' },
  { id: 'stk2', name: 'Shine', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/2728/512.webp' },
  { id: 'stk3', name: 'Joyful', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60a/512.webp' },
  { id: 'stk4', name: 'Heart', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/512.webp' },
  { id: 'stk5', name: 'Fire', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.webp' },
  { id: 'stk6', name: 'Celebrate', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.webp' }
];

const REACTION_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface Reaction {
  userId: string;
  emoji: string;
}

interface Message {
  _id?: string;
  tempId?: string;
  sender?: any; // String ID or populated object
  senderId?: string;
  recipient?: string;
  receiverId?: string;
  text: string;
  mediaUrl?: string;
  messageType: 'text' | 'sticker';
  reactions?: Reaction[];
  createdAt?: string;
  timestamp?: string;
}

interface UserProfile {
  _id: string;
  username: string;
  localChurch?: string;
}

const Messages: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [connectedFriends, setConnectedFriends] = useState<UserProfile[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]); // Dynamic presence

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Call States
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'incoming' | 'active'>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<Peer | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Safely extract own ID from dynamic user object structure
  const myId = user?._id ? String(user._id) : (user?.id ? String(user.id) : '');

  // Computed presence check
  const isSelectedUserOnline = selectedUser ? onlineUsers.includes(selectedUser._id) : false;

  // Safe Helper: Format timestamps without throwing runtime crashes
  const formatMessageTime = (msg: Message): string => {
    if (msg.timestamp) return msg.timestamp;
    if (!msg.createdAt) return '';
    try {
      const parsedDate = new Date(msg.createdAt);
      if (isNaN(parsedDate.getTime())) return '';
      return parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (!myId) return;

    socketRef.current = io('http://localhost:4000');
    socketRef.current.emit('register', myId);

    // Listen for real-time presence lists
    socketRef.current.on('online_users', (usersList: string[]) => {
      setOnlineUsers(usersList);
    });

    let peer: Peer | null = null;
    try {
      const envHost = (import.meta as any).env?.VITE_PEER_HOST as string | undefined;
      const envPort = (import.meta as any).env?.VITE_PEER_PORT as string | undefined;
      const envPath = (import.meta as any).env?.VITE_PEER_PATH as string | undefined;

      const peerHost = envHost || '0.peerjs.com';
      const peerPort = envPort ? parseInt(envPort, 10) : 443;
      const peerPath = envPath || '/';
      const isSecure = envHost ? (import.meta as any).env?.DEV === false : true;

      peer = new Peer(myId, {
        host: peerHost,
        port: peerPort,
        path: peerPath,
        secure: isSecure
      });
      peerRef.current = peer;

      peer.on('open', (id) => {
        console.log(`PeerJS Client linked successfully under user: ${id}`);
      });

      peer.on('error', (err) => {
        console.warn("⚠️ PeerJS client encountered a routing issue. Call capabilities disabled.", err.message);
      });

      peer.on('call', (call) => {
        setCallStatus('incoming');
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
          setLocalStream(stream);
          call.answer(stream);
          call.on('stream', (userRemoteStream) => {
            setRemoteStream(userRemoteStream);
            setCallStatus('active');
          });
        });
      });
    } catch (err) {
      console.warn("❌ Could not bind PeerJS client framework:", err);
    }

    fetchDirectory();

    return () => {
      socketRef.current?.disconnect();
      if (peer) {
        try {
          peer.destroy();
        } catch (destroyErr) {
          console.warn("Clean teardown bypass achieved", destroyErr);
        }
      }
      localStream?.getTracks().forEach(t => t.stop());
    };
  }, [myId]);

  // Real-time listener for incoming messages, reactions, and read receipts
  useEffect(() => {
    if (!socketRef.current) return;

    socketRef.current.off('receive_message');
    socketRef.current.off('receive_reaction');

    socketRef.current.on('receive_message', (msg: Message) => {
      const msgSenderId = typeof msg.sender === 'object' ? msg.sender?._id : (msg.senderId || msg.sender);
      const msgReceiverId = typeof msg.recipient === 'object' ? msg.recipient?._id : (msg.receiverId || msg.recipient);

      if (selectedUser && (String(msgSenderId) === String(selectedUser._id) || String(msgReceiverId) === String(selectedUser._id))) {
        setMessages((prev) => [...prev, msg]);
        triggerMarkAsRead();
      }
    });

    socketRef.current.on('receive_reaction', (reactionData: { messageId: string; reactions: Reaction[] }) => {
      setMessages((prev) =>
        prev.map((m) => {
          const mId = m._id || m.tempId;
          if (mId === reactionData.messageId) {
            return { ...m, reactions: reactionData.reactions || [] };
          }
          return m;
        })
      );
    });

    return () => {
      socketRef.current?.off('receive_message');
      socketRef.current?.off('receive_reaction');
    };
  }, [selectedUser]);

  // Load chat logs on conversation select
  useEffect(() => {
    const fetchChatLogs = async () => {
      if (!selectedUser) return;
      try {
        const response = await apiFetch(`/messages/${selectedUser._id}?page=1&limit=20`);
        
        if (Array.isArray(response)) {
          setMessages(response);
          setHasMore(false);
        } else {
          setMessages(response.messages || []);
          setHasMore(response.pagination?.hasMore || false);
        }
        
        setCurrentPage(1);
        triggerMarkAsRead();
      } catch (err) {
        console.error("Failed loading chat history logs", err);
        setMessages([]);
      }
    };

    fetchChatLogs();
    setShowDetailsPanel(false);
  }, [selectedUser]);

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localStream, remoteStream, messages]);

  const triggerMarkAsRead = async () => {
    if (!selectedUser) return;
    try {
      await apiFetch(`/messages/read/${selectedUser._id}`, { method: 'PATCH' });
    } catch (err) {
      console.warn("Could not synchronize read receipts stack:", err);
    }
  };

  const loadMoreMessages = async () => {
    if (!selectedUser || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const response = await apiFetch(`/messages/${selectedUser._id}?page=${nextPage}&limit=20`);
      
      const newMessages = Array.isArray(response) ? response : (response.messages || []);
      const nextHasMore = Array.isArray(response) ? false : (response.pagination?.hasMore || false);

      if (newMessages.length > 0) {
        setMessages((prev) => [...newMessages, ...prev]);
        setCurrentPage(nextPage);
        setHasMore(nextHasMore);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed fetching paginated back-history logs:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const fetchDirectory = async () => {
    try {
      const data = await apiFetch('/users/chat-directory');
      setConnectedFriends(data.friends || []);
    } catch (err) {
      console.error("Failed to fetch chat directory data", err);
    }
  };

  const handleSendMessagePayload = async (payloadText: string, messageType: 'text' | 'sticker' = 'text', mediaUrl?: string) => {
    if (!selectedUser || !myId) return;

    const tempId = 'temp-' + Date.now();
    const msgData: Message = {
      _id: tempId,
      tempId: tempId,
      sender: myId,
      senderId: myId,
      recipient: selectedUser._id,
      receiverId: selectedUser._id,
      text: payloadText,
      mediaUrl: mediaUrl || '',
      messageType: messageType,
      reactions: [],
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, msgData]);

    try {
      const savedMsg = await apiFetch(`/messages/${selectedUser._id}`, {
        method: 'POST',
        body: JSON.stringify({
          text: payloadText,
          messageType: messageType,
          mediaUrl: mediaUrl
        })
      });

      setMessages((prev) => prev.map(m => m.tempId === tempId ? savedMsg : m));

      socketRef.current?.emit('send_message', {
        ...savedMsg,
        senderId: myId,
        receiverId: selectedUser._id
      });
    } catch (err) {
      console.error("Failed saving document item to DB stack", err);
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    handleSendMessagePayload(text.trim(), 'text');
    setText('');
    setShowEmoji(false);
  };

  const sendSticker = (url: string) => {
    handleSendMessagePayload('[Sticker]', 'sticker', url);
    setShowStickers(false);
  };

  const handleToggleReaction = async (message: Message, emoji: string) => {
    const messageId = message._id;
    if (!messageId || messageId.startsWith('temp-') || !selectedUser) return;

    try {
      const updatedReactions = await apiFetch(`/messages/reaction/${messageId}`, {
        method: 'POST',
        body: JSON.stringify({ emoji })
      });

      const resolvedReactions = Array.isArray(updatedReactions) 
        ? updatedReactions 
        : (updatedReactions?.reactions || []);

      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions: resolvedReactions } : m))
      );

      socketRef.current?.emit('message_reaction', {
        messageId,
        receiverId: selectedUser._id,
        reactions: resolvedReactions
      });
    } catch (err) {
      console.error("Failed changing reaction array fields", err);
    }
  };

  const initiateCall = async (userId: string) => {
    try {
      setCallStatus('calling');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);

      if (peerRef.current) {
        const call = peerRef.current.call(userId, stream);
        call?.on('stream', (userRemoteStream: MediaStream) => {
          setRemoteStream(userRemoteStream);
          setCallStatus('active');
        });
      } else {
        console.warn("Cannot call: Peer client server instance is not active.");
        setCallStatus('idle');
      }
    } catch (err) {
      console.error("Failed to establish video stream channels", err);
      setCallStatus('idle');
    }
  };

  const endCall = () => {
    localStream?.getTracks().forEach(t => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus('idle');
  };

  return (
    <div className="w-full h-screen bg-[#0a0a0a] text-white flex overflow-hidden font-sans antialiased">

      {/* VIDEO OVERLAY */}
      {callStatus !== 'idle' && (
        <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center p-6 animate-fade-in">
          <div className="relative w-full max-w-4xl h-[75vh] flex flex-col md:flex-row gap-4">
            <div className="flex-1 bg-black rounded-[32px] overflow-hidden border border-zinc-800 relative shadow-2xl">
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            </div>
            <div className="w-44 h-56 bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-700 shadow-2xl absolute bottom-6 right-6 z-10">
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
            </div>
          </div>
          <button onClick={endCall} className="mt-8 w-14 h-14 bg-rose-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg">
            <PhoneOff size={24} />
          </button>
        </div>
      )}

      {/* SIDEBAR */}
      <div className="w-80 bg-[#121212] border-r border-zinc-900 overflow-hidden hidden md:flex flex-col shrink-0">
        <div className="p-4 pt-5 pb-2">
          <h2 className="font-bold text-xl text-white tracking-tight">Messages</h2>
        </div>

        <div className="px-4 pb-4">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people..."
              className="w-full bg-zinc-800/60 text-white text-xs pl-9 pr-4 py-2 rounded-full border border-transparent focus:outline-none placeholder-zinc-500"
            />
          </div>
        </div>

        {/* MANAGED DIRECTORY FLOW */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 flex flex-col justify-between">
          <div className="space-y-5">
            <div>
              <div className="px-3 pb-1.5 flex justify-between items-center">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Connected Friends</span>
              </div>
              <div className="space-y-0.5">
                {connectedFriends.filter(u => u.username?.toLowerCase().includes(searchQuery.toLowerCase())).map(u => {
                  const isOnline = onlineUsers.includes(u._id);
                  return (
                    <div
                      key={u._id}
                      onClick={() => setSelectedUser(u)}
                      className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between transition ${
                        selectedUser?._id === u._id ? 'bg-zinc-800 border border-zinc-700/30' : 'hover:bg-zinc-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs">
                          {u.username?.charAt(0).toUpperCase()}
                          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#121212] ${
                            isOnline ? 'bg-emerald-500' : 'bg-zinc-500'
                          }`} />
                        </div>
                        <span className="text-xs font-semibold tracking-wide truncate">{u.username}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* REDIRECT TO FRIENDS HUB PANEL */}
          <div className="p-2 border-t border-zinc-900 bg-[#121212] mt-auto">
            <button
              onClick={() => navigate('/friends')}
              className="w-full py-2.5 px-3 bg-zinc-800/80 hover:bg-blue-600 text-white rounded-xl transition flex items-center justify-center gap-2 text-xs font-bold tracking-wide cursor-pointer group"
            >
              <Users size={15} className="text-zinc-400 group-hover:text-white transition-colors" />
              Manage Connections
            </button>
          </div>
        </div>
      </div>

      {/* MAIN MESSAGES AREA */}
      <div className="flex-1 bg-[#121212] flex flex-col overflow-hidden relative">
        {selectedUser ? (
          <>
            <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-[#121212]/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center font-bold text-base relative">
                  {selectedUser.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-sm tracking-wide text-white">{selectedUser.username}</div>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider block ${
                    isSelectedUserOnline ? 'text-emerald-400' : 'text-zinc-500'
                  }`}>
                    {isSelectedUserOnline ? 'Active Now' : 'Offline'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => initiateCall(selectedUser._id)} className="p-2.5 text-zinc-400 hover:text-white rounded-xl cursor-pointer">
                  <Video size={18} fill="currentColor" />
                </button>
                <button onClick={() => setShowDetailsPanel(!showDetailsPanel)} className="p-2.5 text-zinc-400 hover:text-white rounded-xl cursor-pointer">
                  <Info size={18} />
                </button>
              </div>
            </div>

            {/* MESSAGE TIMELINE FLOW */}
            <div className="flex-1 bg-[#121212] p-5 overflow-y-auto space-y-4 flex flex-col w-full">
              
              {hasMore && (
                <div className="flex justify-center w-full">
                  <button 
                    type="button"
                    onClick={loadMoreMessages} 
                    disabled={isLoadingMore}
                    className="text-[10px] font-bold text-zinc-400 bg-zinc-800/80 hover:bg-zinc-800 px-3 py-1.5 rounded-full transition cursor-pointer"
                  >
                    {isLoadingMore ? "Loading..." : "Load Older Messages"}
                  </button>
                </div>
              )}

              {messages.map((msg, i) => {
                let senderId = '';
                if (msg.sender) {
                  if (typeof msg.sender === 'object') {
                    senderId = msg.sender._id ? String(msg.sender._id) : (msg.sender.id ? String(msg.sender.id) : String(msg.sender));
                  } else {
                    senderId = String(msg.sender);
                  }
                } else if (msg.senderId) {
                  senderId = String(msg.senderId);
                }

                const isMe = senderId.toLowerCase() === myId.toLowerCase();
                const msgId = msg._id || msg.tempId;
                
                return (
                  <div
                    key={msgId || i}
                    className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex flex-col relative group max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}
                      onMouseEnter={() => setHoveredMessageId(msgId || null)}
                      onMouseLeave={() => setHoveredMessageId(null)}
                    >
                      {/* INLINE REACTION PICKER */}
                      {hoveredMessageId === msgId && msgId && !msgId.startsWith('temp-') && (
                        <div className={`absolute -top-8 z-20 bg-zinc-900 border border-zinc-800 rounded-full px-2 py-1 shadow-xl flex gap-1.5 animate-fade-in ${isMe ? 'right-2' : 'left-2'}`}>
                          {REACTION_OPTIONS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleToggleReaction(msg, emoji)}
                              className="hover:scale-125 transition transform duration-150 cursor-pointer text-sm"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* MESSAGE BOX */}
                      <div className={`p-3 rounded-2xl relative ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-tr-none font-medium text-right' 
                          : 'bg-zinc-800 text-zinc-100 rounded-tl-none font-normal text-left border border-zinc-700/40' 
                      }`}>
                        {msg.messageType === 'sticker' ? (
                          <img src={msg.mediaUrl} alt="sticker" className="w-28 h-28 object-contain my-1" />
                        ) : (
                          <p className="text-xs tracking-wide leading-relaxed break-words">{msg.text}</p>
                        )}

                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="absolute -bottom-2.5 left-2 bg-zinc-900 border border-zinc-800 rounded-full px-1.5 py-0.5 text-[10px] flex items-center gap-1 shadow-md">
                            {Array.from(new Set(msg.reactions.map((r: any) => r.emoji))).map((emoji: any, idx) => (
                              <span key={idx}>{emoji}</span>
                            ))}
                            {msg.reactions.length > 1 && (
                              <span className="text-zinc-500 font-semibold text-[8px]">{msg.reactions.length}</span>
                            )}
                          </div>
                        )}

                        <div className="text-[8px] mt-1.5 opacity-40 text-right">
                          {formatMessageTime(msg)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            {/* INPUT ELEMENT ACTIONS BAR */}
            <form onSubmit={sendMessage} className="p-4 border-t border-zinc-900 bg-[#121212] flex items-center gap-2 relative">
              
              {showEmoji && (
                <div className="absolute bottom-16 left-4 z-50">
                  <EmojiPicker
                    theme={Theme.DARK}
                    onEmojiClick={(emojiData: EmojiClickData) => {
                      setText((prev) => prev + emojiData.emoji);
                    }}
                  />
                </div>
              )}

              {showStickers && (
                <div className="absolute bottom-16 left-12 z-50 bg-[#1a1a1a] border border-zinc-800 p-3 rounded-2xl shadow-2xl w-64">
                  <div className="grid grid-cols-3 gap-2">
                    {STICKERS.map((stk) => (
                      <button
                        type="button"
                        key={stk.id}
                        onClick={() => sendSticker(stk.url)}
                        className="p-1 hover:bg-zinc-800 rounded-xl transition cursor-pointer"
                      >
                        <img src={stk.url} alt={stk.name} className="w-12 h-12 mx-auto object-contain" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowEmoji(!showEmoji)}
                className="p-2.5 text-zinc-400 hover:text-white rounded-xl cursor-pointer"
              >
                <Smile size={18} />
              </button>

              <button
                type="button"
                onClick={() => setShowStickers(!showStickers)}