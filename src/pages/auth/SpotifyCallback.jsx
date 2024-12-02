import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { handleSpotifyCallback, setOnboardingStep } from '../../store/slices/authSlice';
import { LoadingSpinner } from '../../components/ui/loading-spinner';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { setProfileLoading } from '../../store/slices/profileSlice'; 

const SpotifyCallback = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { error, onboarding, spotify } = useSelector((state) => state.auth);

  useEffect(() => {
    const handleCallback = async () => {
      // dispatch(setProfileLoading(false));
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code || !state) {
        console.error('Missing code or state');
        navigate('/auth');
        return;
      }

      // Verify state matches
      if (state !== spotify.savedState) {
        console.error('State mismatch in OAuth callback');
        navigate('/auth');
        return;
      }

      try {
        await dispatch(handleSpotifyCallback({ code, state })).unwrap();
        dispatch(setOnboardingStep('profile'));
        if (!onboarding.completed) {
          dispatch(setProfileLoading(false));
          navigate('/create-profile');
        } else {
          dispatch(setProfileLoading(false));
          navigate('/discover');
        }
      } catch (err) {
        console.error('Spotify callback error:', err);
        navigate('/auth');
      }
    };

    handleCallback();
  }, [dispatch, navigate, searchParams, onboarding.completed, spotify.savedState]); 

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>Failed to connect with Spotify</AlertDescription>
        </Alert>
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