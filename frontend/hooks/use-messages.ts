import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useSocket } from '@/hooks/use-socket';
import { useEffect } from 'react';

export interface Message {
  id: string;
  content: string;
  type: string;
  channelId?: string;
  dmId?: string;
  userId: string;
  threadId?: string;
  edited: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    name: string;
    avatar?: string;
  };
  reactions: Array<{
    id: string;
    emoji: string;
    messageId: string;
    userId: string;
    user: {
      id: string;
      username: string;
      name: string;
    };
  }>;
  attachments: Array<{
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
  }>;
}

export function useMessages(channelId: string) {
  const { token } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['messages', channelId],
    queryFn: async (): Promise<Message[]> => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/messages/channels/${channelId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      return data.messages || [];
    },
    enabled: !!token && !!channelId,
  });

  // Set up real-time message listeners
  useEffect(() => {
    if (!socket || !channelId) return;

    // Join the channel room
    socket.emit('join-channel', channelId);

    // Listen for new messages
    const handleNewMessage = (message: Message) => {
      queryClient.setQueryData(['messages', channelId], (oldMessages: Message[] | undefined) => {
        if (!oldMessages) return [message];
        // Avoid duplicates
        if (oldMessages.some(m => m.id === message.id)) return oldMessages;
        return [...oldMessages, message];
      });
    };

    // Listen for message updates
    const handleMessageUpdated = (message: Message) => {
      queryClient.setQueryData(['messages', channelId], (oldMessages: Message[] | undefined) => {
        if (!oldMessages) return [];
        return oldMessages.map(m => m.id === message.id ? message : m);
      });
    };

    // Listen for message deletions
    const handleMessageDeleted = ({ messageId }: { messageId: string }) => {
      queryClient.setQueryData(['messages', channelId], (oldMessages: Message[] | undefined) => {
        if (!oldMessages) return [];
        return oldMessages.filter(m => m.id !== messageId);
      });
    };

    // Listen for reaction additions/removals
    const handleReactionAdded = ({ messageId, reaction }: { messageId: string; reaction: any }) => {
      queryClient.setQueryData(['messages', channelId], (oldMessages: Message[] | undefined) => {
        if (!oldMessages) return [];
        return oldMessages.map(m => 
          m.id === messageId 
            ? { ...m, reactions: [...m.reactions, reaction] }
            : m
        );
      });
    };

    const handleReactionRemoved = ({ messageId, userId, emoji }: { messageId: string; userId: string; emoji: string }) => {
      queryClient.setQueryData(['messages', channelId], (oldMessages: Message[] | undefined) => {
        if (!oldMessages) return [];
        return oldMessages.map(m => 
          m.id === messageId 
            ? { ...m, reactions: m.reactions.filter(r => !(r.userId === userId && r.emoji === emoji)) }
            : m
        );
      });
    };

    socket.on('new-message', handleNewMessage);
    socket.on('message-updated', handleMessageUpdated);
    socket.on('message-deleted', handleMessageDeleted);
    socket.on('reaction-added', handleReactionAdded);
    socket.on('reaction-removed', handleReactionRemoved);

    return () => {
      socket.emit('leave-channel', channelId);
      socket.off('new-message', handleNewMessage);
      socket.off('message-updated', handleMessageUpdated);
      socket.off('message-deleted', handleMessageDeleted);
      socket.off('reaction-added', handleReactionAdded);
      socket.off('reaction-removed', handleReactionRemoved);
    };
  }, [socket, channelId, queryClient]);

  return query;
}
