import { Request, Response } from 'express';
import { monitoringService } from '../services/monitoringService';
import { AuthenticatedRequest } from '../middleware/auth';

export class HealthController {
  async healthCheck(req: Request, res: Response) {
    try {
      const healthResult = await monitoringService.performHealthCheck();
      
      // Set appropriate HTTP status based on health
      let statusCode: number;
      switch (healthResult.status) {
        case 'healthy':
          statusCode = 200;
          break;
        case 'degraded':
          statusCode = 200; // Still operational
          break;
        case 'unhealthy':
          statusCode = 503; // Service Unavailable
          break;
        default:
          statusCode = 500;
      }

      res.status(statusCode).json(healthResult);
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date(),
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async readinessCheck(req: Request, res: Response) {
    try {
      const healthResult = await monitoringService.performHealthCheck();
      
      // Service is ready if database and core services are healthy
      const isReady = healthResult.checks.database.status !== 'unhealthy' &&
                     healthResult.checks.memory.status !== 'unhealthy';

      if (isReady) {
        res.status(200).json({
          status: 'ready',
          timestamp: new Date(),
          message: 'Service is ready to handle requests'
        });
      } else {
        res.status(503).json({
          status: 'not ready',
          timestamp: new Date(),
          message: 'Service is not ready to handle requests',
          checks: healthResult.checks
        });
      }
    } catch (error) {
      console.error('Readiness check failed:', error);
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date(),
        message: 'Readiness check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async livenessCheck(req: Request, res: Response) {
    // Simple liveness check - if we can respond, we're alive
    res.status(200).json({
      status: 'alive',
      timestamp: new Date(),
      message: 'Service is alive'
    });
  }

  async getMetrics(req: AuthenticatedRequest, res: Response) {
    try {
      // Only allow authenticated admin users to view detailed metrics
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const metrics = await monitoringService.getSystemMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Error getting metrics:', error);
      res.status(500).json({
        error: 'Failed to get system metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getDetailedHealth(req: AuthenticatedRequest, res: Response) {
    try {
      // Only allow authenticated users to view detailed health
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const [healthResult, metrics] = await Promise.all([
        monitoringService.performHealthCheck(),
        monitoringService.getSystemMetrics()
      ]);

      res.json({
        health: healthResult,
        metrics
      });
    } catch (error) {
      console.error('Error getting detailed health:', error);
      res.status(500).json({
        error: 'Failed to get detailed health information',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getVersion(req: Request, res: Response) {
    res.json({
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date()
    });
  }
}

export const healthController = new HealthController();
