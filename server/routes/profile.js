const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile');
const { requireAuth } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/error');
const { 
  validateBasicInfo,
  validatePhotos,
  validateMusicProfile,
  validatePreferences,
  validatePhotoOrder
} = require('../middleware/profileValidation');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 6 // Max 6 files
  },
  fileFilter: (req, file, cb) => {
    console.log('Multer processing file:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype
    });
    
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only images are allowed'));
      return;
    }
    cb(null, true);
  }
});

// All routes require authentication
router.use(requireAuth);

// Profile Creation and Retrieval
router.post('/',
  validateBasicInfo,
  handleValidationErrors,
  profileController.createProfile
);

router.get('/',
  profileController.getProfile
);

router.get('/initialize',
  profileController.initializeProfile
);

router.get('/status',
  profileController.getProfileStatus
);

// Basic Info
router.put('/basic-info',
  validateBasicInfo,
  handleValidationErrors,
  profileController.updateBasicInfo
);

// Photos
router.post('/photos',
  (req, res, next) => {
    console.log('Photo upload request received:', {
      headers: req.headers,
      userId: req.user.id
    });
    
    upload.array('photos', 6)(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({
          message: 'File upload error',
          error: err.message
        });
      }
      console.log('Files processed by multer:', req.files?.length);
      next();
    });
  },
  validatePhotos,
  handleValidationErrors,
  async (req, res, next) => {
    try {
      await profileController.uploadPhotosToS3(req, res, next);
    } catch (error) {
      console.error('S3 upload error:', error);
      return res.status(500).json({
        message: 'Failed to upload to S3',
        error: error.message
      });
    }
  },
  async (req, res) => {
    try {
      await profileController.savePhotoReferences(req, res);
    } catch (error) {
      console.error('Save photo references error:', error);
      return res.status(500).json({
        message: 'Failed to save photo references',
        error: error.message
      });
    }
  }
);

router.delete('/photos/:photoId',
  profileController.deletePhotoFromS3, // This deletes from S3
  profileController.removePhotoReference // This removes from profile
);

router.put('/photos/reorder',
  validatePhotoOrder,
  handleValidationErrors,
  profileController.reorderPhotos
);

// Music Profile
router.put('/music-profile',
  validateMusicProfile,
  handleValidationErrors,
  profileController.updateMusicProfile
);

// Preferences
router.put('/preferences',
  validatePreferences,
  handleValidationErrors,
  profileController.updatePreferences
);

// Profile Completion
router.post('/complete',
  profileController.completeProfile
);

// Profile Discovery/Matching
router.get('/discover',
  profileController.getDiscoverProfiles
);

router.post('/like/:profileId',
  profileController.likeProfile
);

router.post('/dislike/:profileId',
  profileController.dislikeProfile
);

// Profile Location
router.put('/location',
  profileController.updateLocation
);

// Match Management
router.get('/matches',
  profileController.getMatches
);

router.delete('/matches/:matchId',
  profileController.unmatch
);

// Debug/Admin Routes (can be protected by admin middleware in production)
if (process.env.NODE_ENV === 'development') {
  router.delete('/debug/reset',
    profileController.resetProfile
  );
}

module.exports = router;