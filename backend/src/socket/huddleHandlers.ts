import { Server as SocketServer } from 'socket.io';
import { AuthenticatedSocket } from './index';
import { huddleService } from '../services/huddleService';

export function huddleHandlers(io: SocketServer, socket: AuthenticatedSocket) {
  // Create huddle
  socket.on('create-huddle', async (data: {
    channelId?: string;
    name?: string;
  }) => {
    try {
      const huddle = await huddleService.createHuddle({
        creatorId: socket.userId,
        channelId: data.channelId,
        name: data.name
      });

      // Join the creator to the huddle room
      socket.join(`huddle:${huddle.id}`);

      // Notify channel or all users about new huddle
      if (data.channelId) {
        io.to(data.channelId).emit('huddle-created', huddle);
      } else {
        io.emit('huddle-created', huddle);
      }

    } catch (error) {
      socket.emit('error', { message: 'Failed to create huddle' });
    }
  });

  // Join huddle
  socket.on('join-huddle', async (data: { huddleId: string }) => {
    try {
      const participant = await huddleService.joinHuddle(
        data.huddleId,
        socket.userId
      );

      // Join the huddle room
      socket.join(`huddle:${data.huddleId}`);

      // Notify other participants
      socket.to(`huddle:${data.huddleId}`).emit('user-joined-huddle', {
        huddleId: data.huddleId,
        participant
      });

      // Send current participants to the new joiner
      const participants = await huddleService.getHuddleParticipants(data.huddleId);
      socket.emit('huddle-participants', {
        huddleId: data.huddleId,
        participants
      });

    } catch (error) {
      socket.emit('error', { message: 'Failed to join huddle' });
    }
  });

  // Leave huddle
  socket.on('leave-huddle', async (data: { huddleId: string }) => {
    try {
      await huddleService.leaveHuddle(data.huddleId, socket.userId);

      // Leave the huddle room
      socket.leave(`huddle:${data.huddleId}`);

      // Notify other participants
      socket.to(`huddle:${data.huddleId}`).emit('user-left-huddle', {
        huddleId: data.huddleId,
        userId: socket.userId
      });

    } catch (error) {
      socket.emit('error', { message: 'Failed to leave huddle' });
    }
  });

  // End huddle (only creator can do this)
  socket.on('end-huddle', async (data: { huddleId: string }) => {
    try {
      await huddleService.endHuddle(data.huddleId, socket.userId);

      // Notify all participants
      io.to(`huddle:${data.huddleId}`).emit('huddle-ended', {
        huddleId: data.huddleId
      });

      // Remove all sockets from the huddle room
      const sockets = await io.in(`huddle:${data.huddleId}`).fetchSockets();
      sockets.forEach(s => s.leave(`huddle:${data.huddleId}`));

    } catch (error) {
      socket.emit('error', { message: 'Failed to end huddle' });
    }
  });

  // WebRTC signaling for voice/video
  socket.on('webrtc-offer', (data: {
    huddleId: string;
    targetUserId: string;
    offer: any; // RTCSessionDescriptionInit - using any to avoid WebRTC dependency
  }) => {
    socket.to(data.targetUserId).emit('webrtc-offer', {
      huddleId: data.huddleId,
      fromUserId: socket.userId,
      offer: data.offer
    });
  });

  socket.on('webrtc-answer', (data: {
    huddleId: string;
    targetUserId: string;
    answer: any; // RTCSessionDescriptionInit - using any to avoid WebRTC dependency
  }) => {
    socket.to(data.targetUserId).emit('webrtc-answer', {
      huddleId: data.huddleId,
      fromUserId: socket.userId,
      answer: data.answer
    });
  });

  socket.on('webrtc-ice-candidate', (data: {
    huddleId: string;
    targetUserId: string;
    candidate: any; // RTCIceCandidate - using any to avoid WebRTC dependency
  }) => {
    socket.to(data.targetUserId).emit('webrtc-ice-candidate', {
      huddleId: data.huddleId,
      fromUserId: socket.userId,
      candidate: data.candidate
    });
  });

  // Audio/Video controls
  socket.on('toggle-audio', async (data: {
    huddleId: string;
    muted: boolean;
  }) => {
    try {
      await huddleService.updateParticipant(
        data.huddleId,
        socket.userId,
        { audioMuted: data.muted }
      );

      // Notify other participants
      socket.to(`huddle:${data.huddleId}`).emit('participant-audio-toggled', {
        userId: socket.userId,
        muted: data.muted
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to toggle audio' });
    }
  });

  socket.on('toggle-video', async (data: {
    huddleId: string;
    videoOn: boolean;
  }) => {
    try {
      await huddleService.updateParticipant(
        data.huddleId,
        socket.userId,
        { videoOn: data.videoOn }
      );

      // Notify other participants
      socket.to(`huddle:${data.huddleId}`).emit('participant-video-toggled', {
        userId: socket.userId,
        videoOn: data.videoOn
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to toggle video' });
    }
  });

  // Get active huddles
  socket.on('get-active-huddles', async () => {
    try {
      const huddles = await huddleService.getActiveHuddles();
      socket.emit('active-huddles', huddles);
    } catch (error) {
      socket.emit('error', { message: 'Failed to get active huddles' });
    }
  });
}
