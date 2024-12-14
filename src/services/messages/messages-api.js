import axios from 'axios';

const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL || '/api'}/messages`,
  withCredentials: true
});

class MessagesAPI {
  static async getMessages(roomId, lastId = null, limit = 50) {
    try {
      const params = { limit };
      if (lastId) params.lastId = lastId;
      
      const response = await api.get(`/${roomId}`, { params });
      return {
        messages: response.data.messages,
        hasMore: response.data.hasMore,
        lastId: response.data.lastId
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  static async getConversationPreviews() {
    try {
      const response = await api.get('/conversations/preview');
      return response.data.conversations;
    } catch (error) {
      this.handleError(error);
    }
  }

  static async sendMessage(roomId, content, clientId) {
    try {
      const response = await api.post(`/${roomId}`, {
        content,
        clientId
      });
      return response.data.message;
    } catch (error) {
      this.handleError(error);
    }
  }

  static async markMessagesAsRead(roomId, messageIds) {
    try {
      const response = await api.patch(`/${roomId}/read`, {
        messageIds
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Error handling
  static handleError(error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Message operation failed');
    } else if (error.request) {
      throw new Error('Network error. Please try again.');
    } else {
      throw new Error('An unexpected error occurred');
    }
  }
}

// Reuse the same interceptor pattern from your other APIs
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (originalRequest._retry || 
        error.response?.status === 404 ||
        error.response?.status !== 401 ||
        originalRequest.url.includes('/auth/refresh')) 
    {
      return Promise.reject(error);
    }

    try {
      originalRequest._retry = true;
      await axios.post(
        `${process.env.REACT_APP_API_URL || '/api'}/auth/refresh`,
        null,
        { withCredentials: true }
      );
      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(error);
    }
  }
);

export default MessagesAPI;