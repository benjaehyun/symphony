import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Heart, MessageCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectUnreadCount as selectUnreadMatchCount } from '../../store/slices/matchesSlice';
import { selectUnreadCount as selectUnreadMessageCount } from '../../store/slices/messagesSlice';
import { cn } from '../../utils/cn';


const MobileNav = () => {
  const location = useLocation();
  const unreadMatchCount = useSelector(selectUnreadMatchCount);
  const unreadMessageCount = useSelector(selectUnreadMessageCount);

  const navigationItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Discover', path: '/discover', icon: Search },
    { 
      name: 'Matches', 
      path: '/matches', 
      icon: Heart,
      badge: unreadMatchCount > 0 ? unreadMatchCount : null 
    },
    { 
      name: 'Messages', 
      path: '/messages', 
      icon: MessageCircle,
      badge: unreadMessageCount > 0 ? unreadMessageCount : null 
    }
  ];

  return (
    <nav className="flex items-center justify-around py-3 px-4 border-t border-border bg-background">
      {navigationItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={cn(
            "flex flex-col items-center space-y-1 relative",
            location.pathname === item.path
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          <div className="relative">
            <item.icon className="w-6 h-6" />
            {item.badge && (
              <span className="absolute -top-1 -right-1 min-w-[1.125rem] h-4.5 
                             flex items-center justify-center rounded-full 
                             bg-spotify-green text-[0.625rem] text-white px-1">
                {item.badge}
              </span>
            )}
          </div>
          <span className="text-xs">{item.name}</span>
        </Link>
      ))}
    </nav>
  );
};

export default MobileNav;