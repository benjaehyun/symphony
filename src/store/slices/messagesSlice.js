import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import MessagesAPI from '../../services/messages/messages-api';
import { getSocket, sendMessage as socketSendMessage } from '../../utils/socket/socket';

// Thunks
export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async ({ roomId, lastId }, { rejectWithValue }) => {
    try {
      const response = await MessagesAPI.getMessages(roomId, lastId);
      return {
        roomId,
        messages: response.messages,
        hasMore: response.hasMore,
        lastId: response.lastId
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchConversationPreviews = createAsyncThunk(
  'messages/fetchConversationPreviews',
  async (_, { rejectWithValue }) => {
    try {
      return await MessagesAPI.getConversationPreviews();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async ({ content, matchId, roomId, senderId }, { getState }) => {
    try {
      const clientId = `temp_${Date.now()}`;
      const socket = getSocket();

      if (!socket?.connected) {
        // Fallback to REST if socket not available
        const message = await MessagesAPI.sendMessage(roomId, content, clientId);
        return { matchId: roomId, message };
      }

      // Use socket for sending
      socketSendMessage(roomId, content, senderId, clientId);

      // Return optimistic update data
      return {
        matchId: roomId,
        message: {
          _id: clientId,
          content,
          senderId,
          roomId,
          createdAt: new Date().toISOString(),
          status: 'sending',
          clientId
        }
      };
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }
);

export const markMessagesAsRead = createAsyncThunk(
  'messages/markAsRead',
  async ({ roomId, messageIds }, { rejectWithValue }) => {
    try {
      await MessagesAPI.markMessagesAsRead(roomId, messageIds);
      return { roomId, messageIds };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  messagesByRoom: {},
  conversationPreviews: {},
  loading: false,
  error: null,
  hasMore: true
};

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    handleNewMessage: (state, action) => {
      const { message } = action.payload;
      const roomId = message.roomId;
      
      if (!state.messagesByRoom[roomId]) {
        state.messagesByRoom[roomId] = [];
      }
      
      // Handle temporary/duplicate messages
      const tempMessageIndex = state.messagesByRoom[roomId].findIndex(
        m => (m.clientId === message.clientId) || 
            (m._id.startsWith('temp_') && 
             m.content === message.content &&
             m.senderId === message.senderId &&
             new Date(m.createdAt).getTime() >= new Date(message.createdAt).getTime() - 5000)
      );

      if (tempMessageIndex !== -1) {
        state.messagesByRoom[roomId][tempMessageIndex] = message;
      } else {
        const isDuplicate = state.messagesByRoom[roomId].some(
          existingMsg => existingMsg._id === message._id
        );
        if (!isDuplicate) {
          state.messagesByRoom[roomId].push(message);
        }
      }

      // Update conversation preview
      state.conversationPreviews[roomId] = message;
    },

    handleMessageDelivered: (state, action) => {
      const { roomId, messageId, deliveredAt } = action.payload;
      const message = state.messagesByRoom[roomId]?.find(m => m._id === messageId);
      if (message) {
        message.status = 'delivered';
        message.deliveredAt = deliveredAt;
      }
    },

    handleMessagesRead: (state, action) => {
      const { roomId, messageIds, readAt } = action.payload;
      const messages = state.messagesByRoom[roomId];
      if (messages) {
        messages.forEach(message => {
          if (messageIds.includes(message._id)) {
            message.status = 'read';
            message.readAt = readAt;
          }
        });
      }
    },

    clearMessages: (state, action) => {
      const { roomId } = action.payload;
      delete state.messagesByRoom[roomId];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Messages
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { roomId, messages, hasMore } = action.payload;
        if (!state.messagesByRoom[roomId]) {
          state.messagesByRoom[roomId] = [];
        }
        
        // Append or prepend based on pagination direction
        if (action.meta.arg.lastId) {
          state.messagesByRoom[roomId] = [...messages, ...state.messagesByRoom[roomId]];
        } else {
          state.messagesByRoom[roomId] = messages;
        }
        
        state.hasMore = hasMore;
        state.loading = false;
      })

      // Fetch Conversation Previews
      .addCase(fetchConversationPreviews.fulfilled, (state, action) => {
        action.payload.forEach(preview => {
          state.conversationPreviews[preview._id] = preview.lastMessage;
        });
      })

      // Send Message
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { matchId, message } = action.payload;
        if (!state.messagesByRoom[matchId]) {
          state.messagesByRoom[matchId] = [];
        }
        state.messagesByRoom[matchId].push(message);
      })
      
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        const { roomId, messageIds } = action.payload;
        
        // Update messages
        const messages = state.messagesByRoom[roomId];
        if (messages) {
          messages.forEach(message => {
            if (messageIds.includes(message._id)) {
              message.status = 'read';
              message.readAt = new Date().toISOString();
            }
          });
        }
      
        // Update preview
        const preview = state.conversationPreviews[roomId];
        if (preview && messageIds.includes(preview._id)) {
          preview.status = 'read';
          preview.readAt = new Date().toISOString();
        }
      });
  }
});

export const { 
  handleNewMessage, 
  handleMessageDelivered, 
  handleMessagesRead, 
  clearMessages 
} = messagesSlice.actions;

// Selectors
export const selectMessages = (state, roomId) => state.messages.messagesByRoom[roomId] || [];
export const selectMessagesLoading = (state) => state.messages.loading;
export const selectHasMore = (state) => state.messages.hasMore;
export const selectConversationPreview = (state, roomId) => 
  state.messages.conversationPreviews[roomId];

export default messagesSlice.reducer;