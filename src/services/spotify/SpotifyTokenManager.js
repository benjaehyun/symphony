export class SpotifyTokenManager {
  constructor(authService) {
    this.authService = authService;
    this.tokenRefreshThreshold = 5 * 60 * 1000; // 5 minutes
    this._currentTokens = null;
  }

  async initialize() {
    try {
      // Get initial tokens from auth service
      const tokens = await this.authService.getStoredTokens();
      if (tokens) {
        this._currentTokens = tokens;
      }
    } catch (error) {
      console.error('Failed to initialize token manager:', error);
      throw error;
    }
  }

  async getValidAccessToken() {
    if (!this._currentTokens?.accessToken) {
      throw new Error('No access token available');
    }

    if (this.isTokenExpiringSoon(this._currentTokens.expiresAt)) {
      const newTokens = await this.refreshToken(this._currentTokens.refreshToken);
      this._currentTokens = newTokens;
    }

    return this._currentTokens.accessToken;
  }

  isTokenExpiringSoon(expiresAt) {
    return new Date(expiresAt).getTime() - this.tokenRefreshThreshold < Date.now();
  }

  async refreshToken(refreshToken) {
    try {
      const newTokens = await this.authService.refreshAccessToken(refreshToken);
      return {
        accessToken: newTokens.access_token,
        refreshToken: newTokens.refresh_token || refreshToken,
        expiresAt: Date.now() + (newTokens.expires_in * 1000)
      };
    } catch (error) {
      this._currentTokens = null; // Clear invalid tokens
      throw new Error('Failed to refresh token');
    }
  }
}