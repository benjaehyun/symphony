import axios from 'axios';
import { AUTH_ERROR_CODES } from '../../utils/auth/authErrorCodes'

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
      throw {
        message: error.response.data.message || 'Authentication failed',
        code: error.response.data.code,
        status: error.response.status
      };
    } else if (error.request) {
      throw {
        message: 'Network error. Please try again.',
        code: 'NETWORK_ERROR'
      };
    } else {
      throw {
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR'
      };
    }
  }
}

// Axios interceptors for handling auth
// api.interceptors.response.use(
//   response => response,
//   async error => {
//     const originalRequest = error.config;
//     // const errorCode = error.response?.data?.code;
//     const errorCode = error.response?.code;
//     // Only attempt refresh for token-related 401s
//     if (error.response?.status === 401 && 
//       !originalRequest._retry && 
//       [
//         AUTH_ERROR_CODES.TOKEN_EXPIRED,
//         AUTH_ERROR_CODES.INVALID_TOKEN
//       ].includes(errorCode)) {
//       originalRequest._retry = true;
      
//       try {
//         await api.post('/auth/refresh');
//         return api(originalRequest);
//       } catch (refreshError) {
//         // If refresh fails, clear auth state and redirect to login
//         return Promise.reject(refreshError);
//       }
//     }

//     // Pass through non-token related auth errors
//     return Promise.reject(error);
//   }
// );

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Don't retry if:
    if (originalRequest._retry || // Already retried
        error.response?.status === 404 || // Not found (expected for new profiles)
        error.response?.status !== 401 || // Not an auth error
        originalRequest.url.includes('/auth/refresh')) // Is refresh token request
    {
      // Pass through the error to be handled by the calling code
      return Promise.reject(error);
    }

    try {
      originalRequest._retry = true; // Mark as retried
      await api.post('/auth/refresh');
      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(error); // Return original error if refresh fails
    }
  }
);

export default AuthAPI;