const AUTH_ERROR_CODES = {
    // Registration Errors
    EMAIL_EXISTS: 'EMAIL_EXISTS',
    INVALID_EMAIL_FORMAT: 'INVALID_EMAIL_FORMAT',
    WEAK_PASSWORD: 'WEAK_PASSWORD',
    INVALID_NAME: 'INVALID_NAME',
    
    // Login Errors
    EMAIL_NOT_FOUND: 'EMAIL_NOT_FOUND',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
    
    // Token Errors
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    INVALID_TOKEN: 'INVALID_TOKEN',
    NO_TOKEN: 'NO_TOKEN',
    REFRESH_TOKEN_EXPIRED: 'REFRESH_TOKEN_EXPIRED',
    
    // Spotify Auth Errors
    SPOTIFY_AUTH_FAILED: 'SPOTIFY_AUTH_FAILED',
    SPOTIFY_NOT_CONNECTED: 'SPOTIFY_NOT_CONNECTED',
    SPOTIFY_TOKEN_EXPIRED: 'SPOTIFY_TOKEN_EXPIRED',
    
    // General Errors
    NETWORK_ERROR: 'NETWORK_ERROR',
    SERVER_ERROR: 'SERVER_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR'
  };

  module.exports = AUTH_ERROR_CODES;