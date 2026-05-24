'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  Users2, 
  Calendar, 
  UserCheck, 
  MapPin, 
  Clock, 
  ChevronRight, 
  Radio, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useMemberAuthStore } from '@/store/memberAuthStore';
import api from '@/services/api';

export default function MemberDashboard() {
  const { user, token } = useMemberAuthStore();
  const [loading, setLoading] = useState(true);
  const [myMemberships, setMyMemberships] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);


  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch joined organizations
      const orgsRes = await api.get('/member/organizations/mine');
      if (orgsRes.data?.data) {
        setMyMemberships(orgsRes.data.data);
      }

      // 2. Fetch all upcoming/active events
      const eventsRes = await api.get('/member/events');
      if (eventsRes.data?.data) {
        setEvents(eventsRes.data.data);
      }

      // 3. Fetch announcements
      const announcementsRes = await api.get('/member/announcements');
      if (announcementsRes.data?.data) {
        setAnnouncements(announcementsRes.data.data);
      }
    } catch (error) {
      console.error('Failed to load student dashboard content', error);
      toast.error('Failed to load dashboard parameters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);



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

  const approvedMemberships = myMemberships.filter(m => m.status === 'approved');
  const pendingMemberships = myMemberships.filter(m => m.status === 'pending');
  const upcomingEvents = events.filter(e => new Date(e.start_at) > new Date() && e.status !== 'cancelled').slice(0, 3);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in text-left">
      
      {/* Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800/80 bg-gradient-to-r from-violet-600/20 via-violet-950/10 to-slate-950 p-8 shadow-xl">
        <div className="absolute top-0 right-0 -z-10 h-full w-1/3 bg-radial-gradient from-violet-500/10 to-transparent blur-2xl" />
        <h3 className="text-2xl font-extrabold text-white">Welcome back, {user?.name}!</h3>
        <p className="text-sm text-slate-400 mt-1 max-w-xl">
          Discover new student organizations, RSVP to upcoming campus events, check in to events with one click, and review announcements.
        </p>
      </div>

      {/* Metrics Grids */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/20 backdrop-blur-md p-5 hover:border-slate-800 transition-all shadow-lg flex flex-col justify-between">
          <div>
            <div className="h-9 w-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-3">
              <Users2 className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">My Approved Clubs</p>
            <h4 className="text-3xl font-extrabold text-white mt-1">{approvedMemberships.length}</h4>
          </div>
          <Link href="/organizations" className="text-xs text-violet-400 hover:text-violet-300 font-bold flex items-center gap-1 mt-4 transition-colors">
            View all my organizations <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="rounded-xl border border-slate-800/60 bg-slate-900/20 backdrop-blur-md p-5 hover:border-slate-800 transition-all shadow-lg flex flex-col justify-between">
          <div>
            <div className="h-9 w-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
              <Calendar className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upcoming Events</p>
            <h4 className="text-3xl font-extrabold text-white mt-1">{upcomingEvents.length}</h4>
          </div>
          <Link href="/events" className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 mt-4 transition-colors">
            Browse campus calendar <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="rounded-xl border border-slate-800/60 bg-slate-900/20 backdrop-blur-md p-5 hover:border-slate-800 transition-all shadow-lg flex flex-col justify-between">
          <div>
            <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
              <AlertCircle className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Roster Requests</p>
            <h4 className="text-3xl font-extrabold text-white mt-1">{pendingMemberships.length}</h4>
          </div>
          <Link href="/organizations" className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 mt-4 transition-colors">
            Check application states <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {/* Core Schedule Feed */}
        <div className="space-y-6">
          
          {/* Upcoming Schedule Calendar */}
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/20 backdrop-blur-md p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-violet-400" /> Upcoming Schedules
            </h3>
            <div className="space-y-4">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 font-medium">
                  No upcoming events scheduled. Join active clubs to get their updates!
                </div>
              ) : (
                upcomingEvents.map((e) => (
                  <div key={e.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800/40 pb-4 last:border-b-0 last:pb-0">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white hover:text-violet-400 transition-colors">
                        <Link href={`/events/${e.id}`}>{e.title}</Link>
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-slate-500" /> {e.location || e.venue || 'TBA'}</span>
                        <span className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-slate-500" /> {new Date(e.start_at).toLocaleDateString()} at {new Date(e.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <Link 
                      href={`/events/${e.id}`}
                      className="mt-3 sm:mt-0 text-xs px-3.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-900 font-bold transition-all text-slate-300 hover:text-white"
                    >
                      View Details
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Announcements Feed Bulletins */}
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/20 backdrop-blur-md p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Radio className="h-4.5 w-4.5 text-indigo-400 animate-pulse" /> Announcements Feed
            </h3>
            <div className="space-y-4">
              {announcements.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 font-medium">
                  No announcements bulletins found. Pinned updates from your approved clubs appear here.
                </div>
              ) : (
                announcements.map((a) => (
                  <div key={a.id} className="p-4 rounded-xl border border-slate-800/60 bg-slate-950/40 relative">
                    {a.is_pinned === 1 && (
                      <span className="absolute top-3 right-4 px-2 py-0.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-[9px] font-extrabold text-violet-400 tracking-wider uppercase animate-pulse">
                        Pinned
                      </span>
                    )}
                    <h4 className="text-sm font-bold text-white pr-16">{a.title}</h4>
                    <p className="text-xs text-slate-400 font-medium mt-2 leading-relaxed whitespace-pre-wrap">{a.content}</p>
                    <div className="flex items-center gap-2.5 mt-3 pt-3 border-t border-slate-900 text-[10px] text-slate-500 font-bold">
                      <span className="text-violet-400">{a.organization?.name || 'Club'}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-850" />
                      <span>{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
