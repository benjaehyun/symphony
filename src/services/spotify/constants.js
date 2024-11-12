
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