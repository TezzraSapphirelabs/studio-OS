
'use client';

import React from 'react';
import type { DriveFile } from '@/types';
import { XIcon, DownloadIcon } from '@/components/icons';
import { formatBytes } from '@/utils';
import Image from 'next/image';

interface FilePreviewModalProps {
  file: DriveFile;
  onClose: () => void;
}

export function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  // Prevent click inside modal from closing it
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const renderPreview = () => {
    if (file.type.startsWith('image/')) {
      return (
        <div className="relative h-full w-full">
          <Image
            src={file.url}
            alt={file.name}
            fill
            className="object-contain rounded-lg shadow-2xl"
            unoptimized
          />
        </div>
      );
    }
    
    if (file.type === 'application/pdf') {
      return (
        <iframe
          src={`${file.url}#toolbar=0`}
          className="h-full w-full rounded-lg bg-white shadow-2xl"
          title={file.name}
        />
      );
    }
    
    if (file.type.startsWith('text/') || file.type.includes('json') || file.type.includes('markdown')) {
      return (
        <iframe
          src={file.url}
          className="h-full w-full rounded-lg bg-white p-4 shadow-2xl"
          title={file.name}
        />
      );
    }

    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white/[0.02] rounded-xl border border-white/[0.04]">
        <div className="w-16 h-16 mb-4 rounded-full bg-white/[0.04] flex items-center justify-center">
          <DownloadIcon size={24} className="text-white/40" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No preview available</h3>
        <p className="text-sm text-white/50 mb-6">
          This file type cannot be previewed in the browser.
        </p>
        <a
          href={file.url}
          download={file.name}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors font-medium"
        >
          Download File
        </a>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm sm:p-6 lg:p-8 transition-all"
      onClick={onClose}
    >
      <div
        className="relative flex h-full w-full max-w-6xl flex-col rounded-2xl bg-[#0a0a0f] shadow-2xl overflow-hidden border border-white/[0.08]"
        onClick={handleContentClick}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] bg-black/40 px-4 py-3 backdrop-blur-md">
          <div className="flex flex-col truncate pr-4">
            <h2 className="truncate text-sm font-medium text-white">{file.name}</h2>
            <p className="text-xs text-white/40">
              {formatBytes(file.size)} • {new Date(file.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={file.url}
              download={file.name}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-white/70 hover:bg-white/[0.1] hover:text-white transition-colors"
              title="Download"
            >
              <DownloadIcon size={16} />
            </a>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-white/70 hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
              title="Close"
            >
              <XIcon size={16} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 items-center justify-center overflow-hidden bg-black/60 p-4">
          {renderPreview()}
        </div>
      </div>
    </div>
  );
}
