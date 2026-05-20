'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Building,
  User,
  ArrowLeft,
  Hash,
  Copy,
  Plus,
  Trash2,
  AlertCircle,
  FileSpreadsheet,
  UserCheck,
  Search,
  BadgeAlert
} from 'lucide-react';

interface UserItem {
  id: string;
  name: string;
  student_id: string;
  email: string;
}

interface AttendanceItem {
  id: string;
  event_id: string;
  user_id: string;
  checked_in_at: string;
  method: 'self' | 'qr' | 'manual';
  user?: UserItem;
}

interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  venue: string | null;
  start_at: string;
  end_at: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  organization_id: string;
  qr_token: string;
  organization?: { id: string; name: string };
  creator?: { id: string; name: string };
}

export default function AdminEventDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const eventId = params.id;
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Manual Check-in Form
  const [studentId, setStudentId] = useState('');
  const [isSubmittingCheckin, setIsSubmittingCheckin] = useState(false);

  // Attendance Filter / Search
  const [searchTerm, setSearchTerm] = useState('');

  const fetchEventData = async () => {
    setLoading(true);
    setError(null);
    try {
      const eventRes = await api.get(`/admin/events/${eventId}`);
      setEvent(eventRes.data.data);

      const attendanceRes = await api.get(`/admin/events/${eventId}/attendance`);
      setAttendance(attendanceRes.data.data);
    } catch (err: any) {
      console.error('Failed to fetch event dossier:', err);
      setError(err.response?.data?.message || 'Failed to load event details or attendance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  const handleManualCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim()) return;
    setIsSubmittingCheckin(true);

    try {
      const res = await api.post(`/admin/events/${eventId}/attendance`, {
        student_id: studentId.trim(),
      });
      toast.success(res.data.message || 'Attendance registered successfully.');
      setStudentId('');
      
      // Re-fetch attendance
      const attendanceRes = await api.get(`/admin/events/${eventId}/attendance`);
      setAttendance(attendanceRes.data.data);
    } catch (err: any) {
      console.error('Manual check-in failed:', err);
      toast.error(err.response?.data?.message || 'Failed to register manual check-in.');
    } finally {
      setIsSubmittingCheckin(false);
    }
  };

  const handleRemoveAttendance = async (attendanceId: string) => {
    if (!confirm('Are you sure you want to remove this student from the attendance record?')) return;

    try {
      await api.delete(`/admin/events/${eventId}/attendance/${attendanceId}`);
      toast.success('Attendance record removed successfully.');
      
      // Re-fetch attendance
      const attendanceRes = await api.get(`/admin/events/${eventId}/attendance`);
      setAttendance(attendanceRes.data.data);
    } catch (err: any) {
      console.error('Failed to remove attendance:', err);
      toast.error(err.response?.data?.message || 'Failed to remove attendance record.');
    }
  };

  const copyEventCode = () => {
    if (!event) return;
    navigator.clipboard.writeText(event.qr_token || '');
    toast.success('Event code copied to clipboard!');
  };

  // Filtered attendance based on search term
  const filteredAttendance = attendance.filter(item => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.user?.name.toLowerCase().includes(term) ||
      item.user?.student_id.toLowerCase().includes(term) ||
      item.user?.email.toLowerCase().includes(term) ||
      item.method.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Retrieving Event dossier...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="space-y-6">
        <Link href="/admin/events" className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Planner
        </Link>
        <div className="p-4 rounded-xl border border-red-500/25 bg-red-500/5 text-xs text-red-400 flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error || 'Failed to locate the designated university event record.'}</span>
        </div>
      </div>
    );
  }



  return (
    <div className="space-y-6">
      
      {/* Back Button */}
      <Link href="/admin/events" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer">
        <ArrowLeft className="h-4 w-4" /> Back to Events Planner
      </Link>

      {/* Event Details Card */}
      <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-6">
        
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase border ${
              event.status === 'upcoming' 
                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/15'
                : event.status === 'ongoing'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/15 animate-pulse'
                : event.status === 'completed'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15'
                : 'bg-red-500/10 text-red-400 border-red-500/15'
            }`}>
              {event.status}
            </span>
            
            <div className="text-[10px] font-mono text-slate-500">
              Event ID: <span className="font-bold">{event.id}</span>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-black text-white tracking-tight leading-snug">{event.title}</h2>
            <p className="text-xs text-slate-400 mt-2 font-medium leading-relaxed bg-slate-900/10 p-3 rounded-xl border border-slate-900/60">
              {event.description || 'No descriptive context provided for this scheduled event.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/30 border border-slate-900">
              <div className="h-9 w-9 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-400 shrink-0">
                <Building className="h-5 w-5" />
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Host Club</p>
                <p className="text-xs font-bold text-white truncate">{event.organization?.name || 'Independent'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/30 border border-slate-900">
              <div className="h-9 w-9 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-400 shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Location Venue</p>
                <p className="text-xs font-bold text-white truncate">{event.venue || 'No Venue Listed'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/30 border border-slate-900">
              <div className="h-9 w-9 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-400 shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Starts Schedule</p>
                <p className="text-xs font-bold text-white truncate">
                  {new Date(event.start_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(event.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/30 border border-slate-900">
              <div className="h-9 w-9 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-400 shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Ends Schedule</p>
                <p className="text-xs font-bold text-white truncate">
                  {new Date(event.end_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(event.end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="h-7 w-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-extrabold text-slate-500">
              {event.creator?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD'}
            </div>
            <span className="text-[10px] font-bold text-slate-400">Planned by {event.creator?.name || 'Administrator'}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-[11px] font-semibold">Attendance Turnout:</span>
            <div className="px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-black text-indigo-400 font-mono">
              {attendance.length} checked-in
            </div>
          </div>
        </div>

      </div>

      {/* Attendance Roster Panel */}
      <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-6">
        
        {/* Panel Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-900/60">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-indigo-400" /> Attendance Registry
            </h3>
            <p className="text-[11px] text-slate-500">Record arriving members, remove mistaken logs, and export printable roster logs</p>
          </div>

          {/* Quick Manual Check-in Form */}
          <form onSubmit={handleManualCheckin} className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Enter Student ID (e.g. 2024-1002)..."
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-[220px] rounded-xl border border-slate-900 bg-slate-900/10 py-2 px-3.5 pr-8 text-xs font-semibold text-slate-200 outline-none focus:border-indigo-500 focus:bg-slate-900/20"
              />
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-600 pointer-events-none">
                #
              </span>
            </div>
            <button
              type="submit"
              disabled={isSubmittingCheckin || !studentId.trim()}
              className="inline-flex items-center gap-1 px-4.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl shadow-md shadow-indigo-600/10 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="h-4.5 w-4.5" /> Log Arrival
            </button>
          </form>
        </div>

        {/* Search bar inside the registry panel */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600 pointer-events-none">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Fuzzy search inside attendance list..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-900 bg-slate-900/10 py-2 pl-9 pr-4 text-xs font-medium text-slate-300 outline-none focus:border-indigo-500 placeholder:text-slate-600"
            />
          </div>
          
          <div className="text-[11px] font-semibold text-slate-500">
            Filtered: <span className="font-bold text-indigo-400">{filteredAttendance.length}</span> of {attendance.length} records
          </div>
        </div>

        {/* Attendance Roster Table */}
        <div className="border border-slate-900 bg-slate-900/10 rounded-xl overflow-hidden">
          {filteredAttendance.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-600 mx-auto">
                <BadgeAlert className="h-5 w-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-400">No matching attendance logs</h4>
              <p className="text-[10px] text-slate-600">Use manual check-in above or ask students to confirm attendance from their event page.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-900/20 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">
                    <th className="p-3.5 pl-5">Student Information</th>
                    <th className="p-3.5">Student ID</th>
                    <th className="p-3.5">Checked-in Time</th>
                    <th className="p-3.5">Check-in Method</th>
                    <th className="p-3.5 pr-5 text-right">Administrative</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40 text-xs text-slate-300">
                  {filteredAttendance.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/10 transition-colors group">
                      <td className="p-3.5 pl-5">
                        <div className="flex items-center gap-3">
                          <div className="h-8.5 w-8.5 rounded-lg bg-indigo-600/10 border border-indigo-500/15 flex items-center justify-center text-xs font-bold text-indigo-400">
                            {item.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'ST'}
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-indigo-400 transition-colors">{item.user?.name || 'Unknown Student'}</p>
                            <p className="text-[10px] text-slate-500">{item.user?.email || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] font-bold text-slate-400">
                        {item.user?.student_id || 'N/A'}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-300">
                        {new Date(item.checked_in_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(item.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase border ${
                          item.method === 'self' 
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/15'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/15'
                        }`}>
                          {item.method === 'self' ? 'Self Check-in' : 'Manual Entry'}
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <button
                          onClick={() => handleRemoveAttendance(item.id)}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-900 bg-slate-950 hover:bg-red-950/20 hover:border-red-500/30 text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                          title="Revoke Attendance Log"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
