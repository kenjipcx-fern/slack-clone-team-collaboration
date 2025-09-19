import express from 'express';
import { messageController } from '../controllers/messageController';
import { authenticateToken as auth } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router: express.Router = express.Router();

// Rate limiting for messages
const messageRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 messages per minute
  message: 'Too many messages sent. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply authentication to all routes
router.use(auth);

// Get channel messages
router.get('/channels/:channelId', messageController.getChannelMessages);

// Get DM messages
router.get('/dm/:userId', messageController.getDMMessages);

// Create message (mainly for file uploads, regular messages should use WebSocket)
router.post('/', messageRateLimit, messageController.createMessage);

// Update message
router.patch('/:messageId', messageController.updateMessage);

// Delete message
router.delete('/:messageId', messageController.deleteMessage);

// Add reaction to message
router.post('/:messageId/reactions', messageController.addReaction);

// Remove reaction from message
router.delete('/:messageId/reactions', messageController.removeReaction);

export default router;
