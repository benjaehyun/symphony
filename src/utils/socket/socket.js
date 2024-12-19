import io from 'socket.io-client';
import { store } from '../../store';
import axios from 'axios'; 
import { logout } from '../../store/slices/authSlice';

let socket = null;

export const initializeSocket = () => {
  if (socket?.connected) {
    return socket;
  }

  const { auth } = store.getState();
  const { profile } = store.getState().profile;
  
  if (auth.status !== 'authenticated' || !profile) {
    return null;
  }

  socket = io(process.env.REACT_APP_SOCKET_URL, {
    autoConnect: true,
    withCredentials: true
  });

  socket.on('connect', () => {
    // Join user-specific room on connect/reconnect
    socket.emit('user:identify', { userId: profile._id });
  });

  socket.on('connect_error', async (error) => {
    if (error.message === 'auth_error') {
      try {
        await axios.post(
          `${process.env.REACT_APP_API_URL || '/api'}/auth/refresh`,
          null,
          { withCredentials: true }
        );
        socket.connect();
      } catch (refreshError) {
        store.dispatch(logout());
      }
    }
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket.removeAllListeners();  // Remove any remaining listeners
    socket = null;  // Clear the socket instance
  }
};

// Core messaging functions
export const joinRoom = (roomId) => {
  if (!socket) return;
  socket.emit('room:join', { roomId });
};

export const leaveRoom = (roomId) => {
  if (!socket) return;
  socket.emit('room:leave', { roomId });
};

export const sendMessage = (roomId, content, senderId, clientId) => {
  if (!socket) return false;
  socket.emit('message:send', {
    roomId,
    content,
    senderId,
    clientId
  });
  return true;
};

export const confirmMessageDelivery = (roomId, messageId) => {
  if (!socket) return;
  socket.emit('message:delivery_confirm', { roomId, messageId });
};

export const markMessagesAsRead = (roomId, messageIds) => {
  if (!socket) return;
  socket.emit('message:read', { roomId, messageIds });
};