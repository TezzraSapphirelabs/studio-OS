/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import type { DriveFile, DriveFolder } from '@/types';
import {
  FolderIcon,
  ImageIcon,
  PdfIcon,
  FileTextIcon,
  FilesIcon,
  MoreVerticalIcon,
} from '@/components/icons';
import { formatBytes } from '@/utils';

interface FileGridProps {
  folders: DriveFolder[];
  files: DriveFile[];
  onFolderClick: (folder: DriveFolder) => void;
  onFileClick: (file: DriveFile) => void;
  onContextMenu: (e: React.MouseEvent, item: DriveFolder | DriveFile, type: 'folder' | 'file') => void;
}

export function FileGrid({
  folders,
  files,
  onFolderClick,
  onFileClick,
  onContextMenu,
}: FileGridProps) {
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon size={32} className="text-violet-400" />;
    if (type === 'application/pdf') return <PdfIcon size={32} className="text-rose-400" />;
    if (type.startsWith('text/') || type.includes('markdown')) return <FileTextIcon size={32} className="text-blue-400" />;
    return <FilesIcon size={32} className="text-white/40" />;
  };

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {folders.map((folder) => (
        <div
          key={folder.id}
          className="group relative flex cursor-pointer flex-col items-center rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 text-center transition-all hover:bg-white/[0.06] hover:border-white/[0.1]"
          onClick={() => onFolderClick(folder)}
          onContextMenu={(e) => onContextMenu(e, folder, 'folder')}
        >
          <FolderIcon size={48} className="mb-3 text-violet-500" />
          <h3 className="w-full truncate text-sm font-medium text-white/90">
            {folder.name}
          </h3>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onContextMenu(e, folder, 'folder');
            }}
            className="absolute right-2 top-2 p-1.5 opacity-0 text-white/40 hover:text-white transition-opacity group-hover:opacity-100"
          >
            <MoreVerticalIcon size={16} />
          </button>
        </div>
      ))}

      {files.map((file) => (
        <div
          key={file.id}
          className="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 text-center transition-all hover:bg-white/[0.06] hover:border-white/[0.1]"
          onClick={() => onFileClick(file)}
          onContextMenu={(e) => onContextMenu(e, file, 'file')}
        >
          {file.type.startsWith('image/') ? (
            <div className="mb-3 h-16 w-full overflow-hidden rounded-lg">
              <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="mb-3 flex h-16 items-center justify-center">
              {getFileIcon(file.type)}
            </div>
          )}
          
          <h3 className="w-full truncate text-sm font-medium text-white/90" title={file.name}>
            {file.name}
          </h3>
          <p className="mt-1 text-xs text-white/40">{formatBytes(file.size)}</p>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onContextMenu(e, file, 'file');
            }}
            className="absolute right-2 top-2 p-1.5 opacity-0 text-white/40 hover:text-white transition-opacity group-hover:opacity-100 bg-black/40 rounded-lg backdrop-blur-md"
          >
            <MoreVerticalIcon size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
