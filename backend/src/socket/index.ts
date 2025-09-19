import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import { messageHandlers } from './messageHandlers';
import { presenceHandlers } from './presenceHandlers';
import { huddleHandlers } from './huddleHandlers';

export interface AuthenticatedSocket extends Socket {
  userId: string;
  username: string;
}

export function initializeSocket(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      credentials: true
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = verifyToken(token);
      (socket as AuthenticatedSocket).userId = decoded.userId;
      (socket as AuthenticatedSocket).username = decoded.username;
      
      next();
    } catch (error) {
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket) => {
    const authSocket = socket as AuthenticatedSocket;
    console.log(`User ${authSocket.username} connected`);

    // Join user to their own room for private notifications
    socket.join(authSocket.userId);

    // Register event handlers
    messageHandlers(io, authSocket);
    presenceHandlers(io, authSocket);
    huddleHandlers(io, authSocket);

    socket.on('disconnect', () => {
      console.log(`User ${authSocket.username} disconnected`);
    });
  });

  return io;
}
