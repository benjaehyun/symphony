import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Profile status enum to track profile completion
export const PROFILE_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  BASIC_INFO_COMPLETED: 'BASIC_INFO_COMPLETED',
  PHOTOS_UPLOADED: 'PHOTOS_UPLOADED',
  MUSIC_CONNECTED: 'MUSIC_CONNECTED',
  COMPLETED: 'COMPLETED'
};

// Async thunks
export const createUserProfile = createAsyncThunk(
  'profile/createUserProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch('/api/profiles/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({
          userId: auth.user?.id,
          spotifyId: auth.spotify.spotifyId,
        })
      });

      if (!response.ok) throw new Error('Profile creation failed');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateProfileInfo = createAsyncThunk(
  'profile/updateProfileInfo',
  async (profileData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch('/api/profiles/add-user-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) throw new Error('Profile update failed');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const uploadProfilePhotos = createAsyncThunk(
  'profile/uploadPhotos',
  async (photos, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const formData = new FormData();
      
      // Add each photo to form data
      Array.from(photos).forEach(photo => {
        formData.append('photo', photo);
      });

      const response = await fetch('/api/profiles/add-photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Photo upload failed');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'profile/fetchUserProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch('/api/profiles', {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch profile');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateMusicProfile = createAsyncThunk(
  'profile/updateMusicProfile',
  async (musicData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch('/api/profiles/music-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify(musicData)
      });

      if (!response.ok) throw new Error('Failed to update music profile');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState = {
  status: PROFILE_STATUS.NOT_STARTED,
  loading: false,
  error: null,
  profile: {
    id: null,
    name: null,
    age: null,
    about: null,
    photos: [],
    spotifyId: null,
    likes: [],
    dislikes: [],
    matches: [],
    music: {
      sourceType: null,
      sourceId: null,
      analyzedTracks: [],
      analysis: {
        acousticness: null,
        danceability: null,
        energy: null,
        instrumentalness: null,
        valence: null
      },
      lastUpdated: null
    }
  },
  uploadProgress: 0,
  photoUploadStatus: 'idle'
};

// Slice
const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    resetProfile: () => initialState,
    setProfileStatus: (state, action) => {
      state.status = action.payload;
    },
    updateUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    clearProfileError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create Profile
      .addCase(createUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = { ...state.profile, ...action.payload };
        state.status = PROFILE_STATUS.BASIC_INFO_COMPLETED;
      })
      .addCase(createUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Profile Info
      .addCase(updateProfileInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfileInfo.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = { ...state.profile, ...action.payload };
        if (state.status === PROFILE_STATUS.NOT_STARTED) {
          state.status = PROFILE_STATUS.BASIC_INFO_COMPLETED;
        }
      })
      .addCase(updateProfileInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Upload Photos
      .addCase(uploadProfilePhotos.pending, (state) => {
        state.photoUploadStatus = 'loading';
        state.error = null;
      })
      .addCase(uploadProfilePhotos.fulfilled, (state, action) => {
        state.photoUploadStatus = 'succeeded';
        state.profile.photos = action.payload.photos;
        if (state.status === PROFILE_STATUS.BASIC_INFO_COMPLETED) {
          state.status = PROFILE_STATUS.PHOTOS_UPLOADED;
        }
      })
      .addCase(uploadProfilePhotos.rejected, (state, action) => {
        state.photoUploadStatus = 'failed';
        state.error = action.payload;
      })
      // Fetch Profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        // Determine profile status based on completed fields
        state.status = determineProfileStatus(action.payload);
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateMusicProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMusicProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile.music = action.payload;
        if (state.status === PROFILE_STATUS.PHOTOS_UPLOADED) {
          state.status = PROFILE_STATUS.MUSIC_CONNECTED;
        }
      })
      .addCase(updateMusicProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// Helper function to determine profile completion status
function determineProfileStatus(profile) {
  if (!profile) return PROFILE_STATUS.NOT_STARTED;
  if (profile.photos?.length > 0 && profile.music?.sourceId) {
    return PROFILE_STATUS.COMPLETED;
  }
  if (profile.photos?.length > 0) {
    return PROFILE_STATUS.PHOTOS_UPLOADED;
  }
  if (profile.name && profile.age) {
    return PROFILE_STATUS.BASIC_INFO_COMPLETED;
  }
  return PROFILE_STATUS.NOT_STARTED;
}

// Actions
export const { 
  resetProfile, 
  setProfileStatus, 
  updateUploadProgress, 
  clearProfileError 
} = profileSlice.actions;

// Selectors
export const selectProfile = (state) => state.profile.profile;
export const selectProfileStatus = (state) => state.profile.status;
export const selectProfileLoading = (state) => state.profile.loading;
export const selectProfileError = (state) => state.profile.error;
export const selectPhotoUploadStatus = (state) => state.profile.photoUploadStatus;
export const selectUploadProgress = (state) => state.profile.uploadProgress;
export const selectMusicProfile = (state) => state.profile.profile.music;


export default profileSlice.reducer;