import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Bell, Heart, MessageCircle, UserPlus, Flame, Circle, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const NotificationDropdown = () => {
  const { socket } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = async () => {
    try {
      const data = await apiFetch('/notifications');
      const normalized = Array.isArray(data) ? data.map((n: any) => ({
        ...n,
        content: n.content || n.text || 'performed an action',
        read: n.read !== undefined ? n.read : (n.isRead !== undefined ? n.isRead : false)
      })) : [];
      setNotifications(normalized);
    } catch (err) {
      console.error("Notification Fetch Error:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (!socket) return;

    const handleFriendRequest = (data: any) => {
      const liveAlert = {
        _id: `live-alert-follow-${Date.now()}`,
        type: 'follow',
        read: false,
        content: 'sent you a connection request!',
        sender: { username: data.username || 'Someone' },
        createdAt: new Date().toISOString()
      };
      setNotifications(prev => [liveAlert, ...prev]);
    };

    const handleFriendAccepted = (data: any) => {
      const liveAlert = {
        _id: `live-alert-accept-${Date.now()}`,
        type: 'follow',
        read: false,
        content: 'accepted your connection request!',
        sender: { username: data.username || 'User' },
        createdAt: new Date().toISOString()
      };
      setNotifications(prev => [liveAlert, ...prev]);
    };

    const handleNewNotification = (data: any) => {
      const rawText = data.text || data.content || 'interacted with your card';
      const senderUsername = data.sender?.username || 'Someone';
      const cleanContent = rawText.startsWith(senderUsername)
        ? rawText.replace(senderUsername, '').trim()
        : rawText;

      const liveAlert = {
        _id: data._id || `live-alert-metric-${Date.now()}`,
        type: data.type || 'comment',
        read: false,
        content: cleanContent,
        sender: data.sender || { username: 'Someone' },
        createdAt: data.createdAt || new Date().toISOString()
      };

      setNotifications(prev => [liveAlert, ...prev]);
    };

    socket.on('friend-request-received', handleFriendRequest);
    socket.on('friend-request-accepted', handleFriendAccepted);
    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('friend-request-received', handleFriendRequest);
      socket.off('friend-request-accepted', handleFriendAccepted);
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket]);

  // Handle outside layout context target closures cleanly
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await apiFetch('/notifications/read-all', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark notes as read:", err);
    }
  };

  const toggleDropdown = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      markAllAsRead();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={toggleDropdown}
        type="button"
        className={`relative p-2.5 rounded-xl border transition duration-150 flex items-center justify-center cursor-pointer ${
          isOpen
            ? 'bg-blue-50 border-blue-200 text-blue-600'
            : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'
        }`}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black border-2 border-white rounded-full flex items-center justify-center scale-90">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Card panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white border border-gray-100 shadow-2xl rounded-2xl py-3 flex flex-col max-h-[500px] z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-5 py-2 border-b border-gray-50 flex justify-between items-center mb-1">
            <h3 className="text-sm font-black text-gray-900 tracking-tight">Notifications</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={16}/></button>
          </div>

          <div className="overflow-y-auto flex-1 max-h-[380px]">
            {notifications.length === 0 ? (
              <div className="py-12 px-6 text-center">
                <p className="text-xs text-gray-400 font-bold italic">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50/50">
                {notifications.map((n) => {
                  const isValidDate = n.createdAt && !isNaN(Date.parse(n.createdAt));
                  return (
                    <div
                      key={n._id}
                      className={`p-3.5 flex gap-3 hover:bg-gray-50/70 transition cursor-pointer relative ${!n.read ? 'bg-blue-50/10' : ''}`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-gray-100">
                        {(n.type === 'reaction' || n.type === 'like') && <Heart size={14} className="text-red-500 fill-red-500" />}
                        {n.type === 'comment' && <MessageCircle size={14} className="text-blue-500" />}
                        {n.type === 'reply' && <MessageCircle size={14} className="text-purple-500" />}
                        {n.type === 'follow' && <UserPlus size={14} className="text-green-500" />}
                        {n.type === 'prayer' && <Flame size={14} className="text-amber-500 fill-amber-500" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 leading-normal">
                          <span className="font-bold text-gray-900">{n.sender?.username || 'System'}</span> {n.content}
                        </p>
                        <p className="text-[9px] text-gray-400 font-medium mt-0.5">
                          {isValidDate ? `${formatDistanceToNow(new Date(n.createdAt))} ago` : 'Just now'}
                        </p>
                      </div>

                      {!n.read && (
                        <div className="flex items-center shrink-0 pl-1">
                          <Circle size={5} className="text-blue-600 fill-blue-600" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
