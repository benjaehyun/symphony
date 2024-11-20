import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AuthAPI from '../../services/auth/auth-api';
import { SpotifyAuthService } from '../../services/spotify/SpotifyAuthService';
import { SpotifyTokenManager } from '../../services/spotify/SpotifyTokenManager';
import { AUTH_STATUS, SPOTIFY_AUTH_STATUS } from '../../services/spotify/constants';

const authService = new SpotifyAuthService();
const tokenManager = new SpotifyTokenManager(authService);

// App Auth Thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await AuthAPI.login(credentials);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await AuthAPI.register(userData);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Spotify Auth Thunks
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

      // This now stores tokens in backend
      await authService.handleAuthCallback(code, codeVerifier);
      
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const handleAuthSuccess = createAsyncThunk(
  'auth/handleAuthSuccess',
  async (_, { dispatch }) => {
    try {
      // Check auth status with backend
      const authStatus = await AuthAPI.checkAuthStatus();
      
      if (!authStatus.spotifyConnected) {
        const { authUrl } = await dispatch(initiateSpotifyAuth()).unwrap();
        return { success: false, authUrl };
      }

      return { success: true };
    } catch (error) {
      const { authUrl } = await dispatch(initiateSpotifyAuth()).unwrap();
      return { success: false, authUrl };
    }
  }
);

const initialState = {
  status: AUTH_STATUS.IDLE,
  error: null,
  user: null,
  spotify: {
    isAuthenticated: false,
    status: SPOTIFY_AUTH_STATUS.NONE,
    codeVerifier: null,  // Only used during OAuth flow
    savedState: null,    // Only used during OAuth flow
    authUrl: null       // Only used during OAuth flow
  },
  onboarding: {
    step: 'initial',
    completed: false
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    resetAuth: () => initialState,
    setOnboardingStep: (state, action) => {
      state.onboarding.step = action.payload;
    },
    completeOnboarding: (state) => {
      state.onboarding.completed = true;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      // App Auth
      .addCase(loginUser.pending, (state) => {
        state.status = AUTH_STATUS.AUTHENTICATING;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = AUTH_STATUS.AUTHENTICATED;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = AUTH_STATUS.FAILED;
        state.error = action.payload;
      })
      
      // Register
      .addCase(registerUser.pending, (state) => {
        state.status = AUTH_STATUS.AUTHENTICATING;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = AUTH_STATUS.AUTHENTICATED;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = AUTH_STATUS.FAILED;
        state.error = action.payload;
      })

      // Spotify Auth Flow
      .addCase(initiateSpotifyAuth.pending, (state) => {
        state.spotify.status = SPOTIFY_AUTH_STATUS.PENDING;
        state.error = null;
      })
      .addCase(initiateSpotifyAuth.fulfilled, (state, action) => {
        state.spotify.authUrl = action.payload.authUrl;
        state.spotify.codeVerifier = action.payload.codeVerifier;
        state.spotify.savedState = action.payload.state;
      })
      .addCase(initiateSpotifyAuth.rejected, (state, action) => {
        state.spotify.status = SPOTIFY_AUTH_STATUS.FAILED;
        state.error = action.payload;
      })

      .addCase(handleSpotifyCallback.pending, (state) => {
        state.spotify.status = SPOTIFY_AUTH_STATUS.PENDING;
        state.error = null;
      })
      .addCase(handleSpotifyCallback.fulfilled, (state) => {
        state.spotify.status = SPOTIFY_AUTH_STATUS.CONNECTED;
        state.spotify.isAuthenticated = true;
        // Clear OAuth state
        state.spotify.codeVerifier = null;
        state.spotify.savedState = null;
        state.spotify.authUrl = null;
      })
      .addCase(handleSpotifyCallback.rejected, (state, action) => {
        state.spotify.status = SPOTIFY_AUTH_STATUS.FAILED;
        state.error = action.payload;
      })

      .addCase(handleAuthSuccess.fulfilled, (state, action) => {
        if (action.payload.success) {
          state.spotify.status = SPOTIFY_AUTH_STATUS.CONNECTED;
        }
      });
  }
});

export const {
  resetAuth,
  setOnboardingStep,
  completeOnboarding,
  clearAuthError,
  logout
} = authSlice.actions;

export const selectAuthStatus = (state) => state.auth.status;
export const selectSpotifyAuth = (state) => state.auth.spotify;
export const selectOnboarding = (state) => state.auth.onboarding;
export const selectAuthError = (state) => state.auth.error;
export const selectUser = (state) => state.auth.user;

export default authSlice.reducer;