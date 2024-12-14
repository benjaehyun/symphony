const express = require('express');
const router = express.Router();
const discoveryController = require('../controllers/discovery');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/profiles', discoveryController.getDiscoveryProfiles);

router.post('/profiles/:profileId/like', discoveryController.likeProfile);

router.post('/profiles/:profileId/dislike', discoveryController.dislikeProfile);

module.exports = router;