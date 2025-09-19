import express from 'express';
import { uploadController } from '../controllers/uploadController';
import { authenticateToken as auth } from '../middleware/auth';
import { storageService } from '../services/storageService';
import rateLimit from 'express-rate-limit';

const router: express.Router = express.Router();

// Rate limiting for uploads
const uploadRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 uploads per minute
  message: 'Too many uploads. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply authentication to all routes
router.use(auth);

// Upload multiple files (for messages)
router.post(
  '/files',
  uploadRateLimit,
  storageService.getUploadMiddleware().array('files', 10), // Max 10 files
  uploadController.uploadFiles
);

// Upload single avatar
router.post(
  '/avatar',
  uploadRateLimit,
  storageService.getUploadMiddleware().single('avatar'),
  uploadController.uploadAvatar
);

// Delete file
router.delete('/attachments/:attachmentId', uploadController.deleteFile);

// Get presigned URL for secure file access
router.get('/presigned/:filename', uploadController.getPresignedUrl);

// Get file information
router.get('/attachments/:attachmentId', uploadController.getFileInfo);

export default router;
