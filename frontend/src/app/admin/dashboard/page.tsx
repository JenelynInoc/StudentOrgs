'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import api from '@/services/api';
import { 
  Users, 
  Building2, 
  Calendar, 
  AlertCircle, 
  UserX, 
  ArrowUpRight, 
  Clock, 
  Activity,
  CalendarDays,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  total_users: number;
  total_organizations: number;
  total_events: number;
  pending_approvals: number;
  suspended_users: number;
  events_by_status: Record<string, number>;
  organizations_by_status: Record<string, number>;
}

interface ActivityLog {
  id: string;
  user?: { name: string; email: string };
  action: string;
  description: string;
  ip_address: string;
  created_at: string;
}

interface EventItem {
  id: string;
  title: string;
  venue: string;
  start_at: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  organization?: { name: string; acronym?: string };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { admin } = useAdminAuthStore();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, logsRes, eventsRes] = await Promise.all([
        api.get('/admin/reports/overview'),
        api.get('/admin/activity-logs?per_page=5'),
        api.get('/admin/events?per_page=5')
      ]);

      setStats(overviewRes.data.data);
      setLogs(logsRes.data.data);
      setEvents(eventsRes.data.data);
    } catch (err: any) {
      console.error('Error fetching dashboard content:', err);
      setError(err.response?.data?.message || 'Failed to populate dashboard stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Banner skeleton */}
        <div className="h-32 rounded-3xl bg-slate-900/60 border border-slate-800" />
        
        {/* Stats Grid skeleton */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-900/60 border border-slate-800" />
          ))}
        </div>

        {/* Charts & Lists skeleton */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 h-96 rounded-3xl bg-slate-900/60 border border-slate-800" />
          <div className="h-96 rounded-3xl bg-slate-900/60 border border-slate-800" />
        </div>
      </div>
    );
  }

  // Calculate SVG Graph Coordinates dynamically
  const eventStatusCount = stats?.events_by_status || {};
  const upcomingCount = eventStatusCount.upcoming || 0;
  const ongoingCount = eventStatusCount.ongoing || 0;
  const completedCount = eventStatusCount.completed || 0;
  const cancelledCount = eventStatusCount.cancelled || 0;
  const maxEventVal = Math.max(upcomingCount, ongoingCount, completedCount, cancelledCount, 1);

  return (
    <div className="space-y-8">
      
      {/* Welcome Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-900 bg-gradient-to-r from-indigo-900/20 via-slate-950/20 to-slate-950 p-8 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
            Active Session
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight pt-2">
            Welcome back, {admin?.name || 'Administrator'}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed pt-1">
            Student Organization Management System dashboard. Review active club enrollment rates, oversee student registers, track calendar checks, and audit system configurations.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4.5 rounded-2xl border border-red-500/25 bg-red-500/5 text-sm text-red-400 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
          <button onClick={fetchDashboardData} className="ml-auto underline font-bold cursor-pointer">Retry</button>
        </div>
      )}

      {/* Metrics Card Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1 */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-md hover:border-slate-800 transition-all duration-300 relative group overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 h-16 w-16 bg-indigo-500/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Users</p>
            <div className="h-10 w-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <h4 className="text-3xl font-extrabold text-white tracking-tight">{stats?.total_users || 0}</h4>
            <span className="text-[10px] font-bold text-indigo-400">students</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-md hover:border-slate-800 transition-all duration-300 relative group overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 h-16 w-16 bg-emerald-500/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Organizations</p>
            <div className="h-10 w-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <h4 className="text-3xl font-extrabold text-white tracking-tight">{stats?.total_organizations || 0}</h4>
            <span className="text-[10px] font-bold text-emerald-400">active clubs</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-md hover:border-slate-800 transition-all duration-300 relative group overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 h-16 w-16 bg-amber-500/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Roster Approvals</p>
            <div className="h-10 w-10 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <h4 className="text-3xl font-extrabold text-white tracking-tight">{stats?.pending_approvals || 0}</h4>
            <span className="text-[10px] font-bold text-amber-400">awaiting</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-md hover:border-slate-800 transition-all duration-300 relative group overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 h-16 w-16 bg-red-500/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Suspended Members</p>
            <div className="h-10 w-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <UserX className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <h4 className="text-3xl font-extrabold text-white tracking-tight">{stats?.suspended_users || 0}</h4>
            <span className="text-[10px] font-bold text-red-400">restricted</span>
          </div>
        </div>
      </div>

      {/* Analytics Visualizers & List Feeds */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* SVG Custom Charts Container */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-900 bg-slate-950 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-white">Event Scheduling Breakdown</h3>
              <p className="text-xs text-slate-500">Live summary of events recorded across departments</p>
            </div>
            <Link 
              href="/admin/events" 
              className="text-xs font-bold text-indigo-400 hover:text-indigo-350 flex items-center gap-1 hover:underline transition-colors"
            >
              Manage Events <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* SVG Histograms Chart */}
          <div className="pt-4 flex flex-col md:flex-row gap-8 items-center justify-around bg-slate-900/10 border border-slate-900/40 p-6 rounded-2xl">
            {/* SVG Visual */}
            <div className="relative w-48 h-48 flex items-center justify-center">
              {/* Draw a gorgeous SVG Semi-Donut or Radial Chart */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#0f172a" strokeWidth="10" fill="transparent" />
                
                {/* Upcoming segment */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  stroke="#6366f1" 
                  strokeWidth="10" 
                  fill="transparent" 
                  strokeDasharray={`${(upcomingCount / maxEventVal) * 125} 251`}
                  strokeDashoffset="0"
                />

                {/* Completed segment */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  stroke="#10b981" 
                  strokeWidth="10" 
                  fill="transparent" 
                  strokeDasharray={`${(completedCount / maxEventVal) * 70} 251`}
                  strokeDashoffset={`-${(upcomingCount / maxEventVal) * 125}`}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black text-white">{stats?.total_events || 0}</span>
                <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">Total Events</span>
              </div>
            </div>

            {/* Custom Interactive Legend */}
            <div className="flex-1 w-full max-w-xs space-y-4">
              {/* Row 1 */}
              <div className="flex items-center justify-between text-sm border-b border-slate-900 pb-2">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/20" />
                  <span className="font-semibold text-slate-400">Upcoming Scheduler</span>
                </div>
                <span className="font-black text-white">{upcomingCount}</span>
              </div>

              {/* Row 2 */}
              <div className="flex items-center justify-between text-sm border-b border-slate-900 pb-2">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20" />
                  <span className="font-semibold text-slate-400">Completed Sessions</span>
                </div>
                <span className="font-black text-white">{completedCount}</span>
              </div>

              {/* Row 3 */}
              <div className="flex items-center justify-between text-sm border-b border-slate-900 pb-2">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-sky-500 shadow-sm shadow-sky-500/20" />
                  <span className="font-semibold text-slate-400">Ongoing Operations</span>
                </div>
                <span className="font-black text-white">{ongoingCount}</span>
              </div>

              {/* Row 4 */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-red-500 shadow-sm shadow-red-500/20" />
                  <span className="font-semibold text-slate-400">Cancelled / Suspended</span>
                </div>
                <span className="font-black text-white">{cancelledCount}</span>
              </div>
            </div>
          </div>

          {/* Core system activities logs table summary */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-white">Platform Activity Audits</h4>
                <p className="text-[11px] text-slate-500">Latest admin operations and authentication tracks</p>
              </div>
              <Link 
                href="/admin/activity-logs" 
                className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-0.5"
              >
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-900/60 border border-slate-900 rounded-2xl overflow-hidden bg-slate-950">
              {logs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 italic">No activity logs recorded.</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-4 flex items-start gap-4 hover:bg-slate-900/10 transition-colors">
                    <div className="h-8.5 w-8.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="overflow-hidden min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-white truncate">{log.description}</p>
                        <p className="text-[10px] font-semibold text-slate-500 shrink-0">
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 uppercase font-mono tracking-wider">
                          {log.action}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate">
                          by {log.user?.name || 'System Operator'} • IP: {log.ip_address}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Events Agenda */}
        <div className="rounded-3xl border border-slate-900 bg-slate-950 p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-white">Upcoming Events Schedules</h3>
            <p className="text-xs text-slate-500">Next active school capstones and panels</p>
          </div>

          <div className="relative border-l border-slate-900 pl-4.5 ml-2.5 space-y-8 py-2">
            {events.length === 0 ? (
              <div className="text-xs text-slate-500 italic text-center py-10">No upcoming events listed.</div>
            ) : (
              events.map((ev) => (
                <div key={ev.id} className="relative group">
                  {/* Timeline bullet */}
                  <span className="absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full bg-slate-950 border border-slate-900 flex items-center justify-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 group-hover:scale-150 transition-transform duration-200" />
                  </span>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-400 flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                        {new Date(ev.start_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                        ev.status === 'ongoing' 
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' 
                          : ev.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}>
                        {ev.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors pt-1">
                      {ev.title}
                    </h4>
                    
                    <p className="text-[10px] text-slate-500">
                      Venue: <span className="font-semibold text-slate-400">{ev.venue || 'TBD'}</span>
                    </p>
                    
                    {ev.organization && (
                      <p className="text-[9px] font-bold text-indigo-500/60 uppercase tracking-wider">
                        By {ev.organization.name}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <Link
            href="/admin/events"
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-slate-900 hover:bg-indigo-650/15 border border-slate-850 hover:border-indigo-500/20 rounded-2xl text-xs font-bold text-slate-400 hover:text-indigo-400 transition-all cursor-pointer"
          >
            Go to Events Planner
          </Link>
        </div>

      </div>

    </div>
  );
}
