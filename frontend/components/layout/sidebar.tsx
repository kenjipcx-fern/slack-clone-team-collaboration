'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useChannels } from '@/hooks/use-channels';
import { Hash, Lock, Plus, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlobalSearch } from '@/components/search/global-search';

interface SidebarProps {
  selectedChannelId: string | null;
  onSelectChannel: (channelId: string) => void;
}

export function Sidebar({ selectedChannelId, onSelectChannel }: SidebarProps) {
  const { data: channels, isLoading } = useChannels();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredChannels = channels?.filter(channel =>
    channel.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const publicChannels = filteredChannels.filter(channel => channel.type === 'public' || channel.type === 'PUBLIC');
  const privateChannels = filteredChannels.filter(channel => channel.type === 'private' || channel.type === 'PRIVATE');

  return (
    <div className="flex-1 flex flex-col">
      {/* Search */}
      <div className="p-3">
        <GlobalSearch />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Public Channels */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center">
                <Hash className="h-4 w-4 mr-1" />
                Channels
              </h3>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-8 bg-slate-700 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                publicChannels.map((channel) => (
                  <Button
                    key={channel.id}
                    variant="ghost"
                    onClick={() => onSelectChannel(channel.id)}
                    className={cn(
                      "w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700",
                      selectedChannelId === channel.id && "bg-blue-600 text-white hover:bg-blue-600"
                    )}
                  >
                    <Hash className="h-4 w-4 mr-2" />
                    <span className="truncate">{channel.name}</span>
                    {(channel._count?.messages || 0) > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-auto bg-slate-600 text-slate-200 text-xs"
                      >
                        {channel._count?.messages || 0}
                      </Badge>
                    )}
                  </Button>
                ))
              )}
            </div>
          </div>

          {/* Private Channels */}
          {privateChannels.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center">
                  <Lock className="h-4 w-4 mr-1" />
                  Private
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                {privateChannels.map((channel) => (
                  <Button
                    key={channel.id}
                    variant="ghost"
                    onClick={() => onSelectChannel(channel.id)}
                    className={cn(
                      "w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700",
                      selectedChannelId === channel.id && "bg-blue-600 text-white hover:bg-blue-600"
                    )}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    <span className="truncate">{channel.name}</span>
                    {(channel._count?.messages || 0) > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-auto bg-slate-600 text-slate-200 text-xs"
                      >
                        {channel._count?.messages || 0}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Direct Messages */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Direct Messages
              </h3>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-500 px-2 py-1">
                Direct messages coming soon...
              </p>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
