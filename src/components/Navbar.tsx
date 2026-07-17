import React, { useState } from 'react';
import Sidebar from './Sidebar.js';
import RightSidebar from './RightSidebar.js';
import Topbar from './Topbar.js';
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react';

const Navbar = ({ children }: { children: React.ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(true);

  return (
    <div className="flex h-screen w-screen bg-gray-50 overflow-hidden">
      {/* Sidebar is fixed and handles its own visibility */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Workspace - md:ml-64 creates the necessary gap for the sidebar on desktop */}
      <div className="flex flex-1 flex-col h-full overflow-hidden transition-all duration-300 md:ml-64">
        
        {/* Topbar: Fixed height header */}
        <header className="flex w-full items-center justify-between bg-white border-b border-gray-100 p-2 h-16 shrink-0">
          <button className="md:hidden p-2 text-slate-600" onClick={() => setIsCollapsed(!isCollapsed)}>
            <Menu size={20} />
          </button>
          
          <div className="flex-1 overflow-hidden px-2">
            <Topbar />
          </div>

          <button onClick={() => setIsRightCollapsed(!isRightCollapsed)} className="p-2 bg-gray-50 rounded-xl text-slate-500">
            {isRightCollapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F8FAFC]">
          {children}
        </main>
      </div>

      {/* Right Sidebar */}
      <aside className={`transition-all duration-300 border-l border-gray-100 bg-white ${isRightCollapsed ? 'w-0 opacity-0' : 'w-80 opacity-100'}`}>
        <RightSidebar />
      </aside>
    </div>
  );
};

export default Navbar;