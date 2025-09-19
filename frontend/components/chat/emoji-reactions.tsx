'use client';

import { Button } from '@/components/ui/button';
import { useSocket } from '@/hooks/use-socket';
import { cn } from '@/lib/utils';

interface Reaction {
  id: string;
  emoji: string;
  messageId: string;
  userId: string;
  user: {
    id: string;
    username: string;
    name: string;
  };
}

interface EmojiReactionsProps {
  messageId: string;
  reactions: Reaction[];
  currentUserId?: string;
}

export function EmojiReactions({ messageId, reactions, currentUserId }: EmojiReactionsProps) {
  const { socket } = useSocket();

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, Reaction[]>);

  const handleReactionToggle = (emoji: string) => {
    if (!socket) return;

    const userReacted = reactions.some(
      r => r.emoji === emoji && r.userId === currentUserId
    );

    if (userReacted) {
      socket.emit('remove-reaction', { messageId, emoji });
    } else {
      socket.emit('add-reaction', { messageId, emoji });
    }
  };

  if (Object.keys(groupedReactions).length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {Object.entries(groupedReactions).map(([emoji, emojiReactions]) => {
        const count = emojiReactions.length;
        const userReacted = emojiReactions.some(r => r.userId === currentUserId);
        const userNames = emojiReactions.map(r => r.user.name).join(', ');

        return (
          <Button
            key={emoji}
            variant="outline"
            size="sm"
            className={cn(
              "h-7 px-2 text-xs font-normal border-gray-300 hover:border-blue-500",
              userReacted && "bg-blue-50 border-blue-500 text-blue-700"
            )}
            onClick={() => handleReactionToggle(emoji)}
            title={`${userNames} reacted with ${emoji}`}
          >
            <span className="mr-1">{emoji}</span>
            <span>{count}</span>
          </Button>
        );
      })}
    </div>
  );
}
