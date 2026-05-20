'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Calendar, Search, MapPin, Clock, ShieldAlert, Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import api from '@/services/api';

export default function MemberEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'mine'>('all');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // Query events with the correct dynamic query params for filtering
      const isMine = filterType === 'mine';
      const response = await api.get(`/member/events${isMine ? '?mine=true' : ''}`);
      if (response.data?.data) {
        setEvents(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load events data', error);
      toast.error('Failed to retrieve event list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [filterType]);

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.location || e.venue || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.organization?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.organization?.acronym || e.organization?.name?.split(' ').filter(Boolean).map((n: string) => n[0]).join('') || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in text-left">
      
      {/* Header section */}
      <div>
        <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Calendar className="h-5 w-5 text-violet-400" /> Campus Events Calendar
        </h3>
        <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
          Discover academic, professional, and sports events happening across your approved organization networks or throughout the entire campus.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center py-4 border-b border-slate-900">
        
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input 
            type="text"
            placeholder="Search events or clubs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-4 py-2 border border-slate-800 rounded-xl bg-slate-950/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 p-1">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'all'
                ? 'bg-violet-600/20 text-violet-400 border border-violet-500/25'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilterType('mine')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'mine'
                ? 'bg-violet-600/20 text-violet-400 border border-violet-500/25'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            My Clubs' Events
          </button>
        </div>

      </div>

      {/* Grid listing */}
      {filteredEvents.length === 0 ? (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/10 p-12 text-center shadow-md">
          <ShieldAlert className="h-10 w-10 text-slate-500 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">No Scheduled Events</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
            There are no campus activities matching your queries or available events in your joined roster networks.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((e) => {
            const eventDate = new Date(e.start_at);
            const formattedDate = eventDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const formattedTime = eventDate.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div 
                key={e.id}
                className="group relative rounded-2xl border border-slate-800 bg-slate-900/10 backdrop-blur-md p-6 hover:border-slate-700/80 transition-all duration-300 shadow-lg flex flex-col justify-between"
              >
                <div>
                  {/* Badge & Org header */}
                  <div className="flex justify-between items-start gap-2 mb-4">
                    <span className="px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/5 text-[9px] font-extrabold text-violet-400 tracking-wider uppercase">
                      {e.organization?.acronym || e.organization?.name?.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase() || 'Campus'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold font-mono">
                      {formattedDate}
                    </span>
                  </div>

                  {/* Title */}
                  <Link href={`/events/${e.id}`} className="block group-hover:text-violet-400 transition-colors">
                    <h4 className="text-base font-extrabold text-white leading-snug">
                      {e.title}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-semibold block mt-1">
                      Hosted by {e.organization?.name}
                    </span>
                  </Link>

                  {/* Snippet */}
                  <p className="text-xs text-slate-400 leading-relaxed font-medium mt-3.5 line-clamp-3">
                    {e.description || 'No event overview details provided.'}
                  </p>
                </div>

                {/* Details layout summary */}
                <div className="mt-6 pt-4 border-t border-slate-900/60 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{e.location || e.venue || 'TBA'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium pb-2">
                    <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span>{formattedTime}</span>
                  </div>
                  
                  <Link 
                    href={`/events/${e.id}`}
                    className="block w-full text-center text-xs py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-900 font-bold transition-all text-slate-200 hover:text-white"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
