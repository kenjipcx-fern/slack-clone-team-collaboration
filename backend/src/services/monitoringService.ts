import prisma from '../lib/db';
import { redisService } from './redisService';
import { storageService } from './storageService';
import os from 'os';
import process from 'process';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  version: string;
  uptime: number;
  environment: string;
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
    storage: HealthCheck;
    memory: HealthCheck;
    disk: HealthCheck;
  };
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  message?: string;
  details?: any;
}

export interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  process: {
    pid: number;
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
  database: {
    activeConnections?: number;
    responseTime?: number;
  };
  redis: {
    connected: boolean;
    responseTime?: number;
    memoryUsage?: number;
  };
}

export class MonitoringService {
  private startTime = Date.now();
  private readonly version = process.env.npm_package_version || '1.0.0';

  async performHealthCheck(): Promise<HealthCheckResult> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkStorage(),
      this.checkMemory(),
      this.checkDisk(),
    ]);

    const [database, redis, storage, memory, disk] = checks.map(result => 
      result.status === 'fulfilled' ? result.value : {
        status: 'unhealthy' as const,
        message: result.reason?.message || 'Check failed'
      }
    );

    // Determine overall status
    const allChecks = [database, redis, storage, memory, disk];
    const hasUnhealthy = allChecks.some(check => check.status === 'unhealthy');
    const hasDegraded = allChecks.some(check => check.status === 'degraded');

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (hasUnhealthy) {
      overallStatus = 'unhealthy';
    } else if (hasDegraded) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    return {
      status: overallStatus,
      timestamp: new Date(),
      version: this.version,
      uptime: Date.now() - this.startTime,
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database,
        redis,
        storage,
        memory,
        disk
      }
    };
  }

  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Simple query to test database connectivity
      await prisma.$queryRaw`SELECT 1`;
      
      const responseTime = Date.now() - startTime;
      
      // Check response time thresholds
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (responseTime > 1000) {
        status = 'unhealthy';
      } else if (responseTime > 500) {
        status = 'degraded';
      } else {
        status = 'healthy';
      }

      return {
        status,
        responseTime,
        message: `Database responsive in ${responseTime}ms`
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async checkRedis(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const isHealthy = await redisService.ping();
      const responseTime = Date.now() - startTime;
      
      if (!isHealthy) {
        return {
          status: 'unhealthy',
          responseTime,
          message: 'Redis ping failed'
        };
      }

      // Check response time thresholds
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (responseTime > 500) {
        status = 'degraded';
      } else {
        status = 'healthy';
      }

      return {
        status,
        responseTime,
        message: `Redis responsive in ${responseTime}ms`
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: `Redis connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async checkStorage(): Promise<HealthCheck> {
    try {
      // Initialize storage bucket (this will verify S3/MinIO connectivity)
      await storageService.initializeBucket();
      
      return {
        status: 'healthy',
        message: 'Storage service accessible'
      };
    } catch (error) {
      return {
        status: 'degraded', // Storage issues shouldn't make app completely unhealthy
        message: `Storage check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async checkMemory(): Promise<HealthCheck> {
    try {
      const memoryUsage = process.memoryUsage();
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryPercentage = (usedMemory / totalMemory) * 100;

      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (memoryPercentage > 90) {
        status = 'unhealthy';
      } else if (memoryPercentage > 80) {
        status = 'degraded';
      } else {
        status = 'healthy';
      }

      return {
        status,
        message: `Memory usage: ${memoryPercentage.toFixed(1)}%`,
        details: {
          processMemory: {
            rss: this.formatBytes(memoryUsage.rss),
            heapUsed: this.formatBytes(memoryUsage.heapUsed),
            heapTotal: this.formatBytes(memoryUsage.heapTotal),
            external: this.formatBytes(memoryUsage.external)
          },
          systemMemory: {
            total: this.formatBytes(totalMemory),
            free: this.formatBytes(freeMemory),
            used: this.formatBytes(usedMemory),
            percentage: `${memoryPercentage.toFixed(1)}%`
          }
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Memory check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async checkDisk(): Promise<HealthCheck> {
    try {
      // This is a simplified disk check - in production, you might want to use a library like 'df'
      const fs = require('fs');
      const stats = await new Promise<any>((resolve, reject) => {
        fs.stat('.', (err: any, stats: any) => {
          if (err) reject(err);
          else resolve(stats);
        });
      });

      return {
        status: 'healthy',
        message: 'Disk accessible',
        details: {
          accessible: true
        }
      };
    } catch (error) {
      return {
        status: 'degraded',
        message: `Disk check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    const cpuUsage = process.cpuUsage();
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    // Database metrics
    let databaseMetrics = {};
    try {
      const dbStartTime = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      databaseMetrics = {
        responseTime: Date.now() - dbStartTime,
        // Note: Getting actual connection count requires database-specific queries
        activeConnections: undefined
      };
    } catch (error) {
      // Database metrics will be empty if connection fails
    }

    // Redis metrics
    let redisMetrics: any = { connected: false };
    try {
      const redisStartTime = Date.now();
      const isConnected = await redisService.ping();
      redisMetrics = {
        connected: isConnected,
        responseTime: Date.now() - redisStartTime,
        // Note: Getting Redis memory usage requires Redis INFO command
        memoryUsage: undefined
      };
    } catch (error) {
      // Redis metrics will have connected: false
    }

    return {
      timestamp: new Date(),
      cpu: {
        usage: this.calculateCpuUsage(cpuUsage),
        loadAverage: os.loadavg()
      },
      memory: {
        used: usedMemory,
        free: freeMemory,
        total: totalMemory,
        percentage: (usedMemory / totalMemory) * 100
      },
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memoryUsage,
        cpuUsage
      },
      database: databaseMetrics,
      redis: redisMetrics
    };
  }

  private calculateCpuUsage(cpuUsage: NodeJS.CpuUsage): number {
    // This is a simplified CPU calculation
    // In production, you'd want to compare against previous measurements
    const total = cpuUsage.user + cpuUsage.system;
    return (total / 1000000) * 100; // Convert from microseconds to percentage
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async logMetrics() {
    try {
      const metrics = await this.getSystemMetrics();
      console.log(`[METRICS] ${new Date().toISOString()}`, {
        memory: `${metrics.memory.percentage.toFixed(1)}%`,
        cpu: `${metrics.cpu.usage.toFixed(1)}%`,
        uptime: `${Math.floor(metrics.process.uptime)}s`,
        database: metrics.database.responseTime ? `${metrics.database.responseTime}ms` : 'disconnected',
        redis: metrics.redis.connected ? `${metrics.redis.responseTime}ms` : 'disconnected'
      });
    } catch (error) {
      console.error('Error logging metrics:', error);
    }
  }

  startMetricsLogging(intervalMs: number = 60000) {
    // Log metrics every minute by default
    setInterval(() => {
      this.logMetrics();
    }, intervalMs);
    
    console.log(`Started metrics logging every ${intervalMs / 1000} seconds`);
  }
}

export const monitoringService = new MonitoringService();
