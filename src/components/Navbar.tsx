import React, { useState } from 'react';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import Topbar from './Topbar';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface NavbarLayoutProps {
  children?: React.ReactNode;
}

const Navbar: React.FC<NavbarLayoutProps> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* 1. Left Navigation Menu Sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* 2. Main Center Workspace Stack */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Horizontal Control Topbar with a toggle control for the Right Panel */}
        <div className="relative flex items-center justify-between bg-white border-b border-gray-100 pr-4">
          <div className="flex-1">
            <Topbar />
          </div>
          
          {/* Quick toggle button for the Right Sidebar */}
          <button
            onClick={() => setIsRightCollapsed(!isRightCollapsed)}
            className="p-2 ml-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all z-50"
            title={isRightCollapsed ? "Open Right Sidebar" : "Collapse Right Sidebar"}
          >
            {isRightCollapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Dynamic Content Stream Page Grid */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Main Feed View Stream Column */}
          <main className="flex-1 overflow-y-auto p-6 min-w-0 bg-[#F8FAFC]">
            {children}
          </main>

          {/* 3. Collapsable Right Sidebar utility panel */}
          <div 
            className={`transition-all duration-300 ease-in-out border-l border-gray-100 bg-white h-full overflow-y-auto ${
              isRightCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-80 opacity-100'
            }`}
          >
            <RightSidebar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
