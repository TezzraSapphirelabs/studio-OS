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
import { EmptyState } from '@/components';
import { Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, buttonVariants } from '@/components/ui';

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
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-white/[0.04] backdrop-blur-sm">
          <div className="flex flex-col items-center p-8 rounded-2xl bg-[#0a0a0f] border border-white/[0.08] shadow-2xl">
            <UploadIcon size={48} className="text-white/70 mb-4 animate-bounce" />
            <h2 className="text-xl font-bold text-white">Drop files to upload</h2>
            <p className="text-white/60 mt-2">Uploading to {breadcrumbs.length ? breadcrumbs[breadcrumbs.length-1].name : 'Root'}</p>
          </div>
        </div>
      )}

      {/* Upload Progress Overlay */}
      {uploadingFiles.length > 0 && (
        <div className="absolute bottom-6 right-6 w-80 z-40 flex flex-col gap-2">
          {uploadingFiles.map(uf => (
            <div key={uf.name} className="glass-panel p-4 rounded-xl shadow-2xl">
              <p className="text-sm text-white font-medium truncate mb-2">{uf.name}</p>
              <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white text-black transition-all duration-300" 
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.08] text-white/70">
            <FilesIcon size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Files</h1>
            
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm text-white/40 mt-0.5">
              <Select 
                value={selectedProjectId}
                onValueChange={(val) => setSelectedProjectId(val || '')}
                disabled={projects.length === 0}
              >
                <SelectTrigger size="sm" className="w-auto min-w-[140px] bg-transparent border-transparent px-2 h-7 text-white/70 font-medium hover:text-white/90">
                  <SelectValue placeholder="Select Project">
                    {projects.find(p => p.id === selectedProjectId)?.name || "Select Project"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {projects.length === 0 ? (
                    <SelectItem value="none" disabled>No projects found</SelectItem>
                  ) : (
                    projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              
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
          <div className="w-48">
            <Input
              icon={<SearchIcon size={14} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
            />
          </div>
          
          <div className="w-32">
            <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val || '')}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            variant="icon"
            size="icon"
            onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
          >
            <GridIcon size={16} />
          </Button>
          
          <Button
            variant="default"
            onClick={handleCreateFolder}
          >
            <FolderPlusIcon size={16} className="mr-2" />
            <span className="hidden sm:inline">New Folder</span>
          </Button>
          
          <label className={buttonVariants({ variant: 'default', className: 'cursor-pointer' })}>
            <UploadIcon size={16} className="mr-2" />
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
          <EmptyState 
            icon={<FilesIcon size={36} />}
            title="This folder is empty"
            description="Drag and drop files here to upload"
            className="border-dashed border-white/[0.1]"
          />
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
