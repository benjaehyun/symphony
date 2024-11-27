import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Card, CardContent } from '../ui/card';
import { 
  User, MapPin, Music2, Heart, 
  ChevronRight, Edit2 
} from 'lucide-react';

const SECTIONS = {
  BASIC_INFO: {
    icon: User,
    title: 'Basic Information',
    path: '/create-profile/basic-info'
  },
  PHOTOS: {
    icon: MapPin,
    title: 'Photos',
    path: '/create-profile/photos'
  },
  MUSIC_TASTE: {
    icon: Music2,
    title: 'Music Taste',
    path: '/create-profile/music'
  },
  PREFERENCES: {
    icon: Heart,
    title: 'Preferences',
    path: '/create-profile/preferences'
  }
};

const ProfileReview = ({ formData, onValidSubmit, errors }) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = (path) => {
    navigate(path);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onValidSubmit(formData);
    } catch (error) {
      console.error('Profile completion error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBasicInfo = () => (
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <p className="font-medium">{formData.basicInfo.name}, {formData.basicInfo.age}</p>
        <p className="text-muted-foreground">{formData.basicInfo.gender}</p>
        <p className="text-sm mt-2">{formData.basicInfo.bio}</p>
      </div>
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => handleEdit(SECTIONS.BASIC_INFO.path)}
      >
        <Edit2 className="h-4 w-4" />
      </Button>
    </div>
  );

  const renderPhotos = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-medium">Photos ({formData.photos.photos.length})</p>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => handleEdit(SECTIONS.PHOTOS.path)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {formData.photos.photos.map((photo, index) => (
          <div 
            key={photo.key} 
            className="aspect-square relative rounded-md overflow-hidden"
          >
            <img 
              src={photo.url} 
              alt={`Photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {index === 0 && (
              <div className="absolute bottom-1 left-1 bg-black/60 px-2 py-0.5 rounded text-xs text-white">
                Main
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // Inside ProfileReview.jsx, update the renderMusicTaste method:

const renderMusicTaste = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <p className="font-medium">Music Profile</p>
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => handleEdit(SECTIONS.MUSIC_TASTE.path)}
      >
        <Edit2 className="h-4 w-4" />
      </Button>
    </div>

    {formData.musicTaste.analysis && (
      <div className="space-y-6">
        {/* Audio Features */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Audio Features</p>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(formData.musicTaste.analysis.averageFeatures).map(([feature, value]) => (
              <div key={feature} className="space-y-1">
                <p className="text-sm text-muted-foreground capitalize">
                  {feature.replace('_', ' ')}
                </p>
                <div className="h-2 bg-background-elevated rounded-full">
                  <div
                    className="h-full bg-spotify-green rounded-full transition-all"
                    style={{ width: `${value * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Music Dimensions */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Music Dimensions</p>
          <div className="grid grid-cols-1 gap-3">
            {Object.entries(formData.musicTaste.analysis.musicDimensions).map(([dimension, value]) => (
              <div key={dimension} className="space-y-1">
                <p className="text-sm text-muted-foreground capitalize">
                  {dimension.replace('_', ' ')}
                </p>
                <div className="h-2 bg-background-elevated rounded-full">
                  <div
                    className="h-full bg-spotify-green rounded-full transition-all"
                    style={{ width: `${value * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Genres */}
        {Object.keys(formData.musicTaste.analysis.genreDistribution).length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Top Genres</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(formData.musicTaste.analysis.genreDistribution)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([genre, weight]) => (
                  <span
                    key={genre}
                    className="px-2 py-1 rounded-full bg-background-elevated text-sm"
                  >
                    {genre} ({Math.round(weight * 100)}%)
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>
    )}
  </div>
);

  const renderPreferences = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-medium">Preferences</p>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => handleEdit(SECTIONS.PREFERENCES.path)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Interested in: {formData.preferences.genderPreference.join(', ')}
        </p>
        <p className="text-sm text-muted-foreground">
          Age range: {formData.preferences.ageRange.min} - {formData.preferences.ageRange.max} years
        </p>
        <p className="text-sm text-muted-foreground">
          Distance: Up to {formData.preferences.maxDistance} km
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Review Your Profile</h2>
        <p className="text-muted-foreground">
          Review your profile information before finalizing. Click edit on any section to make changes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="divide-y divide-border">
            {/* Basic Info Section */}
            <div className="py-4">
              {renderBasicInfo()}
            </div>

            {/* Photos Section */}
            <div className="py-4">
              {renderPhotos()}
            </div>

            {/* Music Taste Section */}
            <div className="py-4">
              {renderMusicTaste()}
            </div>

            {/* Preferences Section */}
            <div className="py-4">
              {renderPreferences()}
            </div>
          </CardContent>
        </Card>

        {errors && (
          <Alert variant="destructive">
            <AlertDescription>{errors}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Completing Profile...' : 'Complete Profile'}
        </Button>
      </form>
    </div>
  );
};

export default ProfileReview;