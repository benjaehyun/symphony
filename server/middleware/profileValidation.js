const { body, param, query } = require('express-validator');
const { PROFILE_STATUS } = require('../models/profile');

exports.validateBasicInfo = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  
  body('age')
    .isInt({ min: 18, max: 100 }).withMessage('Age must be between 18 and 100'),
  
  body('gender')
    .isIn(['man', 'woman', 'non-binary', 'other'])
    .withMessage('Invalid gender selection'),
  
  body('bio')
    .trim()
    .notEmpty().withMessage('Bio is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Bio must be between 10 and 500 characters')
];

// Let's modify the validation middleware to add more debugging:
exports.validatePhotos = [
  (req, res, next) => {
    console.log('Request Content-Type:', req.headers['content-type']);
    console.log('Files received:', {
      files: req.files?.map(f => ({
        fieldname: f.fieldname,
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size,
        buffer: f.buffer ? 'Present' : 'Missing'
      }))
    });

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: [{ 
          message: 'At least one photo is required',
          debug: {
            hasFiles: !!req.files,
            isArray: Array.isArray(req.files),
            length: req.files?.length
          }
        }]
      });
    }

    next();
  }
];

exports.validatePhotoOrder = [
  body('photoOrder')
    .isArray().withMessage('Photo order must be an array')
    .custom((value, { req }) => {
      if (!value.every(id => typeof id === 'string')) {
        throw new Error('Invalid photo ID format');
      }
      return true;
    })
];

exports.validateMusicProfile = [
  body('sourceType')
    .isIn(['playlist', 'top_tracks'])
    .withMessage('Invalid source type'),

  body('sourceId')
    .notEmpty()
    .withMessage('Source ID is required'),

  body('tracks')
    .isArray()
    .withMessage('Tracks must be an array'),

  body('tracks.*.id')
    .notEmpty()
    .withMessage('Track ID is required'),

  body('tracks.*.name')
    .notEmpty()
    .withMessage('Track name is required'),

  // Validate artists array and its contents
  body('tracks.*.artists')
    .isArray()
    .withMessage('Artists must be an array'),

  body('tracks.*.artists.*.id')
    .notEmpty()
    .withMessage('Artist ID is required'),

  body('tracks.*.artists.*.name')
    .notEmpty()
    .withMessage('Artist name is required'),

  body('tracks.*.artists.*.genres')
    .isArray()
    .withMessage('Artist genres must be an array'),

  // Existing feature validations
  body('tracks.*.features')
    .isObject()
    .withMessage('Track features are required'),

  // Existing analysis validations remain the same
  body('analysis')
    .isObject()
    .withMessage('Analysis data is required'),

  body('analysis.averageFeatures')
    .isObject()
    .withMessage('Average features are required'),

  // Updated genreDistribution validation
  body('analysis.genreDistribution')
    .isObject()
    .withMessage('Genre distribution is required')
    .custom((value) => {
      const isValid = Object.entries(value).every(([genre, weight]) => 
        typeof genre === 'string' && 
        typeof weight === 'number' && 
        weight >= 0 && 
        weight <= 1
      );
      if (!isValid) {
        throw new Error('Invalid genre distribution weights');
      }
      return true;
    }),
  // Validate music dimensions
  body('analysis.musicDimensions')
    .isObject()
    .withMessage('Music dimensions are required'),

  body('analysis.musicDimensions.mellow')
    .isFloat({ min: 0, max: 1 })
    .withMessage('Invalid mellow value'),

  body('analysis.musicDimensions.unpretentious')
    .isFloat({ min: 0, max: 1 })
    .withMessage('Invalid unpretentious value'),

  body('analysis.musicDimensions.sophisticated')
    .isFloat({ min: 0, max: 1 })
    .withMessage('Invalid sophisticated value'),

  body('analysis.musicDimensions.intense')
    .isFloat({ min: 0, max: 1 })
    .withMessage('Invalid intense value'),

  body('analysis.musicDimensions.contemporary')
    .isFloat({ min: 0, max: 1 })
    .withMessage('Invalid contemporary value'),
];

exports.validatePreferences = [
  body('genderPreference')
    .isArray()
    .withMessage('Gender preferences must be an array')
    .custom(value => {
      const validGenders = ['man', 'woman', 'non-binary', 'other'];
      return value.every(gender => validGenders.includes(gender));
    })
    .withMessage('Invalid gender preference selection'),

  body('ageRange')
    .isObject()
    .withMessage('Age range is required'),

  body('ageRange.min')
    .isInt({ min: 18, max: 100 })
    .withMessage('Minimum age must be between 18 and 100'),

  body('ageRange.max')
    .isInt({ min: 18, max: 100 })
    .withMessage('Maximum age must be between 18 and 100')
    .custom((value, { req }) => {
      if (value < req.body.ageRange.min) {
        throw new Error('Maximum age must be greater than minimum age');
      }
      return true;
    }),

  body('maxDistance')
    .isInt({ min: 1, max: 150 })
    .withMessage('Distance must be between 1 and 150 kilometers')
];

exports.validateLocation = [
  body('coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('Coordinates must be [longitude, latitude]'),

  body('coordinates.0') // Longitude
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),

  body('coordinates.1') // Latitude
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude')
];

// Custom middleware to check if profile exists
exports.profileExists = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    req.profile = profile;
    next();
  } catch (error) {
    next(error);
  }
};

// Custom middleware to check profile completion status
exports.requireProfileStatus = (requiredStatus) => async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    const currentStatusIndex = Object.values(PROFILE_STATUS).indexOf(profile.status);
    const requiredStatusIndex = Object.values(PROFILE_STATUS).indexOf(requiredStatus);
    
    if (currentStatusIndex < requiredStatusIndex) {
      return res.status(400).json({ 
        message: `Profile must be in ${requiredStatus} status or higher` 
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = exports;