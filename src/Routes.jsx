import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// import { useSelector } from 'react-redux';

// Public Pages
import Login from './pages/Login';
// import Register from './pages/Register';
// import Landing from './pages/Landing';

// Protected Pages
import Home from './pages/Home';
// import Discover from './pages/Discover';
// import Matches from './pages/Matches';
// import Messages from './pages/Messages';
// import Profile from './pages/Profile';
// import Settings from './pages/Settings';

// // Protected Route Wrapper
// const ProtectedRoute = ({ children }) => {
//   const { isAuthenticated } = useSelector((state) => state.auth);
  
//   if (!isAuthenticated) {
//     return <Navigate to="/login" replace />;
//   }
  
//   return children;
// };

// // Public Route Wrapper (redirects to home if already authenticated)
// const PublicRoute = ({ children }) => {
//   const { isAuthenticated } = useSelector((state) => state.auth);
  
//   if (isAuthenticated) {
//     return <Navigate to="/home" replace />;
//   }
  
//   return children;
// };

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/" 
        element={
          // <ProtectedRoute>
            <Home />
          // </ProtectedRoute>
        } 
      />
      

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;