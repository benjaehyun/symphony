const { body } = require('express-validator');

exports.validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('name')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Name is required')
];

exports.validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .not()
    .isEmpty()
    .withMessage('Password is required')
];

exports.validateSpotifyTokens = [
    body('spotifyId').notEmpty().withMessage('Spotify ID is required'),
    body('accessToken').notEmpty().withMessage('Access token is required'),
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
    body('expiresIn').isNumeric().withMessage('Expiry time is required'),
    body('scope').isArray().withMessage('Scope must be an array')
  ];