export const FEATURE_RANGES = {
  acousticness: { min: 0, max: 1 },
  danceability: { min: 0, max: 1 },
  energy: { min: 0, max: 1 },
  instrumentalness: { min: 0, max: 1 },
  valence: { min: 0, max: 1 },
  tempo: { min: 0, max: 250 },
  loudness: { min: -60, max: 0 }
};

export const AVAILABLE_FEATURES = {
  basic: [
    'acousticness',
    'danceability',
    'energy',
    'instrumentalness',
    'valence'
  ],
  extended: {
    genres: 'artist endpoint',
    artistInfo: 'artist endpoint',
    recentlyPlayed: 'recently-played endpoint',
    topTracks: 'top-tracks endpoint'
  }
};

export const AUTH_STATUS = {
  IDLE: 'idle',
  AUTHENTICATING: 'authenticating',
  AUTHENTICATED: 'authenticated',
  FAILED: 'failed'
};

export const SPOTIFY_SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-library-read',
  'user-read-recently-played'
];

export const SPOTIFY_AUTH_ENDPOINTS = {
  authorize: 'https://accounts.spotify.com/authorize',
  token: 'https://accounts.spotify.com/api/token'
};