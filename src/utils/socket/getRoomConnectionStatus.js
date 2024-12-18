import { generateRoomId } from "../messages/roomID";

export const getRoomConnectionStatus = ({
    match,
    currentProfile,
  }) => {
    // Only care about active matches
    return match.status === 'active';
  };

// export const getRoomConnectionStatus = ({
//     match,
//     currentProfile,
//     messagesByRoom,
//     conversationPreviews
//   }) => {
//     // Constants 
//     const ACTIVE_THRESHOLD = 30 * 24 * 60 * 60 * 1000; // 30 days
//     const RECENT_THRESHOLD = 7 * 24 * 60 * 60 * 1000;  // 7 days
  
//     const roomId = generateRoomId(currentProfile._id, match.matchedProfile._id);
//     const messages = messagesByRoom[roomId];
//     const lastMessage = conversationPreviews[match._id];
  
//     // Always stay connected if:
//     // 1. Match is active AND either:
//     //    - Has unread messages
//     //    - Has activity within last 7 days
//     // 2. Match has any activity within last 30 days
//     if (match.status === 'active') {
//       // Check for unread messages
//       const hasUnread = messages?.some(msg => 
//         msg.senderId !== currentProfile._id && msg.status !== 'read'
//       );
//       if (hasUnread) return true;
  
//       // Check for recent activity
//       if (lastMessage) {
//         const timeSinceLastMessage = Date.now() - new Date(lastMessage.createdAt).getTime();
//         if (timeSinceLastMessage < RECENT_THRESHOLD) return true;
//       }
//     }
  
//     // Check for any activity within extended threshold
//     if (lastMessage) {
//       const timeSinceLastMessage = Date.now() - new Date(lastMessage.createdAt).getTime();
//       return timeSinceLastMessage < ACTIVE_THRESHOLD;
//     }
  
//     return false;
//   };