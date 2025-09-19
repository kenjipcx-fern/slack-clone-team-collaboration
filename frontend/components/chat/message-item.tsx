'use client';

import { useState } from 'react';
import { Message } from '@/hooks/use-messages';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, Reply, MessageSquare, Smile } from 'lucide-react';
import { EmojiReactions } from './emoji-reactions';

interface MessageItemProps {
  message: Message;
  showAvatar: boolean;
  channelId: string;
}

export function MessageItem({ message, showAvatar, channelId }: MessageItemProps) {
  const { user: currentUser } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  const initials = message.user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const isOwnMessage = currentUser?.id === message.userId;
  const timeAgo = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true });

  return (
    <div
      className={`group flex space-x-3 hover:bg-gray-50 px-3 py-1 rounded ${
        showAvatar ? 'mt-2' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {showAvatar ? (
          <Avatar className="h-9 w-9">
            <AvatarImage src={message.user.avatar} alt={message.user.name} />
            <AvatarFallback className="text-xs bg-blue-600 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-9 w-9 flex items-center justify-center">
            {isHovered && (
              <span className="text-xs text-gray-400">
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        {showAvatar && (
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-semibold text-gray-900">
              {message.user.name}
            </span>
            <span className="text-xs text-gray-500">
              @{message.user.username}
            </span>
            <span className="text-xs text-gray-500">
              {timeAgo}
            </span>
            {message.edited && (
              <Badge variant="outline" className="text-xs">
                edited
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-gray-900 whitespace-pre-wrap break-words">
              {message.content}
            </p>

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="border rounded-lg p-3 bg-gray-50 max-w-md"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="text-2xl">📎</div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{attachment.originalName}</p>
                        <p className="text-xs text-gray-500">
                          {(attachment.size / 1024).toFixed(1)} KB • {attachment.mimeType}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reactions */}
            {message.reactions && message.reactions.length > 0 && (
              <div className="mt-2">
                <EmojiReactions
                  messageId={message.id}
                  reactions={message.reactions}
                  currentUserId={currentUser?.id}
                />
              </div>
            )}
          </div>

          {/* Message Actions */}
          {isHovered && (
            <div className="flex items-center space-x-1 ml-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Smile className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Reply className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
