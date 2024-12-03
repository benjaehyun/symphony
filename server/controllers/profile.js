const Profile = require('../models/profile');
const User = require('../models/user');
const s3Service = require('../services/s3Service');

const { PROFILE_STATUS } = require('../models/profile')

// Profile Creation and Basic Operations
exports.createProfile = async (req, res) => {
  try {
    const existingProfile = await Profile.findOne({ user: req.user.id });
    if (existingProfile) {
      return res.status(400).json({ message: 'Profile already exists' });
    }

    const profile = new Profile({
      user: req.user.id,
      ...req.body
    });

    await profile.save();
    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Error creating profile' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

exports.initializeProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (profile) {
      return res.json(profile);
    }
    profile = new Profile({
      user: req.user.id,
      status: 'NOT_STARTED'
    });
    await profile.save();
    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

exports.getProfileStatus = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.json({ status: 'NOT_STARTED' });
    }
    res.json({ status: profile.status });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile status' });
  }
};

// Basic Info Updates
exports.updateBasicInfo = async (req, res) => {
  try {
    const { name, age, gender, bio } = req.body;
    
    const profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      {
        name,
        age,
        gender,
        bio,
        // If this is a new profile, ensure we set initial status
        $setOnInsert: {
          status: 'BASIC_INFO_COMPLETED',
          // Set other required fields with default values
          preferences: {
            genderPreference: [],
            ageRange: {
              min: 18,
              max: 100
            },
            maxDistance: 50
          },
          location: {
            type: 'Point',
            coordinates: [0, 0] // Default coordinates, will be updated later
          }
        }
      },
      {
        new: true, // Return the updated document
        upsert: true, // Create if doesn't exist
        runValidators: true, // Run validators for this update
        setDefaultsOnInsert: true
      }
    );

    res.json(profile);
  } catch (error) {
    console.error('Profile basic info update error:', error);
    res.status(500).json({ 
      message: 'Error updating basic info',
      error: error.message 
    });
  }
};

// Photo Management
exports.uploadPhotosToS3 = async (req, res, next) => {
  try {
    const uploadPromises = req.files.map(file => 
      s3Service.uploadPhoto(file, req.user.id)
    );

    const uploadedPhotos = await Promise.all(uploadPromises);
    req.uploadedPhotos = uploadedPhotos;
    next();
  } catch (error) {
    next(error);
  }
};

exports.savePhotoReferences = async (req, res) => {
  try {
    console.log('Starting savePhotoReferences with user:', req.user.id);
    console.log('Uploaded photos to save:', req.uploadedPhotos);
    
    if (!req.uploadedPhotos || !Array.isArray(req.uploadedPhotos)) {
      console.error('No uploaded photos found in request');
      return res.status(400).json({ 
        message: 'No photos to save' 
      });
    }

    // Get current profile to check existing photos
    const currentProfile = await Profile.findOne({ user: req.user.id });
    if (!currentProfile) {
      console.error('Profile not found for user:', req.user.id);
      return res.status(404).json({ 
        message: 'Profile not found' 
      });
    }

    const startingPhotoCount = currentProfile.photos?.length || 0;
    
    // Prepare new photos with correct ordering
    const newPhotos = req.uploadedPhotos.map((photo, index) => ({
      url: photo.url,
      key: photo.key,
      order: startingPhotoCount + index
    }));

    console.log('Current photo count:', startingPhotoCount);
    console.log('New photos to add:', newPhotos);

    // Determine new status
    let newStatus = currentProfile.status;
    if (currentProfile.status === PROFILE_STATUS.BASIC_INFO_COMPLETED) {
      newStatus = PROFILE_STATUS.PHOTOS_UPLOADED;
    }

    // Perform the update
    const updatedProfile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { 
        $push: { 
          photos: { 
            $each: newPhotos 
          }
        },
        $set: { status: newStatus }
      },
      { 
        new: true,
        runValidators: false,
        fields: { 
          'photos': 1,
          'status': 1 
        }
      }
    );

    if (!updatedProfile) {
      console.error('Failed to update profile with new photos');
      return res.status(500).json({ 
        message: 'Failed to update profile with new photos' 
      });
    }

    console.log('Profile updated successfully:', {
      id: updatedProfile._id,
      previousPhotoCount: startingPhotoCount,
      newPhotoCount: updatedProfile.photos.length,
      addedPhotos: newPhotos.length,
      newStatus: updatedProfile.status
    });
    
    res.json({ 
      photos: updatedProfile.photos,
      status: updatedProfile.status,
      message: `Successfully added ${newPhotos.length} photos`
    });

  } catch (error) {
    console.error('Error in savePhotoReferences:', {
      message: error.message,
      stack: error.stack,
      userId: req.user.id
    });

    res.status(500).json({ 
      message: 'Failed to save photo references',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

exports.deletePhotoFromS3 = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    const photo = profile.photos.find(p => p._id.toString() === req.params.photoId);
    
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    await s3Service.deletePhoto(photo.key);
    next();
  } catch (error) {
    next(error);
  }
};

exports.removePhotoReference = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    profile.photos = profile.photos.filter(
      p => p._id.toString() !== req.params.photoId
    );
    await profile.save();

    res.json({ photos: profile.photos });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove photo reference' });
  }
};

exports.reorderPhotos = async (req, res) => {
  try {
    const { photoOrder } = req.body;
    const profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Update order for each photo
    photoOrder.forEach((photoId, index) => {
      const photo = profile.photos.find(p => p._id.toString() === photoId);
      if (photo) {
        photo.order = index;
      }
    });

    // Sort photos by order
    profile.photos.sort((a, b) => a.order - b.order);
    await profile.save();

    res.json({ photos: profile.photos });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reorder photos' });
  }
};

// Music Profile
exports.updateMusicProfile = async (req, res) => {
  try {
    console.log('Updating music profile for user:', req.user.id);

    const profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      {
        $set: {
          'music.sourceType': req.body.sourceType,
          'music.sourceId': req.body.sourceId,
          'music.tracks': req.body.tracks,
          'music.analysis': req.body.analysis,
          'music.lastUpdated': new Date()
        },
        // If this is first music update, ensure we update status
        $setOnInsert: {
          status: PROFILE_STATUS.MUSIC_CONNECTED
        }
      },
      {
        new: true, // Return the updated document
        runValidators: true, // Run validators for this update
        setDefaultsOnInsert: true
      }
    );

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Log successful update
    console.log('Music profile updated successfully:', {
      userId: req.user.id,
      sourceType: profile.music.sourceType,
      trackCount: profile.music.tracks?.length,
      status: profile.status
    });

    res.json(profile.music);
  } catch (error) {
    console.error('Music profile update error:', {
      userId: req.user.id,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });

    // Handle specific MongoDB validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Invalid music profile data',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({ 
      message: 'Failed to update music profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Preferences
exports.updatePreferences = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    profile.preferences = req.body;
    await profile.save();

    res.json(profile.preferences);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update preferences' });
  }
};

// Location
exports.updateLocation = async (req, res) => {
  try {
    const { coordinates } = req.body;
    const profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    profile.location = {
      type: 'Point',
      coordinates
    };

    await profile.save();
    res.json({ location: profile.location });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update location' });
  }
};

// Profile Completion
exports.completeProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    if (!profile.isComplete()) {
      return res.status(400).json({ 
        message: 'Profile is incomplete. Please fill all required fields.' 
      });
    }

    profile.status = 'COMPLETED';
    await profile.save();

    console.log('saved profile complete')

    // Update user model to reflect completed profile
    // await req.user.updateOne({ isProfileComplete: true });
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user.id },{ isProfileComplete: true })

    console.log('updated user model')

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Failed to complete profile' });
  }
};




// Debug/Development
// if (process.env.NODE_ENV === 'development') {
//   exports.resetProfile = async (req, res) => {
//     try {
//       await Profile.findOneAndDelete({ user: req.user.id });
//       res.json({ message: 'Profile reset successful' });
//     } catch (error) {
//       res.status(500).json({ message: 'Failed to reset profile' });
//     }
//   };
// }

module.exports = exports;