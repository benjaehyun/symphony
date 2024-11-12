import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { SpotifyAuthService } from '../../services/spotify/SpotifyAuthService';
import { SpotifyTokenManager } from '../../services/spotify/SpotifyTokenManager';
import { AUTH_STATUS } from '../../services/spotify/constants';

const authService = new SpotifyAuthService();
const tokenManager = new SpotifyTokenManager(authService);

// Async thunks
export const initiateSpotifyAuth = createAsyncThunk(
  'auth/initiateSpotifyAuth',
  async (_, { rejectWithValue }) => {
    try {
      const { url, state, codeVerifier } = await authService.generateAuthUrl();
      return { authUrl: url, state, codeVerifier };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const handleSpotifyCallback = createAsyncThunk(
  'auth/handleSpotifyCallback',
  async ({ code, state }, { getState, rejectWithValue }) => {
    try {
      const { codeVerifier, savedState } = getState().auth.spotify;
      
      if (state !== savedState) {
        throw new Error('State mismatch in OAuth callback');
      }

      const tokens = await authService.handleAuthCallback(code, codeVerifier);
      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Date.now() + (tokens.expires_in * 1000)
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const refreshSpotifyToken = createAsyncThunk(
  'auth/refreshSpotifyToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { refreshToken } = getState().auth.spotify;
      const tokens = await tokenManager.refreshToken(refreshToken);
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState = {
  status: AUTH_STATUS.IDLE,
  error: null,
  user: null,
  spotify: {
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    codeVerifier: null,
    savedState: null,
    authUrl: null
  },
  onboarding: {
    step: 'initial',
    completed: false
  }
};

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    resetAuth: (state) => {
      state.status = AUTH_STATUS.IDLE;
      state.error = null;
      state.spotify = {
        ...initialState.spotify
      };
    },
    setOnboardingStep: (state, action) => {
      state.onboarding.step = action.payload;
    },
    completeOnboarding: (state) => {
      state.onboarding.completed = true;
    },
    logout: (state) => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      // Initiate Spotify Auth
      .addCase(initiateSpotifyAuth.pending, (state) => {
        state.status = AUTH_STATUS.AUTHENTICATING;
        state.error = null;
      })
      .addCase(initiateSpotifyAuth.fulfilled, (state, action) => {
        state.spotify.authUrl = action.payload.authUrl;
        state.spotify.codeVerifier = action.payload.codeVerifier;
        state.spotify.savedState = action.payload.state;
      })
      .addCase(initiateSpotifyAuth.rejected, (state, action) => {
        state.status = AUTH_STATUS.FAILED;
        state.error = action.payload;
      })
      // Handle Spotify Callback
      .addCase(handleSpotifyCallback.pending, (state) => {
        state.status = AUTH_STATUS.AUTHENTICATING;
        state.error = null;
      })
      .addCase(handleSpotifyCallback.fulfilled, (state, action) => {
        state.status = AUTH_STATUS.AUTHENTICATED;
        state.spotify.isAuthenticated = true;
        state.spotify.accessToken = action.payload.accessToken;
        state.spotify.refreshToken = action.payload.refreshToken;
        state.spotify.expiresAt = action.payload.expiresAt;
        // Clear OAuth state after successful authentication
        state.spotify.codeVerifier = null;
        state.spotify.savedState = null;
        state.spotify.authUrl = null;
      })
      .addCase(handleSpotifyCallback.rejected, (state, action) => {
        state.status = AUTH_STATUS.FAILED;
        state.error = action.payload;
      })
      // Refresh Token
      .addCase(refreshSpotifyToken.fulfilled, (state, action) => {
        state.spotify.accessToken = action.payload.accessToken;
        state.spotify.refreshToken = action.payload.refreshToken;
        state.spotify.expiresAt = action.payload.expiresAt;
      })
      .addCase(refreshSpotifyToken.rejected, (state, action) => {
        state.status = AUTH_STATUS.FAILED;
        state.error = action.payload;
        state.spotify.isAuthenticated = false;
      });
  }
});

export const { resetAuth, setOnboardingStep, completeOnboarding, logout } = authSlice.actions;

export const selectAuthStatus = (state) => state.auth.status;
export const selectSpotifyAuth = (state) => state.auth.spotify;
export const selectOnboarding = (state) => state.auth.onboarding;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;