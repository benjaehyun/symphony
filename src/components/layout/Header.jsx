import React, { useState, useEffect } from 'react';
import { Bell, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import UserMenu from './UserMenu';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-10 px-4 md:px-8 py-4",
        "transition-colors duration-200",
        scrolled ? "bg-background/90 backdrop-blur-sm" : "bg-transparent"
      )}
    >
      <div className="flex items-center justify-between">
        {/* Navigation arrows - only visible on desktop */}
        <div className="hidden md:flex space-x-2">
          <button className="w-8 h-8 rounded-full bg-background/60 flex items-center justify-center">
            ←
          </button>
          <button className="w-8 h-8 rounded-full bg-background/60 flex items-center justify-center">
            →
          </button>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-4 ml-auto">
          <button className="p-2 text-muted-foreground hover:text-primary">
            <Bell className="w-5 h-5" />
          </button>
          {/* <button className="flex items-center space-x-2 py-1 px-2 rounded-full bg-background/60">
            <div className="w-7 h-7 rounded-full bg-background-highlight" />
            <ChevronDown className="w-4 h-4" />
          </button> */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;