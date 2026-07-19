'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { subscribeToEvents, deleteEvent, createEvent, updateEvent } from '@/services/calendar';
import type { CalendarEvent } from '@/types';
import EventModal from '@/components/event-modal';
import { 
  ChevronRightIcon, 
  PlusIcon, 
  CalendarIcon, 
  SearchIcon, 
  ClockIcon, 
  TrashIcon
} from '@/components/icons';
import { useToast } from '@/contexts/toast-context';

export default function CalendarPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Date State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'list'>('month');
  
  // Filtering & Sorting State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!user?.uid) return;
    
    const unsubscribe = subscribeToEvents(user.uid, (data, error) => {
      if (error) {
        toast(error || 'Failed to load events', 'error');
      } else {
        setEvents(data);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, toast]);

  // Notifications
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const notifiedEvents = new Set<string>();
    
    const interval = setInterval(() => {
      if (Notification.permission !== 'granted') return;
      
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      events.forEach(event => {
        if (!event.isAllDay && event.date === todayStr && event.startTime === timeStr && event.status !== 'completed' && !event.archived) {
          const eventKey = `${event.id}-${todayStr}-${timeStr}`;
          if (!notifiedEvents.has(eventKey)) {
            new Notification('Studio OS', {
              body: `Event "${event.title}" is starting now.`,
            });
            notifiedEvents.add(eventKey);
          }
        }
      });
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [events]);

  // View Navigation
  const navigatePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') newDate.setMonth(newDate.getMonth() - 1);
    else if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
    else newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + 1);
    else if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
    else newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const navigateToday = () => {
    setCurrentDate(newDate => {
      const today = new Date();
      // Only update if it's actually a different date to avoid unnecessary renders
      if (today.toDateString() !== newDate.toDateString()) {
        return today;
      }
      return newDate;
    });
  };

  // Derived filtered events
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (searchQuery && !e.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterPriority !== 'all' && e.priority !== filterPriority) return false;
      if (filterStatus !== 'all' && e.status !== filterStatus) return false;
      return true;
    });
  }, [events, searchQuery, filterPriority, filterStatus]);

  // Open modal to create event on specific date
  const handleDateClick = (dateStr: string) => {
    setSelectedEvent(null);
    setSelectedDate(dateStr);
    setIsModalOpen(true);
  };

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = async (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    if (!user?.uid) return;
    
    if (window.confirm('Are you sure you want to delete this event?')) {
      const { error } = await deleteEvent(user.uid, eventId);
      if (error) {
        toast(error || 'Failed to delete event', 'error');
      } else {
        toast('Event deleted', 'success');
      }
    }
  };

  // Month View Calendar Logic
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDayOfMonth.getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
    
    const days = [];
    
    // Previous month padding
    const prevMonth = new Date(year, month, 0);
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - startingDayOfWeek + i + 1),
        isCurrentMonth: false
      });
    }
    
    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Next month padding to fill 6 rows (42 days)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return days;
  }, [currentDate]);

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-violet-500/20 text-violet-300 border-violet-500/30';
    }
  };

  return (
    <div className="flex h-full w-full">
      {/* Sidebar for Filters & Search */}
      <div className="w-64 border-r border-white/5 bg-black/40 flex flex-col p-4">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-medium text-white flex items-center gap-2">
            <CalendarIcon size={18} />
            Calendar
          </h2>
        </div>

        <button
          onClick={() => {
            setSelectedEvent(null);
            setSelectedDate(undefined);
            setIsModalOpen(true);
          }}
          className="w-full mb-6 bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-violet-500/20"
        >
          <PlusIcon size={16} />
          New Event
        </button>

        <div className="space-y-6">
          <div>
            <div className="relative">
              <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input 
                type="text" 
                placeholder="Search events..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/5 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.06] transition-all"
              />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Filters</h3>
            
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs text-white/60 mb-1 block">Status</span>
                <select 
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/5 rounded-lg px-3 py-1.5 text-sm text-white/80 focus:outline-none focus:border-violet-500/50 [&>option]:bg-[#1a1a24] [&>option]:text-white"
                >
                  <option value="all">All Events</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs text-white/60 mb-1 block">Priority</span>
                <select 
                  value={filterPriority}
                  onChange={e => setFilterPriority(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/5 rounded-lg px-3 py-1.5 text-sm text-white/80 focus:outline-none focus:border-violet-500/50 [&>option]:bg-[#1a1a24] [&>option]:text-white"
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/20">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-medium text-white min-w-[200px]">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h1>
            
            <div className="flex items-center bg-white/[0.04] rounded-lg p-1 border border-white/5">
              <button onClick={navigatePrev} className="p-1.5 hover:bg-white/10 rounded-md text-white/70 transition-colors">
                <ChevronRightIcon size={16} className="rotate-180" />
              </button>
              <button onClick={navigateToday} className="px-3 py-1 text-sm font-medium hover:bg-white/10 rounded-md text-white/70 transition-colors">
                Today
              </button>
              <button onClick={navigateNext} className="p-1.5 hover:bg-white/10 rounded-md text-white/70 transition-colors">
                <ChevronRightIcon size={16} />
              </button>
            </div>
          </div>
          
          <div className="flex items-center bg-white/[0.04] rounded-lg p-1 border border-white/5">
            <button 
              onClick={() => setViewMode('month')} 
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'month' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
            >
              Month
            </button>
            <button 
              onClick={() => setViewMode('week')} 
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'week' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
            >
              Week
            </button>
            <button 
              onClick={() => setViewMode('day')} 
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'day' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
            >
              Day
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
            >
              List
            </button>
          </div>
        </div>

        {/* Calendar Grid / List */}
        <div className="flex-1 overflow-auto bg-black/10">
          {loading ? (
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="animate-pulse flex items-center gap-2 text-white/40">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                <span>Loading calendar...</span>
              </div>
            </div>
          ) : viewMode === 'month' ? (
            <div className="flex flex-col h-full min-w-[800px]">
              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b border-white/5 bg-black/20">
                {dayNames.map(day => (
                  <div key={day} className="py-2 text-center text-xs font-medium text-white/50 uppercase tracking-wider border-r border-white/5 last:border-0">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Grid */}
              <div className="flex-1 grid grid-cols-7 grid-rows-6">
                {monthDays.map((dayObj, idx) => {
                  const dateStr = dayObj.date.toISOString().split('T')[0];
                  const todayStr = new Date().toISOString().split('T')[0];
                  const isToday = dateStr === todayStr;
                  
                  // Get events for this day
                  const dayEvents = filteredEvents.filter(e => e.date === dateStr);
                  
                  return (
                    <div 
                      key={idx} 
                      onClick={() => handleDateClick(dateStr)}
                      className={`min-h-[100px] border-r border-b border-white/5 p-2 transition-colors cursor-pointer hover:bg-white/[0.02] ${
                        !dayObj.isCurrentMonth ? 'bg-black/30' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday 
                            ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30' 
                            : !dayObj.isCurrentMonth ? 'text-white/30' : 'text-white/70'
                        }`}>
                          {dayObj.date.getDate()}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map(event => (
                          <div 
                            key={event.id}
                            onClick={(e) => handleEventClick(e, event)}
                            className={`px-1.5 py-1 rounded text-[10px] font-medium truncate border transition-opacity hover:opacity-80 ${getPriorityColor(event.priority)}`}
                          >
                            {!event.isAllDay && <span className="opacity-70 mr-1">{event.startTime}</span>}
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-[10px] font-medium text-white/40 px-1">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : viewMode === 'week' ? (
            <div className="flex flex-col h-full min-w-[800px]">
              <div className="grid grid-cols-7 border-b border-white/5 bg-black/20">
                {dayNames.map(day => (
                  <div key={day} className="py-2 text-center text-xs font-medium text-white/50 uppercase tracking-wider border-r border-white/5 last:border-0">
                    {day}
                  </div>
                ))}
              </div>
              <div className="flex-1 grid grid-cols-7">
                {monthDays.filter(d => {
                  // Get the current week
                  const currDate = new Date(currentDate);
                  currDate.setHours(0,0,0,0);
                  const sunday = new Date(currDate);
                  sunday.setDate(currDate.getDate() - currDate.getDay());
                  const saturday = new Date(sunday);
                  saturday.setDate(sunday.getDate() + 6);
                  return d.date >= sunday && d.date <= saturday;
                }).map((dayObj, idx) => {
                  const dateStr = dayObj.date.toISOString().split('T')[0];
                  const todayStr = new Date().toISOString().split('T')[0];
                  const isToday = dateStr === todayStr;
                  const dayEvents = filteredEvents.filter(e => e.date === dateStr);
                  
                  return (
                    <div 
                      key={idx} 
                      onClick={() => handleDateClick(dateStr)}
                      className={`border-r border-b border-white/5 p-2 transition-colors cursor-pointer hover:bg-white/[0.02] bg-black/10`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className={`text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full ${
                          isToday ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30' : 'text-white/70'
                        }`}>
                          {dayObj.date.getDate()}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {dayEvents.map(event => (
                          <div 
                            key={event.id}
                            onClick={(e) => handleEventClick(e, event)}
                            className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-all hover:scale-[1.02] cursor-pointer ${getPriorityColor(event.priority)}`}
                          >
                            <div className="font-semibold mb-0.5 truncate">{event.title}</div>
                            {!event.isAllDay && <div className="opacity-70 text-[10px]">{event.startTime} - {event.endTime}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : viewMode === 'day' ? (
            <div className="flex flex-col h-full p-6 max-w-3xl mx-auto w-full">
              <h2 className="text-2xl font-semibold text-white mb-6">
                {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h2>
              <div className="flex-1 overflow-auto space-y-3">
                {(() => {
                  const dateStr = currentDate.toISOString().split('T')[0];
                  const dayEvents = filteredEvents.filter(e => e.date === dateStr)
                                      .sort((a,b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));
                  
                  if (dayEvents.length === 0) {
                    return (
                      <div className="text-center py-12 border border-white/5 rounded-2xl bg-white/[0.02]">
                        <p className="text-white/40 text-sm">No events scheduled for today.</p>
                      </div>
                    );
                  }
                  
                  return dayEvents.map(event => (
                    <div 
                      key={event.id}
                      onClick={(e) => handleEventClick(e, event)}
                      className={`p-4 rounded-xl border flex flex-col gap-2 transition-all hover:scale-[1.01] cursor-pointer ${getPriorityColor(event.priority)}`}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold">{event.title}</h3>
                        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest bg-black/20">
                          {event.status}
                        </span>
                      </div>
                      <div className="opacity-80 text-sm">
                        {event.isAllDay ? 'All Day' : `${event.startTime} - ${event.endTime}`}
                      </div>
                      {event.description && (
                        <p className="text-sm opacity-70 mt-2">{event.description}</p>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>
          ) : (
            <div className="p-6 max-w-4xl mx-auto space-y-4">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-20 border border-white/5 rounded-2xl bg-white/[0.02]">
                  <CalendarIcon size={48} className="mx-auto text-white/10 mb-4" />
                  <h3 className="text-white font-medium mb-2">No events found</h3>
                  <p className="text-white/40 text-sm mb-6">Try adjusting your filters or create a new event.</p>
                  <button 
                    onClick={() => {
                      setSelectedEvent(null);
                      setSelectedDate(undefined);
                      setIsModalOpen(true);
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Create Event
                  </button>
                </div>
              ) : (
                filteredEvents
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map(event => (
                    <div 
                      key={event.id}
                      onClick={(e) => handleEventClick(e, event)}
                      className="group flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-xl transition-all cursor-pointer hover:bg-white/[0.04]"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-1 h-12 rounded-full ${
                          event.priority === 'high' ? 'bg-red-500' :
                          event.priority === 'medium' ? 'bg-orange-500' : 'bg-violet-500'
                        }`} />
                        <div>
                          <h3 className="text-sm font-medium text-white/90 mb-1">
                            {event.title}
                            {event.archived && <span className="ml-2 text-[10px] bg-white/10 text-white/50 px-1.5 py-0.5 rounded">Archived</span>}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-white/40">
                            <span className="flex items-center gap-1">
                              <CalendarIcon size={12} />
                              {event.date}
                            </span>
                            {!event.isAllDay && (
                              <span className="flex items-center gap-1">
                                <ClockIcon size={12} />
                                {event.startTime} - {event.endTime}
                              </span>
                            )}
                            {event.isAllDay && (
                              <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-white/70">All Day</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider border ${
                          event.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                          event.status === 'in-progress' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                          'bg-white/10 text-white/60 border-white/10'
                        }`}>
                          {event.status}
                        </span>
                        
                        <div className="opacity-0 group-hover:opacity-100 flex items-center transition-opacity bg-black/40 rounded-lg p-1">
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!user?.uid) return;
                              // eslint-disable-next-line @typescript-eslint/no-unused-vars
                              const { id, ownerId, createdAt, updatedAt, archived, ...rest } = event;
                              await createEvent(user.uid, { ...rest, title: `${rest.title} (Copy)` });
                              toast('Event duplicated', 'success');
                            }}
                            className="px-2 py-1 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
                            title="Duplicate"
                          >
                            Copy
                          </button>
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!user?.uid) return;
                              await updateEvent(user.uid, event.id, { archived: !event.archived });
                              toast(event.archived ? 'Event restored' : 'Event archived', 'success');
                            }}
                            className="px-2 py-1 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
                            title={event.archived ? "Restore" : "Archive"}
                          >
                            {event.archived ? "Restore" : "Archive"}
                          </button>
                          <button 
                            onClick={(e) => handleDeleteEvent(e, event.id)}
                            className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/20 rounded transition-colors ml-1"
                            title="Delete"
                          >
                            <TrashIcon size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Event Modal */}
      {user?.uid && isModalOpen && (
        <EventModal
          onClose={() => setIsModalOpen(false)}
          userId={user.uid}
          initialDate={selectedDate}
          existingEvent={selectedEvent}
        />
      )}
    </div>
  );
}
