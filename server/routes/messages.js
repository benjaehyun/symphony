const express = require('express');
const router = express.Router();
const messagesController = require('../controllers/messages');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// Get paginated messages for a room
router.get('/:roomId', messagesController.getMessages);

// Get conversation previews (last message for each conversation)
router.get('/conversations/preview', messagesController.getConversationPreviews);

// Send message (fallback for socket failure)
router.post('/:roomId', messagesController.sendMessage);

// Mark messages as read
router.patch('/:roomId/read', messagesController.markMessagesAsRead);

module.exports = router;