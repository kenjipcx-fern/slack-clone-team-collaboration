import * as Redis from 'redis';

const redisClient = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

export interface UserPresence {
  userId: string;
  username: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
  socketId?: string;
}

export interface TypingIndicator {
  userId: string;
  username: string;
  channelId?: string;
  dmUserId?: string;
  startedAt: Date;
}

export class RedisService {
  private client = redisClient;

  async connect() {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  async disconnect() {
    if (this.client.isOpen) {
      await this.client.disconnect();
    }
  }

  // User Presence Management
  async setUserOnline(userId: string, username: string, socketId: string) {
    const presence: UserPresence = {
      userId,
      username,
      status: 'online',
      lastSeen: new Date(),
      socketId
    };

    await this.client.setEx(
      `presence:${userId}`,
      300, // 5 minutes TTL
      JSON.stringify(presence)
    );

    // Add to online users set
    await this.client.sAdd('online_users', userId);

    return presence;
  }

  async setUserOffline(userId: string) {
    const existingPresence = await this.getUserPresence(userId);
    
    if (existingPresence) {
      const updatedPresence: UserPresence = {
        ...existingPresence,
        status: 'offline',
        lastSeen: new Date(),
        socketId: undefined
      };

      await this.client.setEx(
        `presence:${userId}`,
        3600, // Keep offline status for 1 hour
        JSON.stringify(updatedPresence)
      );
    }

    // Remove from online users set
    await this.client.sRem('online_users', userId);
  }

  async updateUserStatus(userId: string, status: 'online' | 'away' | 'offline') {
    const existingPresence = await this.getUserPresence(userId);
    
    if (existingPresence) {
      const updatedPresence: UserPresence = {
        ...existingPresence,
        status,
        lastSeen: new Date()
      };

      await this.client.setEx(
        `presence:${userId}`,
        status === 'offline' ? 3600 : 300,
        JSON.stringify(updatedPresence)
      );

      if (status === 'offline') {
        await this.client.sRem('online_users', userId);
      } else {
        await this.client.sAdd('online_users', userId);
      }

      return updatedPresence;
    }

    return null;
  }

  async getUserPresence(userId: string): Promise<UserPresence | null> {
    const data = await this.client.get(`presence:${userId}`);
    return data ? JSON.parse(data) : null;
  }

  async getOnlineUsers(): Promise<UserPresence[]> {
    const userIds = await this.client.sMembers('online_users');
    const presences = await Promise.all(
      userIds.map(userId => this.getUserPresence(userId))
    );
    
    return presences.filter((p): p is UserPresence => p !== null);
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const result = await this.client.sIsMember('online_users', userId);
    return !!result;
  }

  // Typing Indicators
  async setUserTyping(userId: string, username: string, channelId?: string, dmUserId?: string) {
    const typing: TypingIndicator = {
      userId,
      username,
      channelId,
      dmUserId,
      startedAt: new Date()
    };

    const key = channelId ? `typing:channel:${channelId}` : `typing:dm:${dmUserId}`;
    
    await this.client.setEx(
      `${key}:${userId}`,
      10, // 10 seconds TTL
      JSON.stringify(typing)
    );

    return typing;
  }

  async removeUserTyping(userId: string, channelId?: string, dmUserId?: string) {
    const key = channelId ? `typing:channel:${channelId}` : `typing:dm:${dmUserId}`;
    await this.client.del(`${key}:${userId}`);
  }

  async getTypingUsers(channelId?: string, dmUserId?: string): Promise<TypingIndicator[]> {
    const key = channelId ? `typing:channel:${channelId}` : `typing:dm:${dmUserId}`;
    const pattern = `${key}:*`;
    
    const keys = await this.client.keys(pattern);
    const typingData = await Promise.all(
      keys.map(key => this.client.get(key))
    );

    return typingData
      .filter((data): data is string => data !== null)
      .map(data => JSON.parse(data));
  }

  // Caching for frequently accessed data
  async cacheChannelMembers(channelId: string, members: any[]) {
    await this.client.setEx(
      `cache:channel:${channelId}:members`,
      300, // 5 minutes
      JSON.stringify(members)
    );
  }

  async getCachedChannelMembers(channelId: string): Promise<any[] | null> {
    const data = await this.client.get(`cache:channel:${channelId}:members`);
    return data ? JSON.parse(data) : null;
  }

  async cacheUserChannels(userId: string, channels: any[]) {
    await this.client.setEx(
      `cache:user:${userId}:channels`,
      300, // 5 minutes
      JSON.stringify(channels)
    );
  }

  async getCachedUserChannels(userId: string): Promise<any[] | null> {
    const data = await this.client.get(`cache:user:${userId}:channels`);
    return data ? JSON.parse(data) : null;
  }

  // Message caching for recent messages
  async cacheRecentMessages(channelId: string, messages: any[]) {
    await this.client.setEx(
      `cache:messages:channel:${channelId}`,
      60, // 1 minute
      JSON.stringify(messages)
    );
  }

  async getCachedRecentMessages(channelId: string): Promise<any[] | null> {
    const data = await this.client.get(`cache:messages:channel:${channelId}`);
    return data ? JSON.parse(data) : null;
  }

  // Session management
  async storeUserSession(userId: string, sessionData: any) {
    await this.client.setEx(
      `session:${userId}`,
      86400, // 24 hours
      JSON.stringify(sessionData)
    );
  }

  async getUserSession(userId: string): Promise<any | null> {
    const data = await this.client.get(`session:${userId}`);
    return data ? JSON.parse(data) : null;
  }

  async removeUserSession(userId: string) {
    await this.client.del(`session:${userId}`);
  }

  // Rate limiting helpers
  async checkRateLimit(key: string, windowMs: number, maxRequests: number): Promise<boolean> {
    const current = await this.client.incr(`rate_limit:${key}`);
    
    if (current === 1) {
      await this.client.expire(`rate_limit:${key}`, Math.ceil(windowMs / 1000));
    }
    
    return current <= maxRequests;
  }

  async getRateLimitInfo(key: string): Promise<{ count: number; ttl: number }> {
    const [count, ttl] = await Promise.all([
      this.client.get(`rate_limit:${key}`),
      this.client.ttl(`rate_limit:${key}`)
    ]);

    return {
      count: count ? parseInt(count) : 0,
      ttl: ttl || 0
    };
  }

  // Pub/Sub for real-time events
  async publishEvent(channel: string, event: any) {
    await this.client.publish(channel, JSON.stringify(event));
  }

  async subscribeToEvents(channel: string, callback: (event: any) => void): Promise<any> {
    const subscriber = this.client.duplicate();
    await subscriber.connect();
    
    await subscriber.subscribe(channel, (message) => {
      try {
        const event = JSON.parse(message);
        callback(event);
      } catch (error) {
        console.error('Error parsing Redis event:', error);
      }
    });

    return subscriber;
  }

  // Cleanup expired keys
  async cleanupExpiredKeys() {
    const patterns = [
      'presence:*',
      'typing:*',
      'cache:*',
      'session:*',
      'rate_limit:*'
    ];

    for (const pattern of patterns) {
      const keys = await this.client.keys(pattern);
      for (const key of keys) {
        const ttl = await this.client.ttl(key);
        if (ttl === -1) { // Key exists but has no expiry
          await this.client.expire(key, 3600); // Set 1 hour expiry
        }
      }
    }
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis ping failed:', error);
      return false;
    }
  }
}

export const redisService = new RedisService();

// Initialize Redis connection
redisService.connect().catch(console.error);
