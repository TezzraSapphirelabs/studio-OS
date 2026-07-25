import React, { useState } from 'react';
import { CalendarIcon, ClockIcon } from '@/components/icons';
import type { CalendarEvent, EventPriority, EventStatus } from '@/types';
import { createEvent, updateEvent } from '@/services/calendar';
import { useToast } from '@/contexts/toast-context';
import { GlassModal } from '@/components/ui/glass-modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

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
    <GlassModal
      isOpen={true}
      onClose={onClose}
      title={existingEvent ? 'Edit Event' : 'New Event'}
      className="max-w-md p-0 sm:p-0"
    >
      <div className="flex max-h-[85vh] flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <form id="event-form" onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
            {/* Title */}
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">Title</label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Event title"
                required
              />
            </div>
            
            {/* Description */}
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">Description (Optional)</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details..."
                rows={3}
              />
            </div>
            
            {/* Date & All Day Toggle */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">Date</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  icon={<CalendarIcon size={16} />}
                  className="[color-scheme:dark]"
                />
              </div>
              
              <div className="flex flex-col justify-end pb-2.5">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isAllDay}
                    onChange={(e) => setIsAllDay(e.target.checked)}
                    className="rounded border-white/20 bg-black/40 text-white/70 focus:ring-white/20/50 focus:ring-offset-0"
                  />
                  <span className="text-sm font-medium text-white/80">All day event</span>
                </label>
              </div>
            </div>
            
            {/* Time range (hidden if all day) */}
            {!isAllDay && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">Start Time</label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    icon={<ClockIcon size={16} />}
                    className="[color-scheme:dark]"
                  />
                </div>
                
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">End Time</label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    icon={<ClockIcon size={16} />}
                    className="[color-scheme:dark]"
                  />
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              {/* Priority */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">Priority</label>
                <Select value={priority} onValueChange={(val) => setPriority(val as EventPriority)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Status */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">Status</label>
                <Select value={status} onValueChange={(val) => setStatus(val as EventStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
        </div>
        
        <div className="flex justify-end gap-3 border-t border-white/10 bg-white/[0.02] px-6 py-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="event-form"
            variant="primary"
            disabled={isSubmitting || !title.trim()}
          >
            {isSubmitting ? 'Saving...' : existingEvent ? 'Save Changes' : 'Create Event'}
          </Button>
        </div>
      </div>
    </GlassModal>
  );
}

