import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Heart, MessageCircle, LogOut } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUnreadCount as selectUnreadMatchCount } from '../../store/slices/matchesSlice';
import { selectUnreadCount as selectUnreadMessageCount } from '../../store/slices/messagesSlice';
import { cn } from '../../utils/cn';
import { logoutUser } from '../../store/slices/authSlice';  

const Sidebar = () => {
  const location = useLocation();
  const dispatch = useDispatch();  
  const navigate = useNavigate();
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

  const isActivePath = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="h-full w-full bg-background-elevated p-6">
      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-spotify-green">Symphony</h1>
      </div>

      {/* Nav */}
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
      <div className="mt-4 pt-4 border-t border-border">
        <Link
          to="/profile"
          className="flex items-center px-3 py-2 rounded-lg text-sm font-medium
                    text-muted-foreground hover:text-primary hover:bg-background-highlight
                    transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-background-highlight mr-3" />
          <span>Your Profile</span>
        </Link>

        
        <div className="flex justify-center px-3">
          <div className="w-8 h-8 rounded-full bg-background-highlight mr-3" />
          <button
            onClick={handleLogout}
            className="flex items-center px-1 rounded-md text-xs font-medium
                      text-red-400 hover:text-red-300 hover:bg-red-500/10
                      transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span>logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;