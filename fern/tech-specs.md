# Technical Specifications - Slack Clone

## Executive Summary

Building a modern, scalable team communication platform using a **Next.js 14** frontend with **Node.js/Express** backend, **PostgreSQL** for data persistence, **Redis** for real-time features, and **WebRTC** for voice/video communication.

### Technology Stack Overview
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, Socket.io, Prisma ORM
- **Database**: PostgreSQL (primary), Redis (cache/real-time)
- **Real-time**: Socket.io, WebRTC
- **Package Manager**: pnpm
- **Authentication**: NextAuth.js with JWT
- **File Storage**: AWS S3 compatible (MinIO for dev)
- **Deployment**: Docker, Nginx reverse proxy

## Frontend Architecture

### Framework: Next.js 14 App Router
```
slack-clone/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/
│   │   ├── channels/[id]/
│   │   ├── dms/[userId]/
│   │   ├── threads/[messageId]/
│   │   └── huddles/[huddleId]/
│   ├── api/
│   │   ├── auth/
│   │   ├── channels/
│   │   ├── messages/
│   │   └── uploads/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/ (shadcn/ui components)
│   ├── chat/
│   ├── huddle/
│   └── layout/
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   ├── socket.ts
│   └── utils.ts
├── hooks/
│   ├── useSocket.ts
│   ├── useMessages.ts
│   └── useHuddles.ts
├── types/
│   └── index.ts
└── public/
```

### Key Dependencies
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "typescript": "^5.2.0",
    "tailwindcss": "^3.3.0",
    "@tailwindcss/typography": "^0.5.10",
    "shadcn/ui": "latest",
    "socket.io-client": "^4.7.2",
    "next-auth": "^4.23.1",
    "@prisma/client": "^5.4.2",
    "react-hook-form": "^7.45.4",
    "@hookform/resolvers": "^3.3.1",
    "zod": "^3.22.2",
    "framer-motion": "^10.16.2",
    "lucide-react": "^0.288.0",
    "emoji-picker-react": "^4.5.16",
    "react-dropzone": "^14.2.3",
    "simple-peer": "^9.11.1",
    "@tanstack/react-query": "^4.35.3"
  }
}
```

### State Management Strategy
```typescript
// Global State (React Query + Context)
interface AppState {
  user: User | null;
  activeChannel: Channel | null;
  messages: Message[];
  onlineUsers: User[];
  huddles: Huddle[];
}

// Real-time State (Socket.io)
interface SocketState {
  connected: boolean;
  typing: { [channelId: string]: User[] };
  presence: { [userId: string]: 'online' | 'away' | 'offline' };
}

// Component-level State (useState/useReducer)
// - UI interactions (modals, dropdowns)
// - Form state
// - Local optimistic updates
```

## Backend Architecture

### Node.js/Express Server Structure
```
backend/
├── src/
│   ├── controllers/
│   │   ├── auth.ts
│   │   ├── channels.ts
│   │   ├── messages.ts
│   │   ├── users.ts
│   │   └── files.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   └── upload.ts
│   ├── models/
│   │   └── index.ts (Prisma client)
│   ├── routes/
│   │   ├── api.ts
│   │   └── socket.ts
│   ├── services/
│   │   ├── messageService.ts
│   │   ├── channelService.ts
│   │   ├── fileService.ts
│   │   └── huddleService.ts
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── validation.ts
│   │   └── errors.ts
│   ├── socket/
│   │   ├── handlers/
│   │   ├── middleware.ts
│   │   └── index.ts
│   └── server.ts
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── package.json
└── docker/
    ├── Dockerfile
    └── docker-compose.yml
```

### Key Backend Dependencies
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.2",
    "prisma": "^5.4.2",
    "@prisma/client": "^5.4.2",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.10.0",
    "joi": "^17.10.1",
    "redis": "^4.6.8",
    "aws-sdk": "^2.1465.0",
    "sharp": "^0.32.5",
    "node-cron": "^3.0.2"
  }
}
```

## Database Schema (PostgreSQL + Prisma)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  username  String   @unique
  name      String
  avatar    String?
  status    String   @default("offline") // online, away, offline
  lastSeen  DateTime @default(now())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relationships
  sentMessages     Message[]
  channelMembers   ChannelMember[]
  reactions        Reaction[]
  huddleParticipants HuddleParticipant[]
  createdChannels  Channel[]
  dmConversations1 DirectMessage[] @relation("User1")
  dmConversations2 DirectMessage[] @relation("User2")

  @@map("users")
}

model Channel {
  id          String   @id @default(cuid())
  name        String
  description String?
  type        String   @default("public") // public, private
  createdById String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relationships
  createdBy User            @relation(fields: [createdById], references: [id])
  messages  Message[]
  members   ChannelMember[]
  huddles   Huddle[]

  @@map("channels")
}

model ChannelMember {
  id        String   @id @default(cuid())
  channelId String
  userId    String
  role      String   @default("member") // admin, member
  joinedAt  DateTime @default(now())

  // Relationships
  channel Channel @relation(fields: [channelId], references: [id])
  user    User    @relation(fields: [userId], references: [id])

  @@unique([channelId, userId])
  @@map("channel_members")
}

model Message {
  id        String   @id @default(cuid())
  content   String
  type      String   @default("text") // text, file, system
  channelId String?
  dmId      String?
  userId    String
  threadId  String?  // For threaded messages
  edited    Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relationships
  user         User           @relation(fields: [userId], references: [id])
  channel      Channel?       @relation(fields: [channelId], references: [id])
  dm           DirectMessage? @relation(fields: [dmId], references: [id])
  thread       Message?       @relation("MessageThread", fields: [threadId], references: [id])
  threadReplies Message[]     @relation("MessageThread")
  reactions    Reaction[]
  attachments  Attachment[]

  @@map("messages")
}

model Reaction {
  id        String   @id @default(cuid())
  emoji     String   // Unicode emoji or custom emoji name
  messageId String
  userId    String
  createdAt DateTime @default(now())

  // Relationships
  message Message @relation(fields: [messageId], references: [id])
  user    User    @relation(fields: [userId], references: [id])

  @@unique([messageId, userId, emoji])
  @@map("reactions")
}

model Attachment {
  id        String   @id @default(cuid())
  filename  String
  originalName String
  mimeType  String
  size      Int
  url       String
  messageId String
  uploadedAt DateTime @default(now())

  // Relationships
  message Message @relation(fields: [messageId], references: [id])

  @@map("attachments")
}

model DirectMessage {
  id        String   @id @default(cuid())
  user1Id   String
  user2Id   String
  createdAt DateTime @default(now())

  // Relationships
  user1    User      @relation("User1", fields: [user1Id], references: [id])
  user2    User      @relation("User2", fields: [user2Id], references: [id])
  messages Message[]

  @@unique([user1Id, user2Id])
  @@map("direct_messages")
}

model Huddle {
  id          String   @id @default(cuid())
  name        String?
  channelId   String?
  creatorId   String
  status      String   @default("active") // active, ended
  startedAt   DateTime @default(now())
  endedAt     DateTime?

  // Relationships
  channel      Channel?             @relation(fields: [channelId], references: [id])
  participants HuddleParticipant[]

  @@map("huddles")
}

model HuddleParticipant {
  id         String    @id @default(cuid())
  huddleId   String
  userId     String
  joinedAt   DateTime  @default(now())
  leftAt     DateTime?
  audioMuted Boolean   @default(false)
  videoOn    Boolean   @default(false)

  // Relationships
  huddle Huddle @relation(fields: [huddleId], references: [id])
  user   User   @relation(fields: [userId], references: [id])

  @@unique([huddleId, userId])
  @@map("huddle_participants")
}

model CustomEmoji {
  id        String   @id @default(cuid())
  name      String   @unique
  url       String
  createdBy String
  createdAt DateTime @default(now())

  @@map("custom_emojis")
}
```

### Database Indexes & Performance
```sql
-- Indexes for performance
CREATE INDEX idx_messages_channel_created ON messages(channel_id, created_at DESC);
CREATE INDEX idx_messages_dm_created ON messages(dm_id, created_at DESC);
CREATE INDEX idx_messages_thread ON messages(thread_id) WHERE thread_id IS NOT NULL;
CREATE INDEX idx_reactions_message ON reactions(message_id);
CREATE INDEX idx_channel_members_user ON channel_members(user_id);
CREATE INDEX idx_users_status ON users(status) WHERE status != 'offline';

-- Full-text search on messages
ALTER TABLE messages ADD COLUMN search_vector tsvector;
CREATE INDEX idx_messages_search ON messages USING gin(search_vector);
```

## Real-time Communication

### Socket.io Implementation
```typescript
// backend/src/socket/index.ts
import { Server } from 'socket.io';
import { authenticateSocket } from './middleware';
import { handleMessage } from './handlers/messageHandler';
import { handleTyping } from './handlers/typingHandler';
import { handlePresence } from './handlers/presenceHandler';

export function initializeSocket(httpServer: any) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);
    
    // Join user to their channels
    socket.on('join-channels', async (channelIds: string[]) => {
      channelIds.forEach(channelId => {
        socket.join(channelId);
      });
    });

    // Message handlers
    socket.on('send-message', handleMessage);
    socket.on('typing-start', handleTyping);
    socket.on('typing-stop', handleTyping);
    
    // Presence handlers
    socket.on('set-status', handlePresence);
    
    // Huddle handlers
    socket.on('start-huddle', handleHuddleStart);
    socket.on('join-huddle', handleHuddleJoin);
    socket.on('leave-huddle', handleHuddleLeave);
    
    // WebRTC signaling
    socket.on('webrtc-offer', handleWebRTCOffer);
    socket.on('webrtc-answer', handleWebRTCAnswer);
    socket.on('webrtc-ice-candidate', handleICECandidate);

    socket.on('disconnect', () => {
      handleUserDisconnect(socket.userId);
    });
  });

  return io;
}
```

### Redis for Real-time State
```typescript
// Presence tracking
await redis.hset('user_presence', userId, {
  status: 'online',
  lastSeen: Date.now(),
  socketId: socket.id
});

// Typing indicators (with expiration)
await redis.setex(`typing:${channelId}:${userId}`, 3, 'true');

// Active huddles
await redis.hset('active_huddles', huddleId, JSON.stringify({
  participants: participantIds,
  startedAt: Date.now()
}));
```

## Voice/Video Communication (WebRTC)

### Peer-to-Peer Architecture
```typescript
// Frontend WebRTC implementation
class HuddleManager {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  
  async startHuddle(channelId: string) {
    // Get user media
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: { 
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: false // Audio-first huddles
    });

    // Create peer connections for existing participants
    const participants = await this.getHuddleParticipants(channelId);
    participants.forEach(participant => {
      this.createPeerConnection(participant.id);
    });
  }

  private createPeerConnection(userId: string) {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: process.env.NEXT_PUBLIC_TURN_SERVER }
      ]
    });

    // Add local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle incoming stream
    pc.ontrack = (event) => {
      this.handleRemoteStream(userId, event.streams[0]);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc-ice-candidate', {
          targetUserId: userId,
          candidate: event.candidate
        });
      }
    };

    this.peerConnections.set(userId, pc);
  }
}
```

### Media Server for Group Calls (Optional)
```javascript
// For larger huddles (>4 people), use SFU architecture
// Using mediasoup or similar for scalable media routing
const mediasoup = require('mediasoup');

// Create media router per huddle
const router = await worker.createRouter({
  mediaCodecs: [
    {
      kind: 'audio',
      mimeType: 'audio/opus',
      clockRate: 48000,
      channels: 2
    }
  ]
});
```

## File Upload & Storage

### File Upload Service
```typescript
// backend/src/services/fileService.ts
import AWS from 'aws-sdk';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

const s3 = new AWS.S3({
  endpoint: process.env.S3_ENDPOINT,
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
  s3ForcePathStyle: true
});

export class FileService {
  async uploadFile(file: Express.Multer.File, userId: string) {
    const fileId = uuidv4();
    const key = `uploads/${userId}/${fileId}-${file.originalname}`;
    
    let buffer = file.buffer;
    
    // Image optimization
    if (file.mimetype.startsWith('image/')) {
      buffer = await sharp(file.buffer)
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
    }

    const uploadParams = {
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };

    const result = await s3.upload(uploadParams).promise();
    
    return {
      id: fileId,
      url: result.Location,
      filename: key,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size
    };
  }

  async generateThumbnail(imageUrl: string) {
    // Generate thumbnails for images
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    
    const thumbnail = await sharp(Buffer.from(buffer))
      .resize(200, 200, { fit: 'cover' })
      .jpeg({ quality: 75 })
      .toBuffer();
      
    // Upload thumbnail
    const thumbKey = imageUrl.replace(/\.[^.]+$/, '_thumb.jpg');
    // ... upload logic
  }
}
```

## API Endpoints

### REST API Structure
```typescript
// Core API routes
app.use('/api/auth', authRoutes);        // Authentication
app.use('/api/users', userRoutes);       // User management
app.use('/api/channels', channelRoutes); // Channel CRUD
app.use('/api/messages', messageRoutes); // Message operations
app.use('/api/files', fileRoutes);       // File uploads
app.use('/api/huddles', huddleRoutes);   // Voice/video calls

// Example: Message endpoints
GET    /api/messages/:channelId          // Get channel messages
POST   /api/messages                     // Send message
PUT    /api/messages/:messageId          // Edit message
DELETE /api/messages/:messageId          // Delete message
POST   /api/messages/:messageId/reactions // Add reaction
GET    /api/messages/:messageId/thread   // Get thread replies
```

### Authentication Flow
```typescript
// NextAuth.js configuration
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const user = await userService.authenticate(
          credentials.email,
          credentials.password
        );
        return user ? { id: user.id, email: user.email, name: user.name } : null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId;
      return session;
    }
  },
  session: { strategy: 'jwt' }
};
```

## Development & Deployment

### Development Setup
```bash
# Clone and setup
git clone <repository>
cd slack-clone

# Install dependencies
pnpm install

# Setup databases
docker-compose up -d postgres redis minio

# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Start development servers
pnpm dev        # Frontend (Next.js)
pnpm dev:backend # Backend (Node.js)
```

### Docker Configuration
```dockerfile
# Dockerfile (Frontend)
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
USER nextjs
EXPOSE 3000
CMD ["pnpm", "start"]
```

### Production Deployment
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/slackclone
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    depends_on:
      - backend
      - postgres

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/slackclone
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=slackclone
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
  redis_data:
```

## Performance & Optimization

### Frontend Optimizations
- **Code splitting**: Route-based and component-based splitting
- **Image optimization**: Next.js Image component with WebP
- **Caching**: React Query for API caching
- **Virtual scrolling**: For large message lists
- **Lazy loading**: Messages, images, and components

### Backend Optimizations
- **Database indexing**: Critical query optimization
- **Connection pooling**: PostgreSQL connection management
- **Caching**: Redis for frequently accessed data
- **Rate limiting**: API endpoint protection
- **Compression**: Gzip/Brotli response compression

### Scaling Considerations
- **Horizontal scaling**: Load balancers for multiple app instances
- **Database scaling**: Read replicas, partitioning
- **CDN**: Static asset delivery
- **Message queuing**: Background job processing
- **Microservices**: Service separation for larger scale

This technical specification provides a complete foundation for building a production-ready Slack clone with modern technologies and best practices.
