import React, { useState, useRef } from 'react';
import { Loader, Image as ImageIcon, Film } from 'lucide-react';
import { uploadMedia } from '../utils/mediaUtils';
import { useToast } from './ToastContext';

interface MediaUploaderProps {
  onUpload?: (url: string) => void;
  onUploadBatch?: (urls: string[]) => void;
  folderPath: string;
  label: string;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({ onUpload, onUploadBatch, folderPath, label }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    const target = e.target;
    setIsUploading(true);
    setUploadCount(files.length);

    try {
      const uploadPromises = files.map(async (file, index) => {
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${folderPath}/${Date.now()}_${index}_${sanitizedName}`;
        return await uploadMedia(file, path);
      });

      const urls = await Promise.all(uploadPromises);

      if (onUploadBatch) {
        onUploadBatch(urls);
      } else if (onUpload) {
        urls.forEach(url => onUpload(url));
      }

      const isVideoLabel = label.toLowerCase().includes('video');
      addToast(
        'Media Added',
        'success',
        `Successfully attached ${files.length} ${files.length === 1 ? (isVideoLabel ? 'video' : 'image') : (isVideoLabel ? 'videos' : 'images')} to room.`,
        3500
      );
    } catch (error: any) {
      console.error("Batch upload error:", error);
      addToast('Upload Error', 'error', error?.message || 'Failed to process media files. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadCount(0);
      target.value = '';
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const isVideoLabel = label.toLowerCase().includes('video');

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
        {isVideoLabel ? <Film className="w-3.5 h-3.5 text-blue-400" /> : <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />}
        {label}
      </label>
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={isVideoLabel ? "video/*" : "image/*"}
          onChange={handleFileChange}
          disabled={isUploading}
          className="block w-full text-xs text-zinc-400 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600/10 file:text-blue-400 hover:file:bg-blue-600/20 file:cursor-pointer disabled:opacity-50"
        />
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/90 rounded-xl backdrop-blur-xs border border-blue-500/30">
            <div className="flex items-center gap-2 text-xs font-medium text-blue-400">
              <Loader className="w-4 h-4 animate-spin text-blue-500" />
              <span>Processing {uploadCount} {uploadCount === 1 ? 'file' : 'files'}...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
