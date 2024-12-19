import { 
  handleNewMessage, 
  handleMessageDelivered, 
  handleMessagesRead 
} from '../../store/slices/messagesSlice';
import { getSocket, disconnectSocket } from './socket';
import { selectMatches } from '../../store/slices/matchesSlice';
import { getRoomConnectionStatus } from './getRoomConnectionStatus';
import { joinRoom, leaveRoom } from './socket';
import { generateRoomId } from '../messages/roomID';
import { handleNewMatch, handleMatchUnmatch } from '../../store/slices/matchesSlice';

const createSocketMiddleware = () => {
  let activeRooms = new Set();

  return store => next => action => {
    switch (action.type) {
      case 'socket/initialize': {
        const socket = getSocket();
        if (!socket) return next(action);

        // // Join rooms for all active matches
        const state = store.getState();
        const currentProfile = state.profile.profile;
        const matches = selectMatches(state);

        matches.forEach(match => {
          if (getRoomConnectionStatus({ match, currentProfile })) {
            const roomId = generateRoomId(currentProfile._id, match.matchedProfile._id);
            console.log(roomId)
            joinRoom(roomId);
            activeRooms.add(roomId);
          }
        });

        // Receiving new match
        socket.on('match:new', (data) => {
          const { match, roomId, unreadCount } = data;
          
          // Join the new chat
          joinRoom(roomId);
          activeRooms.add(roomId);
          
          // Update match state
          store.dispatch(handleNewMatch({
            match: match,
            matchId: match._id,
            unreadCount
          }));
        });

        socket.on('match:unmatch', (data) => {
          const { matchId } = data;
          store.dispatch(handleMatchUnmatch({ matchId }));
        });

        // Message receiving
        socket.on('message:receive', (data) => {
          const currentState = store.getState();
          const currentProfile = currentState.profile.profile;
          
          if (data.message.senderId !== currentProfile._id) {
            store.dispatch(handleNewMessage({
              message: data.message
            }));
          }
        });

        // Delivery confirmation
        socket.on('message:delivered', (data) => {
          store.dispatch(handleMessageDelivered({
            roomId: data.roomId,
            messageId: data.messageId,
            deliveredAt: data.deliveredAt
          }));
        });

        // Read status updates
        socket.on('message:read_status', (data) => {
          store.dispatch(handleMessagesRead({
            roomId: data.roomId,
            messageIds: data.messageIds,
            readAt: data.readAt
          }));
        });

        // Error handling
        socket.on('message:error', (data) => {
          console.error('Message error:', data);
          // Could dispatch an error action here if needed
        });
        break;
      }


      case 'socket/cleanup': {
        const socket = getSocket();
        if (socket) {
          // Get current state for user info
          const state = store.getState();
          const currentProfile = state.profile.profile;
          
          // Cancel any pending emit operations
          socket.sendBuffer = [];
          
          // Leave user-specific room
          if (currentProfile?._id) {
            socket.emit('room:leave', { roomId: `user:${currentProfile._id}` });
          }
      
          // Leave all active match/chat rooms
          activeRooms.forEach(roomId => {
            leaveRoom(roomId);
          });
          activeRooms.clear();
      
          // Remove all socket event listeners
          socket.off('match:new');
          socket.off('match:unmatch');
          socket.off('message:receive');
          socket.off('message:delivered');
          socket.off('message:read_status');
          socket.off('message:error');
      
          // Remove any custom socket properties
          delete socket.userId;
          delete socket.rooms;
      
          // Disconnect and clean up socket
          disconnectSocket();
        }
        break;
      }
    }

    return next(action);
  };
};

export default createSocketMiddleware;