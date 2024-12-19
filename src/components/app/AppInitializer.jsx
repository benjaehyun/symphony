import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { logout } from '../../store/slices/authSlice';
import { fetchUserProfile } from '../../store/slices/profileSlice';
import { fetchMatches } from '../../store/slices/matchesSlice';
import { initializeMessageState } from '../../store/slices/messagesSlice';
import { initializeSocket } from '../../utils/socket/socket';
import { LoadingSpinner } from '../ui/loading-spinner';

const AppInitializer = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [isInitialized, setIsInitialized] = useState(false);
  const { status: authStatus } = useSelector(state => state.auth);
  const { status: profileStatus } = useSelector(state => state.profile);
  const hasInitialized = useRef(false);

  // Check if we're in the auth flow
  const isAuthFlow = ['/auth', '/spotify/callback', '/create-profile'].some(
    path => location.pathname.startsWith(path)
  );

  useEffect(() => {
    let mounted = true;

    const initializeApp = async () => {
      // Skip initialization for auth flows
      if (isAuthFlow) {
        setIsInitialized(true);
        return;
      }

      // Skip if already initialized or in auth flow
      if (hasInitialized.current || isAuthFlow) {
        setIsInitialized(true);
        return;
      }

      if (authStatus === 'authenticated') {
        try {
          // 1. Refresh token
          try {
            await axios.post(
              `${process.env.REACT_APP_API_URL || '/api'}/auth/refresh`,
              null,
              { withCredentials: true }
            );
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            dispatch(logout());
            return;
          }

          // 2. Fetch user profile if needed
          if (!profileStatus || profileStatus === 'NOT_STARTED') {
            await dispatch(fetchUserProfile()).unwrap();
          }

          // 3. Initialize app state
          await Promise.all([
            dispatch(fetchMatches({})).unwrap(),
            dispatch(initializeMessageState()).unwrap()
          ]);
                    
          // 4. Initialize socket and set up message handlers
          const socket = await initializeSocket();
          if (socket) {
            dispatch({ type: 'socket/initialize' });
          } else {
            console.error('Socket initialization failed');
          }

          if (mounted) {
            setIsInitialized(true);
            hasInitialized.current = true;
          }
        } catch (error) {
          console.error('App initialization failed:', error);
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            dispatch(logout());
          }
          if (mounted) {
            setIsInitialized(true);
            hasInitialized.current = true;
          }
        }
      } else {
        if (mounted) {
          setIsInitialized(true);
          hasInitialized.current = true;
        }
      }
    };

    initializeApp();

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, [authStatus, isAuthFlow, dispatch, profileStatus]);

  // Handle auth status changes
  useEffect(() => {
    if (authStatus !== 'authenticated' && hasInitialized.current) {
      hasInitialized.current = false;
      setIsInitialized(false);
    }
  }, [authStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      hasInitialized.current = false;
      setIsInitialized(false);
    };
  }, []);

  if (!isInitialized && !isAuthFlow) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return children;
};

export default AppInitializer;