'use client';

import { useChannel } from '@/hooks/use-channels';
import { useMessages } from '@/hooks/use-messages';
import { ChatHeader } from '@/components/chat/chat-header';
import { MessageList } from '@/components/chat/message-list';
import { MessageInput } from '@/components/chat/message-input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatAreaProps {
  channelId: string | null;
}

export function ChatArea({ channelId }: ChatAreaProps) {
  const { data: channel, isLoading: channelLoading } = useChannel(channelId || '');
  const { data: messages, isLoading: messagesLoading } = useMessages(channelId || '');

  if (!channelId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Welcome to Slack Clone
          </h2>
          <p className="text-gray-600">
            Select a channel from the sidebar to start chatting
          </p>
        </div>
      </div>
    );
  }

  if (channelLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Channel not found
          </h2>
          <p className="text-gray-600">
            The selected channel could not be loaded
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Chat Header */}
      <ChatHeader channel={channel} />
      
      {/* Messages Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1">
          <MessageList
            messages={messages || []}
            isLoading={messagesLoading}
            channelId={channelId}
          />
        </ScrollArea>
        
        {/* Message Input */}
        <div className="border-t bg-white p-4">
          <MessageInput channelId={channelId} channelName={channel.name} />
        </div>
      </div>
    </div>
  );
}
