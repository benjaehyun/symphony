import { Buffer } from 'buffer';
import { SPOTIFY_SCOPES, SPOTIFY_AUTH_ENDPOINTS } from './constants';
import AuthAPI from '../auth/auth-api';

export class SpotifyAuthService {
  constructor() {
    this.clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
    this.redirectUri = process.env.REACT_APP_SPOTIFY_REDIRECT_URI;
    this.tokenEndpoint = SPOTIFY_AUTH_ENDPOINTS.token;
    this.scope = SPOTIFY_SCOPES.join(' ');
  }

  async generateAuthUrl() {
    const state = this.generateRandomString(16);
    const codeVerifier = this.generateRandomString(64);
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    return {
      url: `https://accounts.spotify.com/authorize?${new URLSearchParams({
        response_type: 'code',
        client_id: this.clientId,
        scope: this.scope,
        redirect_uri: this.redirectUri,
        state: state,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge
      })}`,
      state,
      codeVerifier
    };
  }

  async handleAuthCallback(code, storedCodeVerifier) {
    try {
      // Get tokens from Spotify
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        code_verifier: storedCodeVerifier
      });

      const response = await fetch(this.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      if (!response.ok) {
        throw new SpotifyAuthError('Failed to get access token', response.status);
      }

      const tokens = await response.json();

      // Store tokens in our backend
      await AuthAPI.storeSpotifyTokens({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
        scope: tokens.scope.split(' ')
      });

      return tokens;
    } catch (error) {
      console.error('Spotify auth error:', error);
      throw error;
    }
  }

  async refreshAccessToken(refreshToken) {
    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId
      });

      const response = await fetch(this.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      if (!response.ok) {
        throw new SpotifyAuthError('Failed to refresh token', response.status);
      }

      const tokens = await response.json();

      // Update tokens in backend
      await AuthAPI.updateSpotifyTokens({
        accessToken: tokens.access_token,
        expiresIn: tokens.expires_in
      });

      return tokens;
    } catch (error) {
      throw new SpotifyAuthError('Failed to refresh token', error.statusCode);
    }
  }

  async getStoredTokens() {
    try {
      const response = await AuthAPI.getSpotifyTokens();
      if (!response) return null;
      
      return {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt: response.expiresAt
      };
    } catch (error) {
      console.error('Failed to get stored tokens:', error);
      return null;
    }
  }

  // Helper methods 
  generateRandomString(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    // return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    //   .map(x => possible[x % possible.length])
    //   .join('');
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
  }

  async generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    
    return Buffer.from(digest)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}

export class SpotifyAuthError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'SpotifyAuthError';
    this.statusCode = statusCode;
  }
}