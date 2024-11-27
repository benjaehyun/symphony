import axios from 'axios';

// Create base axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  withCredentials: true, // Important for cookie handling
  headers: {
    'Content-Type': 'application/json'
  }
});

class AuthAPI {
  // User authentication
  static async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  static async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  static async storeSpotifyTokens(tokenData) {
    try {
      const response = await api.post('/auth/spotify/store-tokens', {
        // spotifyId: tokenData.spotifyId,
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        expiresIn: tokenData.expiresIn,
        scope: tokenData.scope
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
  
  static async updateSpotifyTokens(tokenData) {
    try {
      const response = await api.put('/auth/spotify/update-tokens', {
        accessToken: tokenData.accessToken,
        expiresIn: tokenData.expiresIn
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  static async getSpotifyTokens() {
    try {
      const response = await api.get('/auth/spotify/tokens');
      return response.data;
    } catch (error) {
      // Return null instead of throwing if tokens aren't found
      if (error.response?.status === 404) {
        return null;
      }
      this.handleError(error);
    }
  }

  static async logout() {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  static async checkAuthStatus() {
    try {
      const response = await api.get('/auth/status');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Error handling
  static handleError(error) {
    if (error.response) {
      // Server responded with error
      throw new Error(error.response.data.message || 'Authentication failed');
    } else if (error.request) {
      // Request made but no response
      throw new Error('Network error. Please try again.');
    } else {
      // Something else went wrong
      throw new Error('An unexpected error occurred');
    }
  }
}

// Axios interceptors for handling auth
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Handle token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh token
        await api.post('/auth/refresh');
        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Handle refresh failure
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default AuthAPI;