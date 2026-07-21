'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { subscribeToProjects } from '@/services/projects';
import {
  subscribeToFolders,
  subscribeToFiles,
  createFolder,
  uploadFile,
  deleteFolder,
  deleteFile,
  updateFile,
  updateFolder,
} from '@/services/files';
import type { Project, DriveFile, DriveFolder } from '@/types';
import {
  FilesIcon,
  SearchIcon,
  GridIcon,
  FolderPlusIcon,
  UploadIcon,
} from '@/components/icons';
import { FileGrid } from '@/components/files/file-grid';
import { FileList } from '@/components/files/file-list';
import { FilePreviewModal } from '@/components/files/file-preview-modal';

type ViewMode = 'grid' | 'list';

export default function FilesPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [files, setFiles] = useState<DriveFile[]>([]);
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{ name: string; progress: number }[]>([]);
  
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);

  // Fetch Projects
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToProjects(
      user.uid,
      (data) => {
        setProjects(data);
        setSelectedProjectId(prev => {
          if (!prev && data.length > 0) return data[0].id;
          if (prev && !data.find(p => p.id === prev) && data.length > 0) return data[0].id;
          return prev;
        });
      },
      (err) => toast(err, 'error')
    );
    return () => unsub();
  }, [user?.uid, toast]);

  // Fetch Folders & Files for selected project
  useEffect(() => {
    if (!user?.uid || !selectedProjectId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFolders([]);
      setFiles([]);
      return;
    }
    
    const unsubFolders = subscribeToFolders(selectedProjectId, setFolders);
    const unsubFiles = subscribeToFiles(selectedProjectId, setFiles);
    
    return () => {
      unsubFolders();
      unsubFiles();
    };
  }, [user?.uid, selectedProjectId]);

  // Reset folder navigation when project changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentFolderId(null);
  }, [selectedProjectId]);

  // Breadcrumbs
  const breadcrumbs = useMemo(() => {
    const crumbs: DriveFolder[] = [];
    let current = folders.find(f => f.id === currentFolderId);
    while (current) {
      crumbs.unshift(current);
      current = folders.find(f => f.id === current?.parentId);
    }
    return crumbs;
  }, [folders, currentFolderId]);

  // Filtering
  const displayedFolders = useMemo(() => {
    if (searchQuery) return []; // In search, we only show files or flatten folders
    return folders.filter(f => f.parentId === currentFolderId);
  }, [folders, currentFolderId, searchQuery]);

  const displayedFiles = useMemo(() => {
    let result = files;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(f => f.name.toLowerCase().includes(q));
    } else {
      result = result.filter(f => f.folderId === currentFolderId);
    }

    if (typeFilter !== 'all') {
      if (typeFilter === 'image') result = result.filter(f => f.type.startsWith('image/'));
      if (typeFilter === 'document') result = result.filter(f => f.type.includes('pdf') || f.type.includes('text') || f.type.includes('document'));
    }

    result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [files, currentFolderId, searchQuery, typeFilter]);

  // Handlers
  const handleCreateFolder = async () => {
    if (!user?.uid || !selectedProjectId) return;
    const name = window.prompt('Enter folder name:');
    if (!name) return;
    try {
      await createFolder(selectedProjectId, name, currentFolderId, user.uid);
      toast('Folder created', 'success');
    } catch (err: unknown) {
      toast((err as Error).message, 'error');
    }
  };

  const handleFileUpload = (fileList: FileList | null) => {
    if (!user?.uid || !fileList || !selectedProjectId) return;
    
    Array.from(fileList).forEach(file => {
      setUploadingFiles(prev => [...prev, { name: file.name, progress: 0 }]);
      
      uploadFile(
        selectedProjectId,
        currentFolderId,
        user.uid,
        file,
        (progress) => {
          setUploadingFiles(prev => prev.map(f => f.name === file.name ? { ...f, progress } : f));
        },
        (error) => {
          toast(`Failed to upload ${file.name}: ${error.message}`, 'error');
          setUploadingFiles(prev => prev.filter(f => f.name !== file.name));
        },
        () => {
          toast(`${file.name} uploaded`, 'success');
          setUploadingFiles(prev => prev.filter(f => f.name !== file.name));
        }
      );
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId, currentFolderId, user?.uid]);

  const handleContextMenu = (e: React.MouseEvent, item: DriveFolder | DriveFile, type: 'folder' | 'file') => {
    e.preventDefault();
    // Simplified context menu logic via native prompts for MVP
    const action = window.prompt(`Action for ${item.name}: Type "rename" or "delete"`);
    if (!action) return;
    
    if (action.toLowerCase() === 'delete') {
      if (!window.confirm(`Are you sure you want to delete ${item.name}?`)) return;
      if (type === 'folder') {
        deleteFolder(item.id).then(() => toast('Folder deleted', 'success')).catch((e: unknown) => toast((e as Error).message, 'error'));
      } else {
        deleteFile(item.id, (item as DriveFile).storagePath).then(() => toast('File deleted', 'success')).catch((e: unknown) => toast((e as Error).message, 'error'));
      }
    } else if (action.toLowerCase() === 'rename') {
      const newName = window.prompt('Enter new name:', item.name);
      if (!newName || newName === item.name) return;
      if (type === 'folder') {
        updateFolder(item.id, { name: newName }).then(() => toast('Renamed', 'success')).catch((e: unknown) => toast((e as Error).message, 'error'));
      } else {
        updateFile(item.id, { name: newName }).then(() => toast('Renamed', 'success')).catch((e: unknown) => toast((e as Error).message, 'error'));
      }
    }
  };

  return (
    <div
      className="flex h-full flex-col relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl border-2 border-dashed border-violet-500 bg-violet-500/10 backdrop-blur-sm">
          <div className="flex flex-col items-center p-8 rounded-2xl bg-[#0a0a0f] border border-white/[0.08] shadow-2xl">
            <UploadIcon size={48} className="text-violet-400 mb-4 animate-bounce" />
            <h2 className="text-xl font-bold text-white">Drop files to upload</h2>
            <p className="text-white/60 mt-2">Uploading to {breadcrumbs.length ? breadcrumbs[breadcrumbs.length-1].name : 'Root'}</p>
          </div>
        </div>
      )}

      {/* Upload Progress Overlay */}
      {uploadingFiles.length > 0 && (
        <div className="absolute bottom-6 right-6 w-80 z-40 flex flex-col gap-2">
          {uploadingFiles.map(uf => (
            <div key={uf.name} className="p-4 rounded-xl bg-[#12121a] border border-white/[0.08] shadow-2xl">
              <p className="text-sm text-white font-medium truncate mb-2">{uf.name}</p>
              <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-violet-500 transition-all duration-300" 
                  style={{ width: `${uf.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400">
            <FilesIcon size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Files</h1>
            
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm text-white/40 mt-0.5">
              <select 
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent text-violet-400 font-medium hover:text-violet-300 focus:outline-none cursor-pointer"
                disabled={projects.length === 0}
              >
                {projects.length === 0 ? (
                  <option value="" className="bg-[#0f0f13]">No projects found</option>
                ) : (
                  projects.map(p => (
                    <option key={p.id} value={p.id} className="bg-[#0f0f13]">{p.name}</option>
                  ))
                )}
              </select>
              
              <span className="mx-1.5">/</span>
              
              <button onClick={() => setCurrentFolderId(null)} className="hover:text-white transition-colors">
                Root
              </button>
              
              {breadcrumbs.map(crumb => (
                <React.Fragment key={crumb.id}>
                  <span className="mx-1.5">/</span>
                  <button onClick={() => setCurrentFolderId(crumb.id)} className="hover:text-white transition-colors">
                    {crumb.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 bg-white/[0.02] border border-white/[0.06] rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder-white/40 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.04] transition-all"
            />
          </div>
          
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 px-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-sm text-white/70 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-[#0f0f13]">All Types</option>
            <option value="image" className="bg-[#0f0f13]">Images</option>
            <option value="document" className="bg-[#0f0f13]">Documents</option>
          </select>
          
          <button 
            onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.02] border border-white/[0.06] text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <GridIcon size={16} />
          </button>
          
          <button
            onClick={handleCreateFolder}
            className="flex h-9 items-center gap-2 rounded-xl bg-white/[0.04] px-4 text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
          >
            <FolderPlusIcon size={16} />
            <span className="hidden sm:inline">New Folder</span>
          </button>
          
          <label className="flex h-9 cursor-pointer items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-medium text-white transition-colors hover:bg-violet-700">
            <UploadIcon size={16} />
            <span className="hidden sm:inline">Upload</span>
            <input 
              type="file" 
              multiple 
              className="hidden" 
              onChange={(e) => handleFileUpload(e.target.files)} 
            />
          </label>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-24">
        {displayedFolders.length === 0 && displayedFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border border-dashed border-white/[0.1] rounded-2xl bg-white/[0.01]">
            <FilesIcon size={48} className="text-white/20 mb-4" />
            <p className="text-white/60 mb-2">This folder is empty</p>
            <p className="text-sm text-white/40">Drag and drop files here to upload</p>
          </div>
        ) : (
          viewMode === 'grid' ? (
            <FileGrid 
              folders={displayedFolders} 
              files={displayedFiles} 
              onFolderClick={f => setCurrentFolderId(f.id)} 
              onFileClick={setPreviewFile}
              onContextMenu={handleContextMenu}
            />
          ) : (
            <FileList 
              folders={displayedFolders} 
              files={displayedFiles} 
              onFolderClick={f => setCurrentFolderId(f.id)} 
              onFileClick={setPreviewFile}
              onContextMenu={handleContextMenu}
            />
          )
        )}
      </div>
      
      {/* Modals */}
      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
}
