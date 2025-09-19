import express from 'express';
import { searchController } from '../controllers/searchController';
import { authenticateToken as auth } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router: express.Router = express.Router();

// Rate limiting for search
const searchRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: 'Too many search requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply authentication to all routes
router.use(auth);
router.use(searchRateLimit);

// Global search (messages, channels, users)
router.get('/global', searchController.globalSearch);

// Search messages with advanced filters
router.get('/messages', searchController.searchMessages);

// Search messages with highlights
router.get('/messages/highlights', searchController.searchWithHighlights);

// Search channels
router.get('/channels', searchController.searchChannels);

// Search users
router.get('/users', searchController.searchUsers);

// Get recent messages
router.get('/recent', searchController.getRecentMessages);

export default router;
