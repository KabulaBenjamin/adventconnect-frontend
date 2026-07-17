import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Home, Users, Calendar, BookOpen, Settings, Gamepad2, Library, MessageCircle, Flame, ShieldCheck, LogOut } from 'lucide-react';

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
    { name: 'Music Challenges', icon: <Flame size={18} className="animate-pulse" />, path: '/challenges' },
    { name: 'Gatherings', icon: <Calendar size={18} />, path: '/meetings' },
    { name: 'Trivia', icon: <Gamepad2 size={18} />, path: '/trivia' },
    { name: 'Settings', icon: <Settings size={18} />, path: '/settings' },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 p-5 flex flex-col z-50 transition-all duration-300 ${
        isCollapsed ? '-translate-x-full w-0' : 'translate-x-0 w-64'
      } md:translate-x-0 md:w-64`}
    >
      <div className="w-full bg-slate-50 border p-4 rounded-2xl flex flex-col items-center mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-600 p-[2px]">
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-black">
            {user?.username?.[0] || 'U'}
          </div>
        </div>
        <h2 className="text-xs font-bold mt-3 flex items-center gap-1">
          {user?.username || 'User'} <ShieldCheck size={12} className="text-blue-500" />
        </h2>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <Link
            key={link.name}
            to={link.path}
            onClick={() => window.innerWidth < 768 && setIsCollapsed(true)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-colors ${
              location.pathname === link.path ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {link.icon} <span>{link.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;