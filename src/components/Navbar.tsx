import React, { useState } from 'react';
import Sidebar from './Sidebar.js';
import RightSidebar from './RightSidebar.js';
import Topbar from './Topbar.js';
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react';

const Navbar = ({ children }: { children: React.ReactNode }) => {
  // isCollapsed controls the mobile-first drawer behavior
  const [isCollapsed, setIsCollapsed] = useState(true); 
  const [isRightCollapsed, setIsRightCollapsed] = useState(true);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      {/* 1. Left Sidebar: Z-indexed to overlay on mobile, pushes content on desktop */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* 2. Main Workspace: Flex-1 takes remaining space, adds desktop margin for sidebar */}
      <div className="flex flex-1 flex-col min-w-0 transition-all duration-300 md:pl-64">
        
        {/* Topbar: Explicitly set height and shrink-0 to prevent overlay/squashing */}
        <header className="flex items-center justify-between bg-white border-b border-gray-100 p-2 h-16 shrink-0">
          <button 
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg" 
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <Menu size={20} />
          </button>
          
          <div className="flex-1 overflow-hidden">
            <Topbar />
          </div>

          <button 
            onClick={() => setIsRightCollapsed(!isRightCollapsed)} 
            className="p-2 ml-2 bg-gray-50 rounded-xl text-gray-500 hover:text-blue-600 transition-all"
            title={isRightCollapsed ? "Open Right Sidebar" : "Collapse Right Sidebar"}
          >
            {isRightCollapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </header>

        {/* Content Area: Occupies the rest of the height, fully scrollable */}
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F8FAFC]">
            {children}
          </main>
          
          {/* Right Sidebar: Collapsible utility panel */}
          <aside className={`transition-all duration-300 ease-in-out border-l border-gray-100 bg-white overflow-y-auto ${
            isRightCollapsed ? 'w-0 opacity-0' : 'w-80 opacity-100'
          }`}>
            <RightSidebar />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Navbar;