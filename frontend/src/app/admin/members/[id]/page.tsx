'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Hash, 
  ShieldAlert, 
  UserCheck, 
  Clock, 
  Building2, 
  History,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface UserDetail {
  id: string;
  name: string;
  email: string;
  student_id: string | null;
  role: 'student' | 'officer' | 'admin';
  is_suspended: boolean;
  created_at: string;
  updated_at: string;
}

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  ip_address: string;
  created_at: string;
}

export default function AdminMemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMemberDossier = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userRes, logsRes] = await Promise.all([
        api.get(`/admin/users/${userId}`),
        api.get(`/admin/activity-logs?user_id=${userId}&per_page=10`)
      ]);
      setUserDetail(userRes.data.data);
      setLogs(logsRes.data.data);
    } catch (err: any) {
      console.error('Failed to load user details:', err);
      setError(err.response?.data?.message || 'Failed to populate member dossier.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchMemberDossier();
    }
  }, [userId]);

  const toggleSuspension = async () => {
    if (!userDetail) return;
    const action = userDetail.is_suspended ? 'restore' : 'suspend';
    const confirmMessage = userDetail.is_suspended
      ? 'Restore access permissions for this student?'
      : 'Suspend account? They will lose access to the system immediately.';

    if (!confirm(confirmMessage)) return;

    try {
      const res = await api.patch(`/admin/users/${userId}/${action}`);
      toast.success(res.data.message || `User successfully ${action}ed`);
      fetchMemberDossier();
    } catch (err: any) {
      console.error(`Failed to toggle suspension state:`, err);
      toast.error(err.response?.data?.message || 'Failed to update user authorization.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-24 bg-slate-900 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 h-80 bg-slate-900 rounded-3xl" />
          <div className="lg:col-span-2 h-80 bg-slate-900 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error || !userDetail) {
    return (
      <div className="space-y-4">
        <button 
          onClick={() => router.push('/admin/members')}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-900 bg-slate-950 text-slate-400 hover:text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Members
        </button>
        <div className="p-6 rounded-2xl border border-red-500/25 bg-red-500/5 text-sm text-red-400 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error || 'Unable to locate student record.'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push('/admin/members')}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-900 bg-slate-950 text-slate-400 hover:text-white rounded-xl text-xs font-semibold hover:border-slate-800 transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Members
        </button>
      </div>

      {/* Grid details layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-3xl border border-slate-900 bg-slate-950 p-6 relative overflow-hidden flex flex-col items-center text-center">
            {/* Visual background accent */}
            <div className="absolute top-0 right-0 -translate-y-8 translate-x-8 h-32 w-32 rounded-full bg-indigo-500/5 blur-xl pointer-events-none" />
            
            {/* Avatar block */}
            <div className="h-20 w-20 rounded-2xl bg-indigo-600/10 border border-indigo-500/25 flex items-center justify-center font-black text-2xl text-indigo-400 shrink-0 shadow-lg shadow-indigo-500/5">
              {userDetail.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>

            <h3 className="text-lg font-extrabold text-white tracking-tight mt-4">{userDetail.name}</h3>
            <span className="px-2.5 py-0.5 mt-1 rounded-lg text-[9px] font-extrabold uppercase border bg-indigo-500/10 text-indigo-400 border-indigo-500/15">
              {userDetail.role}
            </span>

            {/* Profile specifications list */}
            <div className="w-full space-y-3.5 mt-8 border-t border-slate-900/60 pt-6 text-left">
              <div className="flex items-center gap-3 text-xs">
                <Mail className="h-4 w-4 text-slate-500 shrink-0" />
                <span className="text-slate-400 truncate" title={userDetail.email}>{userDetail.email}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <Hash className="h-4 w-4 text-slate-500 shrink-0" />
                <span className="font-mono font-bold text-slate-400">{userDetail.student_id || 'No Student ID Provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <Clock className="h-4 w-4 text-slate-500 shrink-0" />
                <span className="text-slate-400">Registered: {new Date(userDetail.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                {userDetail.is_suspended ? (
                  <>
                    <ShieldAlert className="h-4 w-4 text-red-500 shrink-0 animate-pulse" />
                    <span className="font-semibold text-red-400">Suspended from Platform</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="font-semibold text-emerald-400">Active Access Granted</span>
                  </>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="w-full mt-8 border-t border-slate-900/60 pt-6">
              <button
                onClick={toggleSuspension}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  userDetail.is_suspended
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/10'
                    : 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400'
                }`}
              >
                {userDetail.is_suspended ? 'Restore System Access' : 'Suspend System Access'}
              </button>
            </div>
          </div>
        </div>

        {/* Member Operations & Affiliations Feed */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Member activity timelines audit */}
          <div className="rounded-3xl border border-slate-900 bg-slate-950 p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-400">
                <History className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Student Audit Activity Timelines</h3>
                <p className="text-xs text-slate-500">History of check-ins, registration, and administrative logs</p>
              </div>
            </div>

            <div className="relative border-l border-slate-900 pl-4.5 ml-2 py-1 space-y-6">
              {logs.length === 0 ? (
                <div className="text-xs text-slate-500 italic py-6 text-center border border-dashed border-slate-900 rounded-xl">
                  No activity audits logged for this member.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="relative group">
                    {/* Timeline bullet */}
                    <span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full bg-slate-950 border border-slate-900 flex items-center justify-center">
                      <span className="h-1 w-1 rounded-full bg-indigo-400" />
                    </span>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 uppercase font-mono tracking-wider">
                          {log.action}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(log.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white pt-1">{log.description}</p>
                      <p className="text-[10px] text-slate-500">Network IP Address: {log.ip_address}</p>
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
