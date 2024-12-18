import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectMatches } from '../store/slices/matchesSlice';
import ConversationList from '../components/messages/ConversationList';
import ChatRoom from '../components/messages/ChatRoom';
import EmptyMessages from '../components/messages/EmptyMessages';
import EmptyChat from '../components/messages/EmptyChat';
import useMediaQuery from '../hooks/useMediaQuery';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { fetchMatches } from '../store/slices/matchesSlice';
import { fetchConversationPreviews } from '../store/slices/messagesSlice';
import { joinRoom, leaveRoom } from '../utils/socket/socket';
import { generateRoomId } from '../utils/messages/roomID';

const Messages = () => {
  const dispatch = useDispatch()
  const { matchId } = useParams();
  const matches = useSelector(selectMatches);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const loading = useSelector(state => state.messages.loading);
  const currentProfile = useSelector(state => state.profile.profile);
  
  useEffect(() => {
    // Fetch matches when entering Messages page
    dispatch(fetchMatches({}));
    dispatch(fetchConversationPreviews());
  }, [dispatch]);

  // useEffect(() => {
  //   if (currentProfile && matches.length > 0) {
  //     // Join all potential chat rooms
  //     matches.forEach(match => {
  //       const roomId = generateRoomId(currentProfile._id, match.matchedProfile._id);
  //       joinRoom(roomId);
  //     });

  //     // Cleanup function to leave all rooms
  //     return () => {
  //       matches.forEach(match => {
  //         const roomId = generateRoomId(currentProfile._id, match.matchedProfile._id);
  //         leaveRoom(roomId);
  //       });
  //     };
  //   }
  // }, [matches, currentProfile]);

  
  // Show empty state if no matches
  if (matches.length === 0) {
    return <EmptyMessages />;
  }

  // Handle loading state
  if (loading && !matchId) {
    return <div className="flex items-center justify-center h-full">
      <LoadingSpinner />
    </div>;
  }

  const ConversationListComponent = (
    <ConversationList 
      matches={matches} 
      activeMatchId={matchId}
    />
  );

  const MainContent = matchId ? (
    <ChatRoom matchId={matchId} />
  ) : (
    <EmptyChat />
  );

  // Mobile view
  if (isMobile) {
    return matchId ? (
      <div className="h-full"> {/* Use dynamic viewport height */}
        {MainContent}
      </div>
    ) : (
      <div className="h-full">
        {ConversationListComponent}
      </div>
    );
  }

  // Desktop view
  return (
    <div className="flex h-full">
      <div className="w-[320px] border-r border-border bg-background-elevated">
        {ConversationListComponent}
      </div>
      <div className="flex-1">
        {MainContent}
      </div>
    </div>
  );
};

export default Messages;