import { Request, Response } from 'express';
import { searchService } from '../services/searchService';
import { AuthenticatedRequest } from '../middleware/auth';

export class SearchController {
  async globalSearch(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { q: query, limit = '20' } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }

      if (query.trim().length < 2) {
        return res.status(400).json({ 
          error: 'Search query must be at least 2 characters long' 
        });
      }

      const results = await searchService.globalSearch(
        query.trim(),
        req.user.id,
        parseInt(limit as string)
      );

      res.json(results);
    } catch (error) {
      console.error('Error performing global search:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Search failed' 
      });
    }
  }

  async searchMessages(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { 
        q: query, 
        channelId, 
        fromUser, 
        dateFrom, 
        dateTo, 
        hasAttachments,
        messageType,
        limit = '20',
        offset = '0'
      } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }

      if (query.trim().length < 2) {
        return res.status(400).json({ 
          error: 'Search query must be at least 2 characters long' 
        });
      }

      const filters = {
        query: query.trim(),
        userId: req.user.id,
        channelId: channelId as string,
        fromUser: fromUser as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        hasAttachments: hasAttachments === 'true',
        messageType: messageType as string
      };

      const results = await searchService.searchMessages(
        filters,
        parseInt(limit as string),
        parseInt(offset as string)
      );

      res.json(results);
    } catch (error) {
      console.error('Error searching messages:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Message search failed' 
      });
    }
  }

  async searchChannels(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { q: query, limit = '10' } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const channels = await searchService.searchChannels(
        query.trim(),
        req.user.id,
        parseInt(limit as string)
      );

      res.json({ channels });
    } catch (error) {
      console.error('Error searching channels:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Channel search failed' 
      });
    }
  }

  async searchUsers(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { q: query, limit = '10' } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const users = await searchService.searchUsers(
        query.trim(),
        req.user.id,
        parseInt(limit as string)
      );

      res.json({ users });
    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'User search failed' 
      });
    }
  }

  async getRecentMessages(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { limit = '20' } = req.query;

      const messages = await searchService.getRecentMessages(
        req.user.id,
        parseInt(limit as string)
      );

      res.json({ messages });
    } catch (error) {
      console.error('Error getting recent messages:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to get recent messages' 
      });
    }
  }

  async searchWithHighlights(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { q: query, limit = '20' } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }

      if (query.trim().length < 2) {
        return res.status(400).json({ 
          error: 'Search query must be at least 2 characters long' 
        });
      }

      const results = await searchService.searchWithHighlights(
        query.trim(),
        req.user.id,
        parseInt(limit as string)
      );

      res.json(results);
    } catch (error) {
      console.error('Error searching with highlights:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Highlighted search failed' 
      });
    }
  }
}

export const searchController = new SearchController();
