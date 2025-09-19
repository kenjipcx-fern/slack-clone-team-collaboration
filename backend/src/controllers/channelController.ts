import { Request, Response } from 'express';
import prisma from '../lib/db';
import { AuthenticatedRequest } from '../middleware/auth';

// Get all channels for a user
export async function getUserChannels(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    
    // For now, just return existing channels from seed data
    const channels = await prisma.channel.findMany({
      include: {
        members: {
          where: { userId },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
                status: true,
              }
            }
          }
        },
        _count: {
          select: {
            messages: true,
            members: true,
          }
        }
      }
    });

    const userChannels = channels.filter(channel => channel.members.length > 0);

    res.json({
      success: true,
      data: { channels: userChannels },
    });
  } catch (error) {
    console.error('Get user channels error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user channels',
      code: 'GET_CHANNELS_ERROR',
    });
  }
}

// Create a new channel
export async function createChannel(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { name, description, type = 'PUBLIC', topic } = req.body;

    // Check if channel name already exists
    const existingChannel = await prisma.channel.findFirst({
      where: { name: name.toLowerCase() },
    });

    if (existingChannel) {
      return res.status(409).json({
        success: false,
        message: 'Channel name already exists',
        code: 'CHANNEL_EXISTS',
      });
    }

    // Create channel with the creator as admin
    const channel = await prisma.channel.create({
      data: {
        name: name.toLowerCase(),
        description,
        type,
        
        createdById: userId,
        members: {
          create: {
            userId,
            role: 'ADMIN',
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
                status: true,
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          }
        },
        _count: {
          select: {
            messages: true,
            members: true,
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Channel created successfully',
      data: { channel },
    });
  } catch (error) {
    console.error('Create channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating channel',
      code: 'CREATE_CHANNEL_ERROR',
    });
  }
}

// Placeholder functions for now
export async function joinChannel(req: AuthenticatedRequest, res: Response) {
  res.json({ success: true, message: 'Join channel not implemented yet' });
}

export async function leaveChannel(req: AuthenticatedRequest, res: Response) {
  res.json({ success: true, message: 'Leave channel not implemented yet' });
}

export async function getChannel(req: AuthenticatedRequest, res: Response) {
  res.json({ success: true, message: 'Get channel not implemented yet' });
}

export async function updateChannel(req: AuthenticatedRequest, res: Response) {
  res.json({ success: true, message: 'Update channel not implemented yet' });
}

export async function deleteChannel(req: AuthenticatedRequest, res: Response) {
  res.json({ success: true, message: 'Delete channel not implemented yet' });
}
