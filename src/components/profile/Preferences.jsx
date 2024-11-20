import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { validatePreferences } from '../../utils/validation/profile-validation';

const GENDER_OPTIONS = [
  { value: 'man', label: 'Men' },
  { value: 'woman', label: 'Women' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' }
];

const Preferences = ({ formData, onValidSubmit, onDataChange }) => {
  const [localData, setLocalData] = useState(formData);
  const { setValue } = useForm({
    defaultValues: formData,
    mode: 'onChange'
  });

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

    const validationResult = await validatePreferences(newData);
    setLocalData(newData);
    setValue('genderPreference', currentPreferences);
    onDataChange(newData, validationResult.errors);
  };

  const handleAgeRangeChange = async (values) => {
    const newData = {
      ...localData,
      ageRange: {
        min: values[0],
        max: values[1]
      }
    };

    const validationResult = await validatePreferences(newData);
    setLocalData(newData);
    setValue('ageRange', newData.ageRange);
    onDataChange(newData, validationResult.errors);
  };

  const handleDistanceChange = async (value) => {
    const newData = {
      ...localData,
      maxDistance: value
    };

    const validationResult = await validatePreferences(newData);
    setLocalData(newData);
    setValue('maxDistance', value);
    onDataChange(newData, validationResult.errors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationResult = await validatePreferences(localData);
    if (validationResult.isValid) {
      onValidSubmit(localData);
    } else {
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
                className="flex-1 sm:flex-none"
                onClick={() => handleGenderToggle(value)}
              >
                {label}
              </Button>
            ))}
          </div>
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
            onValueChange={([value]) => handleDistanceChange(value)}
            className="py-4"
          />
        </div>

        {/* Hidden submit button for form handling */}
        <button type="submit" className="hidden" />
      </form>

      {/* Display any validation errors */}
      {localData.error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{localData.error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default Preferences;