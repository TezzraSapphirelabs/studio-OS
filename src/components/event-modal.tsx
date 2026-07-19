import React, { useState } from 'react';
import { XIcon, CalendarIcon, ClockIcon } from '@/components/icons';
import type { CalendarEvent, EventPriority, EventStatus } from '@/types';
import { createEvent, updateEvent } from '@/services/calendar';
import { useToast } from '@/contexts/toast-context';

interface EventModalProps {
  onClose: () => void;
  userId: string;
  initialDate?: string; // YYYY-MM-DD
  existingEvent?: CalendarEvent | null;
  onSuccess?: () => void;
}

export default function EventModal({ 
  onClose, 
  userId, 
  initialDate, 
  existingEvent,
  onSuccess 
}: EventModalProps) {
  const { toast } = useToast();
  
  const today = new Date().toISOString().split('T')[0];
  const [title, setTitle] = useState(existingEvent?.title || '');
  const [description, setDescription] = useState(existingEvent?.description || '');
  const [date, setDate] = useState(existingEvent?.date || initialDate || today);
  const [startTime, setStartTime] = useState(existingEvent?.startTime || '09:00');
  const [endTime, setEndTime] = useState(existingEvent?.endTime || '10:00');
  const [isAllDay, setIsAllDay] = useState(existingEvent?.isAllDay || false);
  const [priority, setPriority] = useState<EventPriority>(existingEvent?.priority || 'medium');
  const [status, setStatus] = useState<EventStatus>(existingEvent?.status || 'upcoming');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    
    // Validation
    if (!isAllDay && startTime >= endTime) {
      toast('End time must be after start time', 'error');
      return;
    }

    setIsSubmitting(true);
    
    const eventData = {
      title: title.trim(),
      description: description.trim(),
      date,
      startTime: isAllDay ? null : startTime,
      endTime: isAllDay ? null : endTime,
      isAllDay,
      priority,
      status,
    };

    let error;
    
    if (existingEvent) {
      const res = await updateEvent(userId, existingEvent.id, eventData);
      error = res.error;
    } else {
      const res = await createEvent(userId, eventData);
      error = res.error;
    }
    
    setIsSubmitting(false);

    if (error) {
      toast(error || 'Failed to save event', 'error');
    } else {
      toast(existingEvent ? 'Event updated' : 'Event created', 'success');
      onSuccess?.();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#1a1a24] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">
            {existingEvent ? 'Edit Event' : 'New Event'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-white/50 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <XIcon size={20} />
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1">
          <form id="event-form" onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Event title"
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
              />
            </div>
            
            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details..."
                rows={3}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all resize-none"
              />
            </div>
            
            {/* Date & All Day Toggle */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
                    <CalendarIcon size={16} />
                  </div>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
              
              <div className="flex flex-col justify-end pb-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAllDay}
                    onChange={(e) => setIsAllDay(e.target.checked)}
                    className="rounded border-white/20 bg-black/40 text-violet-500 focus:ring-violet-500/50 focus:ring-offset-0"
                  />
                  <span className="text-sm font-medium text-white/80">All day event</span>
                </label>
              </div>
            </div>
            
            {/* Time range (hidden if all day) */}
            {!isAllDay && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Start Time</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
                      <ClockIcon size={16} />
                    </div>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">End Time</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
                      <ClockIcon size={16} />
                    </div>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              {/* Priority */}
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as EventPriority)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all [&>option]:bg-[#1a1a24] [&>option]:text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EventStatus)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all [&>option]:bg-[#1a1a24] [&>option]:text-white"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            
          </form>
        </div>
        
        <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-3 bg-black/20 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="event-form"
            disabled={isSubmitting || !title.trim()}
            className="px-6 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:hover:bg-violet-600 rounded-lg shadow-lg shadow-violet-500/25 transition-all"
          >
            {isSubmitting ? 'Saving...' : existingEvent ? 'Save Changes' : 'Create Event'}
          </button>
        </div>
      </div>
    </div>
  );
}
