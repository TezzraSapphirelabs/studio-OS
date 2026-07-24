'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { subscribeToTags, createTag, updateTag, deleteTag } from '@/services/tags';
import { type Tag } from '@/types';
import { GlassCard, EmptyState } from '@/components';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon, TagIcon, XIcon } from '@/components/icons';
import { Button, Input, GlassModal } from '@/components/ui';

const COLORS = [
  '#ffffff', '#f4f4f5', '#e4e4e7', '#d4d4d8', 
  '#a1a1aa', '#71717a', '#52525b', '#3f3f46', 
  '#27272a', '#18181b', '#09090b', '#000000',
  '#e5e5e5'
];

export default function TagsPage() {
  const { user } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({ name: '', color: COLORS[0], priority: false, status: false });

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToTags(user.uid, (data) => {
      setTags(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const filteredTags = useMemo(() => {
    if (!search) return tags;
    const lower = search.toLowerCase();
    return tags.filter(t => t.name.toLowerCase().includes(lower));
  }, [tags, search]);

  const openModal = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag);
      setFormData({ name: tag.name, color: tag.color, priority: tag.priority || false, status: tag.status || false });
    } else {
      setEditingTag(null);
      setFormData({ name: '', color: COLORS[0], priority: false, status: false });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTag(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.name.trim()) return;

    if (editingTag) {
      await updateTag(editingTag.id, formData);
    } else {
      await createTag(user.uid, formData.name, formData.color, formData.priority, formData.status);
    }
    closeModal();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this tag?')) {
      await deleteTag(id);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Tags & Labels</h1>
          <p className="mt-1 text-sm text-white/40">Manage reusable tags for your workspace.</p>
        </div>
        <Button
          variant="primary"
          onClick={() => openModal()}
        >
          <PlusIcon size={18} className="mr-2" />
          Create Tag
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="w-full max-w-sm">
          <Input
            icon={<SearchIcon size={16} />}
            placeholder="Search tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-panel h-24 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filteredTags.length === 0 ? (
        <EmptyState
          icon={<TagIcon size={36} />}
          title="No tags found"
          description={search ? 'Try adjusting your search term.' : 'Create your first tag to start organizing your workspace.'}
        />
      ) : (
        <div className="stagger-children grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTags.map(tag => (
            <GlassCard key={tag.id} padding="md" className="group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full shadow-sm" style={{ backgroundColor: COLORS.includes(tag.color) ? tag.color : '#ffffff' }} />
                  <span className="font-medium text-white">{tag.name}</span>
                </div>
                <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                  <Button variant="ghost" size="icon" onClick={() => openModal(tag)} className="h-8 w-8 text-white/40 hover:text-white">
                    <EditIcon size={14} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(tag.id)} className="h-8 w-8 text-white/40 hover:text-white/70">
                    <TrashIcon size={14} />
                  </Button>
                </div>
              </div>
              {(tag.priority || tag.status) && (
                <div className="mt-3 flex gap-2">
                  {tag.priority && <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-white/60 uppercase tracking-wider">Priority Label</span>}
                  {tag.status && <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-white/60 uppercase tracking-wider">Status Label</span>}
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}

      {/* Modal */}
      <GlassModal isOpen={isModalOpen} onClose={closeModal}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{editingTag ? 'Edit Tag' : 'Create Tag'}</h2>
          <Button variant="ghost" size="icon" onClick={closeModal} className="h-8 w-8">
            <XIcon size={20} />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/70">Tag Name</label>
            <Input
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Bug, Feature, Urgent"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/70">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c })}
                  className={`h-8 w-8 rounded-full border-2 ${formData.color === c ? 'border-white' : 'border-transparent'} transition-all hover:scale-110`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.checked })}
                className="rounded border-white/20 bg-white/5 text-white/70 focus:ring-white/20 focus:ring-offset-0"
              />
              Priority Label
            </label>
            <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.checked })}
                className="rounded border-white/20 bg-white/5 text-white/70 focus:ring-white/20 focus:ring-offset-0"
              />
              Status Label
            </label>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 border-t border-white/10 pt-6">
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" type="submit">
              {editingTag ? 'Save Changes' : 'Create Tag'}
            </Button>
          </div>
        </form>
      </GlassModal>
    </div>
  );
}
