'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { ChatArea } from './chat-area';
import { UserPanel } from './user-panel';
import { useChannels } from '@/hooks/use-channels';

export function SlackLayout() {
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const { data: channels } = useChannels();

  // Auto-select first channel when channels load
  useEffect(() => {
    if (channels && channels.length > 0 && !selectedChannelId) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, selectedChannelId]);

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 flex flex-col">
        <UserPanel />
        <Sidebar
          selectedChannelId={selectedChannelId}
          onSelectChannel={setSelectedChannelId}
        />
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatArea channelId={selectedChannelId} />
      </div>
    </div>
  );
}
