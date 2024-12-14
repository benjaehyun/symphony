import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { selectConversationPreview } from '../../store/slices/messagesSlice';
import { Badge } from '../ui/badge';
import { generateRoomId } from '../../utils/messages/roomID';

const ConversationList = ({ matches, activeMatchId }) => {
  const currentProfile = useSelector(state => state.profile.profile);
  const conversationPreviews = useSelector(state => 
    matches.reduce((acc, match) => {
      // Generate roomId using the same method as ChatRoom
      const roomId = generateRoomId(currentProfile._id, match.matchedProfile._id);
      return {
        ...acc,
        [match._id]: selectConversationPreview(state, roomId)
      };
    }, {})
  );
  
  // Sort matches using the previews or match date
  const sortedMatches = [...matches].sort((a, b) => {
    const aPreview = conversationPreviews[a._id];
    const bPreview = conversationPreviews[b._id];
    return new Date(bPreview?.createdAt || b.matchedAt) - 
           new Date(aPreview?.createdAt || a.matchedAt);
  });
 
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold">Messages</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {sortedMatches.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No conversations yet
          </div>
        ) : (
          sortedMatches.map((match) => (
            <ConversationItem 
              key={match._id}
              match={match}
              isActive={match._id === activeMatchId}
              preview={conversationPreviews[match._id]}
            />
          ))
        )}
      </div>
    </div>
  );
};

const ConversationItem = ({ match, isActive, preview }) => {
  const navigate = useNavigate();
  const currentProfile = useSelector(state => state.profile.profile);
  const roomId = generateRoomId(currentProfile._id, match.matchedProfile._id);
  
  const isUnread = preview && 
    preview.senderId !== currentProfile._id && 
    preview.status !== 'read';

  const getPreviewText = () => {
    if (!preview) return 'Start a conversation';
    
    const prefix = preview.senderId === currentProfile._id ? 'You: ' : '';
    const maxLength = 40;
    const content = preview.content.length > maxLength 
      ? `${preview.content.slice(0, maxLength)}...` 
      : preview.content;
    
    return `${prefix}${content}`;
  };
  
  return (
    <div
      onClick={() => navigate(`/messages/${match._id}`)}
      className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-background-highlight transition-colors
        ${isActive ? 'bg-background-highlight' : ''}
        ${isUnread ? 'bg-background-elevated' : ''}`}
    >
      {/* Unread indicator */}
      {isUnread && (
        <div className="w-2 h-2 rounded-full bg-spotify-green flex-shrink-0" />
      )}
      
      <Avatar className="h-12 w-12 flex-shrink-0">
        <AvatarImage 
          src={match.matchedProfile.photos[0]?.url} 
          alt={match.matchedProfile.name} 
        />
        <AvatarFallback>
          {match.matchedProfile.name[0]}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <h3 className="font-semibold truncate">
            {match.matchedProfile.name}
          </h3>
          {preview && (
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {formatMessageTime(preview.createdAt)}
            </span>
          )}
        </div>
        
        <p className={`text-sm truncate ${
          isUnread ? 'text-foreground font-medium' : 'text-muted-foreground'
        }`}>
          {getPreviewText()}
        </p>
      </div>
    </div>
  );
};

const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  
  // If today, show time
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  // If this year, show date without year
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  // Otherwise show full date
  return date.toLocaleDateString([], { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

export default ConversationList;