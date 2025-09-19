'use client';

import { useEffect, useRef } from 'react';
import { Message } from '@/hooks/use-messages';
import { MessageItem } from './message-item';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  channelId: string;
}

export function MessageList({ messages, isLoading, channelId }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-4xl">💬</div>
          <h3 className="text-lg font-medium text-gray-900">No messages yet</h3>
          <p className="text-gray-500">Be the first to send a message in this channel!</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      <div className="p-4 space-y-4">
        {messages.map((message, index) => {
          const previousMessage = index > 0 ? messages[index - 1] : null;
          const showAvatar = !previousMessage || 
            previousMessage.userId !== message.userId || 
            new Date(message.createdAt).getTime() - new Date(previousMessage.createdAt).getTime() > 300000; // 5 minutes

          return (
            <MessageItem
              key={message.id}
              message={message}
              showAvatar={showAvatar}
              channelId={channelId}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
