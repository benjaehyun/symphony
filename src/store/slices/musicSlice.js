import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { SpotifyAPIService } from '../../services/spotify/SpotifyAPIService';

// Async thunks
export const fetchUserPlaylists = createAsyncThunk(
  'music/fetchUserPlaylists',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const spotifyAPI = new SpotifyAPIService(auth.spotify.tokenManager);
      return await spotifyAPI.fetchPlaylists();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchPlaylistTracks = createAsyncThunk(
  'music/fetchPlaylistTracks',
  async (playlistId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const spotifyAPI = new SpotifyAPIService(auth.spotify.tokenManager);
      return await spotifyAPI.fetchPlaylistSongs(playlistId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserTopTracks = createAsyncThunk(
  'music/fetchUserTopTracks',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const spotifyAPI = new SpotifyAPIService(auth.spotify.tokenManager);
      return await spotifyAPI.fetchTopSongs();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAudioFeatures = createAsyncThunk(
  'music/fetchAudioFeatures',
  async (trackIds, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const spotifyAPI = new SpotifyAPIService(auth.spotify.tokenManager);
      return await spotifyAPI.fetchSongFeatures(trackIds);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchEnhancedProfile = createAsyncThunk(
  'music/fetchEnhancedProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const spotifyAPI = new SpotifyAPIService(auth.spotify.tokenManager);
      return await spotifyAPI.getEnhancedUserProfile();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState = {
  loading: false,
  error: null,
  playlists: [],
  selectedPlaylist: null,
  topTracks: [],
  selectedTracks: [],
  audioFeatures: null,
  enhancedProfile: {
    genres: [],
    temporalPattern: [],
    recentTracks: [],
    artists: []
  },
  musicProfile: {
    energy: [],
    instrument: [],
    danceability: [],
    acousticness: [],
    valence: []
  }
};

// Slice
const musicSlice = createSlice({
  name: 'music',
  initialState,
  reducers: {
    resetMusicState: () => initialState,
    setSelectedPlaylist: (state, action) => {
      state.selectedPlaylist = action.payload;
    },
    setSelectedTracks: (state, action) => {
      state.selectedTracks = action.payload;
    },
    clearMusicError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Playlists
      .addCase(fetchUserPlaylists.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserPlaylists.fulfilled, (state, action) => {
        state.loading = false;
        state.playlists = action.payload.items;
      })
      .addCase(fetchUserPlaylists.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Playlist Tracks
      .addCase(fetchPlaylistTracks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlaylistTracks.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedTracks = action.payload.items;
      })
      .addCase(fetchPlaylistTracks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Top Tracks
      .addCase(fetchUserTopTracks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserTopTracks.fulfilled, (state, action) => {
        state.loading = false;
        state.topTracks = action.payload.items;
      })
      .addCase(fetchUserTopTracks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Audio Features
      .addCase(fetchAudioFeatures.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAudioFeatures.fulfilled, (state, action) => {
        state.loading = false;
        state.audioFeatures = action.payload;
        // Process audio features into music profile
        state.musicProfile = processMusicProfile(action.payload);
      })
      .addCase(fetchAudioFeatures.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Enhanced Profile
      .addCase(fetchEnhancedProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEnhancedProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.enhancedProfile = action.payload;
      })
      .addCase(fetchEnhancedProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// Helper function to process audio features into music profile
function processMusicProfile(features) {
  return {
    energy: features.map(f => f.energy),
    instrument: features.map(f => f.instrumentalness),
    danceability: features.map(f => f.danceability),
    acousticness: features.map(f => f.acousticness),
    valence: features.map(f => f.valence)
  };
}

// Actions
export const { 
  resetMusicState, 
  setSelectedPlaylist, 
  setSelectedTracks, 
  clearMusicError 
} = musicSlice.actions;

// Selectors
export const selectMusicLoading = (state) => state.music.loading;
export const selectMusicError = (state) => state.music.error;
export const selectPlaylists = (state) => state.music.playlists;
export const selectSelectedPlaylist = (state) => state.music.selectedPlaylist;
export const selectTopTracks = (state) => state.music.topTracks;
export const selectSelectedTracks = (state) => state.music.selectedTracks;
export const selectAudioFeatures = (state) => state.music.audioFeatures;
export const selectMusicProfile = (state) => state.music.musicProfile;
export const selectEnhancedProfile = (state) => state.music.enhancedProfile;

export default musicSlice.reducer;