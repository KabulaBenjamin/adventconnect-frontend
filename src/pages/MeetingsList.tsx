import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, Video, Clipboard, Check, Plus, Zap, Globe, Shield, Users, Lock, Trash2, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MeetingsList() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [category, setCategory] = useState('global');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleFetch = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    };

    const res = await fetch(`https://adventconnect-7jfq.onrender.com/api${url}`, { ...options, headers });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    return res.json();
  };

  const generateGoogleStyleId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const part = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `${part(3)}-${part(4)}-${part(3)}`;
  };

  const handleInstantMeeting = async () => {
    const instantRoomId = generateGoogleStyleId();
    try {
      const data = await handleFetch('/meetings/schedule', {
        method: 'POST',
        body: JSON.stringify({
          roomId: instantRoomId,
          title: 'Instant Fellowship Session',
          isInstant: true,
          startTime: new Date(),
          category: 'global'
        })
      });
      
      if (data && data.meeting) {
        navigate(`/meeting/${data.meeting.roomId}`);
      } else {
        navigate(`/meeting/${instantRoomId}`);
      }
    } catch (err) {
      console.error("Instant meeting synchronization failed:", err);
      navigate(`/meeting/${instantRoomId}`);
    }
  };

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const data = await handleFetch('/meetings/calendar');
      setMeetings(data || []);
      setError(null);
    } catch (err: any) {
      console.error("Error loading schedules:", err);
      setError("Unable to sync with Fellowship servers.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!window.confirm("Are you sure you want to delete this gathering from the calendar?")) return;
    try {
      await handleFetch(`/meetings/${meetingId}`, { method: 'DELETE' });
      fetchMeetings();
    } catch (err) {
      console.error("Failed to remove gathering:", err);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startTime) return;

    try {
      await handleFetch('/meetings/schedule', {
        method: 'POST',
        body: JSON.stringify({ title, description, startTime, endTime, isInstant: false, category }),
      });
      setTitle('');
      setDescription('');
      setStartTime('');
      setEndTime('');
      setCategory('global');
      fetchMeetings();
    } catch (err) {
      console.error("Scheduling failed:", err);
    }
  };

  const copyToClipboard = (roomId: string) => {
    const inviteLink = `${window.location.origin}/meeting/${roomId}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedId(roomId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-300">
      <div className="text-left">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Sanctuary Fellowships</h1>
        <p className="text-gray-500 font-bold text-sm">Schedule, manage, and distribute unique access links for your services.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg shadow-blue-100 flex flex-col gap-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white">
                <Zap size={20} fill="currentColor" />
              </div>
              <div>
                <h2 className="font-black text-sm uppercase tracking-wider opacity-90">Need to talk now?</h2>
                <p className="text-xs opacity-75 font-bold">Launch an immediate un-scheduled session.</p>
              </div>
            </div>
            <button onClick={handleInstantMeeting} className="w-full bg-white hover:bg-gray-50 text-blue-700 font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer">
              Start Instant Meeting
            </button>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm h-fit text-left">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <Plus size={18} />
              </div>
              <h2 className="font-black text-gray-900 text-base">Schedule Service</h2>
            </div>

            <form onSubmit={handleSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-1">Service Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Friday Evening Vespers" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border-none text-sm focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium" required />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-1">Scope / Coverage Area</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border-none text-sm focus:ring-2 focus:ring-blue-500 text-gray-700 font-bold outline-none cursor-pointer"
                >
                  <option value="global">🌐 Global (Visible to everyone on Feed)</option>
                  <option value="board">💼 Church Board Meeting (Confidential room)</option>
                  <option value="friends">👥 Friends & Mutual Connections Only</option>
                  <option value="invited">🔒 Invited / Private Group Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-1">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Sermon highlights or focus points..." className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border-none text-sm focus:ring-2 focus:ring-blue-500 text-gray-900 h-20 resize-none" />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-1">Start Date & Time</label>
                <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border-none text-sm focus:ring-2 focus:ring-blue-500 text-gray-900 font-bold" required />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-1">End Time (Optional)</label>
                <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border-none text-sm focus:ring-2 focus:ring-blue-500 text-gray-900 font-bold" />
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md shadow-blue-100 cursor-pointer">
                Generate Link & Schedule
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4 text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
              <CalendarIcon size={18} />
            </div>
            <h2 className="font-black text-gray-900 text-base">Upcoming Calendar</h2>
          </div>

          {error && (
            <div className="p-4 bg-amber-50 text-amber-700 border border-amber-100 rounded-2xl text-xs font-bold">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-sm text-gray-400 font-bold">Loading schedule book...</div>
          ) : meetings.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center text-gray-400 font-bold text-sm">
              No services scheduled yet. Generate an item to get started!
            </div>
          ) : (
            <div className="space-y-4 max-h-[620px] overflow-y-auto pr-2">
              {meetings.map((meet) => {
                // Safely parse host properties out of populated document references
                const creatorName = meet.host?.username || meet.host?.name || 'Unknown User';
                const isOwner = meet.host && (meet.host._id === currentUser?.id || meet.host === currentUser?.id || meet.host._id === currentUser?._id);

                return (
                  <div key={meet._id} className="bg-white border border-gray-100 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${meet.status === 'active' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-100 text-blue-600'}`}>
                          {meet.status}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1">
                          {meet.category === 'global' && <Globe size={11} className="text-emerald-600" />}
                          {meet.category === 'board' && <Shield size={11} className="text-amber-600" />}
                          {meet.category === 'friends' && <Users size={11} className="text-blue-600" />}
                          {meet.category === 'invited' && <Lock size={11} className="text-purple-600" />}
                          {meet.category || 'global'}
                        </span>
                        <span className="text-[10px] bg-zinc-50 border border-zinc-100 text-zinc-500 font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <User size={10} /> Created by: {creatorName}
                        </span>
                      </div>
                      <h3 className="font-black text-gray-900 text-base">{meet.title}</h3>
                      {meet.description && <p className="text-xs text-gray-500 font-medium">{meet.description}</p>}

                      <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-400 pt-1">
                        <span className="flex items-center gap-1.5"><Clock size={14} /> {new Date(meet.startTime).toLocaleString()}</span>
                        <span className="text-blue-500 tracking-wider">ID: {meet.roomId}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button onClick={() => copyToClipboard(meet.roomId)} className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 transition-all cursor-pointer" title="Copy Invite Link">
                        {copiedId === meet.roomId ? <Check size={16} className="text-green-600" /> : <Clipboard size={16} />}
                      </button>
                      
                      {isOwner && (
                        <button onClick={() => handleDeleteMeeting(meet._id)} className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all cursor-pointer" title="Delete Gathering">
                          <Trash2 size={16} />
                        </button>
                      )}

                      <button onClick={() => navigate(`/meeting/${meet.roomId}`)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-100 cursor-pointer">
                        <Video size={14} /> Join
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
