import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';
import BasicInfo from '../../components/profile/BasicInfo';
import PhotoUpload from '../../components/profile/PhotoUpload';
import MusicTaste from '../../components/profile/MusicTaste';
import Preferences from '../../components/profile/Preferences';
import ProfileReview from '../../components/profile/ProfileReview';
import { 
  updateProfileInfo, 
  uploadProfilePhotos,
  updateMusicProfile,
  updatePreferences,
  completeProfile,
  fetchUserProfile 
} from '../../store/slices/profileSlice';
import { setOnboardingStep, completeOnboarding } from '../../store/slices/authSlice';

const FORM_STEPS = {
  BASIC_INFO: {
    key: 'BASIC_INFO',
    path: '/create-profile/basic-info',
    label: 'Basic',
    Component: BasicInfo,
  },
  PHOTOS: {
    key: 'PHOTOS',
    path: '/create-profile/photos',
    label: 'Photos',
    Component: PhotoUpload,
  },
  MUSIC_TASTE: {
    key: 'MUSIC_TASTE',
    path: '/create-profile/music',
    label: 'Music',
    Component: MusicTaste,
  },
  PREFERENCES: {
    key: 'PREFERENCES',
    path: '/create-profile/preferences',
    label: 'Preferences',
    Component: Preferences,
  },
  REVIEW: {
    key: 'REVIEW',
    path: '/create-profile/review',
    label: 'Review',
    Component: ProfileReview
  }
};

const initialFormData = {
  basicInfo: {
    name: '',
    age: 18,
    gender: '',
    bio: '',
  },
  photos: {
    photos: [],
  },
  preferences: {
    genderPreference: [],
    ageRange: { min: 18, max: 99 },
    maxDistance: 25,
  },
  musicTaste: {
    sourceType: '',
    sourceId: '',
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
};

const ProfileCreate = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { error, profile, loading } = useSelector(state => state.profile);
  const { status, onboarding } = useSelector((state) => state.auth);
  const [currentStep, setCurrentStep] = useState('BASIC_INFO');
  const [formData, setFormData] = useState(initialFormData);
  const [stepErrors, setStepErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing profile data if available
  // useEffect(() => {
  //   if (status !== 'NOT_STARTED') {
  //     dispatch(fetchUserProfile()).then((action) => {
  //       if (action.payload) {
  //         const { name, age, gender, bio, photos, music, preferences } = action.payload;
  //         setFormData(prev => ({
  //           ...prev,
  //           basicInfo: { name, age, gender, bio },
  //           photos: { photos: photos || [] },
  //           musicTaste: music || prev.musicTaste,
  //           preferences: preferences || prev.preferences
  //         }));
  //       }
  //     });
  //   }
  // }, [dispatch, status]);

//   useEffect(() => {
//   console.log('Profile Create mounted, status:', status);
//   dispatch(fetchUserProfile()).then((action) => {
//     console.log('Profile fetch result:', action);
//     if (action.payload) {
//       const { name, age, gender, bio, photos, music, preferences } = action.payload;
//       setFormData(prev => ({
//         ...prev,
//         basicInfo: { name, age, gender, bio },
//         photos: { photos: photos || [] },
//         musicTaste: music || prev.musicTaste,
//         preferences: preferences || prev.preferences
//       }));
//     }
//   });
// }, [dispatch]);

  // useEffect(() => {
  //     console.log('ProfileCreate effect triggered');
  //   console.log('Current profile:', profile);
  //   console.log('Loading state:', loading);
  //   dispatch(fetchUserProfile())
  //     .unwrap()
  //     .then((action) => {
  //       console.log('Profile fetch result:', action);
  //         if (action) {
  //           const { name, age, gender, bio, photos, music, preferences } = action;
  //           setFormData(prev => ({
  //             ...prev,
  //             basicInfo: { name: name || '', age: age || 18, gender: gender || '', bio: bio || '' },
  //             photos: { photos: photos || [] },
  //             musicTaste: music || prev.musicTaste,
  //             preferences: preferences || prev.preferences
  //           }));
  //         }
  //       })
  //       .catch(error => {
  //         console.error('Profile fetch failed:', error);
  //         // On 404, we'll use the initial form data
  //         if (error.response?.status === 404) {
  //           setFormData(initialFormData);
  //         }
  //       });
  //   }, [dispatch]);
  useEffect(() => {
    // Don't fetch if we're already loading
    if (loading) return;
    
    // Don't fetch if we already have profile data
    // if (profile && Object.keys(profile).length > 0) return;
    
    // Only fetch if we're authenticated and past the Spotify connection step
    const allowedSteps = ['profile', 'complete'];
    if (status === 'authenticated' ) {
      console.log('Initiating profile fetch - Current onboarding step:', onboarding.step);
      dispatch(fetchUserProfile())
        .unwrap()
        .then((action) => {
          console.log('Profile fetch successful:', action);
          if (action) {
            setFormData(prev => ({
              ...prev,
              basicInfo: { 
                name: action.name || '', 
                age: action.age || 18, 
                gender: action.gender || '', 
                bio: action.bio || '' 
              },
              photos: { photos: action.photos || [] },
              musicTaste: action.music || prev.musicTaste,
              preferences: action.preferences || prev.preferences
            }));
          }
        })
        .catch(error => {
          console.error('Profile fetch failed:', error);
          // On 404, we'll use the initial form data
          if (error.response?.status === 404) {
            setFormData(initialFormData);
          }
        });
    }
  }, [dispatch, loading, profile, status, onboarding?.step]);

  // Sync URL with current step
  useEffect(() => {
    const stepFromPath = Object.values(FORM_STEPS).find(
      step => step.path === location.pathname
    );
    
    if (stepFromPath && stepFromPath.key !== currentStep) {
      setCurrentStep(stepFromPath.key);
    } else if (!stepFromPath) {
      navigate(FORM_STEPS.BASIC_INFO.path, { replace: true });
    }
  }, [location, currentStep, navigate]);

  // Load saved form data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('profileFormData');
    if (savedData) {
      setFormData(prev => ({
        ...prev,
        ...JSON.parse(savedData)
      }));
    }
  }, []);

  // Save form data to localStorage
  useEffect(() => {
    localStorage.setItem('profileFormData', JSON.stringify(formData));
  }, [formData]);

  const handleStepDataChange = (stepId, data, errors = null) => {
    if (!stepId) return; // Guard against undefined stepId

    setFormData(prev => ({
      ...prev,
      [stepId.toLowerCase()]: data || {} 
    }));
    
    if (errors) {
      setStepErrors(prev => ({
        ...prev,
        [stepId]: errors
      }));
    } else if (stepErrors) { // Guard against undefined stepErrors
      const newErrors = { ...stepErrors };
      delete newErrors[stepId];
      setStepErrors(newErrors);
    }
  };

  const handleStepSubmit = async (stepId, data) => {
    console.log('handleStepSubmit called with:', { stepId, data });
    setIsSubmitting(true);
    try {
      switch (stepId) {
        case 'BASIC_INFO':
          const basicInfoResult = await dispatch(updateProfileInfo(data)).unwrap();
          if (basicInfoResult) {
            dispatch(setOnboardingStep('photos'));
            setFormData(prev => ({
              ...prev,
              basicInfo: data
            }));
          }
          break;

        case 'PHOTOS':
          if (data.formData) {
            // Batch upload/update photos
            const photoResult = await dispatch(uploadProfilePhotos({
              formData: data.formData,
              action: data.action
            })).unwrap();
            
            if (photoResult?.photos) {
              dispatch(setOnboardingStep('music'));
              setFormData(prev => ({
                ...prev,
                photos: {
                  photos: photoResult.photos
                }
              }));
            }
            return photoResult;
          }
          break;

        case 'MUSIC_TASTE':
          const musicResult = await dispatch(updateMusicProfile(data)).unwrap();
          if (musicResult) {
            dispatch(setOnboardingStep('preferences'));
            setFormData(prev => ({
              ...prev,
              musicTaste: data
            }));
          }
          break;

        case 'PREFERENCES':
          const prefResult = await dispatch(updatePreferences(data)).unwrap();
          if (prefResult) {
            dispatch(setOnboardingStep('review'));
            setFormData(prev => ({
              ...prev,
              preferences: data
            }));
          }
          break;

        case 'REVIEW':
          await dispatch(completeProfile(formData)).unwrap();
          dispatch(completeOnboarding);
          localStorage.removeItem('profileFormData');
          navigate('/discover');
          return;
      }

      // Only proceed with navigation if the current step was completed successfully
      const currentStepIndex = Object.keys(FORM_STEPS).indexOf(currentStep);
      const nextStep = Object.keys(FORM_STEPS)[currentStepIndex + 1];
      
      if (nextStep) {
        navigate(FORM_STEPS[nextStep].path);
      }
    } catch (error) {
      console.error('Step submission error:', error);
      setStepErrors(prev => ({
        ...prev,
        [stepId]: { submit: error.message }
      }));
      return { error };
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    const currentStepIndex = Object.keys(FORM_STEPS).indexOf(currentStep);
    if (currentStepIndex > 0) {
      const prevStep = Object.keys(FORM_STEPS)[currentStepIndex - 1];
      navigate(FORM_STEPS[prevStep].path);
    }
  };

  const currentStepIndex = Object.keys(FORM_STEPS).indexOf(currentStep);
  const StepComponent = FORM_STEPS[currentStep]?.Component;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Progress Bar */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex justify-between mb-2">
          {Object.values(FORM_STEPS).map((step, index) => (
            <div 
              key={step.key}
              className={`text-sm ${
                index <= currentStepIndex 
                  ? 'text-spotify-green' 
                  : 'text-muted-foreground'
              }`}
            >
              {step.label}
            </div>
          ))}
        </div>
        <div className="w-full h-1 bg-background-elevated rounded-full">
          <div 
            className="h-full bg-spotify-green rounded-full transition-all duration-300"
            style={{ 
              width: `${((currentStepIndex + 1) / Object.keys(FORM_STEPS).length) * 100}%` 
            }}
          />
        </div>
      </div>

      {/* Form Content */}
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6">
          {StepComponent && (
            <StepComponent
              formData={currentStep === 'REVIEW' ? formData : formData[currentStep.toLowerCase()] || {}}
              onValidSubmit={(data) => handleStepSubmit(currentStep, data)}
              onDataChange={(data, errors) => 
                handleStepDataChange(currentStep, data, errors)
              }
              errors={stepErrors[currentStep]}
            />
          )}

          {/* Navigation Buttons */}
          {currentStep !== 'REVIEW' && (
            <div className="flex justify-between mt-6">
              {currentStepIndex > 0 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
              )}
              <Button
                className="ml-auto"
                onClick={() => {
                  // Trigger form submission in the step component
                  const form = document.querySelector('form');
                  if (form) {
                    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                  }
                }}
                disabled={isSubmitting || Object.keys(stepErrors[currentStep] || {}).length > 0}
              >
                {isSubmitting ? 'Saving...' : 'Continue'}
              </Button>
            </div>
          )}

          {/* Error Display */}
          {error && error !== 'Profile not found' && ( // Only show non-404 errors
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileCreate;