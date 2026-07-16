import React from 'react';
import { Link, useLocation } from 'react-router-dom';
// FIX: Added the explicit .js extension to satisfy ESM resolution rules
import { useAuth } from '../context/AuthContext.js';
import {
  Home, Users, Calendar, BookOpen, Settings, Gamepad2, Library, MessageCircle, Flame, ShieldCheck, LogOut
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const Sidebar = ({ isCollapsed, setIsCollapsed }: SidebarProps) => {
  const location = useLocation();
  const { user } = useAuth();

  const links = [
    { name: 'Home', icon: <Home size={18} />, path: '/feed' },
    { name: 'Library', icon: <Library size={18} />, path: '/library' },
    { name: 'Devotionals', icon: <BookOpen size={18} />, path: '/devotionals' },
    { name: 'Chat Room', icon: <MessageCircle size={18} />, path: '/messages' },
    { name: 'Music Challenges', icon: <Flame size={18} className="text-amber-500 animate-pulse" />, path: '/challenges' },
    { name: 'Ministries', icon: <Users size={18} />, path: '/ministries' },
    { name: 'Gatherings', icon: <Calendar size={18} />, path: '/meetings' },
    { name: 'Trivia', icon: <Gamepad2 size={18} />, path: '/trivia' },
    { name: 'Settings', icon: <Settings size={18} />, path: '/settings' },
  ];

  // Securely logs the user out and wipes local state caches completely
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-64px)] bg-white/60 backdrop-blur-lg border-r border-gray-200/40 p-5 flex flex-col z-30 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-0 -translate-x-full opacity-0' : 'w-64 opacity-100 translate-x-0'
      }`}
    >
      {/* 🔮 PREMIUM GLOWING IDENTITY FRAME */}
      <div className="w-full bg-white/40 border border-white border-b-slate-100 p-4 rounded-2xl flex flex-col items-center text-center shadow-xs mb-6">
        <div className="relative group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-500 rounded-full blur-md opacity-30 group-hover:opacity-60 transition duration-300"></div>
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 p-[2.5px] shadow-sm">
            <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center border-2 border-white overflow-hidden text-slate-700 font-serif font-black text-lg">
              {user?.username?.[0] || 'U'}
            </div>
          </div>
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full shadow-xs"></span>
        </div>
        <h2 className="text-xs font-black text-slate-800 tracking-tight mt-3 flex items-center gap-0.5">
          {user?.username || 'Sanctuary User'}
          <ShieldCheck size={12} className="text-blue-500 fill-blue-500/5" />
        </h2>
      </div>

      {/* NAVIGATION INTERACTION LINK STACK */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1 custom-scrollbar">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                  : 'text-slate-500 hover:bg-slate-100/60 hover:text-blue-600'
              }`}
            >
              {link.icon}
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* FOOTER & LOGOUT PANEL */}
      <div className="mt-auto pt-4 space-y-2">
        {/* FOCUS BLOCK CARD */}
        <div className="p-3.5 bg-blue-50/40 rounded-xl border border-blue-100/30">
          <p className="text-[9px] font-black text-blue-600 uppercase tracking-wider mb-0.5">Current Focus</p>
          <p className="text-[11px] font-bold text-blue-900 leading-tight">The Great Controversy</p>
        </div>

        {/* 🚪 PREMIUM LOGOUT ACTION BUTTON */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-bold text-xs text-rose-500 hover:bg-rose-50 transition-all duration-150 cursor-pointer"
        >
          <LogOut size={18} />
          <span>Logout Session</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;