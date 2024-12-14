// utils/socket/socketMiddleware.js
import { 
  handleNewMessage, 
  handleMessageDelivered, 
  handleMessagesRead 
} from '../../store/slices/messagesSlice';
import { getSocket } from './socket';

const createSocketMiddleware = () => {
  return store => next => action => {
    switch (action.type) {
      case 'socket/initialize': {
        const socket = getSocket();
        if (!socket) return next(action);

        // Message receiving
        socket.on('message:receive', (data) => {
          store.dispatch(handleNewMessage({
            matchId: data.roomId,
            message: data.message
          }));
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

      case 'auth/logout': {
        const socket = getSocket();
        if (socket) {
          socket.off('message:receive');
          socket.off('message:delivered');
          socket.off('message:read_status');
          socket.off('message:error');
        }
        break;
      }
    }

    return next(action);
  };
};

export default createSocketMiddleware;