import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  selectCurrentProfile, 
  selectDiscoveryStatus,
  selectDiscoveryProfiles,
  fetchDiscoveryProfiles,
  likeProfile,
  dislikeProfile,
  selectNewMatch,
  clearNewMatch
} from '../store/slices/discoverySlice';
import { Heart, X } from 'lucide-react';
import { NoMoreProfiles } from '../components/discovery/ProfileCard';
import MobileMusicSheet from '../components/discovery/MobileMusicSheet';
import DesktopMusicPanel from '../components/discovery/DesktopMusicPanel';
import ProfileStack from '../components/discovery/ProfileStack';
import MatchNotification from '../components/discovery/MatchNotification';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import useMediaQuery from '../hooks/useMediaQuery';

const Discovery = () => {
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const currentProfile = useSelector(selectCurrentProfile);
  const profiles = useSelector(selectDiscoveryProfiles);  
  const status = useSelector(selectDiscoveryStatus);
  const newMatch = useSelector(selectNewMatch);
  const dispatch = useDispatch();

  console.log('Discovery Component State:', {
    currentProfile,
    profiles,
    status,
    currentProfileIndex: currentProfile 
      ? profiles.findIndex(p => p._id === currentProfile._id)
      : 0
  });

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchDiscoveryProfiles());
    }
  }, [status, dispatch]);

  const handleLike = () => {
    if (currentProfile) {
      dispatch(likeProfile(currentProfile._id));
    }
  };

  const handleDislike = () => {
    if (currentProfile) {
      dispatch(dislikeProfile(currentProfile._id));
    }
  };

  const handleProfileTap = () => {
    if (isMobile) {
      setIsMobileSheetOpen(true);
    }
  };

  const handleCloseMatch = () => {
    dispatch(clearNewMatch());
  };

  const currentProfileIndex = currentProfile 
    ? profiles.findIndex(p => p._id === currentProfile._id)
    : 0;

  if (status === 'loading' && !currentProfile) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner/>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="h-full flex flex-col md:flex-row">
        {/* Main Profile View */}
        <div className={`relative flex-1 w-full p-4 min-h-0 mt-6 ${
        // Only apply max-width and margin when we have profiles
          currentProfile 
            ? 'md:max-w-2xl md:mx-auto md:mr-0' 
            : 'md:max-w-none'
        }`}>
          {currentProfile ? (
             <div onClick={handleProfileTap} className='h-[calc(100vh-20rem)] md:h-[600px] w-full'>
              <ProfileStack
                profiles={profiles}
                currentIndex={currentProfileIndex}
                onLike={handleLike}
                onDislike={handleDislike}
              />
            </div>
          ) : (
            <NoMoreProfiles />
          )}
          
          {/* Action Buttons - Fixed on mobile, absolute on desktop */}
          {currentProfile && (
            <div className="fixed md:absolute bottom-32 md:bottom-8 left-0 right-0 flex justify-center gap-4 px-4">
              <button 
                onClick={handleDislike}
                className="w-14 h-14 rounded-full bg-background-elevated shadow-lg 
                         flex items-center justify-center hover:bg-background-highlight 
                         transition-colors border border-border/50"
              >
                <X className="w-6 h-6 text-rose-500" />
              </button>
              <button 
                onClick={handleLike}
                className="w-14 h-14 rounded-full bg-background-elevated shadow-lg 
                         flex items-center justify-center hover:bg-background-highlight 
                         transition-colors border border-border/50"
              >
                <Heart className="w-6 h-6 text-spotify-green" />
              </button>
            </div>
          )}
        </div>

        {/* Desktop Music Panel */}
        {currentProfile && (
          <div className="hidden md:block w-[400px] bg-background-elevated border-l border-border">
            <DesktopMusicPanel profile={currentProfile} />
          </div>
        )}

        {/* Mobile Music Sheet */}
        {currentProfile && (
          <MobileMusicSheet 
            profile={currentProfile}
            isOpen={isMobileSheetOpen}
            onOpenChange={setIsMobileSheetOpen}
          />
        )}
      </div>
      <MatchNotification 
        isOpen={!!newMatch}
        onClose={handleCloseMatch}
        match={newMatch}
      />
    </div>
  );
};

export default Discovery;