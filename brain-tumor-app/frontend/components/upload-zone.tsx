'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';

interface UploadZoneProps {
  onImageSelected: (file: File, preview: string) => void;
  isLoading?: boolean;
}

export function UploadZone({ onImageSelected, isLoading = false }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      onImageSelected(file, preview);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isLoading && fileInputRef.current?.click()}
      className={`
        relative flex flex-col items-center justify-center gap-4 px-6 py-12
        rounded-xl border-2 border-dashed cursor-pointer transition-all
        ${isDragging ? 'border-cyan-accent bg-cyan-accent/5' : 'border-slate-700 hover:border-cyan-accent/50'}
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={isLoading}
        className="hidden"
      />

      <div className="flex items-center justify-center">
        <Upload className="w-8 h-8 text-cyan-accent" />
      </div>

      <div className="text-center">
        <p className="text-sm font-medium text-gray-300">
          Drag and drop your X-ray image
        </p>
        <p className="text-xs text-gray-500 mt-1">
          or click to browse
        </p>
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded-xl">
          <div className="animate-spin">
            <div className="w-5 h-5 border-2 border-cyan-accent border-t-transparent rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
}
