import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import MatchesAPI from '../../services/matches/matches-api';

// Thunks
export const fetchMatches = createAsyncThunk(
  'matches/fetchMatches',
  async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await MatchesAPI.getMatches(page, limit);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'matches/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await MatchesAPI.getUnreadCount();
      return response.unreadCount;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const markMatchesAsRead = createAsyncThunk(
  'matches/markAsRead',
  async (matchIds, { rejectWithValue }) => {
    try {
      await MatchesAPI.markMatchesAsRead(matchIds);
      return matchIds;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const unmatchProfile = createAsyncThunk(
  'matches/unmatch',
  async (matchId, { rejectWithValue }) => {
    try {
      await MatchesAPI.unmatch(matchId);
      return matchId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  matches: [],
  currentPage: 1,
  totalMatches: 0,
  hasMore: true,
  unreadCount: 0,
  loading: false,
  error: null,
  lastFetched: null
};

const matchesSlice = createSlice({
  name: 'matches',
  initialState,
  reducers: {
    // Socket event handlers
    handleNewMatch: (state, action) => {
      const { match, matchId, unreadCount } = action.payload;
      state.matches.unshift({
        _id: matchId,
        matchedProfile: match,
        matchedAt: new Date().toISOString(),
        isRead: false,
        status: 'active'
      });
      state.unreadCount = unreadCount;
      state.totalMatches += 1;
    },
    handleMatchUnmatch: (state, action) => {
      const { matchId } = action.payload;
      const match = state.matches.find(m => m._id === matchId);
      if (match && !match.isRead) {
        state.unreadCount -= 1;
      }
      state.matches = state.matches.filter(m => m._id !== matchId);
      state.totalMatches -= 1;
    },
    handleMatchRead: (state, action) => {
      const { matchIds, unreadCount } = action.payload;
      state.matches = state.matches.map(match => {
        if (matchIds.includes(match._id)) {
          return { ...match, isRead: true };
        }
        return match;
      });
      state.unreadCount = unreadCount;
    },
    clearMatchesError: (state) => {
      state.error = null;
    },
    resetMatches: () => initialState
  },
  extraReducers: (builder) => {
    builder
      // Fetch Matches
      .addCase(fetchMatches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMatches.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.page === 1) {
          state.matches = action.payload.matches;
        } else {
          state.matches = [...state.matches, ...action.payload.matches];
        }
        state.currentPage = action.payload.page;
        state.totalMatches = action.payload.totalMatches;
        state.hasMore = action.payload.hasMore;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchMatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Unread Count
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })

      // Mark as Read
      .addCase(markMatchesAsRead.fulfilled, (state, action) => {
        const matchIds = action.payload;
        state.matches = state.matches.map(match => {
          if (matchIds.includes(match._id)) {
            return { ...match, isRead: true };
          }
          return match;
        });
        state.unreadCount = state.matches.filter(match => !match.isRead).length;
      })

      // Unmatch
      .addCase(unmatchProfile.fulfilled, (state, action) => {
        const matchId = action.payload;
        const match = state.matches.find(m => m._id === matchId);
        if (match && !match.isRead) {
          state.unreadCount -= 1;
        }
        state.matches = state.matches.filter(m => m._id !== matchId);
        state.totalMatches -= 1;
      });
  }
});

// Actions
export const {
  handleNewMatch,
  handleMatchUnmatch,
  handleMatchRead,
  clearMatchesError,
  resetMatches
} = matchesSlice.actions;

// Selectors
export const selectMatches = (state) => state.matches.matches;
export const selectUnreadCount = (state) => state.matches.unreadCount;
export const selectMatchesLoading = (state) => state.matches.loading;
export const selectMatchesError = (state) => state.matches.error;
export const selectHasMoreMatches = (state) => state.matches.hasMore;
export const selectTotalMatches = (state) => state.matches.totalMatches;
export const selectCurrentPage = (state) => state.matches.currentPage;

export default matchesSlice.reducer;