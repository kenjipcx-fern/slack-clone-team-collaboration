import { Request, Response } from 'express';
import { storageService } from '../services/storageService';
import { messageService } from '../services/messageService';
import prisma from '../lib/db';
import { AuthenticatedRequest } from '../middleware/auth';

export class UploadController {
  async uploadFiles(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const { channelId, dmUserId, threadId, content = '' } = req.body;

      if (!channelId && !dmUserId) {
        return res.status(400).json({ 
          error: 'Either channelId or dmUserId is required' 
        });
      }

      // Verify user has access to channel if uploading to channel
      if (channelId) {
        const hasAccess = await messageService.canUserAccessChannel(
          req.user.id,
          channelId
        );
        if (!hasAccess) {
          return res.status(403).json({ error: 'Access denied to channel' });
        }
      }

      // Upload files to storage
      const uploadResults = await storageService.uploadMultipleFiles(files);

      // Create message with attachments
      const messageContent = content || `Shared ${files.length} file${files.length > 1 ? 's' : ''}`;
      
      const message = await messageService.createMessage({
        content: messageContent,
        userId: req.user.id,
        channelId,
        dmUserId,
        threadId,
        type: 'file'
      });

      // Create attachment records
      const attachmentPromises = uploadResults.map(upload => 
        prisma.attachment.create({
          data: {
            filename: upload.filename,
            originalName: upload.originalName,
            mimeType: upload.mimeType,
            size: upload.size,
            url: upload.url,
            messageId: message.id
          }
        })
      );

      const attachments = await Promise.all(attachmentPromises);

      // Fetch the complete message with attachments
      const completeMessage = await prisma.message.findUnique({
        where: { id: message.id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true
            }
          },
          attachments: true,
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true
                }
              }
            }
          }
        }
      });

      res.status(201).json({
        message: completeMessage,
        attachments
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to upload files' 
      });
    }
  }

  async uploadAvatar(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Verify it's an image
      if (!storageService.isImageFile(file.mimetype)) {
        return res.status(400).json({ 
          error: 'Only image files are allowed for avatars' 
        });
      }

      // Upload to storage
      const uploadResult = await storageService.uploadFile(file);

      // Update user avatar
      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: { avatar: uploadResult.url },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          avatar: true,
          status: true,
          lastSeen: true
        }
      });

      res.json({
        user: updatedUser,
        upload: uploadResult
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to upload avatar' 
      });
    }
  }

  async deleteFile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { attachmentId } = req.params;

      // Get attachment details
      const attachment = await prisma.attachment.findUnique({
        where: { id: attachmentId },
        include: {
          message: {
            select: {
              userId: true
            }
          }
        }
      });

      if (!attachment) {
        return res.status(404).json({ error: 'Attachment not found' });
      }

      // Verify user owns the message
      if (attachment.message.userId !== req.user.id) {
        return res.status(403).json({ 
          error: 'You can only delete your own files' 
        });
      }

      // Delete from storage
      await storageService.deleteFile(attachment.filename);

      // Delete attachment record
      await prisma.attachment.delete({
        where: { id: attachmentId }
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to delete file' 
      });
    }
  }

  async getPresignedUrl(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { filename } = req.params;
      const { expires = '3600' } = req.query;

      const url = await storageService.generatePresignedUrl(
        filename,
        parseInt(expires as string)
      );

      res.json({ url });
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to generate URL' 
      });
    }
  }

  async getFileInfo(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { attachmentId } = req.params;

      const attachment = await prisma.attachment.findUnique({
        where: { id: attachmentId },
        include: {
          message: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatar: true
                }
              }
            }
          }
        }
      });

      if (!attachment) {
        return res.status(404).json({ error: 'Attachment not found' });
      }

      // Add helpful metadata
      const fileInfo = {
        ...attachment,
        icon: storageService.getFileIcon(attachment.mimeType),
        formattedSize: storageService.formatFileSize(attachment.size),
        isImage: storageService.isImageFile(attachment.mimeType),
      };

      res.json(fileInfo);
    } catch (error) {
      console.error('Error getting file info:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to get file info' 
      });
    }
  }
}

export const uploadController = new UploadController();
