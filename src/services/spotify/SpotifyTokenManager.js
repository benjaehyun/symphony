export class SpotifyTokenManager {
  constructor(authService) {
    this.authService = authService;
    this.tokenRefreshThreshold = 5 * 60 * 1000; // 5 minutes 
  }

  async getValidAccessToken(tokens) {
    if (!tokens?.accessToken) {
      throw new Error('No access token available');
    }

    if (this.isTokenExpiringSoon(tokens.expiresAt)) {
      const newTokens = await this.refreshToken(tokens.refreshToken);
      return newTokens.accessToken;
    }

    return tokens.accessToken;
  }

  isTokenExpiringSoon(expiresAt) {
    return new Date(expiresAt).getTime() - this.tokenRefreshThreshold < Date.now();
  }

  async refreshToken(refreshToken) {
    try {
      const response = await this.authService.refreshAccessToken(refreshToken);
      return {
        accessToken: response.access_token,
        refreshToken: response.refresh_token || refreshToken,
        expiresAt: Date.now() + (response.expires_in * 1000)
      };
    } catch (error) {
      throw new Error('Failed to refresh token');
    }
  }
}