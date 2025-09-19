# Frontend Implementation Plan

## Overview
This document contains actionable tickets for implementing the Next.js 14 frontend with TypeScript, Tailwind CSS, and shadcn/ui components. Each ticket is designed to be implementable by any developer without additional research.

---

## Phase 1: Foundation & Setup

### FE-001: Project Initialization and Core Dependencies
**Priority**: Critical  
**Estimated Time**: 2 hours  
**Dependencies**: None

**Description:**
Initialize the Next.js 14 project with App Router, TypeScript, and essential dependencies for the Slack clone frontend.

**Tech Stack:**
- Next.js 14 (App Router)
- TypeScript 5.2+
- Tailwind CSS 3.3+
- shadcn/ui components

**Commands to Run:**
```bash
# Navigate to project root
cd slack-clone

# Initialize Next.js project
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"

# Install core dependencies
pnpm add @hookform/resolvers @tanstack/react-query @types/node 
pnpm add framer-motion lucide-react next-auth react-hook-form zod
pnpm add socket.io-client emoji-picker-react react-dropzone simple-peer
pnpm add @tailwindcss/typography class-variance-authority clsx tailwind-merge

# Install shadcn/ui CLI and initialize
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input label textarea select avatar badge dropdown-menu

# Install dev dependencies
pnpm add -D @types/react @types/react-dom eslint-config-next prettier
```

**File Structure to Create:**
```
app/
├── globals.css
├── layout.tsx
├── page.tsx
├── loading.tsx
└── not-found.tsx
components/
├── ui/ (shadcn components)
lib/
├── utils.ts
├── validations.ts
types/
└── index.ts
```

**Key Files to Modify:**
1. **tailwind.config.js** - Add custom color palette from ui-design.md
2. **app/globals.css** - Import Tailwind and custom styles
3. **lib/utils.ts** - Add utility functions and cn helper

**Testing Steps:**
1. Run `pnpm dev` and verify Next.js starts on localhost:3000
2. Verify TypeScript compilation with no errors
3. Test a simple shadcn/ui Button component renders correctly
4. Confirm Tailwind CSS classes are working

**Acceptance Criteria:**
- [ ] Next.js 14 project initializes successfully
- [ ] All dependencies install without conflicts
- [ ] TypeScript compilation passes
- [ ] shadcn/ui components are accessible
- [ ] Development server runs without errors
- [ ] Custom color palette from design system is configured in Tailwind

---

### FE-002: Design System Implementation
**Priority**: High  
**Estimated Time**: 3 hours  
**Dependencies**: FE-001

**Description:**
Implement the complete design system from ui-design.md including colors, typography, spacing, and component variants.

**Tech Stack:**
- Tailwind CSS custom configuration
- CSS custom properties
- CVA (class-variance-authority) for component variants

**Commands to Run:**
```bash
# No additional packages needed
pnpm add class-variance-authority
```

**Files to Create:**
1. **lib/design-tokens.ts** - Design system constants
2. **components/ui/typography.tsx** - Typography components
3. **styles/design-system.css** - CSS custom properties

**Implementation Details:**

**lib/design-tokens.ts:**
```typescript
export const colors = {
  primary: {
    50: '#EFF6FF',
    500: '#0066CC',
    600: '#004499',
  },
  success: '#00AA44',
  warning: '#FF8800',
  error: '#DD3333',
  huddle: '#8B5CF6',
  thread: '#3B82F6',
  emoji: '#FBB040',
} as const;

export const typography = {
  fontFamily: {
    sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
  },
  fontSize: {
    xs: '12px',
    sm: '14px', 
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
  },
} as const;
```

**tailwind.config.js updates:**
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0066CC',
          dark: '#004499',
        },
        success: '#00AA44',
        warning: '#FF8800', 
        error: '#DD3333',
        huddle: '#8B5CF6',
        thread: '#3B82F6',
        emoji: '#FBB040',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
      },
    },
  },
}
```

**Testing Steps:**
1. Create test components using each color variant
2. Verify font loading and typography scales
3. Test responsive spacing system
4. Validate dark mode color combinations

**Acceptance Criteria:**
- [ ] All colors from ui-design.md are available as Tailwind classes
- [ ] Typography scales render correctly
- [ ] Spacing system works consistently
- [ ] Design tokens are accessible via TypeScript
- [ ] Components can use design system variants

---

### FE-003: Authentication UI Components
**Priority**: High  
**Estimated Time**: 4 hours  
**Dependencies**: FE-002

**Description:**
Create authentication components including login, signup, and session management based on UX flow 1 (First Time User Onboarding).

**Tech Stack:**
- NextAuth.js for authentication
- React Hook Form with Zod validation
- shadcn/ui form components

**Commands to Run:**
```bash
pnpm add next-auth @auth/prisma-adapter
pnpm add -D @types/bcryptjs
npx shadcn-ui@latest add form card
```

**Files to Create:**
1. **app/(auth)/login/page.tsx** - Login page
2. **app/(auth)/signup/page.tsx** - Signup page  
3. **app/(auth)/layout.tsx** - Auth layout
4. **components/auth/login-form.tsx** - Login form component
5. **components/auth/signup-form.tsx** - Signup form component
6. **lib/auth.ts** - NextAuth configuration
7. **lib/validations/auth.ts** - Auth validation schemas

**Implementation Details:**

**lib/validations/auth.ts:**
```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
```

**components/auth/login-form.tsx:**
```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

export function LoginForm() {
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    // Implementation will connect to NextAuth
    console.log('Login data:', data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter your password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Sign In
        </Button>
      </form>
    </Form>
  );
}
```

**Testing Steps:**
1. Navigate to /login and verify form renders
2. Test form validation with invalid inputs
3. Test form submission (console.log for now)
4. Verify responsive design on mobile
5. Test keyboard navigation and accessibility

**Acceptance Criteria:**
- [ ] Login page renders with proper styling
- [ ] Signup page renders with workspace creation option
- [ ] Form validation works correctly
- [ ] Components follow design system
- [ ] Mobile responsive design
- [ ] Keyboard navigation works
- [ ] Loading states for form submission

---

## Phase 2: Core Layout Components

### FE-004: Main Application Layout
**Priority**: Critical  
**Estimated Time**: 5 hours  
**Dependencies**: FE-003

**Description:**
Implement the main three-panel layout from ux-design.md wireframes: Sidebar, Main Chat Area, and Right Panel.

**Tech Stack:**
- CSS Grid for layout
- ResizeObserver for responsive sidebar
- shadcn/ui layout components

**Commands to Run:**
```bash
npx shadcn-ui@latest add separator sheet scroll-area
pnpm add react-resizable-panels
```

**Files to Create:**
1. **app/(dashboard)/layout.tsx** - Main dashboard layout
2. **components/layout/sidebar.tsx** - Left sidebar component
3. **components/layout/main-panel.tsx** - Center chat panel
4. **components/layout/right-panel.tsx** - Right info panel
5. **components/layout/top-bar.tsx** - Top navigation bar
6. **hooks/use-layout.ts** - Layout state management

**Implementation Details:**

**app/(dashboard)/layout.tsx:**
```typescript
import { Sidebar } from '@/components/layout/sidebar';
import { MainPanel } from '@/components/layout/main-panel';
import { RightPanel } from '@/components/layout/right-panel';
import { TopBar } from '@/components/layout/top-bar';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <Sidebar />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={60}>
            <MainPanel>{children}</MainPanel>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <RightPanel />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
```

**components/layout/sidebar.tsx:**
```typescript
'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, Hash, MessageCircle, Volume2, Plus, Search } from 'lucide-react';

export function Sidebar() {
  return (
    <div className="flex h-full flex-col border-r bg-gray-100">
      <div className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-primary text-white flex items-center justify-center font-semibold">
            T
          </div>
          <span className="font-semibold">TeamApp</span>
        </div>
      </div>

      <div className="px-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search everything..."
            className="w-full rounded-md border border-gray-200 py-2 pl-10 pr-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-4">
          {/* Home Section */}
          <div>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
              <Home className="h-4 w-4" />
              Home
            </Button>
          </div>

          <Separator />

          {/* Unreads Section */}
          <div>
            <h3 className="px-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              UNREADS
            </h3>
            <div className="mt-2 space-y-1">
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  general
                </div>
                <Badge variant="secondary" className="text-xs">12</Badge>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Channels Section */}
          <div>
            <div className="flex items-center justify-between">
              <h3 className="px-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                CHANNELS
              </h3>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 space-y-1">
              {['general', 'random', 'dev-team', 'design'].map((channel) => (
                <Button key={channel} variant="ghost" size="sm" className="w-full justify-start gap-2">
                  <Hash className="h-4 w-4" />
                  {channel}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Direct Messages Section */}
          <div>
            <div className="flex items-center justify-between">
              <h3 className="px-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                DIRECT MESSAGES
              </h3>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 space-y-1">
              {[
                { name: 'Sarah Johnson', online: true },
                { name: 'Mike Chen', online: true },
                { name: 'Emma Wilson', online: false },
              ].map((user) => (
                <Button key={user.name} variant="ghost" size="sm" className="w-full justify-start gap-2">
                  <div className="relative">
                    <div className="h-6 w-6 rounded-full bg-gray-400 flex items-center justify-center text-xs text-white">
                      {user.name.charAt(0)}
                    </div>
                    {user.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-success border border-white" />
                    )}
                  </div>
                  <span className="truncate">{user.name}</span>
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Huddles Section */}
          <div>
            <div className="flex items-center justify-between">
              <h3 className="px-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                HUDDLES
              </h3>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 space-y-1">
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                <Volume2 className="h-4 w-4 text-huddle" />
                Design Review
                <div className="h-2 w-2 rounded-full bg-huddle ml-auto" />
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
```

**Testing Steps:**
1. Test layout responsiveness across different screen sizes
2. Verify sidebar resizing works smoothly
3. Test keyboard navigation between sections
4. Verify scroll behavior in sidebar
5. Test mobile collapse behavior

**Acceptance Criteria:**
- [ ] Three-panel layout matches wireframes exactly
- [ ] Sidebar shows channels, DMs, huddles correctly
- [ ] Panel resizing works smoothly
- [ ] Mobile responsive (sidebar collapses)
- [ ] Keyboard navigation works
- [ ] Online status indicators display correctly
- [ ] Unread count badges work

---

### FE-005: Message Display Components
**Priority**: Critical  
**Estimated Time**: 6 hours  
**Dependencies**: FE-004

**Description:**
Create message components based on ui-design.md including message bubbles, reactions, threads, and file attachments.

**Tech Stack:**
- Message virtualization for performance
- Time grouping for message display
- Rich text parsing for formatting

**Commands to Run:**
```bash
npx shadcn-ui@latest add avatar popover tooltip
pnpm add react-window react-window-infinite-loader
pnpm add date-fns react-markdown
```

**Files to Create:**
1. **components/chat/message.tsx** - Individual message component
2. **components/chat/message-list.tsx** - Virtualized message list
3. **components/chat/reactions.tsx** - Message reactions
4. **components/chat/thread-indicator.tsx** - Thread reply indicator
5. **components/chat/file-attachment.tsx** - File attachment component
6. **components/chat/message-input.tsx** - Message composition
7. **hooks/use-messages.ts** - Message state management

**Implementation Details:**

**components/chat/message.tsx:**
```typescript
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MessageCircle, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Reactions } from './reactions';
import { FileAttachment } from './file-attachment';
import { ThreadIndicator } from './thread-indicator';

interface MessageProps {
  message: {
    id: string;
    content: string;
    user: {
      id: string;
      name: string;
      username: string;
      avatar?: string;
      role?: string;
    };
    createdAt: Date;
    edited: boolean;
    reactions?: Array<{
      emoji: string;
      count: number;
      users: string[];
    }>;
    attachments?: Array<{
      id: string;
      filename: string;
      url: string;
      mimeType: string;
      size: number;
    }>;
    threadCount?: number;
  };
  compact?: boolean;
  isThreadReply?: boolean;
  onReact?: (emoji: string) => void;
  onReply?: () => void;
  onThread?: () => void;
}

export function Message({ 
  message, 
  compact = false,
  isThreadReply = false,
  onReact,
  onReply,
  onThread
}: MessageProps) {
  const timeAgo = formatDistanceToNow(message.createdAt, { addSuffix: true });
  
  return (
    <div className={`group relative px-4 py-2 hover:bg-gray-50 ${isThreadReply ? 'ml-8 border-l-2 border-thread' : ''}`}>
      <div className="flex gap-3">
        {!compact && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={message.user.avatar} />
            <AvatarFallback>{message.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        )}
        
        <div className={`flex-1 ${compact ? 'ml-11' : ''}`}>
          {!compact && (
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-gray-900">{message.user.name}</span>
              {message.user.role && (
                <Badge variant="secondary" className="text-xs">
                  {message.user.role}
                </Badge>
              )}
              <span className="text-xs text-gray-500">{timeAgo}</span>
              {message.edited && (
                <span className="text-xs text-gray-400">(edited)</span>
              )}
            </div>
          )}
          
          <div className="text-gray-900 leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
          
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment) => (
                <FileAttachment key={attachment.id} attachment={attachment} />
              ))}
            </div>
          )}
          
          {message.reactions && message.reactions.length > 0 && (
            <div className="mt-2">
              <Reactions reactions={message.reactions} onReact={onReact} />
            </div>
          )}
          
          {message.threadCount && message.threadCount > 0 && (
            <div className="mt-2">
              <ThreadIndicator count={message.threadCount} onClick={onThread} />
            </div>
          )}
        </div>
        
        {/* Message Actions */}
        <div className="absolute right-4 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-md shadow-sm p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReact?.('👍')}
              className="h-6 w-6 p-0"
            >
              👍
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReply}
              className="h-6 w-6 p-0"
            >
              <MessageCircle className="h-3 w-3" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-48">
                <div className="space-y-1">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    Edit message
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    Copy link
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-error">
                    Delete
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Testing Steps:**
1. Render messages with different content types
2. Test hover interactions and message actions
3. Verify time formatting and grouping
4. Test reactions and thread indicators
5. Verify file attachment display
6. Test message virtualization performance

**Acceptance Criteria:**
- [ ] Messages display exactly as designed in wireframes
- [ ] Hover actions appear smoothly
- [ ] Time formatting shows relative times
- [ ] Reactions display and function correctly
- [ ] File attachments render with previews
- [ ] Thread indicators work
- [ ] Message virtualization performs well with 1000+ messages
- [ ] Compact mode works for consecutive messages

---

## Phase 3: Interactive Features

### FE-006: Real-time Socket Integration
**Priority**: High  
**Estimated Time**: 4 hours  
**Dependencies**: FE-005

**Description:**
Integrate Socket.io client for real-time messaging, typing indicators, and presence status.

**Tech Stack:**
- Socket.io client
- React context for socket state
- Custom hooks for real-time features

**Commands to Run:**
```bash
# Already installed in FE-001
# No additional packages needed
```

**Files to Create:**
1. **lib/socket.ts** - Socket.io client configuration
2. **contexts/socket-context.tsx** - Socket context provider
3. **hooks/use-socket.ts** - Socket hook
4. **hooks/use-typing.ts** - Typing indicator hook
5. **hooks/use-presence.ts** - User presence hook
6. **components/chat/typing-indicator.tsx** - Typing indicator component

**Implementation Details:**

**lib/socket.ts:**
```typescript
import { io, Socket } from 'socket.io-client';

class SocketManager {
  private socket: Socket | null = null;
  
  connect(token: string) {
    this.socket = io(process.env.NEXT_PUBLIC_BACKEND_URL!, {
      auth: { token },
      transports: ['websocket', 'polling']
    });
    
    return this.socket;
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  getSocket() {
    return this.socket;
  }
}

export const socketManager = new SocketManager();
```

**contexts/socket-context.tsx:**
```typescript
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { socketManager } from '@/lib/socket';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  joinChannel: (channelId: string) => void;
  leaveChannel: (channelId: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (session?.user) {
      const newSocket = socketManager.connect(session.user.accessToken);
      
      newSocket.on('connect', () => {
        setConnected(true);
        console.log('Connected to socket server');
      });
      
      newSocket.on('disconnect', () => {
        setConnected(false);
        console.log('Disconnected from socket server');
      });
      
      setSocket(newSocket);
      
      return () => {
        socketManager.disconnect();
        setSocket(null);
        setConnected(false);
      };
    }
  }, [session]);

  const joinChannel = (channelId: string) => {
    if (socket) {
      socket.emit('join-channel', channelId);
    }
  };

  const leaveChannel = (channelId: string) => {
    if (socket) {
      socket.emit('leave-channel', channelId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, connected, joinChannel, leaveChannel }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
```

**hooks/use-typing.ts:**
```typescript
import { useEffect, useState, useRef } from 'react';
import { useSocket } from '@/contexts/socket-context';

interface TypingUser {
  id: string;
  name: string;
}

export function useTyping(channelId: string) {
  const { socket } = useSocket();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleTypingStart = (data: { userId: string; userName: string; channelId: string }) => {
      if (data.channelId === channelId) {
        setTypingUsers(prev => {
          const exists = prev.find(user => user.id === data.userId);
          if (exists) return prev;
          return [...prev, { id: data.userId, name: data.userName }];
        });
      }
    };

    const handleTypingStop = (data: { userId: string; channelId: string }) => {
      if (data.channelId === channelId) {
        setTypingUsers(prev => prev.filter(user => user.id !== data.userId));
      }
    };

    socket.on('user-typing-start', handleTypingStart);
    socket.on('user-typing-stop', handleTypingStop);

    return () => {
      socket.off('user-typing-start', handleTypingStart);
      socket.off('user-typing-stop', handleTypingStop);
    };
  }, [socket, channelId]);

  const startTyping = () => {
    if (!socket) return;
    
    socket.emit('typing-start', { channelId });
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing-stop', { channelId });
    }, 3000);
  };

  const stopTyping = () => {
    if (!socket) return;
    
    socket.emit('typing-stop', { channelId });
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  return { typingUsers, startTyping, stopTyping };
}
```

**Testing Steps:**
1. Test socket connection establishment
2. Verify real-time message receiving
3. Test typing indicators
4. Verify presence status updates
5. Test connection recovery after disconnect

**Acceptance Criteria:**
- [ ] Socket connects automatically when user is authenticated
- [ ] Real-time messages appear instantly
- [ ] Typing indicators show and hide correctly
- [ ] Presence status updates in real-time
- [ ] Socket reconnects after network interruption
- [ ] No memory leaks in socket listeners

---

### FE-007: Message Composition with Rich Features
**Priority**: High  
**Estimated Time**: 5 hours  
**Dependencies**: FE-006

**Description:**
Create the message input component with emoji picker, file upload, and rich text formatting as shown in ui-design.md.

**Tech Stack:**
- React Hook Form for message input
- Emoji picker component
- File drag-and-drop upload
- Rich text formatting buttons

**Commands to Run:**
```bash
# Already installed in FE-001
# No additional packages needed
```

**Files to Create:**
1. **components/chat/message-input.tsx** - Main message input component
2. **components/chat/emoji-picker.tsx** - Emoji selection component
3. **components/chat/file-upload.tsx** - File upload component
4. **components/chat/format-toolbar.tsx** - Rich text formatting toolbar
5. **hooks/use-message-input.ts** - Message input logic

**Implementation Details:**

**components/chat/message-input.tsx:**
```typescript
'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Smile, Paperclip, Send, Bold, Italic, Code, Link } from 'lucide-react';
import { EmojiPicker } from './emoji-picker';
import { FileUpload } from './file-upload';
import { FormatToolbar } from './format-toolbar';
import { useSocket } from '@/contexts/socket-context';
import { useTyping } from '@/hooks/use-typing';

interface MessageInputProps {
  channelId?: string;
  userId?: string;
  placeholder?: string;
  onSendMessage?: (content: string, files?: File[]) => void;
}

export function MessageInput({ 
  channelId, 
  userId, 
  placeholder = "Type your message here...",
  onSendMessage 
}: MessageInputProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [showFormatting, setShowFormatting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { startTyping, stopTyping } = useTyping(channelId || '');
  
  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: { message: '' }
  });
  
  const messageValue = watch('message');

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    } else if (e.key === 'Enter' && e.shiftKey) {
      // Allow new line
    } else {
      startTyping();
    }
  };

  const onSubmit = (data: { message: string }) => {
    if (!data.message.trim() && files.length === 0) return;
    
    onSendMessage?.(data.message, files);
    reset();
    setFiles([]);
    stopTyping();
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = messageValue.substring(0, start) + emoji + messageValue.substring(end);
    
    setValue('message', newValue);
    
    // Focus back and set cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const insertFormatting = (format: 'bold' | 'italic' | 'code' | 'link') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = messageValue.substring(start, end);
    
    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        break;
    }
    
    const newValue = messageValue.substring(0, start) + formattedText + messageValue.substring(end);
    setValue('message', newValue);
    
    // Focus and select the formatted text
    setTimeout(() => {
      textarea.focus();
      const newStart = start + (formattedText.length - selectedText.length);
      textarea.setSelectionRange(start, newStart);
    }, 0);
  };

  return (
    <div className="border-t bg-white p-4">
      {/* Format Toolbar */}
      {showFormatting && (
        <FormatToolbar onFormat={insertFormatting} />
      )}
      
      {/* File Previews */}
      {files.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-2 bg-gray-100 rounded-md p-2">
              <span className="text-sm">{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))}
                className="h-5 w-5 p-0"
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertFormatting('bold')}
                className="h-7 w-7 p-0"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertFormatting('italic')}
                className="h-7 w-7 p-0"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertFormatting('code')}
                className="h-7 w-7 p-0"
              >
                <Code className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertFormatting('link')}
                className="h-7 w-7 p-0"
              >
                <Link className="h-4 w-4" />
              </Button>
              
              <div className="flex-1" />
              
              <FileUpload onFilesSelected={setFiles}>
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Paperclip className="h-4 w-4" />
                </Button>
              </FileUpload>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-auto p-0">
                  <EmojiPicker onSelect={insertEmoji} />
                </PopoverContent>
              </Popover>
            </div>
            
            <Textarea
              ref={textareaRef}
              {...register('message')}
              placeholder={placeholder}
              onKeyDown={handleKeyPress}
              onBlur={stopTyping}
              className="min-h-[80px] resize-none border-gray-200 focus:border-primary"
              rows={3}
            />
            
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>Shift + Enter for new line</span>
            </div>
          </div>
          
          <Button
            type="submit"
            disabled={!messageValue.trim() && files.length === 0}
            className="h-10 w-10 p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
```

**Testing Steps:**
1. Test message sending with Enter key
2. Test emoji picker functionality
3. Test file upload and preview
4. Test rich text formatting buttons
5. Test typing indicators
6. Test keyboard shortcuts

**Acceptance Criteria:**
- [ ] Message sending works with Enter key
- [ ] Shift+Enter creates new line
- [ ] Emoji picker inserts emojis at cursor
- [ ] File uploads show previews
- [ ] Rich text formatting works
- [ ] Typing indicators activate correctly
- [ ] Form validation prevents empty messages
- [ ] Mobile responsive design

---

## Phase 4: Advanced Features

### FE-008: Huddle (Voice/Video) Interface
**Priority**: Medium  
**Estimated Time**: 8 hours  
**Dependencies**: FE-007

**Description:**
Implement the voice/video call interface using WebRTC for huddles as designed in ui-design.md.

**Tech Stack:**
- WebRTC for peer-to-peer communication
- Simple-peer for WebRTC abstraction
- Audio/video controls and UI

**Commands to Run:**
```bash
# Already installed in FE-001
# No additional packages needed
```

**Files to Create:**
1. **components/huddle/huddle-interface.tsx** - Main huddle UI
2. **components/huddle/participant-video.tsx** - Individual participant view
3. **components/huddle/huddle-controls.tsx** - Audio/video controls
4. **components/huddle/screen-share.tsx** - Screen sharing component
5. **hooks/use-webrtc.ts** - WebRTC management hook
6. **lib/webrtc.ts** - WebRTC utilities

**Implementation Details:**

**hooks/use-webrtc.ts:**
```typescript
import { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'simple-peer';
import { useSocket } from '@/contexts/socket-context';

interface Participant {
  id: string;
  name: string;
  stream: MediaStream | null;
  audioMuted: boolean;
  videoOn: boolean;
}

export function useWebRTC(huddleId: string) {
  const { socket } = useSocket();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const peers = useRef<Map<string, Peer.Instance>>(new Map());
  
  const startHuddle = useCallback(async (audio = true, video = false) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video
      });
      
      setLocalStream(stream);
      setIsAudioMuted(!audio);
      setIsVideoOn(video);
      
      if (socket) {
        socket.emit('join-huddle', { huddleId });
      }
      
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  }, [socket, huddleId]);
  
  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
        
        if (socket) {
          socket.emit('toggle-audio', { huddleId, muted: !audioTrack.enabled });
        }
      }
    }
  }, [localStream, socket, huddleId]);
  
  const toggleVideo = useCallback(async () => {
    if (!isVideoOn) {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = videoStream.getVideoTracks()[0];
        
        if (localStream) {
          localStream.addTrack(videoTrack);
          setIsVideoOn(true);
        }
      } catch (error) {
        console.error('Error enabling video:', error);
      }
    } else {
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          localStream.removeTrack(videoTrack);
          videoTrack.stop();
          setIsVideoOn(false);
        }
      }
    }
    
    if (socket) {
      socket.emit('toggle-video', { huddleId, videoOn: !isVideoOn });
    }
  }, [isVideoOn, localStream, socket, huddleId]);
  
  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      // Replace video track with screen share
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          localStream.removeTrack(videoTrack);
        }
        
        const screenTrack = screenStream.getVideoTracks()[0];
        localStream.addTrack(screenTrack);
        
        setIsScreenSharing(true);
        
        screenTrack.onended = () => {
          setIsScreenSharing(false);
          // Switch back to camera if needed
        };
      }
      
      if (socket) {
        socket.emit('start-screen-share', { huddleId });
      }
      
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  }, [localStream, socket, huddleId]);
  
  const leaveHuddle = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    peers.current.forEach(peer => peer.destroy());
    peers.current.clear();
    
    setParticipants([]);
    setIsAudioMuted(false);
    setIsVideoOn(false);
    setIsScreenSharing(false);
    
    if (socket) {
      socket.emit('leave-huddle', { huddleId });
    }
  }, [localStream, socket, huddleId]);
  
  useEffect(() => {
    if (!socket) return;
    
    const handleParticipantJoined = (data: { userId: string; userName: string }) => {
      // Create peer connection for new participant
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: localStream || undefined
      });
      
      peer.on('signal', (signal) => {
        socket.emit('webrtc-offer', {
          targetUserId: data.userId,
          signal
        });
      });
      
      peer.on('stream', (stream) => {
        setParticipants(prev => prev.map(p =>
          p.id === data.userId ? { ...p, stream } : p
        ));
      });
      
      peers.current.set(data.userId, peer);
      
      setParticipants(prev => [...prev, {
        id: data.userId,
        name: data.userName,
        stream: null,
        audioMuted: false,
        videoOn: false
      }]);
    };
    
    socket.on('participant-joined', handleParticipantJoined);
    
    return () => {
      socket.off('participant-joined', handleParticipantJoined);
    };
  }, [socket, localStream]);
  
  return {
    localStream,
    participants,
    isAudioMuted,
    isVideoOn,
    isScreenSharing,
    startHuddle,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    leaveHuddle
  };
}
```

**Testing Steps:**
1. Test audio-only huddle creation
2. Test video enable/disable functionality
3. Test screen sharing
4. Test multiple participant connections
5. Test audio quality and echo cancellation

**Acceptance Criteria:**
- [ ] Audio huddles work with clear quality
- [ ] Video can be toggled on/off smoothly
- [ ] Screen sharing works correctly
- [ ] Multiple participants can connect
- [ ] Audio/video controls respond immediately
- [ ] Participant management works
- [ ] Connection recovery after network issues

---

### FE-009: Search and Navigation
**Priority**: Medium  
**Estimated Time**: 4 hours  
**Dependencies**: FE-005

**Description:**
Implement search functionality for messages, files, and channels with keyboard shortcuts and navigation.

**Tech Stack:**
- Fuse.js for fuzzy search
- Command palette pattern
- Keyboard navigation

**Commands to Run:**
```bash
pnpm add fuse.js cmdk
pnpm add -D @types/fuse.js
```

**Files to Create:**
1. **components/search/search-command.tsx** - Command palette component
2. **components/search/search-results.tsx** - Search results display
3. **hooks/use-search.ts** - Search functionality hook
4. **hooks/use-keyboard-shortcuts.ts** - Keyboard shortcuts

**Testing Steps:**
1. Test search across messages and files
2. Test keyboard shortcuts (Cmd+K)
3. Test search result navigation
4. Test fuzzy search functionality

**Acceptance Criteria:**
- [ ] Search works across all content types
- [ ] Keyboard shortcuts work correctly
- [ ] Search results are relevant and fast
- [ ] Navigation between results is smooth

---

## Phase 5: Performance & Polish

### FE-010: Performance Optimization
**Priority**: Medium  
**Estimated Time**: 3 hours  
**Dependencies**: All previous tickets

**Description:**
Optimize performance with code splitting, lazy loading, and caching strategies.

**Tech Stack:**
- React.lazy for code splitting
- React Query for caching
- Virtual scrolling optimization

**Testing Steps:**
1. Run Lighthouse performance audit
2. Test with large message histories
3. Verify smooth scrolling performance
4. Test loading states and transitions

**Acceptance Criteria:**
- [ ] Lighthouse score > 90 for performance
- [ ] Smooth scrolling with 1000+ messages
- [ ] Fast initial page load
- [ ] Optimistic updates work correctly

---

### FE-011: Mobile Responsive Design
**Priority**: High  
**Estimated Time**: 4 hours  
**Dependencies**: FE-004, FE-005

**Description:**
Ensure full mobile responsiveness with touch gestures and mobile-optimized UI.

**Tech Stack:**
- CSS Grid/Flexbox responsive design
- Touch gesture handling
- Mobile-first approach

**Testing Steps:**
1. Test on various mobile devices
2. Test touch gestures and interactions
3. Verify sidebar collapse behavior
4. Test mobile keyboard behavior

**Acceptance Criteria:**
- [ ] Works perfectly on mobile devices
- [ ] Touch interactions are responsive
- [ ] Sidebar collapses appropriately
- [ ] Mobile keyboard doesn't break layout
- [ ] All features accessible on mobile

---

### FE-012: Accessibility & Testing
**Priority**: Medium  
**Estimated Time**: 3 hours  
**Dependencies**: All previous tickets

**Description:**
Implement comprehensive accessibility features and testing.

**Tech Stack:**
- ARIA labels and roles
- Keyboard navigation
- Screen reader support
- Jest and Testing Library for tests

**Commands to Run:**
```bash
pnpm add -D @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
```

**Testing Steps:**
1. Run automated accessibility tests
2. Test with screen readers
3. Test keyboard navigation
4. Verify ARIA labels and roles

**Acceptance Criteria:**
- [ ] Passes WCAG 2.1 AA standards
- [ ] Full keyboard navigation
- [ ] Screen reader compatible
- [ ] High contrast mode support
- [ ] Focus management works correctly

---

## Summary

This frontend plan provides **12 detailed tickets** that will implement a complete, production-ready Slack clone frontend. Each ticket includes:

- ✅ **Clear descriptions** and priority levels
- ✅ **Complete tech stack** specifications  
- ✅ **Exact commands** to run for setup
- ✅ **Full code examples** and implementation details
- ✅ **Comprehensive testing steps**
- ✅ **Specific acceptance criteria**

The plan progresses logically from foundation through core features to advanced functionality and polish. Any developer can pick up these tickets and implement them without additional research or clarification.
