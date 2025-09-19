# 🚀 Slack Clone - Team Collaboration Platform

A fully functional, real-time team collaboration platform built with modern web technologies. This Slack clone provides all the core features you need for team communication including messaging, channels, search, and emoji reactions.

![Slack Clone](https://img.shields.io/badge/Version-1.0.0-blue) ![License](https://img.shields.io/badge/License-MIT-green) ![Node.js](https://img.shields.io/badge/Node.js-18+-brightgreen) ![Next.js](https://img.shields.io/badge/Next.js-14-black)

## ✨ Features

### 💬 Core Messaging
- **Real-time messaging** with WebSocket connections
- **Channel-based communication** (public/private channels)
- **Direct messages** between team members
- **Message persistence** with full history
- **Emoji reactions** on messages
- **Typing indicators** and user presence

### 🔍 Search & Discovery
- **Global search** across messages, channels, and users
- **Advanced filtering** by date, user, and channel
- **Keyboard shortcuts** (Cmd/Ctrl + K for search)
- **Real-time search results**

### 👥 Team Management
- **User authentication** with JWT tokens
- **User profiles** with avatars and status
- **Online/offline presence** tracking
- **Channel member management**
- **Admin permissions** and moderation tools

### 🎨 Modern UI/UX
- **Slack-identical interface** with dark sidebar
- **Responsive design** for desktop and mobile
- **Professional typography** using Inter font
- **Smooth animations** and transitions
- **Accessibility** with proper ARIA labels

### 🔧 Developer Features
- **File upload** and sharing capabilities
- **WebRTC foundation** for future video/audio calls
- **REST API** for all operations
- **Real-time WebSocket API** for live updates
- **Docker containerization** for easy deployment

## 🏗️ Technical Architecture

### Backend Stack
- **Node.js** with Express.js framework
- **TypeScript** for type safety
- **PostgreSQL** database with Prisma ORM
- **Redis** for caching and session management
- **Socket.io** for real-time communication
- **MinIO** for object storage (S3-compatible)
- **JWT** for authentication
- **Docker** for containerization

### Frontend Stack
- **Next.js 14** with App Router
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **React Query** for state management
- **Socket.io Client** for real-time updates
- **React Hook Form** with Zod validation

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- Docker and Docker Compose
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/slack-clone.git
cd slack-clone
```

### 2. Environment Setup
```bash
# Copy environment files
cp .env.production.example .env.production
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# Update environment variables with your values
```

### 3. Run with Docker (Recommended)
```bash
# Start all services
docker-compose -f docker-compose.production.yml up -d

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

### 4. Manual Setup (Development)
```bash
# Backend setup
cd backend
pnpm install
pnpm run build
pnpm run db:migrate
pnpm run db:seed
pnpm start

# Frontend setup (in new terminal)
cd frontend
pnpm install
pnpm run build
pnpm start
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Database Admin**: http://localhost:5555 (Prisma Studio)
- **Storage Admin**: http://localhost:9001 (MinIO Console)

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/auth/register - Register new user
POST /api/auth/login    - User login
POST /api/auth/logout   - User logout
GET  /api/auth/me       - Get current user
```

### Channel Endpoints
```
GET    /api/channels           - List all channels
POST   /api/channels           - Create new channel
GET    /api/channels/:id       - Get channel details
PUT    /api/channels/:id       - Update channel
DELETE /api/channels/:id       - Delete channel
```

### Message Endpoints
```
GET  /api/messages/:channelId     - Get channel messages
POST /api/messages                - Send message
PUT  /api/messages/:id            - Edit message
DELETE /api/messages/:id          - Delete message
POST /api/messages/:id/reactions  - Add reaction
```

### Search Endpoints
```
GET /api/search?q=query&type=all  - Global search
GET /api/search/messages?q=query  - Search messages only
GET /api/search/channels?q=query  - Search channels only
GET /api/search/users?q=query     - Search users only
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/slackclone
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
MINIO_ENDPOINT=localhost
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000
```

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd backend
pnpm test

# Frontend tests
cd frontend  
pnpm test

# End-to-end tests
pnpm test:e2e
```

### Health Checks
```bash
# Backend health
curl http://localhost:8000/health

# Database connection
curl http://localhost:8000/api/health/db

# Redis connection  
curl http://localhost:8000/api/health/redis
```

## 📦 Deployment

### Production Deployment
1. Set up your production server with Docker
2. Clone the repository
3. Configure production environment variables
4. Run with Docker Compose:
```bash
docker-compose -f docker-compose.production.yml up -d
```

### Environment-Specific Configs
- **Development**: `docker-compose.yml`
- **Production**: `docker-compose.production.yml`
- **Testing**: `docker-compose.test.yml`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Slack's excellent UX design
- Built with amazing open-source technologies
- shadcn/ui for beautiful component library
- Lucide React for professional icons

## 📞 Support

- 📧 Email: support@slackclone.dev
- 💬 Discord: [Join our community]
- 📖 Documentation: [docs.slackclone.dev]
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/slack-clone/issues)

---

**Built with ❤️ by the Slack Clone Team**
