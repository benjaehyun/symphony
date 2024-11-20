import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import BasicInfo from '../../components/profile/BasicInfo';
import PhotoUpload from '../../components/profile/PhotoUpload';


const FORM_STEPS = {
  BASIC_INFO: 'BASIC_INFO',
  PHOTOS: 'PHOTOS',
  PREFERENCES: 'PREFERENCES',
  MUSIC_TASTE: 'MUSIC_TASTE',
  REVIEW: 'REVIEW'
};

const ProfileCreate = () => {
  const dispatch = useDispatch();
  const [currentStep, setCurrentStep] = useState(FORM_STEPS.BASIC_INFO);
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    age: 18,
    gender: '',
    bio: '',
    
    // Preferences
    genderPreference: [],
    ageRange: {
      min: 18,
      max: 99
    },
    distancePreference: 25,

    // Photos
    photos: [],

    // Music
    genres: [],
    artists: [],
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Progress indicator
  const steps = [
    { key: FORM_STEPS.BASIC_INFO, label: 'Basic Info' },
    { key: FORM_STEPS.PHOTOS, label: 'Photos' },
    { key: FORM_STEPS.PREFERENCES, label: 'Preferences' },
    { key: FORM_STEPS.MUSIC_TASTE, label: 'Music Taste' },
    { key: FORM_STEPS.REVIEW, label: 'Review' }
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateBasicInfo = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else if (formData.age < 18) {
      newErrors.age = 'You must be at least 18 years old';
    }

    if (!formData.gender) {
      newErrors.gender = 'Please select your gender';
    }

    if (!formData.bio.trim()) {
      newErrors.bio = 'Please tell us a bit about yourself';
    } else if (formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePhotos = () => {
    const newErrors = {};
    
    if (formData.photos.length === 0) {
      newErrors.photos = 'Please upload at least one photo';
    }
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  

  const handleNext = () => {
    let isValid = false;

    switch (currentStep) {
        case FORM_STEPS.BASIC_INFO:
            isValid = validateBasicInfo();
            break;
        case FORM_STEPS.PHOTOS:
            isValid = validatePhotos();
            break;
      // Add other step validations here
        default:
            isValid = true;
    }

    if (isValid) {
      setCurrentStep(steps[currentStepIndex + 1].key);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // This will be connected to our Redux action
      await dispatch(createProfile(formData)).unwrap();
      // Navigate to next page after successful profile creation
      navigate('/discover');
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        submit: error.message
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
    case FORM_STEPS.BASIC_INFO:
        return (
        <BasicInfo 
            formData={formData}
            onChange={handleChange}
            errors={errors}
        />
        );
    case FORM_STEPS.PHOTOS:
        return (
            <PhotoUpload 
            photos={formData.photos}
            onChange={({ photos, error }) => {
                if (photos) {
                    setFormData(prev => ({ ...prev, photos }));
                }
                if (error) {
                    setErrors(prev => ({ ...prev, photos: error }));
                }
            }}
            errors={errors}
            />
        );    
        // Other steps will be added here
        default:
            return null;
        }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Progress Bar */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex justify-between mb-2">
          {steps.map((step, index) => (
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
              width: `${((currentStepIndex + 1) / steps.length) * 100}%` 
            }}
          />
        </div>
      </div>

      {/* Form Content */}
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6">
          {/* Form content will go here based on currentStep */}
          {renderStepContent()}
          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            {currentStepIndex > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(steps[currentStepIndex - 1].key)}
              >
                Back
              </Button>
            )}
            <Button
              className="ml-auto"
              onClick={currentStepIndex === steps.length - 1 ? handleSubmit : handleNext}
            >
              {currentStepIndex === steps.length - 1 ? 'Complete Profile' : 'Continue'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileCreate;