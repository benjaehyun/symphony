import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectMessages, fetchMessages, markMessagesAsRead } from '../../store/slices/messagesSlice';
import { selectMatches } from '../../store/slices/matchesSlice';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { ArrowLeft } from 'lucide-react';
import ChatInput from './ChatInput';
import MessageBubble from './MessageBubble';
import { useNavigate } from 'react-router-dom';
import useMediaQuery from '../../hooks/useMediaQuery';
import { joinRoom, leaveRoom } from '../../utils/socket/socket';
import { generateRoomId } from '../../utils/messages/roomID';

const ChatRoom = ({ matchId }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const match = useSelector(selectMatches).find(m => m._id === matchId);
  const currentProfile = useSelector(state => state.profile.profile);
  const roomId = match && currentProfile ? 
    generateRoomId(currentProfile._id, match.matchedProfile._id) : 
    null;
  const messages = useSelector(state => selectMessages(state, roomId));
  const messagesEndRef = useRef(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  
  // Join/leave room
  // useEffect(() => {
  //   if (roomId) {
  //     joinRoom(roomId);
  //     return () => leaveRoom(roomId);
  //   }
  // }, [roomId]);

  // Initial message load
  useEffect(() => {
    if (roomId) {
      dispatch(fetchMessages({ roomId })).unwrap()
        .then(result => {
          setHasMore(result.hasMore);
        });
    }
  }, [roomId, dispatch]);

  // Mark messages as read
  useEffect(() => {
    if (roomId && messages.length > 0) {
      const unreadMessages = messages
        .filter(m => m.senderId !== currentProfile._id && m.status !== 'read')
        .map(m => m._id);

      if (unreadMessages.length > 0) {
        dispatch(markMessagesAsRead({ roomId, messageIds: unreadMessages }));
      }
    }
  }, [roomId, messages, currentProfile._id, dispatch]);

  // Load more messages
  const handleLoadMore = async () => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const firstMessage = messages[0];
      if (firstMessage) {
        const result = await dispatch(fetchMessages({ 
          roomId, 
          lastId: firstMessage._id 
        })).unwrap();
        setHasMore(result.hasMore);
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
    }
    setIsLoadingMore(false);
  };

  // Auto-scroll to bottom for new messages
  useEffect(() => {
    if (!isLoadingMore) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoadingMore]);

  if (!match) return null;

  return (
    <div className="flex flex-col h-full"> 
      {/* Header */}
      <div className="flex-none px-4 h-16 border-b border-border flex items-center justify-between bg-background-elevated">
        <div className="flex items-center gap-3">
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/messages')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={match.matchedProfile.photos[0]?.url} 
              alt={match.matchedProfile.name} 
            />
            <AvatarFallback>
              {match.matchedProfile.name[0]}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold">{match.matchedProfile.name}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0">       
      <div className="p-4 space-y-4"> 
        {hasMore && (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? 'Loading...' : 'Load earlier messages'}
            </Button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground mb-2">No messages yet</p>
            <p className="text-sm text-muted-foreground">
              Send a message to start the conversation
            </p>
          </div>
        ) : (
          messages.map(message => (
            <MessageBubble 
              key={message._id} 
              message={message} 
              match={match} 
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
      {/* Input */}
      <div className="flex-none p-4 mb-[4px] border-t border-border bg-background">
        <ChatInput matchId={matchId} roomId={roomId} />
      </div>
    </div>
  );
};

export default ChatRoom;