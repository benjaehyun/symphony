import axios from 'axios';

const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL || '/api'}/matches`,
  withCredentials: true
});

class MatchesAPI {
  static async getMatches(page = 1, limit = 10) {
    try {
      const response = await api.get('/', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  static async getUnreadCount() {
    try {
      const response = await api.get('/unread/count');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  static async markMatchesAsRead(matchIds) {
    try {
      const response = await api.patch('/read', { matchIds });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  static async unmatch(matchId) {
    try {
      const response = await api.delete(`/${matchId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Error handling
  static handleError(error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Match operation failed');
    } else if (error.request) {
      throw new Error('Network error. Please try again.');
    } else {
      throw new Error('An unexpected error occurred');
    }
  }
}

// Reuse the same interceptor pattern
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

export default MatchesAPI;