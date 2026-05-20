'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { 
  Building2, 
  ArrowLeft, 
  Users, 
  Calendar, 
  X, 
  Check, 
  UserMinus, 
  AlertCircle,
  Clock
} from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email: string;
  student_id: string | null;
  pivot: {
    status: 'pending' | 'approved' | 'rejected';
    joined_at: string | null;
  };
}

interface EventItem {
  id: string;
  title: string;
  venue: string;
  start_at: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

interface OrgDetail {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  department?: { name: string; code: string };
  members: Member[];
  events: EventItem[];
}

export default function AdminOrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;

  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrgDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/admin/organizations/${orgId}`);
      setOrg(res.data.data);
    } catch (err: any) {
      console.error('Failed to load organization dossier:', err);
      setError(err.response?.data?.message || 'Failed to populate organization dossier.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) {
      fetchOrgDetails();
    }
  }, [orgId]);

  const handleApprove = async (userId: string) => {
    try {
      await api.post(`/admin/organizations/${orgId}/approve-member/${userId}`);
      toast.success('Membership request approved.');
      fetchOrgDetails();
    } catch (err: any) {
      console.error('Failed to approve membership:', err);
      toast.error(err.response?.data?.message || 'Failed to approve member.');
    }
  };

  const handleRemove = async (userId: string, isPending: boolean = false) => {
    const action = isPending ? 'reject' : 'remove';
    if (!confirm(`Are you sure you want to ${action} this student's membership?`)) return;

    try {
      await api.delete(`/admin/organizations/${orgId}/remove-member/${userId}`);
      toast.success(isPending ? 'Membership request rejected.' : 'Member removed from roster.');
      fetchOrgDetails();
    } catch (err: any) {
      console.error(`Failed to ${action} membership:`, err);
      toast.error(err.response?.data?.message || `Failed to ${action} member.`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-24 bg-slate-900 rounded-xl" />
        <div className="h-44 bg-slate-900 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-900 rounded-3xl" />
          <div className="h-80 bg-slate-900 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="space-y-4">
        <button 
          onClick={() => router.push('/admin/organizations')}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-900 bg-slate-950 text-slate-400 hover:text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Organizations
        </button>
        <div className="p-6 rounded-2xl border border-red-500/25 bg-red-500/5 text-sm text-red-400 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error || 'Unable to locate organization record.'}</span>
        </div>
      </div>
    );
  }

  const approvedMembers = org.members.filter(m => m.pivot?.status === 'approved');
  const pendingMembers = org.members.filter(m => m.pivot?.status === 'pending');

  return (
    <div className="space-y-8">
      
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push('/admin/organizations')}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-900 bg-slate-950 text-slate-400 hover:text-white rounded-xl text-xs font-semibold hover:border-slate-800 transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Organizations
        </button>
      </div>

      {/* Organization Info Banner */}
      <div className="rounded-3xl border border-slate-900 bg-slate-950 p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="absolute top-0 right-0 -translate-y-8 translate-x-8 h-44 w-44 rounded-full bg-indigo-500/5 blur-xl pointer-events-none" />
        
        <div className="h-16 w-16 rounded-2xl bg-indigo-650/10 border border-indigo-500/25 flex items-center justify-center font-bold text-2xl text-indigo-400 shrink-0">
          <Building2 className="h-8 w-8" />
        </div>

        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-xl font-extrabold text-white tracking-tight">{org.name}</h3>
            <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase border ${
              org.status === 'active' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15' 
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}>
              {org.status}
            </span>
            {org.department && (
              <span className="font-mono text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/15 px-2 py-0.5 rounded text-[10px]">
                {org.department.code} Department
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">{org.description || 'No description cataloged for this organization.'}</p>
        </div>
      </div>

      {/* Split Roster vs Events Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Roster column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Pending applications */}
          <div className="rounded-3xl border border-slate-900 bg-slate-950 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-900/60 pb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-amber-500" />
                <h4 className="text-sm font-extrabold text-white">Pending Roster Applications</h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] text-amber-400 font-extrabold">
                {pendingMembers.length} Awaiting
              </span>
            </div>

            {pendingMembers.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-3">No pending applications for this organization.</p>
            ) : (
              <div className="divide-y divide-slate-900/60 border border-slate-900 rounded-2xl overflow-hidden bg-slate-950/20">
                {pendingMembers.map((m) => (
                  <div key={m.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-900/5 transition-colors">
                    <div className="overflow-hidden min-w-0">
                      <p className="font-bold text-white text-xs">{m.name}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{m.email} • ID: <span className="font-mono text-slate-400 font-bold">{m.student_id || '—'}</span></p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleApprove(m.id)}
                        className="inline-flex items-center justify-center h-8.5 px-3 rounded-lg border border-emerald-900 bg-emerald-950/10 hover:bg-emerald-600 hover:border-emerald-500 text-xs font-bold text-emerald-400 hover:text-white transition-all cursor-pointer"
                      >
                        <Check className="h-4 w-4 mr-1 shrink-0" /> Approve
                      </button>
                      <button
                        onClick={() => handleRemove(m.id, true)}
                        className="inline-flex items-center justify-center h-8.5 px-3 rounded-lg border border-red-900 bg-red-950/10 hover:bg-red-650/20 text-xs font-bold text-red-400 hover:text-red-300 transition-all cursor-pointer"
                      >
                        <X className="h-4 w-4 mr-1 shrink-0" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active members */}
          <div className="rounded-3xl border border-slate-900 bg-slate-950 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-900/60 pb-4">
              <div className="flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-indigo-400" />
                <h4 className="text-sm font-extrabold text-white">Active Roster Directory</h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] text-indigo-400 font-extrabold">
                {approvedMembers.length} Members
              </span>
            </div>

            {approvedMembers.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-3">No active members approved in this roster.</p>
            ) : (
              <div className="divide-y divide-slate-900/60 border border-slate-900 rounded-2xl overflow-hidden bg-slate-950/20">
                {approvedMembers.map((m) => (
                  <div key={m.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-900/5 transition-colors">
                    <div className="overflow-hidden min-w-0">
                      <p className="font-bold text-white text-xs">{m.name}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {m.email} • ID: <span className="font-mono text-slate-400 font-bold">{m.student_id || '—'}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemove(m.id, false)}
                      className="inline-flex items-center justify-center h-8.5 w-8.5 rounded-lg border border-slate-905 hover:bg-red-950/20 hover:border-red-500/30 text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                      title="Kick from Roster"
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Associated events list */}
        <div className="rounded-3xl border border-slate-900 bg-slate-950 p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-900 pb-4">
            <Calendar className="h-4.5 w-4.5 text-indigo-400" />
            <h4 className="text-sm font-extrabold text-white">Event Caps</h4>
          </div>

          <div className="space-y-4">
            {org.events.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-8">No events hosted by this organization.</p>
            ) : (
              org.events.map((ev) => (
                <Link 
                  key={ev.id} 
                  href={`/admin/events/${ev.id}`}
                  className="block p-4 border border-slate-900 hover:border-indigo-500/25 bg-slate-900/20 hover:bg-indigo-950/5 rounded-2xl transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-indigo-400">
                      {new Date(ev.start_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                      ev.status === 'completed' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    }`}>
                      {ev.status}
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors mt-2.5">{ev.title}</h5>
                  <p className="text-[10px] text-slate-500 mt-1 truncate">Venue: {ev.venue || 'TBD'}</p>
                </Link>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
