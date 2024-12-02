import axios from 'axios';

const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL || '/api'}/profiles`,
  withCredentials: true,
  headers: {
    // 'Content-Type': 'application/json'
  }
});

class ProfileAPI {
  // Basic Profile Operations
  static async createProfile(initialData) {
    try {
      const response = await api.post('/', initialData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  static async getProfile() {
    try {
      const response = await api.get('/');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
  static async initializeProfile() {
    try {
      const response = await api.get('/initialize');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  static async checkProfileStatus() {
    try {
      const response = await api.get('/status');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Profile Creation Steps
  static async updateBasicInfo(basicInfo) {
    try {
      const response = await api.put('/basic-info', basicInfo);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  static async uploadPhotos(formData, onProgress) {
    // Set correct headers for multipart/form-data
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: progressEvent => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      }
    };
  
    try {
      const response = await api.post('/photos', formData, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  static async deletePhoto(photoId) {
    try {
      const response = await api.delete(`/photos/${photoId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  static async reorderPhotos(photoOrder) {
    try {
      const response = await api.put('/photos/reorder', { photoOrder });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  static async updateMusicProfile(musicData) {
    try {
      const response = await api.put('/music-profile', {
        sourceType: musicData.sourceType,
        sourceId: musicData.sourceId,
        tracks: musicData.tracks,
        analysis: {
          averageFeatures: musicData.analysis.averageFeatures,
          genreDistribution: musicData.analysis.genreDistribution,
          musicDimensions: musicData.analysis.musicDimensions
        },
        lastUpdated: musicData.lastUpdated
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  static async updatePreferences(preferences) {
    try {
      const response = await api.put('/preferences', preferences);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Profile Completion
  static async completeProfile(profileData) {
    try {
      const response = await api.post('/complete', profileData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Error handling
  static handleError(error) {
    if (error.response) {
      // Server responded with error
      throw new Error(error.response.data.message || 'Profile operation failed');
    } else if (error.request) {
      // Request made but no response
      throw new Error('Network error. Please try again.');
    } else {
      // Something else went wrong
      throw new Error('An unexpected error occurred');
    }
  }
}

// Axios interceptors for handling auth and errors
api.interceptors.request.use(
  config => {
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

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
      await axios.post(
        `${process.env.REACT_APP_API_URL || '/api'}/auth/refresh`, 
        null, 
        { withCredentials: true }
      );
      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(error); // Return original error if refresh fails
    }
  }
);

export default ProfileAPI;