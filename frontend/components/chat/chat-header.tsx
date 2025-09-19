'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Hash, Lock, Users, Phone, Video, Settings, Star, Info } from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  description?: string;
  type: string;
  members: Array<{
    user: {
      id: string;
      username: string;
      name: string;
      avatar?: string;
    };
  }>;
  _count: {
    messages: number;
    members: number;
  };
}

interface ChatHeaderProps {
  channel: Channel;
}

export function ChatHeader({ channel }: ChatHeaderProps) {
  const isPrivate = channel.type === 'private' || channel.type === 'PRIVATE';

  return (
    <div className="border-b bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {isPrivate ? (
              <Lock className="h-5 w-5 text-gray-500" />
            ) : (
              <Hash className="h-5 w-5 text-gray-500" />
            )}
            <h1 className="text-lg font-semibold text-gray-900">
              {channel.name}
            </h1>
            {isPrivate && (
              <Badge variant="secondary" className="text-xs">
                Private
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            <span>{channel._count?.members || channel.members?.length || 0}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Star className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Info className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {channel.description && (
        <div className="mt-2">
          <p className="text-sm text-gray-600">{channel.description}</p>
        </div>
      )}
    </div>
  );
}
