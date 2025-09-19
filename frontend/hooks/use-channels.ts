import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';

interface Channel {
  id: string;
  name: string;
  description?: string;
  type: string;
  createdAt: string;
  members: Array<{
    id: string;
    user: {
      id: string;
      username: string;
      name: string;
      avatar?: string;
    };
    role: string;
  }>;
  _count: {
    messages: number;
    members: number;
  };
}

export function useChannels() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['channels'],
    queryFn: async (): Promise<Channel[]> => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/channels`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch channels');
      }

      const data = await response.json();
      return data.data?.channels || data.channels || [];
    },
    enabled: !!token,
  });
}

export function useChannel(channelId: string) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['channels', channelId],
    queryFn: async (): Promise<Channel> => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/channels/${channelId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch channel');
      }

      const data = await response.json();
      return data.data?.channel || data.channel || data;
    },
    enabled: !!token && !!channelId,
  });
}
