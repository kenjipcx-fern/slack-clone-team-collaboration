'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSocket } from '@/hooks/use-socket';
import { useAuth } from '@/hooks/use-auth';
import { Send, Smile, AtSign } from 'lucide-react';
import { UploadButton } from '@/components/file-upload/upload-button';

interface MessageInputProps {
  channelId: string;
  channelName: string;
}

export function MessageInput({ channelId, channelName }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { socket } = useSocket();
  const { user } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleTyping = useCallback(() => {
    if (!socket || !user) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing-start', { channelId });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        socket.emit('typing-stop', { channelId });
      }
    }, 2000);
  }, [socket, user, channelId, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const sendMessage = () => {
    if (!socket || !message.trim()) return;

    // Clear typing indicator
    if (isTyping) {
      setIsTyping(false);
      socket.emit('typing-stop', { channelId });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }

    // Send message
    socket.emit('send-message', {
      content: message.trim(),
      channelId,
    });

    // Clear input
    setMessage('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    handleTyping();

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative border border-gray-300 rounded-lg focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={`Message #${channelName}`}
            className="min-h-[44px] max-h-[120px] resize-none border-0 focus:ring-0 focus:border-0 focus-visible:ring-0 focus-visible:ring-offset-0 pr-12"
            rows={1}
          />
          
          {/* Send Button */}
          <div className="absolute right-2 bottom-2">
            <Button
              type="submit"
              size="sm"
              disabled={!message.trim()}
              className="h-8 w-8 p-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            <UploadButton channelId={channelId} />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Smile className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <AtSign className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-xs text-gray-500">
            <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for new line
          </div>
        </div>
      </form>
    </div>
  );
}
