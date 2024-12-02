import { SpotifyAPIService } from './SpotifyAPIService';
import { SpotifyTokenManager } from './SpotifyTokenManager';
import { SpotifyAuthService } from './SpotifyAuthService';

class SpotifyAPIInstance {
  constructor() {
    this._instance = null;
    this._initializationPromise = null;
  }

  async initialize() {
    if (this._initializationPromise) {
      return this._initializationPromise;
    }

    if (this._instance) {
      return this._instance;
    }

    this._initializationPromise = (async () => {
      try {
        console.log('Initializing Spotify API...');
        
        const authService = new SpotifyAuthService();
        const tokenManager = new SpotifyTokenManager(authService);
        
        // Initialize token manager first
        await tokenManager.initialize();
        
        // Create API service with initialized token manager
        this._instance = new SpotifyAPIService(tokenManager);
        
        // Test connection
        // await this._instance.testConnection();
        console.log('Spotify API initialized successfully');
        
        return this._instance;
      } catch (error) {
        console.error('Failed to initialize Spotify API:', error);
        this._instance = null; // Clear failed instance
        throw error;
      } finally {
        this._initializationPromise = null;
      }
    })();

    return this._initializationPromise;
  }

  getInstance() {
    if (!this._instance) {
      throw new Error('Spotify API not initialized. Call initialize() first.');
    }
    return this._instance;
  }

  reset() {
    this._instance = null;
    this._initializationPromise = null;
  }
}

export const spotifyAPI = new SpotifyAPIInstance();