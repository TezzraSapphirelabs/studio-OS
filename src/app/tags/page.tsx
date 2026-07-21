'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { subscribeToTags, createTag, updateTag, deleteTag } from '@/services/tags';
import { type Tag } from '@/types';
import { GlassCard } from '@/components';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon, TagIcon, XIcon } from '@/components/icons';

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', 
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', 
  '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e',
  '#78716c'
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
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:bg-violet-500"
        >
          <PlusIcon size={18} />
          Create Tag
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="relative w-full max-w-sm">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/40 outline-none transition-colors focus:border-violet-500 focus:bg-white/10"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : filteredTags.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] py-20 text-center">
          <TagIcon size={48} className="mb-4 text-white/20" />
          <h3 className="text-lg font-medium text-white">No tags found</h3>
          <p className="mt-1 max-w-sm text-sm text-white/40">
            {search ? 'Try adjusting your search term.' : 'Create your first tag to start organizing your workspace.'}
          </p>
        </div>
      ) : (
        <div className="stagger-children grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTags.map(tag => (
            <GlassCard key={tag.id} padding="md" className="group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full shadow-sm" style={{ backgroundColor: tag.color }} />
                  <span className="font-medium text-white">{tag.name}</span>
                </div>
                <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => openModal(tag)} className="p-1.5 text-white/40 hover:text-white">
                    <EditIcon size={14} />
                  </button>
                  <button onClick={() => handleDelete(tag.id)} className="p-1.5 text-white/40 hover:text-red-400">
                    <TrashIcon size={14} />
                  </button>
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
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-md scale-100 overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f13] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{editingTag ? 'Edit Tag' : 'Create Tag'}</h2>
              <button onClick={closeModal} className="text-white/40 hover:text-white"><XIcon size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/70">Tag Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Bug, Feature, Urgent"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500"
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
                    className="rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500 focus:ring-offset-0"
                  />
                  Priority Label
                </label>
                <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.checked })}
                    className="rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500 focus:ring-offset-0"
                  />
                  Status Label
                </label>
              </div>

              <div className="mt-8 flex items-center justify-end gap-3 border-t border-white/10 pt-6">
                <button type="button" onClick={closeModal} className="rounded-xl px-5 py-2 text-sm font-medium text-white hover:bg-white/10">Cancel</button>
                <button type="submit" className="rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-500">
                  {editingTag ? 'Save Changes' : 'Create Tag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
