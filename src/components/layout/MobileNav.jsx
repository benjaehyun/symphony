import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Heart, MessageCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

const MobileNav = () => {
  const location = useLocation();

  const navigationItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Discover', path: '/discover', icon: Search },
    { name: 'Matches', path: '/matches', icon: Heart },
    { name: 'Messages', path: '/messages', icon: MessageCircle },
  ];

  return (
    <nav className="flex items-center justify-around py-3 px-4 border-t border-border">
      {navigationItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={cn(
            "flex flex-col items-center space-y-1",
            location.pathname === item.path
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          <item.icon className="w-6 h-6" />
          <span className="text-xs">{item.name}</span>
        </Link>
      ))}
    </nav>
  );
};

export default MobileNav;