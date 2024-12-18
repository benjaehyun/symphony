import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import DiscoveryAPI from '../../services/discovery/discovery-api';
import { fetchUnreadCount } from './matchesSlice';

export const DISCOVERY_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  NO_PROFILES: 'no_profiles',
  DEPLETED: 'depleted' //When we've shown all available profiles
};

// Thunks
export const fetchDiscoveryProfiles = createAsyncThunk(
  'discovery/fetchProfiles',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { discovery } = getState();
      console.log('Current Discovery State:', discovery);
      
      // Don't fetch if we already know there are no more profiles
      if (discovery.status === DISCOVERY_STATUS.DEPLETED) {
        return { status: 'NO_PROFILES', profiles: [], hasMore: false };
      }

      const lastId = discovery.profiles.length > 0 
        ? discovery.profiles[discovery.profiles.length - 1]._id 
        : null;

      const response = await DiscoveryAPI.getDiscoveryProfiles(lastId);
      console.log('Thunk Response:', response);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const likeProfile = createAsyncThunk(
  'discovery/likeProfile',
  async (profileId, { dispatch, rejectWithValue }) => {
    try {
      const response = await DiscoveryAPI.likeProfile(profileId);

      // if (response.match) {
      //   dispatch(fetchUnreadCount());
      // }
      return {
        profileId,
        matchData: response.match ? {...response.matchedProfile, matchId: response.matchId} : null
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const dislikeProfile = createAsyncThunk(
  'discovery/dislikeProfile',
  async (profileId, { rejectWithValue }) => {
    try {
      await DiscoveryAPI.dislikeProfile(profileId);
      return profileId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  status: DISCOVERY_STATUS.IDLE,
  profiles: [],
  currentProfileIndex: 0,
  hasMore: true,
  loading: false,
  error: null,
  newMatch: null,
};

const discoverySlice = createSlice({
  name: 'discovery',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearNewMatch: (state) => {
      state.newMatch = null;
    },
    resetDiscovery: () => initialState,
    advanceToNextProfile: (state) => {
      // Only advance if we have more profiles
      if (state.currentProfileIndex < state.profiles.length - 1) {
        state.currentProfileIndex += 1;
      }
      // If we've reached the end of our current profiles
      else if (state.currentProfileIndex === state.profiles.length - 1) {
        // If we know there are no more to fetch, mark as depleted
        if (!state.hasMore) {
          state.status = DISCOVERY_STATUS.DEPLETED;
        }
        // Otherwise, mark as idle to trigger a new fetch
        else {
          state.status = DISCOVERY_STATUS.IDLE;
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Profiles
      .addCase(fetchDiscoveryProfiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDiscoveryProfiles.fulfilled, (state, action) => {
        state.loading = false;
        
        if (action.payload.status === 'NO_PROFILES') {
          state.status = DISCOVERY_STATUS.DEPLETED;
          state.hasMore = false;
          return;
        }

        state.status = DISCOVERY_STATUS.SUCCEEDED;
        state.profiles.push(...action.payload.profiles);
        state.hasMore = action.payload.hasMore;
      })
      .addCase(fetchDiscoveryProfiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.status = DISCOVERY_STATUS.FAILED;
      })

      // Like Profile
      .addCase(likeProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(likeProfile.fulfilled, (state, action) => {
        state.loading = false;
        // Remove liked profile
        state.profiles = state.profiles.filter(
          profile => profile._id !== action.payload.profileId
        );
        
        // If it was a match, store the match data
        if (action.payload.matchData) {
          state.newMatch = action.payload.matchData;
        }

        // If we've used all profiles and there are no more to fetch
        if (state.profiles.length === 0 && !state.hasMore) {
          state.status = DISCOVERY_STATUS.DEPLETED;
        }
      })
      .addCase(likeProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Dislike Profile
      .addCase(dislikeProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(dislikeProfile.fulfilled, (state, action) => {
        state.loading = false;
        // Remove disliked profile
        state.profiles = state.profiles.filter(
          profile => profile._id !== action.payload
        );

        // If we've used all profiles and there are no more to fetch
        if (state.profiles.length === 0 && !state.hasMore) {
          state.status = DISCOVERY_STATUS.DEPLETED;
        }
      })
      .addCase(dislikeProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// Actions
export const { 
  clearError, 
  clearNewMatch, 
  resetDiscovery,
  advanceToNextProfile 
} = discoverySlice.actions;

// Selectors
export const selectDiscoveryStatus = (state) => state.discovery.status;
export const selectDiscoveryProfiles = (state) => state.discovery.profiles;
export const selectCurrentProfile = (state) => 
  state.discovery.profiles[state.discovery.currentProfileIndex];
export const selectDiscoveryLoading = (state) => state.discovery.loading;
export const selectDiscoveryError = (state) => state.discovery.error;
export const selectHasMoreProfiles = (state) => state.discovery.hasMore;
export const selectNewMatch = (state) => state.discovery.newMatch;

export default discoverySlice.reducer;