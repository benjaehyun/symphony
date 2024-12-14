const express = require('express');
const router = express.Router();
const matchesController = require('../controllers/matches');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', matchesController.getMatches);
router.get('/unread/count', matchesController.getUnreadCount);
router.patch('/read', matchesController.markMatchesAsRead);
router.delete('/:matchId', matchesController.unmatch);

module.exports = router;