import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';

import authReducer from './slices/authSlice';
import profileReducer from './slices/profileSlice';
// import musicReducer from './slices/musicSlice';

// Combine all reducers
const rootReducer = combineReducers({
  auth: authReducer,
  profile: profileReducer,
  // music: musicReducer
});

// Root persist configuration
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'profile'], // Persist auth and profile state
  blacklist: ['music'], // Don't persist music state (we'll fetch fresh)
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        // Ignore certain paths in actions and state for non-serializable data
        ignoredActionPaths: [
          'payload.headers',
          'payload.config',
          'payload.request',
          'error'
        ],
        ignoredPaths: [
          'music.audioFeatures',
          'auth.spotify.tokenManager'
        ]
      },
    }),
  devTools: process.env.NODE_ENV !== 'production'
});

export const persistor = persistStore(store);