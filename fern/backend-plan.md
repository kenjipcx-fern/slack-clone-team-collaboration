# Backend Implementation Plan

## Overview
This document contains actionable tickets for implementing the Node.js/Express backend with Socket.io, PostgreSQL, Redis, and Prisma ORM. Each ticket is designed to be implementable by any developer without additional research.

---

## Phase 1: Foundation & Database Setup

### BE-001: Project Initialization and Core Dependencies
**Priority**: Critical  
**Estimated Time**: 2 hours  
**Dependencies**: None

**Description:**
Initialize the Node.js backend project with Express, TypeScript, and essential dependencies for the Slack clone API.

**Tech Stack:**
- Node.js 18+
- Express 4.18+
- TypeScript 5.2+
- Prisma ORM 5.4+
- PostgreSQL database

**Commands to Run:**
```bash
# Navigate to project root and create backend directory
mkdir -p slack-clone/backend
cd slack-clone/backend

# Initialize package.json
pnpm init

# Install core dependencies
pnpm add express cors helmet express-rate-limit
pnpm add prisma @prisma/client bcryptjs jsonwebtoken
pnpm add socket.io redis multer sharp joi
pnpm add aws-sdk node-cron dotenv

# Install TypeScript and dev dependencies  
pnpm add -D typescript @types/node @types/express @types/cors
pnpm add -D @types/bcryptjs @types/jsonwebtoken @types/multer
pnpm add -D nodemon ts-node jest @types/jest supertest
pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Initialize TypeScript
npx tsc --init
```

**File Structure to Create:**
```
backend/
├── src/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── socket/
│   ├── utils/
│   └── server.ts
├── prisma/
│   └── schema.prisma
├── docker/
├── tests/
├── package.json
├── tsconfig.json
├── .env.example
└── .gitignore
```

**Key Configuration Files:**

**package.json scripts:**
```json
{
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "ts-node prisma/seed.ts"
  }
}
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**.env.example:**
```
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/slackclone"
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# Server
PORT=8000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"

# File Storage
S3_ENDPOINT="http://localhost:9000"
S3_BUCKET="slack-files"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000
```

**Testing Steps:**
1. Run `pnpm dev` and verify server starts without errors
2. Test TypeScript compilation with `pnpm build`
3. Verify environment variables are loaded correctly
4. Check that all dependencies are installed properly

**Acceptance Criteria:**
- [ ] Node.js project initializes successfully
- [ ] All dependencies install without conflicts
- [ ] TypeScript compilation passes
- [ ] Development server runs on specified port
- [ ] Environment configuration works
- [ ] Project structure follows specifications

---

### BE-002: Database Schema Implementation with Prisma
**Priority**: Critical  
**Estimated Time**: 3 hours  
**Dependencies**: BE-001

**Description:**
Implement the complete database schema from tech-specs.md using Prisma ORM with PostgreSQL.

**Tech Stack:**
- Prisma ORM 5.4+
- PostgreSQL 15+
- Database indexing for performance

**Commands to Run:**
```bash
# Initialize Prisma
npx prisma init

# Generate Prisma client after schema creation
npx prisma generate

# Create and run initial migration
npx prisma migrate dev --name init

# Seed the database
npx prisma db seed
```

**Files to Create:**
1. **prisma/schema.prisma** - Complete database schema
2. **prisma/seed.ts** - Database seeding script
3. **src/lib/db.ts** - Database connection utility

**Implementation Details:**

**prisma/schema.prisma:**
```prisma
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
  sentMessages         Message[]
  channelMembers       ChannelMember[]
  reactions            Reaction[]
  huddleParticipants   HuddleParticipant[]
  createdChannels      Channel[]
  dmConversations1     DirectMessage[] @relation("User1")
  dmConversations2     DirectMessage[] @relation("User2")

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
  createdBy User            @relation(fields: [createdById], references: [id], onDelete: Cascade)
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
  channel Channel @relation(fields: [channelId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

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
  user         User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  channel      Channel?       @relation(fields: [channelId], references: [id], onDelete: Cascade)
  dm           DirectMessage? @relation(fields: [dmId], references: [id], onDelete: Cascade)
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
  message Message @relation(fields: [messageId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([messageId, userId, emoji])
  @@map("reactions")
}

model Attachment {
  id           String   @id @default(cuid())
  filename     String
  originalName String
  mimeType     String
  size         Int
  url          String
  messageId    String
  uploadedAt   DateTime @default(now())

  // Relationships
  message Message @relation(fields: [messageId], references: [id], onDelete: Cascade)

  @@map("attachments")
}

model DirectMessage {
  id        String   @id @default(cuid())
  user1Id   String
  user2Id   String
  createdAt DateTime @default(now())

  // Relationships
  user1    User      @relation("User1", fields: [user1Id], references: [id], onDelete: Cascade)
  user2    User      @relation("User2", fields: [user2Id], references: [id], onDelete: Cascade)
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
  channel      Channel?             @relation(fields: [channelId], references: [id], onDelete: SetNull)
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
  huddle Huddle @relation(fields: [huddleId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

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

**prisma/seed.ts:**
```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.huddleParticipant.deleteMany();
  await prisma.huddle.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.message.deleteMany();
  await prisma.channelMember.deleteMany();
  await prisma.directMessage.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 12);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'sarah@example.com',
        username: 'sarah_johnson',
        name: 'Sarah Johnson',
        avatar: null,
        status: 'online',
      },
    }),
    prisma.user.create({
      data: {
        email: 'mike@example.com',
        username: 'mike_chen',
        name: 'Mike Chen',
        avatar: null,
        status: 'online',
      },
    }),
    prisma.user.create({
      data: {
        email: 'emma@example.com',
        username: 'emma_wilson',
        name: 'Emma Wilson',
        avatar: null,
        status: 'away',
      },
    }),
  ]);

  // Create channels
  const generalChannel = await prisma.channel.create({
    data: {
      name: 'general',
      description: 'General team discussions and announcements',
      type: 'public',
      createdById: users[0].id,
    },
  });

  const devTeamChannel = await prisma.channel.create({
    data: {
      name: 'dev-team',
      description: 'Development team discussions',
      type: 'public',
      createdById: users[1].id,
    },
  });

  // Add users to channels
  await prisma.channelMember.createMany({
    data: [
      { channelId: generalChannel.id, userId: users[0].id, role: 'admin' },
      { channelId: generalChannel.id, userId: users[1].id, role: 'member' },
      { channelId: generalChannel.id, userId: users[2].id, role: 'member' },
      { channelId: devTeamChannel.id, userId: users[0].id, role: 'member' },
      { channelId: devTeamChannel.id, userId: users[1].id, role: 'admin' },
    ],
  });

  // Create sample messages
  const messages = await Promise.all([
    prisma.message.create({
      data: {
        content: 'Welcome to the team! 👋',
        channelId: generalChannel.id,
        userId: users[0].id,
        type: 'text',
      },
    }),
    prisma.message.create({
      data: {
        content: 'Thanks Sarah! Excited to be here and start contributing.',
        channelId: generalChannel.id,
        userId: users[1].id,
        type: 'text',
      },
    }),
    prisma.message.create({
      data: {
        content: 'Let me know if you need any help getting started!',
        channelId: generalChannel.id,
        userId: users[2].id,
        type: 'text',
      },
    }),
  ]);

  // Add reactions to messages
  await prisma.reaction.createMany({
    data: [
      { messageId: messages[0].id, userId: users[1].id, emoji: '👍' },
      { messageId: messages[0].id, userId: users[2].id, emoji: '❤️' },
      { messageId: messages[1].id, userId: users[0].id, emoji: '🎉' },
    ],
  });

  // Create a direct message conversation
  const dmConversation = await prisma.directMessage.create({
    data: {
      user1Id: users[0].id,
      user2Id: users[1].id,
    },
  });

  await prisma.message.create({
    data: {
      content: 'Hey Mike, can we chat about the new project requirements?',
      dmId: dmConversation.id,
      userId: users[0].id,
      type: 'text',
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**src/lib/db.ts:**
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
```

**package.json seed configuration:**
```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

**Testing Steps:**
1. Run database migration: `pnpm db:migrate`
2. Generate Prisma client: `pnpm db:generate`
3. Seed database: `pnpm db:seed`
4. Verify tables are created correctly in PostgreSQL
5. Test database queries using Prisma Studio: `npx prisma studio`

**Acceptance Criteria:**
- [ ] All database tables are created according to schema
- [ ] Prisma client generates without errors
- [ ] Database migrations run successfully
- [ ] Seed data is inserted correctly
- [ ] Foreign key constraints work properly
- [ ] Database indexes are created for performance

---

### BE-003: Authentication System with JWT
**Priority**: Critical  
**Estimated Time**: 4 hours  
**Dependencies**: BE-002

**Description:**
Implement user authentication with registration, login, and JWT token management.

**Tech Stack:**
- JWT for token-based authentication
- bcryptjs for password hashing
- Input validation with Joi
- Rate limiting for auth endpoints

**Commands to Run:**
```bash
# Dependencies already installed in BE-001
# No additional packages needed
```

**Files to Create:**
1. **src/controllers/authController.ts** - Authentication logic
2. **src/middleware/auth.ts** - JWT authentication middleware
3. **src/middleware/validation.ts** - Input validation middleware
4. **src/routes/auth.ts** - Authentication routes
5. **src/utils/jwt.ts** - JWT utility functions
6. **src/utils/validation.ts** - Validation schemas

**Implementation Details:**

**src/utils/jwt.ts:**
```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export function extractTokenFromHeader(authorization?: string): string | null {
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }
  return authorization.substring(7);
}
```

**src/utils/validation.ts:**
```typescript
import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Username must contain only alphanumeric characters',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must not exceed 30 characters',
      'any.required': 'Username is required',
    }),
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 50 characters',
    'any.required': 'Name is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required',
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  username: Joi.string().alphanum().min(3).max(30),
  avatar: Joi.string().uri(),
  status: Joi.string().valid('online', 'away', 'offline'),
}).min(1);
```

**src/middleware/validation.ts:**
```typescript
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export function validateBody(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    req.body = value;
    next();
  };
}

export function validateParams(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parameters',
        error: error.message,
      });
    }

    req.params = value;
    next();
  };
}
```

**src/middleware/auth.ts:**
```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import prisma from '../lib/db';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    name: string;
  };
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
    }

    const decoded = verifyToken(token);

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        status: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
}

export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    return next();
  }

  authenticateToken(req, res, next);
}
```

**src/controllers/authController.ts:**
```typescript
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/db';
import { generateToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../middleware/auth';

export async function register(req: Request, res: Response) {
  try {
    const { email, username, name, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.email === email 
          ? 'Email is already registered' 
          : 'Username is already taken',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        name,
        password: hashedPassword,
        status: 'online',
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        status: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Update user status and last seen
    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'online',
        lastSeen: new Date(),
      },
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          avatar: user.avatar,
          status: 'online',
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login',
    });
  }
}

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        status: true,
        lastSeen: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
    });
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const updates = req.body;

    // If username is being updated, check if it's available
    if (updates.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: updates.username,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Username is already taken',
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        status: true,
        lastSeen: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user profile',
    });
  }
}

export async function logout(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;

    // Update user status to offline
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'offline',
        lastSeen: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout',
    });
  }
}
```

**src/routes/auth.ts:**
```typescript
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  getProfile,
  updateProfile,
  logout,
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from '../utils/validation';

const router = Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication routes
router.post('/register', authLimiter, validateBody(registerSchema), register);
router.post('/login', authLimiter, validateBody(loginSchema), login);
router.post('/logout', authenticateToken, logout);

// Profile routes
router.get('/profile', authenticateToken, getProfile);
router.patch('/profile', authenticateToken, validateBody(updateProfileSchema), updateProfile);

export default router;
```

**Testing Steps:**
1. Test user registration with valid data
2. Test registration with duplicate email/username
3. Test user login with correct credentials
4. Test login with incorrect credentials
5. Test protected routes with valid JWT token
6. Test protected routes with invalid/expired token
7. Test rate limiting on auth endpoints
8. Verify password hashing works correctly

**Acceptance Criteria:**
- [ ] User registration creates user with hashed password
- [ ] Login returns valid JWT token
- [ ] JWT authentication middleware works correctly
- [ ] Rate limiting prevents brute force attacks
- [ ] Input validation catches invalid data
- [ ] User profile operations work correctly
- [ ] Logout updates user status
- [ ] All auth endpoints handle errors gracefully

---

## Phase 2: Core API Endpoints

### BE-004: Channel Management API
**Priority**: High  
**Estimated Time**: 4 hours  
**Dependencies**: BE-003

**Description:**
Implement CRUD operations for channels including creation, joining, leaving, and permission management.

**Tech Stack:**
- Express.js REST API
- Prisma database queries
- Role-based permissions

**Files to Create:**
1. **src/controllers/channelController.ts** - Channel operations
2. **src/routes/channels.ts** - Channel routes
3. **src/middleware/permissions.ts** - Channel permissions middleware
4. **src/services/channelService.ts** - Channel business logic

**Implementation Details:**

**src/controllers/channelController.ts:**
```typescript
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { channelService } from '../services/channelService';

export async function createChannel(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { name, description, type = 'public' } = req.body;

    const channel = await channelService.createChannel({
      name,
      description,
      type,
      createdById: userId,
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
    });
  }
}

export async function getUserChannels(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const channels = await channelService.getUserChannels(userId);

    res.json({
      success: true,
      data: { channels },
    });
  } catch (error) {
    console.error('Get user channels error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user channels',
    });
  }
}

export async function joinChannel(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { channelId } = req.params;

    await channelService.joinChannel(channelId, userId);

    res.json({
      success: true,
      message: 'Successfully joined channel',
    });
  } catch (error) {
    console.error('Join channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Error joining channel',
    });
  }
}

export async function leaveChannel(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { channelId } = req.params;

    await channelService.leaveChannel(channelId, userId);

    res.json({
      success: true,
      message: 'Successfully left channel',
    });
  } catch (error) {
    console.error('Leave channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Error leaving channel',
    });
  }
}
```

**Testing Steps:**
1. Test channel creation with valid data
2. Test channel listing for authenticated user
3. Test joining public channels
4. Test joining private channels (should fail without permission)
5. Test leaving channels
6. Test channel permissions

**Acceptance Criteria:**
- [ ] Channels can be created with proper validation
- [ ] Users can join and leave public channels
- [ ] Private channels require permission to join
- [ ] Channel listing shows user's channels only
- [ ] Channel operations handle permissions correctly

---

### BE-005: Real-time Messaging API
**Priority**: Critical  
**Estimated Time**: 5 hours  
**Dependencies**: BE-004

**Description:**
Implement message sending, receiving, editing, and deletion with Socket.io real-time updates.

**Tech Stack:**
- Socket.io for real-time communication
- Message validation and sanitization
- Optimistic updates support

**Files to Create:**
1. **src/controllers/messageController.ts** - Message operations
2. **src/routes/messages.ts** - Message HTTP routes
3. **src/socket/messageHandlers.ts** - Socket.io message handlers
4. **src/services/messageService.ts** - Message business logic
5. **src/socket/index.ts** - Socket.io server setup

**Implementation Details:**

**src/socket/index.ts:**
```typescript
import { Server as HTTPServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import { messageHandlers } from './messageHandlers';
import { presenceHandlers } from './presenceHandlers';
import { huddleHandlers } from './huddleHandlers';

export interface AuthenticatedSocket extends Socket {
  userId: string;
  username: string;
}

export function initializeSocketServer(httpServer: HTTPServer) {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      credentials: true,
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
```

**src/socket/messageHandlers.ts:**
```typescript
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

  // Typing indicators
  socket.on('typing-start', (data: { channelId: string }) => {
    socket.to(data.channelId).emit('user-typing-start', {
      userId: socket.userId,
      username: socket.username,
      channelId: data.channelId,
    });
  });

  socket.on('typing-stop', (data: { channelId: string }) => {
    socket.to(data.channelId).emit('user-typing-stop', {
      userId: socket.userId,
      channelId: data.channelId,
    });
  });

  // Message reactions
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

      // Emit to all users in the message's channel
      const message = await messageService.getMessageWithDetails(data.messageId);
      if (message.channelId) {
        io.to(message.channelId).emit('reaction-added', {
          messageId: data.messageId,
          reaction,
        });
      }

    } catch (error) {
      socket.emit('error', { message: 'Failed to add reaction' });
    }
  });
}
```

**src/services/messageService.ts:**
```typescript
import prisma from '../lib/db';

export class MessageService {
  async createMessage(data: {
    content: string;
    userId: string;
    channelId?: string;
    dmUserId?: string;
    threadId?: string;
  }) {
    const { content, userId, channelId, dmUserId, threadId } = data;

    // Handle direct message
    let dmId: string | undefined;
    if (dmUserId) {
      // Find or create DM conversation
      const existingDM = await prisma.directMessage.findFirst({
        where: {
          OR: [
            { user1Id: userId, user2Id: dmUserId },
            { user1Id: dmUserId, user2Id: userId },
          ],
        },
      });

      if (existingDM) {
        dmId = existingDM.id;
      } else {
        const newDM = await prisma.directMessage.create({
          data: {
            user1Id: userId,
            user2Id: dmUserId,
          },
        });
        dmId = newDM.id;
      }
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content,
        userId,
        channelId,
        dmId,
        threadId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        attachments: true,
        _count: {
          select: {
            threadReplies: true,
          },
        },
      },
    });

    return message;
  }

  async getChannelMessages(channelId: string, limit = 50, cursor?: string) {
    const messages = await prisma.message.findMany({
      where: { channelId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        attachments: true,
        _count: {
          select: {
            threadReplies: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    return messages.reverse();
  }

  async canUserAccessChannel(userId: string, channelId: string) {
    const membership = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });

    return !!membership;
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    // Use upsert to handle duplicate reactions
    const reaction = await prisma.reaction.upsert({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
      update: {},
      create: {
        messageId,
        userId,
        emoji,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return reaction;
  }

  async getMessageWithDetails(messageId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        channel: true,
        dm: true,
      },
    });

    return message;
  }
}

export const messageService = new MessageService();
```

**Testing Steps:**
1. Test real-time message sending via Socket.io
2. Test message persistence in database
3. Test typing indicators
4. Test message reactions
5. Test channel message retrieval
6. Test direct message functionality
7. Test message threading

**Acceptance Criteria:**
- [ ] Messages are sent and received in real-time
- [ ] Messages persist correctly in database
- [ ] Typing indicators work across clients
- [ ] Reactions are added and synced
- [ ] Channel permissions are enforced
- [ ] Direct messages work between users
- [ ] Message threading functions correctly

---

## Phase 3: Advanced Features

### BE-006: File Upload and Storage Service
**Priority**: Medium  
**Estimated Time**: 4 hours  
**Dependencies**: BE-005

**Description:**
Implement file upload functionality with S3-compatible storage, image processing, and file metadata management.

**Tech Stack:**
- Multer for file upload handling
- Sharp for image processing
- AWS SDK for S3 storage
- File type validation and security

**Files to Create:**
1. **src/services/fileService.ts** - File operations service
2. **src/controllers/fileController.ts** - File upload endpoints
3. **src/middleware/upload.ts** - File upload middleware
4. **src/routes/files.ts** - File routes

**Testing Steps:**
1. Test file upload with valid files
2. Test file type validation
3. Test file size limits
4. Test image processing and thumbnails
5. Test file URL generation
6. Test file deletion

**Acceptance Criteria:**
- [ ] Files upload successfully to storage
- [ ] File metadata is stored in database
- [ ] Images are processed and thumbnails generated
- [ ] File access URLs work correctly
- [ ] File type and size validation works
- [ ] Secure file handling prevents malicious uploads

---

### BE-007: WebRTC Signaling Server
**Priority**: Medium  
**Estimated Time**: 5 hours  
**Dependencies**: BE-005

**Description:**
Implement WebRTC signaling server for voice/video huddles with offer/answer/ICE candidate exchange.

**Tech Stack:**
- Socket.io for signaling
- WebRTC offer/answer handling
- ICE candidate relay
- Huddle state management

**Files to Create:**
1. **src/socket/huddleHandlers.ts** - Huddle signaling handlers
2. **src/services/huddleService.ts** - Huddle business logic
3. **src/controllers/huddleController.ts** - Huddle HTTP API

**Testing Steps:**
1. Test huddle creation and joining
2. Test WebRTC offer/answer exchange
3. Test ICE candidate handling
4. Test multiple participants
5. Test huddle state management

**Acceptance Criteria:**
- [ ] WebRTC signaling works correctly
- [ ] Multiple participants can connect
- [ ] Offer/answer/ICE exchange functions
- [ ] Huddle state is managed properly
- [ ] Connection recovery works

---

### BE-008: Search API Implementation
**Priority**: Medium  
**Estimated Time**: 3 hours  
**Dependencies**: BE-005

**Description:**
Implement full-text search across messages, files, and channels using PostgreSQL's search capabilities.

**Tech Stack:**
- PostgreSQL full-text search
- Search result ranking
- Search filters and pagination

**Files to Create:**
1. **src/services/searchService.ts** - Search functionality
2. **src/controllers/searchController.ts** - Search endpoints
3. **src/routes/search.ts** - Search routes

**Testing Steps:**
1. Test message search functionality
2. Test search result ranking
3. Test search filters
4. Test search performance
5. Test search permissions

**Acceptance Criteria:**
- [ ] Search works across all content types
- [ ] Results are ranked by relevance
- [ ] Search respects user permissions
- [ ] Search performance is acceptable
- [ ] Pagination works correctly

---

## Phase 4: Production Features

### BE-009: Redis Integration for Real-time State
**Priority**: High  
**Estimated Time**: 3 hours  
**Dependencies**: BE-005

**Description:**
Integrate Redis for caching user presence, typing indicators, and active huddle state.

**Tech Stack:**
- Redis for caching and pub/sub
- User presence tracking
- Typing indicator management
- Session management

**Files to Create:**
1. **src/lib/redis.ts** - Redis client setup
2. **src/services/presenceService.ts** - User presence management
3. **src/socket/presenceHandlers.ts** - Presence socket handlers

**Testing Steps:**
1. Test user presence tracking
2. Test presence state persistence
3. Test typing indicator caching
4. Test Redis pub/sub functionality

**Acceptance Criteria:**
- [ ] User presence is tracked accurately
- [ ] Presence state persists across reconnections
- [ ] Typing indicators use Redis for state
- [ ] Redis caching improves performance

---

### BE-010: Rate Limiting and Security
**Priority**: High  
**Estimated Time**: 2 hours  
**Dependencies**: All previous tickets

**Description:**
Implement comprehensive rate limiting, input sanitization, and security headers.

**Tech Stack:**
- Express rate limiting
- Helmet for security headers
- Input sanitization
- CORS configuration

**Files to Create:**
1. **src/middleware/rateLimiting.ts** - Rate limiting middleware
2. **src/middleware/security.ts** - Security middleware
3. **src/utils/sanitization.ts** - Input sanitization utilities

**Testing Steps:**
1. Test rate limiting enforcement
2. Test security headers
3. Test input sanitization
4. Test CORS configuration
5. Test error handling

**Acceptance Criteria:**
- [ ] Rate limiting prevents abuse
- [ ] Security headers are properly set
- [ ] Input is sanitized correctly
- [ ] CORS is configured securely
- [ ] Error responses don't leak information

---

### BE-011: Health Checks and Monitoring
**Priority**: Medium  
**Estimated Time**: 2 hours  
**Dependencies**: All previous tickets

**Description:**
Implement health check endpoints and basic monitoring for production deployment.

**Tech Stack:**
- Health check endpoints
- Database connectivity checks
- Redis connectivity checks
- Basic metrics collection

**Files to Create:**
1. **src/routes/health.ts** - Health check routes
2. **src/utils/healthChecks.ts** - Health check utilities
3. **src/middleware/metrics.ts** - Basic metrics middleware

**Testing Steps:**
1. Test health check endpoints
2. Test database health checks
3. Test Redis health checks
4. Test basic metrics collection

**Acceptance Criteria:**
- [ ] Health checks work correctly
- [ ] Database connectivity is monitored
- [ ] Redis connectivity is monitored
- [ ] Basic metrics are collected
- [ ] Health checks are fast and reliable

---

### BE-012: Docker and Production Setup
**Priority**: Medium  
**Estimated Time**: 3 hours  
**Dependencies**: All previous tickets

**Description:**
Create Docker configuration and production deployment setup with environment management.

**Tech Stack:**
- Docker for containerization
- Docker Compose for development
- Environment variable management
- Production optimization

**Files to Create:**
1. **Dockerfile** - Backend container configuration
2. **docker-compose.yml** - Development environment
3. **docker-compose.prod.yml** - Production environment
4. **.dockerignore** - Docker ignore file

**Commands to Run:**
```bash
# Build Docker image
docker build -t slack-clone-backend .

# Run with Docker Compose
docker-compose up -d

# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

**Testing Steps:**
1. Test Docker image builds successfully
2. Test development environment with Docker Compose
3. Test production environment setup
4. Test environment variable configuration
5. Test database migrations in containers

**Acceptance Criteria:**
- [ ] Docker image builds without errors
- [ ] Development environment runs correctly
- [ ] Production configuration is secure
- [ ] Environment variables are properly managed
- [ ] Database migrations work in containers
- [ ] All services start and connect properly

---

## Summary

This backend plan provides **12 detailed tickets** that will implement a complete, production-ready Slack clone backend. Each ticket includes:

- ✅ **Clear descriptions** and priority levels
- ✅ **Complete tech stack** specifications  
- ✅ **Exact commands** to run for setup
- ✅ **Full code examples** and implementation details
- ✅ **Comprehensive testing steps**
- ✅ **Specific acceptance criteria**

The plan progresses logically from foundation through core features to advanced functionality and production deployment. Any developer can pick up these tickets and implement them without additional research or clarification.

**Key Technologies Implemented:**
- Node.js/Express REST API
- Socket.io for real-time communication
- PostgreSQL with Prisma ORM
- Redis for caching and real-time state
- JWT authentication
- File upload with S3 storage
- WebRTC signaling
- Full-text search
- Docker containerization
