import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import ProfileAPI from '../../services/profile/profile-api';
import PhotoService from '../../services/photo-service';

export const PROFILE_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  BASIC_INFO_COMPLETED: 'BASIC_INFO_COMPLETED',
  PHOTOS_UPLOADED: 'PHOTOS_UPLOADED',
  MUSIC_CONNECTED: 'MUSIC_CONNECTED',
  COMPLETED: 'COMPLETED'
};

export const PHOTO_UPLOAD_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed'
};

// Thunks
export const uploadProfilePhotos = createAsyncThunk(
  'profile/uploadPhotos',
  async ({ formData }, { rejectWithValue }) => {
    try {
      // Pass the FormData directly to the API
      const response = await ProfileAPI.uploadPhotos(formData);

      return {
        photos: response.photos.map(photo => ({
          ...photo,
          id: photo.key || photo._id,
          url: photo.url,
          isStaged: false
        }))
      };
    } catch (error) {
      return rejectWithValue({
        message: error.message || 'Failed to upload photos',
        errors: error.errors || []
      });
    }
  }
);

export const removeProfilePhoto = createAsyncThunk(
  'profile/removePhoto',
  async ({ photoId }, { rejectWithValue }) => {
    try {
      const result = await ProfileAPI.deletePhoto(photoId);
      return {
        photos: result.photos.map(photo => ({
          ...photo,
          id: photo.key || photo._id
        }))
      };
    } catch (error) {
      return rejectWithValue({
        message: error.message || 'Failed to delete photo'
      });
    }
  }
);

// For reordering photos
export const updatePhotoOrder = createAsyncThunk(
  'profile/updatePhotoOrder',
  async (photoOrder, { rejectWithValue }) => {
    try {
      const response = await ProfileAPI.reorderPhotos(photoOrder);
      return response.photos;
    } catch (error) {
      return rejectWithValue({
        message: error.message || 'Failed to update photo order'
      });
    }
  }
);



export const createUserProfile = createAsyncThunk(
  'profile/createUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await ProfileAPI.createProfile();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateProfileInfo = createAsyncThunk(
  'profile/updateProfileInfo',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await ProfileAPI.updateBasicInfo(profileData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateMusicProfile = createAsyncThunk(
  'profile/updateMusicProfile',
  async (musicData, { rejectWithValue }) => {
    try {
      const response = await ProfileAPI.updateMusicProfile({
        ...musicData,
        lastUpdated: new Date()
      });
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updatePreferences = createAsyncThunk(
  'profile/updatePreferences',
  async (preferences, { rejectWithValue }) => {
    try {
      const response = await ProfileAPI.updatePreferences(preferences);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const completeProfile = createAsyncThunk(
  'profile/complete',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await ProfileAPI.completeProfile(profileData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const initializeUserProfile = createAsyncThunk(
  'profile/initializeUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await ProfileAPI.initializeProfile();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'profile/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await ProfileAPI.getProfile();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

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
      tracks: [],
      analysis: {
        averageFeatures: {
          danceability: null,
          energy: null,
          acousticness: null,
          instrumentalness: null,
          valence: null
        },
        genreDistribution: {},
        musicDimensions: {
          mellow: null,
          unpretentious: null,
          sophisticated: null,
          intense: null,
          contemporary: null
        }
      },
      lastUpdated: null
    }
  },
  photoUpload: {
    stagedPhotos: [], // Photos waiting to be uploaded
    savedPhotos: [],  // Photos already on server
    uploadProgress: 0,
    status: PHOTO_UPLOAD_STATUS.IDLE,
    error: null,
    photoOrder: [] // Maintains the order of all photos (staged + saved)
  }
};

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
    },
    addStagedPhoto: (state, action) => {
      state.photoUpload.stagedPhotos.push(action.payload);
      state.photoUpload.photoOrder = [
        ...state.photoUpload.photoOrder,
        action.payload.id
      ];
    },
    
    removeStagedPhoto: (state, action) => {
      state.photoUpload.stagedPhotos = state.photoUpload.stagedPhotos
        .filter(photo => photo.id !== action.payload);
      state.photoUpload.photoOrder = state.photoUpload.photoOrder
        .filter(id => id !== action.payload);
    },
    
    updatePhotoOrderLocal: (state, action) => {
      state.photoUpload.photoOrder = action.payload;
    },
    
    clearStagedPhotos: (state) => {
      // Cleanup staged photos
      state.photoUpload.stagedPhotos.forEach(photo => {
        if (photo.url?.startsWith('blob:')) {
          URL.revokeObjectURL(photo.url);
        }
      });
      state.photoUpload.stagedPhotos = [];
      state.photoUpload.photoOrder = state.photoUpload.savedPhotos
        .map(photo => photo.id);
    },
    
    setUploadProgress: (state, action) => {
      state.photoUpload.uploadProgress = action.payload;
    },
    
    resetPhotoUploadStatus: (state) => {
      state.photoUpload.status = PHOTO_UPLOAD_STATUS.IDLE;
      state.photoUpload.error = null;
      state.photoUpload.uploadProgress = 0;
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
        state.photoUpload.status = PHOTO_UPLOAD_STATUS.LOADING;
        state.photoUpload.error = null;
      })
      .addCase(uploadProfilePhotos.fulfilled, (state, action) => {
        state.photoUpload.status = PHOTO_UPLOAD_STATUS.SUCCEEDED;
        state.photoUpload.savedPhotos = action.payload.photos;
        state.photoUpload.stagedPhotos = [];
        state.photoUpload.uploadProgress = 0;
        state.photoUpload.photoOrder = action.payload.photos.map(p => p.id);
        // Update main profile photos as well
        state.profile.photos = action.payload.photos;
      })
      .addCase(uploadProfilePhotos.rejected, (state, action) => {
        state.photoUpload.status = PHOTO_UPLOAD_STATUS.FAILED;
        state.photoUpload.error = action.payload;
        state.photoUpload.uploadProgress = 0;
      })
      
      // Update Photo Order
      .addCase(updatePhotoOrder.pending, (state) => {
        state.photoUpload.status = PHOTO_UPLOAD_STATUS.LOADING;
      })
      .addCase(updatePhotoOrder.fulfilled, (state, action) => {
        state.photoUpload.status = PHOTO_UPLOAD_STATUS.SUCCEEDED;
        state.photoUpload.savedPhotos = action.payload;
        state.photoUpload.photoOrder = action.payload.map(p => p.id);
        // Update main profile photos as well
        state.profile.photos = action.payload;
      })
      .addCase(updatePhotoOrder.rejected, (state, action) => {
        state.photoUpload.status = PHOTO_UPLOAD_STATUS.FAILED;
        state.photoUpload.error = action.payload;
      })

      // Music Profile
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
      })

      // Complete Profile
      .addCase(completeProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        state.status = PROFILE_STATUS.COMPLETED;
      })
      .addCase(completeProfile.rejected, (state, action) => {
        state.loading = false;
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
        // state.status = determineProfileStatus(action.payload);
        state.status = action.payload.status
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Initialize Profile
      .addCase(initializeUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        state.status = determineProfileStatus(action.payload);
      })
      .addCase(initializeUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
  }
});

function determineProfileStatus(profile) {
  if (!profile) return PROFILE_STATUS.NOT_STARTED;
  if (profile.photos?.length > 0 && profile.music?.sourceId && profile.preferences) {
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

export const { 
  resetProfile, 
  setProfileStatus, 
  updateUploadProgress, 
  clearProfileError,
  addStagedPhoto,
  removeStagedPhoto,
  updatePhotoOrderLocal,
  clearStagedPhotos,
  setUploadProgress,
  resetPhotoUploadStatus
} = profileSlice.actions;

// Selectors
export const selectProfile = (state) => state.profile.profile;
export const selectProfileStatus = (state) => state.profile.status;
export const selectProfileLoading = (state) => state.profile.loading;
export const selectProfileError = (state) => state.profile.error;
export const selectPhotoUploadStatus = (state) => state.profile.photoUploadStatus;
export const selectPhotoUploadState = (state) => state.profile.photoUpload;
export const selectAllPhotos = (state) => {
  const { stagedPhotos, savedPhotos, photoOrder } = state.profile.photoUpload;
  const allPhotos = [...stagedPhotos, ...savedPhotos];
  // Return photos in the order specified by photoOrder
  return photoOrder
    .map(id => allPhotos.find(photo => photo.id === id))
    .filter(Boolean); // Remove any undefined entries
};
export const selectUploadStatus = (state) => state.profile.photoUpload.status;
export const selectUploadProgress = (state) => state.profile.photoUpload.uploadProgress;
export const selectPhotoUploadError = (state) => state.profile.photoUpload.error;

export default profileSlice.reducer;