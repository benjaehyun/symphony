import React, { useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';
import { useDispatch } from 'react-redux';
import { fetchUnreadCount } from '../../store/slices/matchesSlice';

const Layout = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Fetch unread count on initial load
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  return (
    <div className="h-[100dvh] bg-background flex flex-col md:flex-row">
      {/* Sidebar hidden on mobile */}
      <div className="hidden md:flex md:w-[280px] md:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main content  */}
      <main className="flex-1 min-h-0">
        <Header />
        <div className="px-4 md:px-8 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-8 
                      h-[calc(100dvh-4rem)] md:h-[calc(100vh-4rem)] overflow-y-auto">
          {children}
        </div>
      </main>

      {/* Mobile navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background-elevated">
        <MobileNav />
        {/* safe area padding for iOS */}
        <div className="h-[env(safe-area-inset-bottom)] bg-background-elevated" />
      </div>
    </div>
  );
};


export default Layout;