'use client';

import { useAuth } from '@/hooks/use-auth';
import { useSocket } from '@/hooks/use-socket';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings, LogOut, User } from 'lucide-react';

export function UserPanel() {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();

  if (!user) return null;

  const initials = (user.name || user.username || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="p-4 border-b border-slate-700">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start h-auto p-2 text-white hover:bg-slate-700"
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-xs bg-blue-600 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {isConnected && (
                  <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-slate-800 rounded-full" />
                )}
              </div>
              <div className="flex flex-col items-start">
                <p className="font-semibold text-sm">{user.name || user.username}</p>
                <div className="flex items-center space-x-1">
                  <div className={`h-2 w-2 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-gray-500'
                  }`} />
                  <p className="text-xs text-slate-300">
                    {isConnected ? 'Active' : 'Offline'}
                  </p>
                </div>
              </div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{user.name || user.username}</p>
            <p className="text-xs text-gray-500">@{user.username}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <div className="mt-2 text-xs text-slate-400">
        <div className="flex items-center justify-between">
          <span>Slack Clone Team</span>
          {isConnected ? (
            <Badge variant="outline" className="text-green-500 border-green-500">
              Online
            </Badge>
          ) : (
            <Badge variant="outline" className="text-gray-500 border-gray-500">
              Offline
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
