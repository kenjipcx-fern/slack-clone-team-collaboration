'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useSocket } from '@/hooks/use-socket';
import { Paperclip, Upload, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface UploadButtonProps {
  channelId: string;
}

export function UploadButton({ channelId }: UploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { token } = useAuth();
  const { socket } = useSocket();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !token) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });
      formData.append('channelId', channelId);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      toast({
        title: "Files uploaded!",
        description: `${files.length} file(s) shared successfully.`,
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={handleFileSelect}
        disabled={isUploading}
      >
        {isUploading ? (
          <Upload className="h-4 w-4 animate-pulse" />
        ) : (
          <Paperclip className="h-4 w-4" />
        )}
      </Button>
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt,.zip"
        onChange={handleFileUpload}
        className="hidden"
      />

      {isUploading && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md p-2 shadow-md z-10 min-w-[200px]">
          <div className="flex items-center space-x-2">
            <Upload className="h-4 w-4 text-blue-500" />
            <span className="text-sm">Uploading files...</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
            <div 
              className="bg-blue-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
