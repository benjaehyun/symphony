import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';

import createSocketMiddleware from '../utils/socket/socketMiddleware';

import authReducer from './slices/authSlice';
import profileReducer from './slices/profileSlice';
import discoveryReducer from './slices/discoverySlice';
import matchesReducer from './slices/matchesSlice';
import messagesReducer from './slices/messagesSlice';
// import musicReducer from './slices/musicSlice';

// Combine all reducers
const rootReducer = combineReducers({
  auth: authReducer,
  profile: profileReducer,
  discovery: discoveryReducer,
  matches: matchesReducer,
  messages: messagesReducer,
});

// Root persist configuration
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'profile'], // Persist auth and profile state
  blacklist: ['discovery', 'messages'
    // 'music'
  ], // Don't persist music state (we'll fetch fresh)
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
          'auth.spotify.tokenManager',
          'discovery.profiles'
        ]
      },
    }).concat(createSocketMiddleware()),
  devTools: process.env.NODE_ENV !== 'production'
});

store.subscribe(() => {
  const state = store.getState();
  if (state.auth?.status === 'authenticated') {
    console.log('Auth state:', state.auth);
  }
});

export const persistor = persistStore(store);