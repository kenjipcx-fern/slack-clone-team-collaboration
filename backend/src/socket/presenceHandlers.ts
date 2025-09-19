import { Server as SocketServer } from 'socket.io';
import { AuthenticatedSocket } from './index';
import prisma from '../lib/db';

export function presenceHandlers(io: SocketServer, socket: AuthenticatedSocket) {
  // Update user status to online when they connect
  socket.on('connect', async () => {
    try {
      await prisma.user.update({
        where: { id: socket.userId },
        data: { 
          status: 'online',
          lastSeen: new Date()
        }
      });

      // Notify other users about status change
      socket.broadcast.emit('user-status-changed', {
        userId: socket.userId,
        status: 'online'
      });
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  });

  // Handle manual status updates
  socket.on('update-status', async (data: { status: 'online' | 'away' | 'offline' }) => {
    try {
      await prisma.user.update({
        where: { id: socket.userId },
        data: { 
          status: data.status,
          lastSeen: new Date()
        }
      });

      // Notify other users about status change
      socket.broadcast.emit('user-status-changed', {
        userId: socket.userId,
        status: data.status
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      socket.emit('error', { message: 'Failed to update status' });
    }
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    try {
      await prisma.user.update({
        where: { id: socket.userId },
        data: { 
          status: 'offline',
          lastSeen: new Date()
        }
      });

      // Notify other users about status change
      socket.broadcast.emit('user-status-changed', {
        userId: socket.userId,
        status: 'offline'
      });
    } catch (error) {
      console.error('Error updating user status on disconnect:', error);
    }
  });

  // Get online users
  socket.on('get-online-users', async () => {
    try {
      const onlineUsers = await prisma.user.findMany({
        where: {
          status: {
            in: ['online', 'away']
          }
        },
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          status: true,
          lastSeen: true
        }
      });

      socket.emit('online-users', onlineUsers);
    } catch (error) {
      console.error('Error getting online users:', error);
      socket.emit('error', { message: 'Failed to get online users' });
    }
  });
}
