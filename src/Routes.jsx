import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Pages
import Login from './pages/Login';
import SpotifyCallback from './pages/SpotifyCallback';
import Home from './pages/Home';

// Layouts
import Layout from './components/layout/Layout';
import AuthLayout from './components/layout/AuthLayout'; // We should create this

// Protected Route with Layout Context
const ProtectedRoute = ({ children }) => {
  const { status, spotify } = useSelector((state) => state.auth);
  const { status: profileStatus } = useSelector((state) => state.profile);
  
  if (status !== 'authenticated') {
    return <Navigate to="/login" replace />;
  }

  // Handle onboarding flow
  if (!spotify.isAuthenticated) {
    return <Navigate to="/spotify-connect" replace />;
  }

  if (profileStatus === 'NOT_STARTED') {
    return <Navigate to="/create-profile" replace />;
  }

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
  const isAuthFlow = ['/login', '/spotify-connect', '/create-profile'].includes(location.pathname);

  return (
    <Routes>
      {/* Auth Flow Routes */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      
      <Route 
        path="/spotify/callback" 
        element={<SpotifyCallback />} 
      />

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