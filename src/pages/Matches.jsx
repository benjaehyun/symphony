import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchMatches, 
  selectMatches,
  selectMatchesLoading,
  selectHasMoreMatches,
  markMatchesAsRead,
  fetchUnreadCount
} from '../store/slices/matchesSlice';
import MatchProfileView from '../components/matches/MatchProfileView';
import { Button } from '../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { Music2, MessageCircle } from 'lucide-react';
import useMediaQuery from '../hooks/useMediaQuery';
import { useParams, useNavigate } from 'react-router-dom';

const Matches = () => {
  const { matchId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate()
  const matches = useSelector(selectMatches);
  const isLoading = useSelector(selectMatchesLoading);
  const hasMore = useSelector(selectHasMoreMatches);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchMatches({ page: 1 }));
  }, [dispatch]);

  useEffect(() => {
    if (matchId) {
      const match = matches.find(m => m.matchedProfile._id === matchId);
      if (match) {
        setSelectedMatch(match);
        if (!match.isRead) {
          dispatch(markMatchesAsRead([match._id]))
            // .then(() => {
            //   dispatch(fetchUnreadCount());
            // });
        }
      }
    }
  }, [matchId, matches]);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      dispatch(fetchMatches({ page: nextPage }));
    }
  };

  const handleMatchSelect = (match) => {
    setSelectedMatch(match);
    if (!match.isRead) {
      dispatch(markMatchesAsRead([match._id]))
      .then(() => {
        // After marking as read, update the unread count
        dispatch(fetchUnreadCount());
      });
    }
  };

  if (isMobile === null) return null;

  if (isLoading && matches.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isLoading && matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <div className="w-16 h-16 mb-6 rounded-full bg-background-elevated flex items-center justify-center">
          <Music2 className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Matches Yet</h2>
        <p className="text-muted-foreground">
          Keep discovering profiles to find your musical matches
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 max-w-[1200px] mx-auto">
        <h1 className="text-2xl font-bold mb-6">Your Matches</h1>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {matches.map((match) => (
            <div 
              key={match._id}
              className="group relative flex flex-col items-center p-4 rounded-lg
                border border-border/50 bg-background-elevated/50 
                hover:bg-background-highlight hover:border-border
                transition-all duration-200 cursor-pointer"
              onClick={() => handleMatchSelect(match)}
            >
              {/* Profile Image with New Indicator */}
              <div className="relative w-full aspect-square mb-4">
                <Avatar className="w-full h-full">
                  <AvatarImage 
                    src={match.matchedProfile.photos[0]?.url} 
                    alt={match.matchedProfile.name}
                    className="object-cover" 
                  />
                  <AvatarFallback className="text-4xl">
                    {match.matchedProfile.name[0]}
                  </AvatarFallback>
                </Avatar>
                {!match.isRead && (
                  <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-spotify-green" />
                )}
                
                {/* Hover Actions Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 
                               group-hover:opacity-100 transition-opacity duration-200">
                  <Button
                    size="icon"
                    className="w-12 h-12 rounded-full bg-spotify-green text-white shadow-lg 
                              hover:scale-105 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/messages/${match._id}`);
                    }}
                  >
                    <MessageCircle className="h-6 w-6" />
                  </Button>
                </div>
              </div>

              {/* Name and Music Info */}
              <h3 className="font-semibold text-center mb-1">
                {match.matchedProfile.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Music2 className="w-4 h-4" />
                <span>
                  {match.matchedProfile.music.sourceType === 'playlist' 
                    ? 'Playlist' 
                    : 'Top Tracks'}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {hasMore && (
          <div className="py-8 text-center">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </div>

        {selectedMatch && (
            <MatchProfileView 
                match={selectedMatch}
                onClose={() => setSelectedMatch(null)}
            />
        )}
    </div>
  );
};

export default Matches;