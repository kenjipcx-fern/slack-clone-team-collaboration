'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Hash, User, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SearchResult {
  type: 'message' | 'channel' | 'user';
  id: string;
  title: string;
  subtitle?: string;
  content?: string;
  timestamp?: string;
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { token } = useAuth();

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || !token) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/search/global?q=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const searchResults: SearchResult[] = [
          ...data.messages.map((message: any) => ({
            type: 'message' as const,
            id: message.id,
            title: message.user.name,
            subtitle: message.channel?.name || 'Direct Message',
            content: message.content,
            timestamp: message.createdAt,
          })),
          ...data.channels.map((channel: any) => ({
            type: 'channel' as const,
            id: channel.id,
            title: channel.name,
            subtitle: channel.description || 'Channel',
            content: `${channel._count?.members || 0} members`,
          })),
          ...data.users.map((user: any) => ({
            type: 'user' as const,
            id: user.id,
            title: user.name,
            subtitle: `@${user.username}`,
            content: user.email,
          })),
        ];
        setResults(searchResults);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, token]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <FileText className="h-4 w-4" />;
      case 'channel':
        return <Hash className="h-4 w-4" />;
      case 'user':
        return <User className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start text-slate-400">
          <Search className="h-4 w-4 mr-2" />
          Search channels
          <Badge variant="outline" className="ml-auto text-xs">⌘K</Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search Slack Clone</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search messages, channels, and people..."
              className="pl-10"
              autoFocus
            />
          </div>

          {isSearching && (
            <div className="text-center py-4 text-gray-500">
              Searching...
            </div>
          )}

          {!isSearching && results.length === 0 && query && (
            <div className="text-center py-4 text-gray-500">
              No results found for "{query}"
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="flex items-start space-x-3 p-3 rounded-md hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setIsOpen(false);
                    // Handle result selection
                  }}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getResultIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-sm">{result.title}</p>
                      <Badge variant="outline" className="text-xs">
                        {result.type}
                      </Badge>
                    </div>
                    {result.subtitle && (
                      <p className="text-sm text-gray-500">{result.subtitle}</p>
                    )}
                    {result.content && (
                      <p className="text-sm text-gray-700 truncate mt-1">
                        {result.content}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!query && (
            <div className="text-sm text-gray-500 space-y-2">
              <p><strong>Tips:</strong></p>
              <ul className="space-y-1 ml-4">
                <li>• Search across all channels and direct messages</li>
                <li>• Use quotes for exact phrases: "hello world"</li>
                <li>• Press ⌘K (Ctrl+K) to open search quickly</li>
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
