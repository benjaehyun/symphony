const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth');
const { validateRegister, validateLogin, validateSpotifyTokens } = require('../middleware/authValidation');
const { requireAuth } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/error');
const { requestLogger } = require('../services/requestLogger')

router.use(requestLogger)

// Public routes
router.post('/register', 
  validateRegister, 
  handleValidationErrors, 
  authController.register
);

router.post('/login', 
  validateLogin, 
  handleValidationErrors, 
  authController.login
);

router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);

// Protected routes
router.get('/status', 
  requestLogger,
  requireAuth, 
  authController.checkStatus
);


router.get('/spotify/tokens',
  requireAuth,
  authController.getSpotifyTokens
);

// Spotify OAuth routes
router.post('/spotify/store-tokens',
    requireAuth,
    validateSpotifyTokens,
    handleValidationErrors,
    authController.storeSpotifyTokens
);

router.put('/spotify/update-tokens',
    requireAuth,
    body('accessToken').notEmpty().withMessage('Access token is required'),
    body('expiresIn').isNumeric().withMessage('Expiry time is required'),
    handleValidationErrors,
    authController.updateSpotifyTokens
);

module.exports = router;