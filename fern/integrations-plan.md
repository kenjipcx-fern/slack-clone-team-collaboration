# Integrations Implementation Plan

## Overview
This document contains actionable tickets for integrating frontend and backend components, implementing real-time synchronization, authentication flow, and end-to-end functionality. Each ticket is designed to be implementable by any developer without additional research.

---

## Phase 1: Authentication Integration

### INT-001: NextAuth.js Backend Integration
**Priority**: Critical  
**Estimated Time**: 3 hours  
**Dependencies**: FE-003, BE-003

**Description:**
Integrate NextAuth.js frontend authentication with the custom Node.js backend authentication system using JWT tokens.

**Tech Stack:**
- NextAuth.js custom provider
- JWT token exchange
- Session management
- Automatic token refresh

**Commands to Run:**
```bash
# In frontend directory
cd slack-clone
pnpm add next-auth @auth/prisma-adapter
pnpm add -D @types/next-auth

# No additional backend dependencies needed
```

**Files to Create:**
1. **app/api/auth/[...nextauth]/route.ts** - NextAuth configuration
2. **lib/auth-config.ts** - Authentication configuration  
3. **middleware.ts** - Route protection middleware
4. **contexts/auth-context.tsx** - Authentication context
5. **components/auth/auth-provider.tsx** - Auth provider wrapper

**Implementation Details:**

**lib/auth-config.ts:**
```typescript
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { JWT } from 'next-auth/jwt';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Call backend login API
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(data.message || 'Authentication failed');
          }

          return {
            id: data.data.user.id,
            email: data.data.user.email,
            name: data.data.user.name,
            username: data.data.user.username,
            avatar: data.data.user.avatar,
            accessToken: data.data.token,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    }),
    // Custom registration provider
    CredentialsProvider({
      id: 'register',
      name: 'Register',
      credentials: {
        email: { label: 'Email', type: 'email' },
        username: { label: 'Username', type: 'text' },
        name: { label: 'Name', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.username || !credentials?.name) {
          return null;
        }

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              username: credentials.username,
              name: credentials.name,
              password: credentials.password,
            }),
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(data.message || 'Registration failed');
          }

          return {
            id: data.data.user.id,
            email: data.data.user.email,
            name: data.data.user.name,
            username: data.data.user.username,
            avatar: data.data.user.avatar,
            accessToken: data.data.token,
          };
        } catch (error) {
          console.error('Registration error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Store access token in JWT
      if (user) {
        token.accessToken = user.accessToken;
        token.userId = user.id;
        token.username = user.username;
      }
      
      return token;
    },
    async session({ session, token }) {
      // Send properties to client
      session.accessToken = token.accessToken;
      session.user.id = token.userId as string;
      session.user.username = token.username as string;
      
      return session;
    }
  },
  pages: {
    signIn: '/login',
    signUp: '/signup',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
```

**app/api/auth/[...nextauth]/route.ts:**
```typescript
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth-config';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

**middleware.ts:**
```typescript
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protect dashboard routes
        if (req.nextUrl.pathname.startsWith('/channels') || 
            req.nextUrl.pathname.startsWith('/dms') ||
            req.nextUrl.pathname.startsWith('/huddles')) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/channels/:path*',
    '/dms/:path*', 
    '/huddles/:path*',
    '/api/protected/:path*'
  ]
};
```

**contexts/auth-context.tsx:**
```typescript
'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface AuthContextType {
  user: {
    id: string;
    email: string;
    name: string;
    username: string;
    avatar?: string;
  } | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  const contextValue: AuthContextType = {
    user: session?.user ? {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.name!,
      username: session.user.username,
      avatar: session.user.image || undefined,
    } : null,
    accessToken: session?.accessToken || null,
    isAuthenticated: !!session?.user,
    isLoading: status === 'loading',
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

**Updated components/auth/login-form.tsx:**
```typescript
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function LoginForm() {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      setIsLoading(true);
      setError('');

      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
        return;
      }

      router.push('/channels/general');
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  disabled={isLoading}
                  {...field}
                />
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
                <Input
                  type="password"
                  placeholder="Enter your password"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>
    </Form>
  );
}
```

**Testing Steps:**
1. Test login flow with valid credentials
2. Test login with invalid credentials
3. Test registration flow
4. Test protected route access
5. Test session persistence across page refreshes
6. Test logout functionality
7. Verify JWT token is correctly passed to backend

**Acceptance Criteria:**
- [ ] Login/registration integrates with backend API
- [ ] JWT tokens are stored and managed correctly
- [ ] Protected routes redirect unauthenticated users
- [ ] Session persists across browser refreshes
- [ ] Token is automatically included in API requests
- [ ] Logout clears session properly
- [ ] Error handling works for all auth flows

---

### INT-002: API Client Integration with React Query
**Priority**: Critical  
**Estimated Time**: 4 hours  
**Dependencies**: INT-001

**Description:**
Create a centralized API client with React Query integration for efficient data fetching, caching, and synchronization.

**Tech Stack:**
- Axios for HTTP requests
- React Query for state management
- Automatic JWT token inclusion
- Error handling and retries

**Commands to Run:**
```bash
# In frontend directory
pnpm add axios @tanstack/react-query @tanstack/react-query-devtools
```

**Files to Create:**
1. **lib/api-client.ts** - Axios client configuration
2. **lib/react-query.ts** - React Query configuration
3. **hooks/api/use-channels.ts** - Channel-related queries
4. **hooks/api/use-messages.ts** - Message-related queries
5. **hooks/api/use-users.ts** - User-related queries
6. **components/providers/query-provider.tsx** - Query client provider

**Implementation Details:**

**lib/api-client.ts:**
```typescript
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { getSession } from 'next-auth/react';

// Create axios instance
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const session = await getSession();
    
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Try to refresh the session
      try {
        const session = await getSession();
        if (session?.accessToken) {
          originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Redirect to login if refresh fails
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// API response types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Common API functions
export const api = {
  // GET request
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.get(url, config).then(response => response.data),

  // POST request
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.post(url, data, config).then(response => response.data),

  // PUT request
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.put(url, data, config).then(response => response.data),

  // PATCH request
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.patch(url, data, config).then(response => response.data),

  // DELETE request
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.delete(url, config).then(response => response.data),

  // File upload
  upload: <T>(url: string, formData: FormData, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> =>
    apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(Math.round(progress));
        }
      },
    }).then(response => response.data),
};
```

**lib/react-query.ts:**
```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 408, 429
        if (error.response?.status >= 400 && error.response?.status < 500) {
          if (error.response?.status === 408 || error.response?.status === 429) {
            return failureCount < 3;
          }
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: false,
    },
  },
});

// Query keys for consistent caching
export const queryKeys = {
  // User queries
  user: {
    profile: ['user', 'profile'] as const,
    channels: ['user', 'channels'] as const,
    dms: ['user', 'dms'] as const,
  },
  // Channel queries
  channels: {
    all: ['channels'] as const,
    detail: (id: string) => ['channels', 'detail', id] as const,
    members: (id: string) => ['channels', 'members', id] as const,
    messages: (id: string) => ['channels', 'messages', id] as const,
  },
  // Message queries
  messages: {
    all: ['messages'] as const,
    thread: (id: string) => ['messages', 'thread', id] as const,
    search: (query: string) => ['messages', 'search', query] as const,
  },
  // Direct message queries
  dms: {
    all: ['dms'] as const,
    conversation: (userId: string) => ['dms', 'conversation', userId] as const,
    messages: (conversationId: string) => ['dms', 'messages', conversationId] as const,
  },
  // Huddle queries
  huddles: {
    all: ['huddles'] as const,
    active: ['huddles', 'active'] as const,
    detail: (id: string) => ['huddles', 'detail', id] as const,
  },
} as const;
```

**hooks/api/use-channels.ts:**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/react-query';
import { Channel, ChannelMember } from '@/types';

// Get user's channels
export function useChannels() {
  return useQuery({
    queryKey: queryKeys.user.channels,
    queryFn: () => api.get<Channel[]>('/api/channels/user'),
  });
}

// Get channel details
export function useChannel(channelId: string) {
  return useQuery({
    queryKey: queryKeys.channels.detail(channelId),
    queryFn: () => api.get<Channel>(`/api/channels/${channelId}`),
    enabled: !!channelId,
  });
}

// Get channel members
export function useChannelMembers(channelId: string) {
  return useQuery({
    queryKey: queryKeys.channels.members(channelId),
    queryFn: () => api.get<ChannelMember[]>(`/api/channels/${channelId}/members`),
    enabled: !!channelId,
  });
}

// Create channel mutation
export function useCreateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      type: 'public' | 'private';
    }) => api.post<Channel>('/api/channels', data),
    onSuccess: () => {
      // Invalidate and refetch channels
      queryClient.invalidateQueries({ queryKey: queryKeys.user.channels });
    },
  });
}

// Join channel mutation
export function useJoinChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channelId: string) => api.post(`/api/channels/${channelId}/join`),
    onSuccess: (_, channelId) => {
      // Invalidate channels and channel details
      queryClient.invalidateQueries({ queryKey: queryKeys.user.channels });
      queryClient.invalidateQueries({ queryKey: queryKeys.channels.detail(channelId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.channels.members(channelId) });
    },
  });
}

// Leave channel mutation
export function useLeaveChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channelId: string) => api.post(`/api/channels/${channelId}/leave`),
    onSuccess: (_, channelId) => {
      // Invalidate channels and remove channel data
      queryClient.invalidateQueries({ queryKey: queryKeys.user.channels });
      queryClient.removeQueries({ queryKey: queryKeys.channels.detail(channelId) });
      queryClient.removeQueries({ queryKey: queryKeys.channels.messages(channelId) });
    },
  });
}
```

**hooks/api/use-messages.ts:**
```typescript
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api, PaginatedResponse } from '@/lib/api-client';
import { queryKeys } from '@/lib/react-query';
import { Message } from '@/types';

// Get channel messages with infinite scroll
export function useChannelMessages(channelId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.channels.messages(channelId),
    queryFn: ({ pageParam = null }) =>
      api.get<PaginatedResponse<Message>>(`/api/channels/${channelId}/messages`, {
        params: {
          cursor: pageParam,
          limit: 50,
        },
      }),
    getNextPageParam: (lastPage) => {
      return lastPage.data.hasMore ? lastPage.data.items[lastPage.data.items.length - 1].id : undefined;
    },
    enabled: !!channelId,
  });
}

// Send message mutation
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      content: string;
      channelId?: string;
      dmUserId?: string;
      threadId?: string;
      attachments?: string[];
    }) => api.post<Message>('/api/messages', data),
    onSuccess: (response, variables) => {
      // Optimistically add message to cache
      if (variables.channelId) {
        queryClient.setQueryData(
          queryKeys.channels.messages(variables.channelId),
          (old: any) => {
            if (!old) return old;
            
            const newPages = [...old.pages];
            if (newPages[0]) {
              newPages[0].data.items = [response.data, ...newPages[0].data.items];
            }
            
            return { ...old, pages: newPages };
          }
        );
      }
    },
  });
}

// Add reaction mutation
export function useAddReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      messageId: string;
      emoji: string;
    }) => api.post(`/api/messages/${data.messageId}/reactions`, { emoji: data.emoji }),
    onMutate: async ({ messageId, emoji }) => {
      // Optimistic update - add reaction immediately
      // Implementation would update the message in cache
    },
  });
}

// Delete message mutation
export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => api.delete(`/api/messages/${messageId}`),
    onSuccess: (_, messageId) => {
      // Remove message from all relevant caches
      queryClient.setQueriesData(
        { predicate: (query) => query.queryKey[0] === 'channels' && query.queryKey[1] === 'messages' },
        (old: any) => {
          if (!old) return old;
          
          const newPages = old.pages?.map((page: any) => ({
            ...page,
            data: {
              ...page.data,
              items: page.data.items.filter((msg: Message) => msg.id !== messageId)
            }
          }));
          
          return { ...old, pages: newPages };
        }
      );
    },
  });
}

// Search messages
export function useSearchMessages(query: string) {
  return useQuery({
    queryKey: queryKeys.messages.search(query),
    queryFn: () => api.get<Message[]>('/api/search/messages', {
      params: { q: query }
    }),
    enabled: query.length > 2,
    staleTime: 30 * 1000, // 30 seconds
  });
}
```

**components/providers/query-provider.tsx:**
```typescript
'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/react-query';

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
```

**Updated app/layout.tsx:**
```typescript
import { Inter } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import { QueryProvider } from '@/components/providers/query-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { SocketProvider } from '@/contexts/socket-context';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <QueryProvider>
            <AuthProvider>
              <SocketProvider>
                {children}
              </SocketProvider>
            </AuthProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
```

**Testing Steps:**
1. Test API client with authentication
2. Test React Query caching and invalidation
3. Test optimistic updates for messages
4. Test error handling and retries
5. Test infinite scroll for messages
6. Test mutation success/error states
7. Verify dev tools work in development

**Acceptance Criteria:**
- [ ] API client automatically includes JWT tokens
- [ ] React Query caches responses appropriately  
- [ ] Optimistic updates provide smooth UX
- [ ] Error handling works for all scenarios
- [ ] Infinite scroll loads messages efficiently
- [ ] Mutations invalidate relevant cache keys
- [ ] Development tools aid debugging

---

## Phase 2: Real-time Integration

### INT-003: Socket.io Frontend-Backend Integration
**Priority**: Critical  
**Estimated Time**: 5 hours  
**Dependencies**: INT-002, BE-005

**Description:**
Complete the Socket.io integration between frontend and backend for real-time messaging, typing indicators, and presence.

**Tech Stack:**
- Socket.io client-server communication
- Real-time message synchronization
- Typing indicators
- User presence tracking

**Files to Create:**
1. **hooks/use-socket-integration.ts** - Socket integration hook
2. **hooks/use-real-time-messages.ts** - Real-time message updates
3. **hooks/use-presence.ts** - User presence management  
4. **components/chat/real-time-message-list.tsx** - Real-time message display
5. **utils/socket-events.ts** - Socket event constants

**Implementation Details:**

**utils/socket-events.ts:**
```typescript
// Socket event constants for type safety
export const SOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  
  // Channel events
  JOIN_CHANNEL: 'join-channel',
  LEAVE_CHANNEL: 'leave-channel',
  
  // Message events
  SEND_MESSAGE: 'send-message',
  NEW_MESSAGE: 'new-message',
  MESSAGE_EDITED: 'message-edited',
  MESSAGE_DELETED: 'message-deleted',
  
  // Reaction events
  ADD_REACTION: 'add-reaction',
  REMOVE_REACTION: 'remove-reaction',
  REACTION_ADDED: 'reaction-added',
  REACTION_REMOVED: 'reaction-removed',
  
  // Typing events
  TYPING_START: 'typing-start',
  TYPING_STOP: 'typing-stop',
  USER_TYPING_START: 'user-typing-start',
  USER_TYPING_STOP: 'user-typing-stop',
  
  // Presence events
  USER_ONLINE: 'user-online',
  USER_OFFLINE: 'user-offline',
  USER_STATUS_CHANGED: 'user-status-changed',
  
  // Huddle events
  JOIN_HUDDLE: 'join-huddle',
  LEAVE_HUDDLE: 'leave-huddle',
  HUDDLE_STARTED: 'huddle-started',
  HUDDLE_ENDED: 'huddle-ended',
  PARTICIPANT_JOINED: 'participant-joined',
  PARTICIPANT_LEFT: 'participant-left',
  
  // WebRTC events
  WEBRTC_OFFER: 'webrtc-offer',
  WEBRTC_ANSWER: 'webrtc-answer',
  WEBRTC_ICE_CANDIDATE: 'webrtc-ice-candidate',
} as const;

export type SocketEvent = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
```

**hooks/use-real-time-messages.ts:**
```typescript
import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/contexts/socket-context';
import { queryKeys } from '@/lib/react-query';
import { SOCKET_EVENTS } from '@/utils/socket-events';
import { Message, Reaction } from '@/types';

export function useRealTimeMessages(channelId?: string) {
  const { socket, connected } = useSocket();
  const queryClient = useQueryClient();

  // Handle new messages
  const handleNewMessage = useCallback((message: Message) => {
    // Add message to appropriate cache
    if (message.channelId) {
      queryClient.setQueryData(
        queryKeys.channels.messages(message.channelId),
        (old: any) => {
          if (!old) return old;
          
          const newPages = [...old.pages];
          if (newPages[0]) {
            // Check if message already exists (prevent duplicates)
            const messageExists = newPages[0].data.items.some(
              (msg: Message) => msg.id === message.id
            );
            
            if (!messageExists) {
              newPages[0].data.items.unshift(message);
            }
          }
          
          return { ...old, pages: newPages };
        }
      );
    }
  }, [queryClient]);

  // Handle message edits
  const handleMessageEdited = useCallback((updatedMessage: Message) => {
    queryClient.setQueriesData(
      { predicate: (query) => query.queryKey[0] === 'channels' && query.queryKey[1] === 'messages' },
      (old: any) => {
        if (!old) return old;
        
        const newPages = old.pages?.map((page: any) => ({
          ...page,
          data: {
            ...page.data,
            items: page.data.items.map((msg: Message) => 
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          }
        }));
        
        return { ...old, pages: newPages };
      }
    );
  }, [queryClient]);

  // Handle message deletion
  const handleMessageDeleted = useCallback((messageId: string) => {
    queryClient.setQueriesData(
      { predicate: (query) => query.queryKey[0] === 'channels' && query.queryKey[1] === 'messages' },
      (old: any) => {
        if (!old) return old;
        
        const newPages = old.pages?.map((page: any) => ({
          ...page,
          data: {
            ...page.data,
            items: page.data.items.filter((msg: Message) => msg.id !== messageId)
          }
        }));
        
        return { ...old, pages: newPages };
      }
    );
  }, [queryClient]);

  // Handle reaction updates
  const handleReactionAdded = useCallback((data: {
    messageId: string;
    reaction: Reaction;
  }) => {
    queryClient.setQueriesData(
      { predicate: (query) => query.queryKey[0] === 'channels' && query.queryKey[1] === 'messages' },
      (old: any) => {
        if (!old) return old;
        
        const newPages = old.pages?.map((page: any) => ({
          ...page,
          data: {
            ...page.data,
            items: page.data.items.map((msg: Message) => {
              if (msg.id === data.messageId) {
                return {
                  ...msg,
                  reactions: [...(msg.reactions || []), data.reaction]
                };
              }
              return msg;
            })
          }
        }));
        
        return { ...old, pages: newPages };
      }
    );
  }, [queryClient]);

  useEffect(() => {
    if (!socket || !connected) return;

    // Subscribe to real-time events
    socket.on(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
    socket.on(SOCKET_EVENTS.MESSAGE_EDITED, handleMessageEdited);
    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
    socket.on(SOCKET_EVENTS.REACTION_ADDED, handleReactionAdded);

    return () => {
      socket.off(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
      socket.off(SOCKET_EVENTS.MESSAGE_EDITED, handleMessageEdited);
      socket.off(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
      socket.off(SOCKET_EVENTS.REACTION_ADDED, handleReactionAdded);
    };
  }, [socket, connected, handleNewMessage, handleMessageEdited, handleMessageDeleted, handleReactionAdded]);

  // Join/leave channel rooms
  useEffect(() => {
    if (!socket || !connected || !channelId) return;

    socket.emit(SOCKET_EVENTS.JOIN_CHANNEL, channelId);

    return () => {
      socket.emit(SOCKET_EVENTS.LEAVE_CHANNEL, channelId);
    };
  }, [socket, connected, channelId]);

  return {
    connected,
    joinChannel: (id: string) => socket?.emit(SOCKET_EVENTS.JOIN_CHANNEL, id),
    leaveChannel: (id: string) => socket?.emit(SOCKET_EVENTS.LEAVE_CHANNEL, id),
  };
}
```

**hooks/use-presence.ts:**
```typescript
import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '@/contexts/socket-context';
import { SOCKET_EVENTS } from '@/utils/socket-events';

interface UserPresence {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: Date;
}

export function usePresence() {
  const { socket, connected } = useSocket();
  const [presenceMap, setPresenceMap] = useState<Map<string, UserPresence>>(new Map());

  const handleUserOnline = useCallback((data: UserPresence) => {
    setPresenceMap(prev => new Map(prev.set(data.userId, data)));
  }, []);

  const handleUserOffline = useCallback((data: UserPresence) => {
    setPresenceMap(prev => new Map(prev.set(data.userId, { ...data, status: 'offline' })));
  }, []);

  const handleStatusChanged = useCallback((data: UserPresence) => {
    setPresenceMap(prev => new Map(prev.set(data.userId, data)));
  }, []);

  useEffect(() => {
    if (!socket || !connected) return;

    socket.on(SOCKET_EVENTS.USER_ONLINE, handleUserOnline);
    socket.on(SOCKET_EVENTS.USER_OFFLINE, handleUserOffline);
    socket.on(SOCKET_EVENTS.USER_STATUS_CHANGED, handleStatusChanged);

    return () => {
      socket.off(SOCKET_EVENTS.USER_ONLINE, handleUserOnline);
      socket.off(SOCKET_EVENTS.USER_OFFLINE, handleUserOffline);
      socket.off(SOCKET_EVENTS.USER_STATUS_CHANGED, handleStatusChanged);
    };
  }, [socket, connected, handleUserOnline, handleUserOffline, handleStatusChanged]);

  const getUserPresence = useCallback((userId: string): UserPresence | null => {
    return presenceMap.get(userId) || null;
  }, [presenceMap]);

  const updateStatus = useCallback((status: 'online' | 'away' | 'offline') => {
    if (socket) {
      socket.emit('set-status', { status });
    }
  }, [socket]);

  return {
    presenceMap,
    getUserPresence,
    updateStatus,
    connected,
  };
}
```

**components/chat/real-time-message-list.tsx:**
```typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import { useChannelMessages } from '@/hooks/api/use-messages';
import { useRealTimeMessages } from '@/hooks/use-real-time-messages';
import { useTyping } from '@/hooks/use-typing';
import { Message } from '@/components/chat/message';
import { TypingIndicator } from '@/components/chat/typing-indicator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';

interface RealTimeMessageListProps {
  channelId: string;
}

export function RealTimeMessageList({ channelId }: RealTimeMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // API data
  const {
    data: messagesData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChannelMessages(channelId);

  // Real-time integration
  const { connected } = useRealTimeMessages(channelId);
  const { typingUsers } = useTyping(channelId);

  // Flatten all message pages
  const messages = messagesData?.pages?.flatMap(page => page.data.items) || [];

  // Auto-scroll to bottom for new messages
  const scrollToBottom = (smooth = true) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
      setShowScrollButton(false);
      setIsUserScrolling(false);
    }
  };

  // Handle scroll events
  const handleScroll = () => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    if (isNearBottom) {
      setShowScrollButton(false);
      setIsUserScrolling(false);
    } else {
      setShowScrollButton(true);
      setIsUserScrolling(true);
    }

    // Load more messages when scrolling to top
    if (scrollTop < 100 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Auto-scroll for new messages (only if user isn't scrolling)
  useEffect(() => {
    if (!isUserScrolling && messages.length > 0) {
      scrollToBottom(true);
    }
  }, [messages, isUserScrolling]);

  // Initial scroll to bottom
  useEffect(() => {
    if (messages.length > 0 && !isUserScrolling) {
      scrollToBottom(false);
    }
  }, [channelId, messages.length]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading messages...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-sm text-red-500">Error loading messages</div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative">
      <ScrollArea className="h-full">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto"
          onScroll={handleScroll}
        >
          {/* Loading more messages indicator */}
          {isFetchingNextPage && (
            <div className="p-4 text-center">
              <div className="text-sm text-gray-500">Loading more messages...</div>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-0">
            {messages.map((message, index) => {
              const previousMessage = messages[index - 1];
              const shouldShowCompact = 
                previousMessage &&
                previousMessage.userId === message.userId &&
                new Date(message.createdAt).getTime() - new Date(previousMessage.createdAt).getTime() < 5 * 60 * 1000; // 5 minutes

              return (
                <Message
                  key={message.id}
                  message={message}
                  compact={shouldShowCompact}
                />
              );
            })}
          </div>

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="px-4 py-2">
              <TypingIndicator users={typingUsers} />
            </div>
          )}

          {/* Connection status */}
          {!connected && (
            <div className="p-2 bg-yellow-50 border-l-4 border-yellow-400">
              <div className="text-sm text-yellow-800">
                Connection lost. Trying to reconnect...
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <div className="absolute bottom-4 right-4">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => scrollToBottom()}
            className="rounded-full shadow-lg"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
```

**Testing Steps:**
1. Test real-time message delivery between clients
2. Test typing indicators appear and disappear correctly
3. Test user presence updates in real-time
4. Test message reactions sync across clients
5. Test connection recovery after disconnect
6. Test optimistic updates vs real-time updates
7. Test scroll behavior with real-time messages

**Acceptance Criteria:**
- [ ] Messages appear instantly on all connected clients
- [ ] Typing indicators work across multiple users
- [ ] User presence updates in real-time
- [ ] Message reactions sync immediately
- [ ] Connection status is displayed to users
- [ ] Optimistic updates prevent UI lag
- [ ] Auto-scroll works correctly with new messages

---

### INT-004: WebRTC Huddle Integration
**Priority**: Medium  
**Estimated Time**: 6 hours  
**Dependencies**: INT-003, BE-007

**Description:**
Complete WebRTC integration for voice/video huddles with signaling server coordination and peer connection management.

**Tech Stack:**
- WebRTC peer connections
- Socket.io signaling coordination  
- Media stream management
- Connection state management

**Files to Create:**
1. **hooks/use-huddle-integration.ts** - Complete huddle integration
2. **components/huddle/huddle-manager.tsx** - Huddle management component
3. **utils/webrtc-helpers.ts** - WebRTC utility functions
4. **contexts/huddle-context.tsx** - Huddle state context

**Testing Steps:**
1. Test huddle creation and joining
2. Test audio quality and controls
3. Test screen sharing functionality
4. Test multiple participant scenarios
5. Test connection recovery
6. Test WebRTC signaling flow

**Acceptance Criteria:**
- [ ] Huddles can be created and joined successfully
- [ ] Audio quality is clear with echo cancellation
- [ ] Screen sharing works reliably
- [ ] Multiple participants can connect simultaneously
- [ ] WebRTC signaling coordinates properly with backend
- [ ] Connection state is managed correctly

---

## Phase 3: File and Media Integration

### INT-005: File Upload Integration
**Priority**: Medium  
**Estimated Time**: 4 hours  
**Dependencies**: INT-002, BE-006

**Description:**
Integrate file upload functionality between frontend drag-and-drop interface and backend storage service.

**Tech Stack:**
- React Dropzone for file uploads
- Progress tracking and error handling
- File type validation
- Image preview generation

**Files to Create:**
1. **components/file-upload/upload-zone.tsx** - File upload interface
2. **components/file-upload/upload-progress.tsx** - Upload progress display
3. **hooks/use-file-upload.ts** - File upload logic
4. **utils/file-validation.ts** - File validation utilities

**Testing Steps:**
1. Test drag and drop file upload
2. Test file type validation
3. Test upload progress tracking
4. Test file preview generation
5. Test error handling for failed uploads
6. Test large file uploads

**Acceptance Criteria:**
- [ ] Files can be uploaded via drag and drop
- [ ] Upload progress is displayed accurately
- [ ] File type validation prevents invalid uploads
- [ ] Image previews are generated correctly
- [ ] Upload errors are handled gracefully
- [ ] Large files upload successfully

---

## Phase 4: Search and Discovery

### INT-006: Search Integration
**Priority**: Medium  
**Estimated Time**: 3 hours  
**Dependencies**: INT-002, BE-008

**Description:**
Integrate search functionality across messages, files, and channels with real-time filtering and keyboard shortcuts.

**Tech Stack:**
- Command palette pattern (cmdk)
- Debounced search queries
- Search result highlighting
- Keyboard navigation

**Files to Create:**
1. **components/search/global-search.tsx** - Global search interface
2. **components/search/search-results.tsx** - Search results display
3. **hooks/use-search-integration.ts** - Search functionality
4. **utils/search-highlighting.ts** - Search result highlighting

**Testing Steps:**
1. Test search across all content types
2. Test search result highlighting
3. Test keyboard shortcuts (Cmd+K)
4. Test search performance with large datasets
5. Test search permissions and filtering

**Acceptance Criteria:**
- [ ] Search works across messages, files, and channels
- [ ] Search results are highlighted appropriately
- [ ] Keyboard shortcuts provide quick access
- [ ] Search performance is acceptable
- [ ] Search respects user permissions

---

## Phase 5: End-to-End Testing and Polish

### INT-007: Mobile Responsive Integration
**Priority**: High  
**Estimated Time**: 4 hours  
**Dependencies**: All frontend tickets

**Description:**
Ensure all integrations work seamlessly on mobile devices with touch interactions and responsive design.

**Tech Stack:**
- Mobile-first responsive design
- Touch gesture handling
- Mobile-optimized layouts
- Progressive Web App features

**Files to Create:**
1. **components/mobile/mobile-navigation.tsx** - Mobile navigation
2. **hooks/use-mobile-detection.ts** - Mobile device detection
3. **utils/touch-gestures.ts** - Touch interaction utilities
4. **styles/mobile-optimizations.css** - Mobile-specific styles

**Testing Steps:**
1. Test all features on mobile devices
2. Test touch interactions and gestures
3. Test mobile navigation patterns
4. Test responsive layout breakpoints
5. Test mobile keyboard behavior

**Acceptance Criteria:**
- [ ] All features work on mobile devices
- [ ] Touch interactions are responsive
- [ ] Mobile navigation is intuitive
- [ ] Layouts adapt properly to small screens
- [ ] Mobile keyboard doesn't break functionality

---

### INT-008: Performance Integration Testing
**Priority**: High  
**Estimated Time**: 3 hours  
**Dependencies**: All integration tickets

**Description:**
Comprehensive performance testing of integrated systems with optimization and monitoring.

**Tech Stack:**
- Lighthouse performance auditing
- Bundle analysis and optimization
- Performance monitoring
- Load testing

**Files to Create:**
1. **utils/performance-monitoring.ts** - Performance tracking
2. **tests/performance.test.ts** - Performance test suite
3. **scripts/bundle-analysis.js** - Bundle analyzer script

**Testing Steps:**
1. Run Lighthouse performance audits
2. Test with large message histories
3. Test concurrent user scenarios
4. Test WebRTC performance with multiple participants
5. Test file upload performance
6. Monitor memory usage and CPU utilization

**Acceptance Criteria:**
- [ ] Lighthouse performance score > 90
- [ ] App remains responsive with large datasets
- [ ] WebRTC performance is acceptable with multiple users
- [ ] File uploads don't block other operations
- [ ] Memory usage remains stable over time
- [ ] Bundle size is optimized

---

### INT-009: End-to-End Testing Suite
**Priority**: High  
**Estimated Time**: 5 hours  
**Dependencies**: All integration tickets

**Description:**
Comprehensive end-to-end testing suite covering all user workflows and integration points.

**Tech Stack:**
- Playwright for E2E testing
- Test data management
- Visual regression testing
- CI/CD integration

**Commands to Run:**
```bash
# Install Playwright
pnpm add -D @playwright/test

# Initialize Playwright
npx playwright install

# Run E2E tests
pnpm test:e2e
```

**Files to Create:**
1. **tests/e2e/auth.spec.ts** - Authentication flow tests
2. **tests/e2e/messaging.spec.ts** - Messaging workflow tests
3. **tests/e2e/huddles.spec.ts** - Huddle functionality tests
4. **tests/e2e/file-upload.spec.ts** - File upload tests
5. **playwright.config.ts** - Playwright configuration

**Implementation Details:**

**tests/e2e/messaging.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Messaging Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for redirect to channels
    await expect(page).toHaveURL(/\/channels/);
  });

  test('should send and receive messages in real-time', async ({ page, context }) => {
    // Open second tab to simulate another user
    const secondPage = await context.newPage();
    await secondPage.goto('/channels/general');
    
    // Send message from first user
    await page.fill('[data-testid="message-input"]', 'Hello from user 1!');
    await page.press('[data-testid="message-input"]', 'Enter');
    
    // Verify message appears on both pages
    await expect(page.locator('[data-testid="message"]').last()).toContainText('Hello from user 1!');
    await expect(secondPage.locator('[data-testid="message"]').last()).toContainText('Hello from user 1!');
  });

  test('should show typing indicators', async ({ page, context }) => {
    const secondPage = await context.newPage();
    await secondPage.goto('/channels/general');
    
    // Start typing on first page
    await page.fill('[data-testid="message-input"]', 'I am typing...');
    
    // Check typing indicator appears on second page
    await expect(secondPage.locator('[data-testid="typing-indicator"]')).toBeVisible();
    
    // Stop typing
    await page.fill('[data-testid="message-input"]', '');
    
    // Check typing indicator disappears
    await expect(secondPage.locator('[data-testid="typing-indicator"]')).not.toBeVisible();
  });

  test('should handle message reactions', async ({ page }) => {
    // Send a message first
    await page.fill('[data-testid="message-input"]', 'React to this message!');
    await page.press('[data-testid="message-input"]', 'Enter');
    
    // Wait for message to appear and hover to show actions
    const message = page.locator('[data-testid="message"]').last();
    await message.hover();
    
    // Click reaction button
    await page.click('[data-testid="add-reaction"]');
    
    // Select emoji
    await page.click('[data-testid="emoji-👍"]');
    
    // Verify reaction appears
    await expect(message.locator('[data-testid="reaction-👍"]')).toBeVisible();
  });
});
```

**playwright.config.ts:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: [
    {
      command: 'pnpm dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd backend && pnpm dev',
      url: 'http://localhost:8000',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

**Testing Steps:**
1. Test complete user registration and login flow
2. Test real-time messaging between multiple users
3. Test channel creation, joining, and leaving
4. Test file upload and sharing workflow  
5. Test huddle creation and voice/video functionality
6. Test mobile responsive design
7. Test error handling and recovery scenarios
8. Test performance under load

**Acceptance Criteria:**
- [ ] All critical user workflows pass E2E tests
- [ ] Tests run reliably in CI/CD environment
- [ ] Visual regression tests catch UI changes
- [ ] Mobile tests verify responsive functionality
- [ ] Performance tests validate acceptable load times
- [ ] Error scenarios are properly handled
- [ ] Multi-user real-time scenarios work correctly

---

## Summary

This integrations plan provides **9 detailed tickets** that will connect all frontend and backend components into a fully functional Slack clone. Each ticket includes:

- ✅ **Clear descriptions** and priority levels
- ✅ **Complete tech stack** specifications  
- ✅ **Exact commands** to run for setup
- ✅ **Full code examples** and implementation details
- ✅ **Comprehensive testing steps**
- ✅ **Specific acceptance criteria**

The plan ensures seamless integration between:

- **Authentication**: NextAuth.js with custom backend
- **Real-time Features**: Socket.io client-server coordination
- **Data Management**: React Query with API client
- **WebRTC Communication**: Frontend-backend signaling
- **File Operations**: Upload, storage, and display
- **Search Functionality**: Frontend UI with backend APIs
- **Mobile Responsiveness**: Touch-optimized interactions
- **Performance**: Optimized loading and real-time updates

By completing these integration tickets, the Slack clone will have full end-to-end functionality with production-ready performance and user experience.
