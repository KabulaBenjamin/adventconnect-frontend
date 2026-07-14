import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Peer from 'peerjs';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import {
  Send, Smile, Paperclip, Phone, Video, X, PhoneOff, Hash, Info, Lock,
  Mail, Share2, Users, ThumbsUp, Type, ShieldCheck, Clock, Eye, Ban, AlertTriangle,
  Search, UserPlus, Check, Image as ImageIcon
} from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';

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

const Messages = () => {
  const { user } = useAuth();
  const [connectedFriends, setConnectedFriends] = useState<any[]>([]);
  const [peopleYouMayKnow, setPeopleYouMayKnow] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<string[]>([]);

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
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

  // Safe Helper: Format timestamps without throwing runtime crashes
  const formatMessageTime = (msg: any): string => {
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
    if (!user) return;

    socketRef.current = io('http://localhost:4000');
    socketRef.current.emit('register', user._id);

    // 🔥 FIXED: Wrapped PeerJS initialization inside safe exception scope to avoid fatal silent crashing
    let peer: Peer | null = null;
    try {
      peer = new Peer(user._id, {
        host: '/',
        port: 9000,
        path: '/peerjs'
      });
      peerRef.current = peer;

      peer.on('open', (id) => {
        console.log(`PeerJS Client linked successfully under user: ${id}`);
      });

      peer.on('error', (err) => {
        console.warn("⚠️ PeerJS client encountered a routing issue. Call capabilities disabled. Normal chat is active.", err.message);
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
      console.warn("❌ Could not bind PeerJS client to local application framework:", err);
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
  }, [user]);

  // Real-time listener for incoming messages, reactions, and read receipts
  useEffect(() => {
    if (!socketRef.current) return;

    socketRef.current.off('receive_message');
    socketRef.current.off('receive_reaction');

    socketRef.current.on('receive_message', (msg: any) => {
      const matchId = msg.senderId || msg.sender;
      const targetId = msg.receiverId || msg.recipient;
      if (selectedUser && (matchId === selectedUser._id || targetId === selectedUser._id)) {
        setMessages((prev) => [...prev, msg]);
        triggerMarkAsRead();
      }
    });

    socketRef.current.on('receive_reaction', (reactionData: any) => {
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
        
        // Defensive Check: Handle both backend pagination formats and legacy flat arrays
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

  // Helper: Trigger Mark As Read
  const triggerMarkAsRead = async () => {
    if (!selectedUser) return;
    try {
      await apiFetch(`/messages/read/${selectedUser._id}`, { method: 'PATCH' });
    } catch (err) {
      console.warn("Could not synchronize read receipts stack:", err);
    }
  };

  // Load older paginated messages
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
      setPeopleYouMayKnow(data.suggestions || []);
    } catch (err) {
      console.error("Failed to fetch chat directory data", err);
    }
  };

  const handleSendFriendRequest = async (targetId: string) => {
    try {
      await apiFetch(`/users/friend-request/${targetId}`, { method: 'POST' });
      setSentRequests((prev) => [...prev, targetId]);
    } catch (err) {
      console.error("Could not complete friend request", err);
    }
  };

  // Sender loop
  const handleSendMessagePayload = async (payloadText: string, messageType: 'text' | 'sticker' = 'text', mediaUrl?: string) => {
    if (!selectedUser) return;

    const tempId = 'temp-' + Date.now();
    const msgData = {
      _id: tempId,
      tempId: tempId,
      sender: user?._id,
      senderId: user?._id,
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
        senderId: user?._id,
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

  const handleToggleReaction = async (message: any, emoji: string) => {
    const messageId = message._id;
    if (!messageId || messageId.startsWith('temp-')) return;

    try {
      const updatedReactions = await apiFetch(`/messages/reaction/${messageId}`, {
        method: 'POST',
        body: JSON.stringify({ emoji })
      });

      // Secure both structure options (raw array or nested object reactions)
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
        call?.on('stream', (userRemoteStream) => {
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

        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-5">
          <div>
            <div className="px-3 pb-1.5 flex justify-between items-center">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Connected Friends</span>
            </div>
            <div className="space-y-0.5">
              {connectedFriends.filter(u => u.username?.toLowerCase().includes(searchQuery.toLowerCase())).map(u => (
                <div
                  key={u._id}
                  onClick={() => setSelectedUser(u)}
                  className={`p-2.5 rounded-xl cursor-pointer flex items-center gap-3 transition ${
                    selectedUser?._id === u._id ? 'bg-zinc-800 border border-zinc-700/30' : 'hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs">
                    {u.username?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold tracking-wide truncate">{u.username}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="px-3 pb-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">People You May Know</span>
            </div>
            <div className="space-y-0.5">
              {peopleYouMayKnow.filter(u => u.username?.toLowerCase().includes(searchQuery.toLowerCase())).map(u => (
                <div key={u._id} className="p-2.5 rounded-xl flex items-center justify-between hover:bg-zinc-900/40">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedUser(u)}>
                    <div className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs">
                      {u.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-zinc-300">{u.username}</span>
                      <span className="text-[10px] text-zinc-600 -mt-0.5">{u.localChurch || 'Global Member'}</span>
                    </div>
                  </div>
                  {sentRequests.includes(u._id) ? (
                    <button disabled className="p-1.5 bg-zinc-800 text-emerald-500 rounded-lg"><Check size={13} /></button>
                  ) : (
                    <button onClick={() => handleSendFriendRequest(u._id)} className="p-1.5 bg-zinc-800 hover:bg-blue-600 rounded-lg cursor-pointer"><UserPlus size={13} /></button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN MESSAGES AREA */}
      <div className="flex-1 bg-[#121212] flex flex-col overflow-hidden relative">
        {selectedUser ? (
          <>
            <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-[#121212]/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center font-bold text-base">
                  {selectedUser.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-sm tracking-wide text-white">{selectedUser.username}</div>
                  <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block">Active Now</span>
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
            <div className="flex-1 bg-[#121212] p-5 overflow-y-auto space-y-6">
              
              {/* Pagination load action bubble */}
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
                const isMe = (msg.senderId || msg.sender) === user?._id;
                const msgId = msg._id || msg.tempId;
                
                return (
                  <div
                    key={msgId || i}
                    className={`flex flex-col relative group ${isMe ? 'items-end' : 'items-start'}`}
                    onMouseEnter={() => setHoveredMessageId(msgId)}
                    onMouseLeave={() => setHoveredMessageId(null)}
                  >
                    {/* INLINE REACTION PICKER */}
                    {hoveredMessageId === msgId && msgId && !msgId.startsWith('temp-') && (
                      <div className={`absolute -top-8 z-20 bg-zinc-900 border border-zinc-800 rounded-full px-2 py-1 shadow-xl flex gap-1.5 animate-fade-in ${isMe ? 'right-2' : 'left-2'}`}>
                        {REACTION_OPTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleToggleReaction(msg, emoji)}
                            className="hover:scale-125 transition transform duration-150 cursor-pointer text-sm"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* MESSAGE BOX */}
                    <div className={`max-w-xs sm:max-w-md p-3 rounded-2xl relative ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-tr-none font-medium' 
                        : 'bg-zinc-800 text-zinc-100 rounded-tl-none font-normal border border-zinc-700/40' 
                    }`}>
                      {msg.messageType === 'sticker' ? (
                        <img src={msg.mediaUrl} alt="sticker" className="w-28 h-28 object-contain my-1" />
                      ) : (
                        <p className="text-xs tracking-wide leading-relaxed break-words">{msg.text}</p>
                      )}

                      {/* Reactions display layout */}
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
                    onEmojiClick={(emojiData) => setText((prev) => prev + emojiData.emoji)}
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
                className="p-2.5 text-zinc-400 hover:text-white rounded-xl cursor-pointer"
              >
                <ImageIcon size={18} />
              </button>

              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write your message..."
                className="flex-1 bg-zinc-800/60 text-white text-xs px-4 py-2.5 rounded-xl border border-transparent focus:outline-none focus:border-zinc-700/50"
              />

              <button
                type="submit"
                className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl cursor-pointer transition flex items-center justify-center shrink-0"
              >
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 bg-zinc-900 rounded-3xl border border-zinc-800 flex items-center justify-center text-blue-500 mb-4">
              <Hash size={24} />
            </div>
            <h3 className="font-bold text-sm tracking-wide text-white">No Conversation Active</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs">Select a verified connection in your directory to begin exchange paths safely.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;