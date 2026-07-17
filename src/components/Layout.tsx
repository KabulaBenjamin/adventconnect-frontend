import React from 'react';
import Navbar from './Navbar.js';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Navbar>
      {children}
    </Navbar>
  );
};

export default Layout;