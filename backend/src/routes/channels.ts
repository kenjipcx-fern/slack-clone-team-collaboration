import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  getUserChannels,
  createChannel,
  joinChannel,
  leaveChannel,
  getChannel,
  updateChannel,
  deleteChannel,
} from '../controllers/channelController';
import { authenticateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import {
  createChannelSchema,
  updateChannelSchema,
} from '../utils/validation';

const router: Router = Router();

// Health check for channel service (no auth required)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'channels',
    timestamp: new Date().toISOString(),
  });
});

// Rate limiting for channel operations
const channelLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window per IP
  message: {
    success: false,
    message: 'Too many channel requests, please try again later',
    code: 'RATE_LIMITED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// More restrictive rate limiting for channel creation
const createChannelLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 channel creations per hour per IP
  message: {
    success: false,
    message: 'Too many channel creations, please try again later',
    code: 'CREATE_RATE_LIMITED',
  },
});

// Channel routes (all require authentication)
router.get('/', authenticateToken, channelLimiter, getUserChannels);
router.post('/', authenticateToken, createChannelLimiter, validateBody(createChannelSchema), createChannel);

router.get('/:channelId', authenticateToken, channelLimiter, getChannel);
router.patch('/:channelId', authenticateToken, channelLimiter, validateBody(updateChannelSchema), updateChannel);
router.delete('/:channelId', authenticateToken, channelLimiter, deleteChannel);

router.post('/:channelId/join', authenticateToken, channelLimiter, joinChannel);
router.post('/:channelId/leave', authenticateToken, channelLimiter, leaveChannel);

export default router;
