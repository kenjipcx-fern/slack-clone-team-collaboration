import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  getProfile,
  updateProfile,
  logout,
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from '../utils/validation';

const router: Router = Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window per IP
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    code: 'RATE_LIMITED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// More generous rate limiting for profile operations
const profileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window per IP
  message: {
    success: false,
    message: 'Too many profile requests, please try again later',
    code: 'RATE_LIMITED',
  },
});

// Authentication routes
router.post('/register', authLimiter, validateBody(registerSchema), register);
router.post('/login', authLimiter, validateBody(loginSchema), login);
router.post('/logout', authenticateToken, logout);

// Profile routes
router.get('/profile', profileLimiter, authenticateToken, getProfile);
router.patch('/profile', profileLimiter, authenticateToken, validateBody(updateProfileSchema), updateProfile);

// Health check for auth service
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'auth',
    timestamp: new Date().toISOString(),
  });
});

export default router;
