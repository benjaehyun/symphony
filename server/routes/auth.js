const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');
const { requireAuth } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/error');

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
  requireAuth, 
  authController.checkStatus
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
    body('accessToken').notEmpty(),
    body('expiresIn').isNumeric(),
    handleValidationErrors,
    authController.updateSpotifyTokens
);

module.exports = router;