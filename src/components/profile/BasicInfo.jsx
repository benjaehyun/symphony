import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { validateBasicInfo } from '../../utils/validation/profile-schemas';

const GENDER_OPTIONS = [
  { value: 'man', label: 'Man' },
  { value: 'woman', label: 'Woman' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' }
];

const BasicInfo = ({ formData, onValidSubmit, onDataChange }) => {
  const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm({
    defaultValues: formData,
    mode: 'onChange'
  });

  const bioLength = watch('bio')?.length || 0;

  // Update parent form data when fields change
  const handleFieldChange = async (name, value) => {
    setValue(name, value);
    const currentData = { ...formData, [name]: value };
    const { isValid, errors: validationErrors } = await validateBasicInfo(currentData);
    onDataChange(currentData, isValid ? null : validationErrors);
  };

  useEffect(() => {
    if (formData) {
      // Set initial form values
      Object.entries(formData).forEach(([key, value]) => {
        setValue(key, value || ''); // Add fallback for null values
      });
    }
  }, [formData, setValue]);

  const onSubmit = async (data) => {
    console.log('Form submitted with data:', data);
    const { isValid, errors } = await validateBasicInfo(data);
    console.log('Validation result:', { isValid, errors });
    if (isValid) {
      onValidSubmit(data);
    } else {
      // Update errors in parent component
      onDataChange(data, errors);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          Tell us about yourself
        </h2>
        <p className="text-muted-foreground">
          Let's start with some basic information to help people get to know you.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Enter your name"
            className={errors?.name ? 'border-destructive' : ''}
            onChange={(e) => handleFieldChange('name', e.target.value)}
          />
          {errors?.name && (
            <span className="text-sm text-destructive">{errors.name.message}</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              min={18}
              max={100}
              {...register('age', { valueAsNumber: true })}
              className={errors?.age ? 'border-destructive' : ''}
              onChange={(e) => handleFieldChange('age', Number(e.target.value))}
            />
            {errors?.age && (
              <span className="text-sm text-destructive">{errors.age.message}</span>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={watch('gender')}
              onValueChange={(value) => handleFieldChange('gender', value)}
            >
              <SelectTrigger 
                id="gender"
                className={errors?.gender ? 'border-destructive' : ''}
              >
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors?.gender && (
              <span className="text-sm text-destructive">{errors.gender.message}</span>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="bio">About Me</Label>
          <Textarea
            id="bio"
            {...register('bio')}
            placeholder="Tell others about yourself, your music taste, and what you're looking for..."
            className={`min-h-[120px] ${errors?.bio ? 'border-destructive' : ''}`}
            onChange={(e) => handleFieldChange('bio', e.target.value)}
          />
          <div className="flex justify-between">
            {errors?.bio && (
              <span className="text-sm text-destructive">{errors.bio.message}</span>
            )}
            <span className="text-sm text-muted-foreground">
              {bioLength}/500
            </span>
          </div>
        </div>
        <button type="submit" style={{ display: 'none' }} />
      </form>
    </div>
  );
};

export default BasicInfo;