import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Navbar>
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 overflow-y-auto h-full animate-in fade-in duration-200">
        {children}
      </div>
    </Navbar>
  );
};

export default Layout;