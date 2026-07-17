import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-64px)] bg-white/90 backdrop-blur-lg border-r border-gray-200 p-5 flex flex-col z-50 transition-all duration-300 ease-in-out ${
        isCollapsed ? '-translate-x-full w-0 opacity-0' : 'translate-x-0 w-64 opacity-100'
      } md:translate-x-0 md:w-64`}
    >
      <div className="w-full bg-white/40 border border-white p-4 rounded-2xl flex flex-col items-center shadow-sm mb-6">
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-600 p-[2px]">
          <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center font-black text-lg">
            {user?.username?.[0] || 'U'}
          </div>
        </div>
        <h2 className="text-xs font-black text-slate-800 mt-3 flex items-center gap-1">
          {user?.username || 'User'} <ShieldCheck size={12} className="text-blue-500" />
        </h2>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <Link
            key={link.name}
            to={link.path}
            onClick={() => window.innerWidth < 768 && setIsCollapsed(true)}
            className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
              location.pathname === link.path ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {link.icon}
            <span>{link.name}</span>
          </Link>
        ))}
      </nav>

      <button onClick={handleLogout} className="mt-auto w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-bold text-xs text-rose-500 hover:bg-rose-50">
        <LogOut size={18} /> Logout
      </button>
    </aside>
  );
};

export default Sidebar;