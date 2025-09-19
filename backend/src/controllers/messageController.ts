import { Request, Response } from 'express';
import { messageService } from '../services/messageService';
import { AuthenticatedRequest } from '../middleware/auth';

export class MessageController {
  // Get channel messages
  async getChannelMessages(req: AuthenticatedRequest, res: Response) {
    try {
      const { channelId } = req.params;
      const { limit = '50', cursor } = req.query;
      
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const messages = await messageService.getChannelMessages(
        channelId,
        req.user.id,
        parseInt(limit as string),
        cursor as string
      );

      res.json({ messages });
    } catch (error) {
      console.error('Error fetching channel messages:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to fetch messages' 
      });
    }
  }

  // Get DM messages
  async getDMMessages(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params;
      const { limit = '50', cursor } = req.query;
      
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const messages = await messageService.getDMMessages(
        req.user.id,
        userId,
        parseInt(limit as string),
        cursor as string
      );

      res.json({ messages });
    } catch (error) {
      console.error('Error fetching DM messages:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to fetch messages' 
      });
    }
  }

  // Create message (REST endpoint - mainly for file uploads)
  async createMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const { content, channelId, dmUserId, threadId, type } = req.body;
      
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!content || content.trim() === '') {
        return res.status(400).json({ error: 'Message content is required' });
      }

      const message = await messageService.createMessage({
        content: content.trim(),
        userId: req.user.id,
        channelId,
        dmUserId,
        threadId,
        type
      });

      res.status(201).json(message);
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to create message' 
      });
    }
  }

  // Update message
  async updateMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const { messageId } = req.params;
      const { content } = req.body;
      
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!content || content.trim() === '') {
        return res.status(400).json({ error: 'Message content is required' });
      }

      const updatedMessage = await messageService.updateMessage(
        messageId,
        req.user.id,
        content.trim()
      );

      res.json(updatedMessage);
    } catch (error) {
      console.error('Error updating message:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to update message' 
      });
    }
  }

  // Delete message
  async deleteMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const { messageId } = req.params;
      
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await messageService.deleteMessage(messageId, req.user.id);

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to delete message' 
      });
    }
  }

  // Add reaction
  async addReaction(req: AuthenticatedRequest, res: Response) {
    try {
      const { messageId } = req.params;
      const { emoji } = req.body;
      
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!emoji) {
        return res.status(400).json({ error: 'Emoji is required' });
      }

      const reaction = await messageService.addReaction(
        messageId,
        req.user.id,
        emoji
      );

      res.json(reaction);
    } catch (error) {
      console.error('Error adding reaction:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to add reaction' 
      });
    }
  }

  // Remove reaction
  async removeReaction(req: AuthenticatedRequest, res: Response) {
    try {
      const { messageId } = req.params;
      const { emoji } = req.query;
      
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!emoji) {
        return res.status(400).json({ error: 'Emoji is required' });
      }

      await messageService.removeReaction(
        messageId,
        req.user.id,
        emoji as string
      );

      res.json({ success: true });
    } catch (error) {
      console.error('Error removing reaction:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to remove reaction' 
      });
    }
  }
}

export const messageController = new MessageController();
