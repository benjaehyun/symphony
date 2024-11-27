import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { validatePreferences } from '../../utils/validation/profile-schemas';

const GENDER_OPTIONS = [
  { value: 'man', label: 'Men' },
  { value: 'woman', label: 'Women' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' }
];

const DEFAULT_PREFERENCES = {
  genderPreference: [],
  ageRange: { min: 18, max: 99 },
  maxDistance: 25
};

const Preferences = ({ formData = DEFAULT_PREFERENCES, onValidSubmit, onDataChange }) => {
  const [localData, setLocalData] = useState(formData);
  const [validationErrors, setValidationErrors] = useState({});
  const { setValue } = useForm({
    defaultValues: formData,
    mode: 'onChange'
  });

  const updateDataAndValidate = async (newData) => {
    const validationResult = await validatePreferences(newData);
    setLocalData(newData);
    
    if (validationResult.errors) {
      setValidationErrors(validationResult.errors);
      onDataChange(newData, validationResult.errors);
    } else {
      setValidationErrors({});
      onDataChange(newData);
    }
  };

  const handleGenderToggle = async (gender) => {
    const currentPreferences = [...localData.genderPreference];
    const index = currentPreferences.indexOf(gender);
    
    if (index === -1) {
      currentPreferences.push(gender);
    } else {
      currentPreferences.splice(index, 1);
    }

    const newData = {
      ...localData,
      genderPreference: currentPreferences
    };

    setValue('genderPreference', currentPreferences);
    await updateDataAndValidate(newData);
  };

  const handleAgeRangeChange = async (values) => {
    const newData = {
      ...localData,
      ageRange: {
        min: values[0],
        max: values[1]
      }
    };

    setValue('ageRange', newData.ageRange);
    await updateDataAndValidate(newData);
  };

  const handleDistanceChange = async (value) => {
    const newData = {
      ...localData,
      maxDistance: value[0] // Slider returns array even for single value
    };

    setValue('maxDistance', value[0]);
    await updateDataAndValidate(newData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationResult = await validatePreferences(localData);
    
    if (validationResult.isValid) {
      onValidSubmit(localData);
    } else {
      setValidationErrors(validationResult.errors);
      onDataChange(localData, validationResult.errors);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Your Preferences</h2>
        <p className="text-muted-foreground">
          Let us know what you're looking for to help find your perfect match.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Gender Preferences */}
        <div className="space-y-4">
          <Label>I'm interested in</Label>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
            {GENDER_OPTIONS.map(({ value, label }) => (
              <Button
                key={value}
                type="button"
                variant={localData.genderPreference.includes(value) ? "default" : "outline"}
                className={`flex-1 sm:flex-none transition-colors ${
                  localData.genderPreference.includes(value) 
                    ? 'bg-spotify-green hover:bg-spotify-green/90' 
                    : ''
                }`}
                onClick={() => handleGenderToggle(value)}
              >
                {label}
              </Button>
            ))}
          </div>
          {validationErrors.genderPreference && (
            <p className="text-sm text-destructive mt-1">
              {validationErrors.genderPreference}
            </p>
          )}
        </div>

        {/* Age Range */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Age Range</Label>
            <span className="text-sm text-muted-foreground">
              {localData.ageRange.min} - {localData.ageRange.max} years
            </span>
          </div>
          <Slider
            min={18}
            max={100}
            step={1}
            value={[localData.ageRange.min, localData.ageRange.max]}
            onValueChange={handleAgeRangeChange}
            className="py-4"
          />
          {validationErrors.ageRange && (
            <p className="text-sm text-destructive">
              {validationErrors.ageRange}
            </p>
          )}
        </div>

        {/* Distance */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Maximum Distance</Label>
            <span className="text-sm text-muted-foreground">
              {localData.maxDistance} km
            </span>
          </div>
          <Slider
            min={1}
            max={150}
            step={1}
            value={[localData.maxDistance]}
            onValueChange={handleDistanceChange}
            className="py-4"
          />
          <p className="text-sm text-muted-foreground">
            Show me people within {localData.maxDistance} kilometers
          </p>
          {validationErrors.maxDistance && (
            <p className="text-sm text-destructive">
              {validationErrors.maxDistance}
            </p>
          )}
        </div>

        {/* Hidden submit button for form handling */}
        <button type="submit" className="hidden" />
      </form>

      {/* General Error Display */}
      {Object.keys(validationErrors).length > 0 && !validationErrors.genderPreference && !validationErrors.ageRange && !validationErrors.maxDistance && (
        <Alert variant="destructive">
          <AlertDescription>
            Please check your preferences and try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default Preferences;