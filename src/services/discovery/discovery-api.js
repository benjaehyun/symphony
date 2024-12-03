import axios from 'axios';

const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL || '/api'}/discovery`,
  withCredentials: true
});

class DiscoveryAPI {
  static async getDiscoveryProfiles(lastId = null) {
    try {
      const params = lastId ? { lastId } : {};
      const response = await api.get('/profiles', { params });
      console.log('API Response:', response.data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  static async likeProfile(profileId) {
    try {
      const response = await api.post(`/profiles/${profileId}/like`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  static async dislikeProfile(profileId) {
    try {
      const response = await api.post(`/profiles/${profileId}/dislike`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Error handling
  static handleError(error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Discovery operation failed');
    } else if (error.request) {
      throw new Error('Network error. Please try again.');
    } else {
      throw new Error('An unexpected error occurred');
    }
  }
}

// Reuse the same interceptor pattern from profile-api
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

export default DiscoveryAPI;