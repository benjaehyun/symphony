import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Pages
import Auth from './pages/auth/Auth';
import SpotifyCallback from './pages/auth/SpotifyCallback';
import Home from './pages/Home';
import ProfileCreate from './pages/profile/ProfileCreate'

// Layouts
import Layout from './components/layout/Layout';
import AuthLayout from './components/layout/AuthLayout'; 

// Protected Route with Layout Context
const ProtectedRoute = ({ children, skipProfileCheck = false }) => {
  const { status, spotify } = useSelector((state) => state.auth);
  const { status: profileStatus } = useSelector((state) => state.profile);
  
  if (status !== 'authenticated') {
    return <Navigate to="/auth" replace />;
  }

  // Handle onboarding flow
  // if (!spotify.isConnected) {
  //   return <Navigate to="/spotify-connect" replace />;
  // }

  if (!skipProfileCheck && profileStatus === 'NOT_STARTED') {
    return <Navigate to="/create-profile/basic-info" replace />;
  }

  // if (profileStatus === 'NOT_STARTED') {
  //   return <Navigate to="/create-profile" replace />;
  // }

  return <Layout>{children}</Layout>;
};

// Public Route with Auth Layout
const PublicRoute = ({ children }) => {
  const { status } = useSelector((state) => state.auth);
  const { status: profileStatus } = useSelector((state) => state.profile);
  
  if (status === 'authenticated') {
    if (profileStatus === 'NOT_STARTED') {
      return <Navigate to="/create-profile" replace />;
    }
    return <Navigate to="/discover" replace />;
  }
  
  return <AuthLayout>{children}</AuthLayout>;
};

const AppRoutes = () => {
  const location = useLocation();
  const isAuthFlow = ['/auth', '/spotify-connect', '/create-profile'].includes(location.pathname);

  return (
    <Routes>
      {/* Auth Flow Routes */}
      <Route 
        path="/auth" 
        element={
          <PublicRoute>
            <Auth />
          </PublicRoute>
        } 
      />
      
      <Route 
        path="/spotify/callback" 
        element={<SpotifyCallback />} 
      />

      <Route path="/create-profile">
        {/* Index route redirects to basic-info */}
        <Route 
          index 
          element={
            <Navigate to="/create-profile/basic-info" replace />
          } 
        />
        
        {/* Catch all sub-routes and render ProfileCreate */}
        <Route 
          path="*"
          element={
            <ProtectedRoute skipProfileCheck={true}>
              <ProfileCreate />
            </ProtectedRoute>
          } 
        />
      </Route>

      {/* Main App Routes */}
      <Route 
        path="/discover" 
        element={
          <ProtectedRoute>
            <div>Discover (Coming Soon)</div>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/matches" 
        element={
          <ProtectedRoute>
            <div>Matches (Coming Soon)</div>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/messages" 
        element={
          <ProtectedRoute>
            <div>Messages (Coming Soon)</div>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } 
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;