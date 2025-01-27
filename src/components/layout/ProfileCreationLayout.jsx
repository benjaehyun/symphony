import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '../../utils/cn';

const ProfileCreationLayout = ({ children }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header  */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="px-4 md:px-8 h-14 flex items-center max-w-4xl mx-auto">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-muted-foreground hover:text-primary rounded-full 
                     hover:bg-background-highlight transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="absolute left-1/2 -translate-x-1/2">
            <h1 className="text-lg font-bold text-spotify-green">Symphony</h1>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-4xl px-4 md:px-8">
        {/* Content wrapper for responsive spacing */}
        <div className={cn(
          "py-6 md:py-8",
          "pb-24 md:pb-8"
        )}>
          {children}
        </div>
      </main>

      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md 
                      border-t border-border">
        <div className="h-20 px-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">

          </span>
        </div>
      </div>
    </div>
  );
};

export default ProfileCreationLayout;