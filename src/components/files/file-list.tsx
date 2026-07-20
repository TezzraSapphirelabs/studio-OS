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
import { formatBytes, formatRelativeDate } from '@/utils';

interface FileListProps {
  folders: DriveFolder[];
  files: DriveFile[];
  onFolderClick: (folder: DriveFolder) => void;
  onFileClick: (file: DriveFile) => void;
  onContextMenu: (e: React.MouseEvent, item: DriveFolder | DriveFile, type: 'folder' | 'file') => void;
}

export function FileList({
  folders,
  files,
  onFolderClick,
  onFileClick,
  onContextMenu,
}: FileListProps) {
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon size={20} className="text-violet-400" />;
    if (type === 'application/pdf') return <PdfIcon size={20} className="text-rose-400" />;
    if (type.startsWith('text/') || type.includes('markdown')) return <FileTextIcon size={20} className="text-blue-400" />;
    return <FilesIcon size={20} className="text-white/40" />;
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/[0.04] bg-white/[0.02]">
      <table className="w-full text-left text-sm text-white/70">
        <thead className="border-b border-white/[0.04] bg-white/[0.02] text-xs uppercase text-white/50">
          <tr>
            <th className="px-6 py-4 font-medium">Name</th>
            <th className="px-6 py-4 font-medium hidden md:table-cell">Last Modified</th>
            <th className="px-6 py-4 font-medium hidden sm:table-cell">Size</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {folders.map((folder) => (
            <tr
              key={folder.id}
              className="group cursor-pointer transition-colors hover:bg-white/[0.04]"
              onClick={() => onFolderClick(folder)}
              onContextMenu={(e) => onContextMenu(e, folder, 'folder')}
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <FolderIcon size={20} className="text-violet-500" />
                  <span className="font-medium text-white/90">{folder.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 hidden md:table-cell">
                {formatRelativeDate(folder.updatedAt)}
              </td>
              <td className="px-6 py-4 hidden sm:table-cell">—</td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onContextMenu(e, folder, 'folder');
                  }}
                  className="p-1.5 opacity-0 text-white/40 hover:text-white transition-opacity group-hover:opacity-100"
                >
                  <MoreVerticalIcon size={16} />
                </button>
              </td>
            </tr>
          ))}

          {files.map((file) => (
            <tr
              key={file.id}
              className="group cursor-pointer transition-colors hover:bg-white/[0.04]"
              onClick={() => onFileClick(file)}
              onContextMenu={(e) => onContextMenu(e, file, 'file')}
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  {getFileIcon(file.type)}
                  <span className="font-medium text-white/90 truncate max-w-[200px] sm:max-w-[300px] lg:max-w-md" title={file.name}>
                    {file.name}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 hidden md:table-cell">
                {formatRelativeDate(file.updatedAt)}
              </td>
              <td className="px-6 py-4 hidden sm:table-cell text-white/50">
                {formatBytes(file.size)}
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onContextMenu(e, file, 'file');
                  }}
                  className="p-1.5 opacity-0 text-white/40 hover:text-white transition-opacity group-hover:opacity-100"
                >
                  <MoreVerticalIcon size={16} />
                </button>
              </td>
            </tr>
          ))}
          
          {folders.length === 0 && files.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center text-white/40">
                This folder is empty.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
