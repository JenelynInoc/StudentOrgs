'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  ChevronLeft, 
  UserCheck, 
  CheckCircle2, 
  XCircle,
  Building,
  Award,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import api from '@/services/api';

export default function EventDetails() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [eventData, setEventData] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const fetchEventDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/member/events/${eventId}`);
      if (response.data?.data) {
        setEventData(response.data.data.event);
        setAttendance(response.data.data.attendance);
      }
    } catch (error) {
      console.error('Failed to load event details', error);
      toast.error('Failed to load event specifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    try {
      const response = await api.post(`/member/events/${eventId}/checkin`);

      if (response.data) {
        toast.success('Attendance confirmed successfully!');
        fetchEventDetails();
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Check-in failed. Are you a registered club member?';
      toast.error(msg);
    } finally {
      setIsCheckingIn(false);
    }
  };

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

  if (!eventData) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Event specifications not found.</p>
        <button onClick={() => router.push('/events')} className="mt-4 text-xs text-violet-400 hover:underline">
          Return to calendar index
        </button>
      </div>
    );
  }

  const startAtDate = new Date(eventData.start_at);
  const endAtDate = new Date(eventData.end_at);

  const formattedStartDate = startAtDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTimeRange = `${startAtDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endAtDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6 pb-12 animate-fade-in text-left">
      
      {/* Breadcrumb Header */}
      <button 
        onClick={() => router.push('/events')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> Back to calendar
      </button>

      {/* Main Jumbotron */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/10 backdrop-blur-md p-6 sm:p-8 shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/5 text-[9px] font-extrabold text-violet-400 tracking-wider uppercase">
              {eventData.organization?.acronym || eventData.organization?.name?.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase() || 'Campus Event'}
            </span>
            <span className="text-[10px] text-slate-500 font-bold font-mono tracking-wider">
              {formattedStartDate}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
            {eventData.title}
          </h2>
          <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Building className="h-4 w-4 text-violet-400" /> Hosted by{' '}
            <Link 
              href={`/organizations/${eventData.organization?.id}`} 
              className="text-violet-400 hover:underline font-bold"
            >
              {eventData.organization?.name}
            </Link>
          </p>
        </div>

        {/* Dynamic attendance status indicator */}
        <div className="w-full lg:w-auto shrink-0">
          {attendance ? (
            <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">Checked In Successfully</p>
                <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                  Logged {new Date(attendance.checked_in_at).toLocaleString()}
                </p>
              </div>
            </div>
          ) : eventData.status === 'cancelled' ? (
            <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
              <XCircle className="h-5 w-5 shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">Event Cancelled</p>
                <p className="text-[9px] text-slate-400 mt-0.5">This scheduling is no longer active.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
              <AlertCircle className="h-5 w-5 shrink-0 animate-pulse" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">Not Checked In</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Click the button below to confirm your attendance.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Info detail block */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/10 backdrop-blur-md p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-900 pb-2">
              Event Description
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
              {eventData.description || 'No descriptive context was provided by the hosting student organization.'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/10 backdrop-blur-md p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-900 pb-2">
              Hosting Club Profile
            </h3>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h4 className="text-sm font-bold text-white">
                  {eventData.organization?.name}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed font-medium mt-1">
                  {eventData.organization?.description || 'Learn more about this club\'s activities.'}
                </p>
              </div>
              <Link
                href={`/organizations/${eventData.organization?.id}`}
                className="inline-flex items-center justify-center gap-1.5 text-xs py-2 px-4 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-900 font-bold transition-all text-slate-300 hover:text-white text-center"
              >
                <Award className="h-4 w-4 text-violet-400" /> Visit Club Space
              </Link>
            </div>
          </div>
        </div>

        {/* Check-in panel */}
        <div className="space-y-6">
          
          {/* Quick Attendance Check-in Widget */}
          {!attendance && eventData.status !== 'cancelled' && eventData.status !== 'completed' && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/10 backdrop-blur-md p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <UserCheck className="h-4.5 w-4.5 text-violet-400" />
                <span>Attendance Check-in</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                You are logged in as a registered member. Click the button below to confirm your attendance for this event.
              </p>
              
              <Button 
                variant="primary"
                className="w-full gap-2"
                isLoading={isCheckingIn}
                onClick={handleCheckIn}
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirm My Attendance
              </Button>
            </div>
          )}

          {/* Logistics card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/10 backdrop-blur-md p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-900 pb-2">
              Logistics
            </h3>
            
            <div className="space-y-4 text-xs font-medium">
              <div className="flex gap-3">
                <MapPin className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Event Venue</span>
                  <span className="text-slate-200 block mt-0.5 font-semibold">{eventData.location || eventData.venue || 'TBA'}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <Clock className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Timelines</span>
                  <span className="text-slate-200 block mt-0.5 font-semibold">{formattedTimeRange}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <Calendar className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Hosting Group</span>
                  <span className="text-slate-200 block mt-0.5 font-semibold">
                    {eventData.organization?.acronym || eventData.organization?.name?.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase() || 'Campus'} Team
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
