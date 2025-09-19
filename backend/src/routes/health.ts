import express from 'express';
import { healthController } from '../controllers/healthController';
import { authenticateToken as auth } from '../middleware/auth';

const router: express.Router = express.Router();

// Public health endpoints (no authentication required)
router.get('/', healthController.healthCheck);
router.get('/ready', healthController.readinessCheck);
router.get('/live', healthController.livenessCheck);
router.get('/version', healthController.getVersion);

// Protected endpoints (require authentication)
router.get('/metrics', auth, healthController.getMetrics);
router.get('/detailed', auth, healthController.getDetailedHealth);

export default router;
