import { Server as SocketServer } from 'socket.io';
import { AuthenticatedSocket } from './index';
import { messageService } from '../services/messageService';

export function messageHandlers(io: SocketServer, socket: AuthenticatedSocket) {
  // Join channel rooms
  socket.on('join-channel', async (channelId: string) => {
    try {
      // Verify user has access to channel
      const hasAccess = await messageService.canUserAccessChannel(
        socket.userId,
        channelId
      );

      if (hasAccess) {
        socket.join(channelId);
        console.log(`User ${socket.username} joined channel ${channelId}`);
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to join channel' });
    }
  });

  // Leave channel rooms
  socket.on('leave-channel', (channelId: string) => {
    socket.leave(channelId);
    console.log(`User ${socket.username} left channel ${channelId}`);
  });

  // Send message
  socket.on('send-message', async (data: {
    content: string;
    channelId?: string;
    dmUserId?: string;
    threadId?: string;
  }) => {
    try {
      const message = await messageService.createMessage({
        content: data.content,
        userId: socket.userId,
        channelId: data.channelId,
        dmUserId: data.dmUserId,
        threadId: data.threadId,
      });

      // Emit to appropriate room
      if (data.channelId) {
        io.to(data.channelId).emit('new-message', message);
      } else if (data.dmUserId) {
        io.to(socket.userId).emit('new-message', message);
        io.to(data.dmUserId).emit('new-message', message);
      }

    } catch (error) {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Update message
  socket.on('update-message', async (data: {
    messageId: string;
    content: string;
  }) => {
    try {
      const updatedMessage = await messageService.updateMessage(
        data.messageId,
        socket.userId,
        data.content
      );

      // Emit to appropriate rooms
      if (updatedMessage.channelId) {
        io.to(updatedMessage.channelId).emit('message-updated', updatedMessage);
      } else if (updatedMessage.dmId) {
        // Get DM participants
        const dmConversation = await messageService.getDMMessages(
          socket.userId,
          updatedMessage.dmId,
          1
        );
        // Emit to both DM participants (simplified for now)
        io.to(socket.userId).emit('message-updated', updatedMessage);
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to update message' });
    }
  });

  // Delete message
  socket.on('delete-message', async (data: { messageId: string }) => {
    try {
      await messageService.deleteMessage(data.messageId, socket.userId);
      
      // Emit deletion to appropriate rooms (simplified)
      io.emit('message-deleted', { messageId: data.messageId });
    } catch (error) {
      socket.emit('error', { message: 'Failed to delete message' });
    }
  });

  // Add reaction
  socket.on('add-reaction', async (data: {
    messageId: string;
    emoji: string;
  }) => {
    try {
      const reaction = await messageService.addReaction(
        data.messageId,
        socket.userId,
        data.emoji
      );

      // Emit to all subscribers of the message's room
      io.emit('reaction-added', {
        messageId: data.messageId,
        reaction
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to add reaction' });
    }
  });

  // Remove reaction
  socket.on('remove-reaction', async (data: {
    messageId: string;
    emoji: string;
  }) => {
    try {
      await messageService.removeReaction(
        data.messageId,
        socket.userId,
        data.emoji
      );

      // Emit to all subscribers of the message's room
      io.emit('reaction-removed', {
        messageId: data.messageId,
        userId: socket.userId,
        emoji: data.emoji
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to remove reaction' });
    }
  });

  // Typing indicators
  socket.on('typing-start', (data: { channelId?: string; dmUserId?: string }) => {
    if (data.channelId) {
      socket.to(data.channelId).emit('user-typing-start', {
        userId: socket.userId,
        username: socket.username,
        channelId: data.channelId
      });
    } else if (data.dmUserId) {
      socket.to(data.dmUserId).emit('user-typing-start', {
        userId: socket.userId,
        username: socket.username,
        dmUserId: data.dmUserId
      });
    }
  });

  socket.on('typing-stop', (data: { channelId?: string; dmUserId?: string }) => {
    if (data.channelId) {
      socket.to(data.channelId).emit('user-typing-stop', {
        userId: socket.userId,
        channelId: data.channelId
      });
    } else if (data.dmUserId) {
      socket.to(data.dmUserId).emit('user-typing-stop', {
        userId: socket.userId,
        dmUserId: data.dmUserId
      });
    }
  });
}
