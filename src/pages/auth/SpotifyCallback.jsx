import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { handleSpotifyCallback } from '../../store/slices/authSlice';
import { LoadingSpinner } from '../../components/ui/loading-spinner';

const SpotifyCallback = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { status, error, onboarding } = useSelector((state) => state.auth);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code || !state) {
        console.error('Missing code or state');
        navigate('/auth');
        return;
      }

      try {
        await dispatch(handleSpotifyCallback({ code, state })).unwrap();
        
        // Check onboarding status to determine where to redirect
        if (!onboarding.completed) {
          navigate('/create-profile');
        } else {
          navigate('/discover');
        }
      } catch (err) {
        console.error('Spotify callback error:', err);
        navigate('/auth');
      }
    };

    handleCallback();
  }, [dispatch, navigate, searchParams]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-destructive mb-4">Failed to connect with Spotify</div>
        <button 
          onClick={() => navigate('/auth')}
          className="text-spotify-green hover:underline"
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <LoadingSpinner />
      <p className="mt-4 text-muted-foreground">Connecting to Spotify...</p>
    </div>
  );
};

export default SpotifyCallback;