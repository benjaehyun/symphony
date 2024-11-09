import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';

const Layout = ({ children }) => {
  return (
    <div className="h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:flex md:w-[280px] md:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto">
        <Header />
        <div className="px-4 md:px-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile navigation - visible only on mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background-elevated">
        <MobileNav />
      </div>
    </div>
  );
};

export default Layout;