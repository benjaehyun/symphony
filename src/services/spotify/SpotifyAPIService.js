import axios from 'axios';
import axiosRetry from 'axios-retry';
import pLimit from 'p-limit';
import { RateLimiter } from 'limiter';

export class SpotifyAPIService {
  constructor(tokenManager) {
    this.baseUrl = 'https://api.spotify.com/v1';
    this.tokenManager = tokenManager;
    this.limiter = new RateLimiter({ tokensPerInterval: 30, interval: 'second' });
    this.concurrencyLimit = pLimit(5);
    this.cache = new SpotifyAPICache();

    this.api = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000
    });

    axiosRetry(this.api, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          error.response?.status === 429;
      }
    });

    this.api.interceptors.request.use(async (config) => {
      const token = await this.tokenManager.getValidAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  async makeRequest(requestFn, cacheKey = null) {
    if (cacheKey) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    await this.limiter.removeTokens(1);
    const result = await this.concurrencyLimit(requestFn);

    if (cacheKey) {
      this.cache.set(cacheKey, result);
    }

    return result;
  }

  async getEnhancedUserProfile() {
    try {
      const [
        audioFeatures,
        topTracks,
        recentlyPlayed,
        topArtists
      ] = await Promise.all([
        this.fetchTopSongsWithFeatures(),
        this.fetchTopSongs('long_term', 50),
        this.fetchRecentlyPlayed(50),
        this.fetchTopArtists('long_term', 50)
      ]);

      const genres = new Set();
      topArtists.items.forEach(artist => {
        artist.genres.forEach(genre => genres.add(genre));
      });

      const temporalPattern = this.analyzeDailyPattern(recentlyPlayed.items);

      return {
        audioFeatures,
        topTracks: topTracks.items,
        recentTracks: recentlyPlayed.items,
        genres: Array.from(genres),
        artists: topArtists.items,
        temporalPattern
      };
    } catch (error) {
      throw new SpotifyAPIError('Failed to fetch enhanced profile', error);
    }
  }

  async fetchPlaylists(limit = 50, offset = 0) {
    try {
      // Create cache key that includes pagination params
      const cacheKey = `playlists-${limit}-${offset}`;
      
      const response = await this.makeRequest(
        () => this.api.get('/me/playlists', {
          params: {
            limit,
            offset,
            // Optimize response size by specifying needed fields
            fields: 'items(id,name,images,description,tracks.total),total,limit,offset'
          }
        }),
        cacheKey
      );
  
      // Validate response
      if (!response?.data?.items) {
        throw new SpotifyAPIError('Invalid playlist response format', {
          status: 500,
          message: 'Malformed response'
        });
      }
  
      // Return with pagination metadata
      return {
        items: response.data.items,
        total: response.data.total,
        limit: response.data.limit,
        offset: response.data.offset,
        hasMore: (offset + response.data.items.length) < response.data.total
      };
  
    } catch (error) {
      if (error.response?.status === 429) {
        throw new SpotifyAPIError('Rate limit exceeded. Please try again later.', error);
      }
      if (error.response?.status === 401) {
        throw new SpotifyAPIError('Spotify authorization expired', error);
      }
      throw new SpotifyAPIError('Failed to fetch playlists', error);
    }
  }

  async fetchSongFeatures(songIds) {
    if (!songIds?.length) return [];

    try {
      const chunks = this.chunkArray(songIds, 100);
      const features = await Promise.all(
        chunks.map(chunk =>
          this.makeRequest(
            () => this.api.get('/audio-features', {
              params: { ids: chunk.join(',') }
            }),
            `features-${chunk.join(',')}`
          )
        )
      );

      return features
        .flatMap(response => response.data.audio_features)
        .filter(Boolean);
    } catch (error) {
      throw new SpotifyAPIError('Failed to fetch song features', error);
    }
  }

  async fetchTopSongs(timeRange = 'medium_term', limit = 20) {
    try {
      const response = await this.makeRequest(
        () => this.api.get('/me/top/tracks', {
          params: { time_range: timeRange, limit }
        }),
        `top-songs-${timeRange}-${limit}`
      );
      return response.data;
    } catch (error) {
      throw new SpotifyAPIError('Failed to fetch top songs', error);
    }
  }

  async fetchPlaylistSongs(playlistId, limit = 20) {
    try {
      const response = await this.makeRequest(
        () => this.api.get(`/playlists/${playlistId}/tracks`, {
          params: {
            limit,
            fields: 'items(track(album(name),artists(id,name),id,name))'
          }
        }),
        `playlist-${playlistId}-${limit}`
      );
      return response.data;
    } catch (error) {
      throw new SpotifyAPIError('Failed to fetch playlist songs', error);
    }
  }

  async fetchRecentlyPlayed(limit = 50) {
    try {
      const response = await this.makeRequest(
        () => this.api.get('/me/player/recently-played', {
          params: { limit }
        })
      );
      return response.data;
    } catch (error) {
      throw new SpotifyAPIError('Failed to fetch recently played', error);
    }
  }

  async fetchTopArtists(timeRange = 'medium_term', limit = 20) {
    try {
      const response = await this.makeRequest(
        () => this.api.get('/me/top/artists', {
          params: { time_range: timeRange, limit }
        }),
        `top-artists-${timeRange}-${limit}`
      );
      return response.data;
    } catch (error) {
      throw new SpotifyAPIError('Failed to fetch top artists', error);
    }
  }

  async fetchTopSongsWithFeatures() {
    const topSongs = await this.fetchTopSongs('medium_term', 50);
    const songIds = topSongs.items.map(track => track.id);
    const features = await this.fetchSongFeatures(songIds);
    
    return features.map((feature, index) => ({
      ...feature,
      track: topSongs.items[index]
    }));
  }

  // async testConnection() {
  //   try {
  //     // Try to fetch the user's profile as a connection test
  //     await this.makeRequest(
  //       () => this.api.get('/me'),
  //       'test-connection'
  //     );
  //     return true;
  //   } catch (error) {
  //     throw new SpotifyAPIError('Failed to connect to Spotify API', error);
  //   }
  // }


async getArtists(artistIds) {
  if (!artistIds?.length) return [];

  try {
    // Spotify API has a limit of 50 artists per request
    const chunks = this.chunkArray(artistIds, 50);
    const artistPromises = chunks.map(chunk =>
      this.makeRequest(
        () => this.api.get('/artists', {
          params: { ids: chunk.join(',') }
        }),
        `artists-${chunk.join(',')}`
      )
    );

    const responses = await Promise.all(artistPromises);
    return {
      artists: responses.flatMap(response => response.data.artists)
    };
  } catch (error) {
    throw new SpotifyAPIError('Failed to fetch artists', error);
  }
}

  // Helper methods
  analyzeDailyPattern(history) {
    const pattern = new Array(24).fill(0);
    
    history.forEach(entry => {
      const hour = new Date(entry.played_at).getHours();
      pattern[hour]++;
    });

    const max = Math.max(...pattern);
    return pattern.map(value => value / max);
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

export class SpotifyAPIError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'SpotifyAPIError';
    this.statusCode = originalError.response?.status;
    this.spotifyError = originalError.response?.data?.error;
    this.originalError = originalError;
  }
}

export class SpotifyAPICache {
  constructor(ttl = 3600000) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl
    });
  }
}