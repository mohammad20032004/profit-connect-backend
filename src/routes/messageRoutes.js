const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getOrCreateConversation,
  getMyConversations,
  getMessages,
  sendMessage,
  getUnreadCount
} = require('../controllers/messageController');

router.post('/conversations', protect, getOrCreateConversation);
router.get('/conversations', protect, getMyConversations);
router.get('/conversations/:conversationId', protect, getMessages);
router.post('/conversations/:conversationId', protect, sendMessage);
router.get('/unread', protect, getUnreadCount);

module.exports = router;
