import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import BasicInfo from '../../components/profile/BasicInfo';
import PhotoUpload from '../../components/profile/PhotoUpload';
import MusicTaste from '../../components/profile/MusicTaste';
import { 
  updateProfileInfo, 
  uploadProfilePhotos,
  updateMusicProfile,
  fetchUserProfile 
} from '../../store/slices/profileSlice';

const FORM_STEPS = {
  BASIC_INFO: {
    key: 'BASIC_INFO',
    path: '/create-profile/basic-info',
    label: 'Basic Info',
    Component: BasicInfo,
  },
  PHOTOS: {
    key: 'PHOTOS',
    path: '/create-profile/photos',
    label: 'Photos',
    Component: PhotoUpload,
  },
  PREFERENCES: {
    key: 'PREFERENCES',
    path: '/create-profile/preferences',
    label: 'Preferences',
    // Component: Preferences, // To be implemented
  },
  MUSIC_TASTE: {
    key: 'MUSIC_TASTE',
    path: '/create-profile/music',
    label: 'Music Taste',
    Component: MusicTaste,
  },
  REVIEW: {
    key: 'REVIEW',
    path: '/create-profile/review',
    label: 'Review',
    // Component: ProfileReview, // To be implemented
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
        analyzedTracks: [],
        analysis: {
        acousticness: null,
        danceability: null,
        energy: null,
        instrumentalness: null,
        valence: null
        }
    }
};

const ProfileCreate = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { status, error, profile } = useSelector(state => state.profile);
  const [currentStep, setCurrentStep] = useState('BASIC_INFO');
  const [formData, setFormData] = useState(initialFormData);
  const [stepErrors, setStepErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status !== 'NOT_STARTED') {
      dispatch(fetchUserProfile()).then((action) => {
        if (action.payload) {
          const { name, age, gender, bio, photos, music } = action.payload;
          setFormData(prev => ({
            ...prev,
            basicInfo: { name, age, gender, bio },
            photos: { photos: photos || [] },
            musicTaste: music || prev.musicTaste
          }));
        }
      });
    }
  }, [dispatch, status]);

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

  // Store form data in localStorage to prevent loss on refresh
  useEffect(() => {
    const savedData = localStorage.getItem('profileFormData');
    if (savedData) {
      setFormData(prev => ({
        ...prev,
        ...JSON.parse(savedData)
      }));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('profileFormData', JSON.stringify(formData));
  }, [formData]);

  const handleStepDataChange = (stepId, data, errors = null) => {
    setFormData(prev => ({
      ...prev,
      [stepId.toLowerCase()]: data
    }));
    
    if (errors) {
      setStepErrors(prev => ({
        ...prev,
        [stepId]: errors
      }));
    } else {
      const { [stepId]: _, ...remainingErrors } = stepErrors;
      setStepErrors(remainingErrors);
    }
  };

  const handleStepSubmit = async (stepId, data) => {
    setIsSubmitting(true);
    try {
      switch (stepId) {
        case 'BASIC_INFO':
            await dispatch(updateProfileInfo(data)).unwrap();
            break;
        case 'PHOTOS':
            await dispatch(uploadProfilePhotos(data.photos)).unwrap();
            break;
        case 'MUSIC_TASTE':
            await dispatch(updateMusicProfile({
            sourceType: data.sourceType,
            sourceId: data.sourceId,
            analyzedTracks: data.tracks,
            analysis: data.analysis
            })).unwrap();
            break;
        // Add other step submissions
      }

      const currentStepIndex = Object.keys(FORM_STEPS).indexOf(currentStep);
      const nextStep = Object.keys(FORM_STEPS)[currentStepIndex + 1];
      
      if (nextStep) {
        navigate(FORM_STEPS[nextStep].path);
      } else {
        navigate('/discover');
      }
    } catch (error) {
        console.error('Step submission error:', error);
        setStepErrors(prev => ({
          ...prev,
          [stepId]: { submit: error.message }
        }));
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
              formData={formData[currentStep.toLowerCase()]}
              onValidSubmit={(data) => handleStepSubmit(currentStep, data)}
              onDataChange={(data, errors) => 
                handleStepDataChange(currentStep, data, errors)
              }
              errors={stepErrors[currentStep]}
            />
          )}

          {/* Navigation Buttons */}
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
                  form.dispatchEvent(new Event('submit', { cancelable: true }));
                }
              }}
              disabled={isSubmitting || Object.keys(stepErrors[currentStep] || {}).length > 0}
            >
              {isSubmitting ? 'Saving...' : currentStepIndex === Object.keys(FORM_STEPS).length - 1 
                ? 'Complete Profile' 
                : 'Continue'}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
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