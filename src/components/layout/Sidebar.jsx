import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Heart, MessageCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectUnreadCount } from '../../store/slices/matchesSlice';
import { cn } from '../../utils/cn';

const Sidebar = () => {
  const location = useLocation();
  const unreadMatchCount = useSelector(selectUnreadCount);
  
  const navigationItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Discover', path: '/discover', icon: Search },
    { 
      name: 'Matches', 
      path: '/matches', 
      icon: Heart,
      badge: unreadMatchCount > 0 ? unreadMatchCount : null 
    },
    { name: 'Messages', path: '/messages', icon: MessageCircle },
  ];

  const isActivePath = (path) => location.pathname === path;

  return (
    <div className="h-full w-full bg-background-elevated p-6">
      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-spotify-green">Symphony</h1>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        {navigationItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              "hover:bg-background-highlight",
              "relative",
              isActivePath(item.path)
                ? "text-primary bg-background-highlight"
                : "text-muted-foreground"
            )}
          >
            <item.icon className="h-5 w-5 mr-3" />
            {item.name}
            {item.badge && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[1.25rem] h-5 
                             flex items-center justify-center rounded-full bg-spotify-green 
                             text-xs text-white px-1">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Profile section */}
      <div className="mt-auto pt-4 border-t border-border">
        <Link
          to="/profile"
          className="flex items-center px-3 py-2 rounded-lg text-sm font-medium
                     text-muted-foreground hover:text-primary hover:bg-background-highlight
                     transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-background-highlight mr-3" />
          <span>Your Profile</span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;