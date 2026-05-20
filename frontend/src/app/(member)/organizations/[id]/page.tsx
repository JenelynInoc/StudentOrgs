'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  Users2, 
  Calendar, 
  Radio, 
  MapPin, 
  Clock, 
  ChevronLeft, 
  Award, 
  Bookmark,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import api from '@/services/api';

export default function OrganizationDetails() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;

  const [orgData, setOrgData] = useState<any>(null);
  const [membershipStatus, setMembershipStatus] = useState<string | null>(null);
  const [joinedAt, setJoinedAt] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      // 1. Fetch organization profiles & rosters
      const response = await api.get(`/member/organizations/${orgId}`);
      if (response.data?.data) {
        setOrgData(response.data.data.organization);
        setMembershipStatus(response.data.data.membership_status);
        setJoinedAt(response.data.data.joined_at);
      }

      // 2. Fetch all events (filter locally for this org)
      const eventsRes = await api.get('/member/events');
      if (eventsRes.data?.data) {
        setEvents(eventsRes.data.data.filter((e: any) => e.organization_id === orgId));
      }

      // 3. Fetch announcements if user is a member
      if (response.data?.data?.membership_status === 'approved') {
        const announcementsRes = await api.get('/member/announcements');
        if (announcementsRes.data?.data) {
          setAnnouncements(announcementsRes.data.data.filter((a: any) => a.organization_id === orgId));
        }
      }
    } catch (error) {
      console.error('Failed to load organization profile', error);
      toast.error('Failed to retrieve club profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) {
      fetchDetails();
    }
  }, [orgId]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const response = await api.post(`/member/organizations/${orgId}/join`);
      if (response.data) {
        toast.success('Join request submitted successfully!');
        setMembershipStatus('pending');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to submit join request';
      toast.error(msg);
    } finally {
      setJoining(false);
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

  if (!orgData) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Organization profile not found.</p>
        <button onClick={() => router.push('/organizations')} className="mt-4 text-xs text-violet-400 hover:underline">
          Return to club directory
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in text-left">
      
      {/* Breadcrumb Back Button */}
      <button 
        onClick={() => router.push('/organizations')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> Back to explore directory
      </button>

      {/* Main Jumbotron Header card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/10 backdrop-blur-md p-6 sm:p-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/5 text-[9px] font-extrabold text-violet-400 tracking-wider uppercase">
              {orgData.department?.name || 'General'}
            </span>
            <span className="text-xs text-slate-500 font-mono tracking-wider font-bold">
              {orgData.acronym || orgData.name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase()}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
            {orgData.name}
          </h2>
          {membershipStatus === 'approved' && joinedAt && (
            <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Approved Member (Joined {new Date(joinedAt).toLocaleDateString()})
            </p>
          )}
        </div>

        {/* Join button triggers */}
        <div className="w-full md:w-auto">
          {membershipStatus === 'approved' ? (
            <div className="px-5 py-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-xs font-extrabold text-emerald-400 text-center uppercase tracking-wider">
              Approved Active Member
            </div>
          ) : membershipStatus === 'pending' ? (
            <div className="px-5 py-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 text-xs font-extrabold text-amber-400 text-center uppercase tracking-wider">
              Roster Request Pending
            </div>
          ) : (
            <Button
              onClick={handleJoin}
              variant="primary"
              className="w-full md:w-auto px-6 py-2.5 text-sm"
              isLoading={joining}
            >
              Apply for Club Membership
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Detail Contents */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Summary description */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/10 backdrop-blur-md p-6 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Club Summary & Mission</h3>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
              {orgData.description || 'No detailed mission values or description has been logged yet for this organization.'}
            </p>
          </div>

          {/* Announcements Board */}
          {membershipStatus === 'approved' && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/10 backdrop-blur-md p-6 shadow-xl">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Radio className="h-4.5 w-4.5 text-violet-400" /> Club Announcements
              </h3>
              <div className="space-y-4">
                {announcements.length === 0 ? (
                  <p className="text-xs text-slate-500 font-medium py-2">No official announcements have been pinned recently.</p>
                ) : (
                  announcements.map((a) => (
                    <div key={a.id} className="p-4 rounded-xl border border-slate-805 bg-slate-950/40 relative">
                      {a.is_pinned === 1 && (
                        <span className="absolute top-3.5 right-4 px-2 py-0.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-[9px] font-extrabold text-violet-400 tracking-wider uppercase">
                          Pinned
                        </span>
                      )}
                      <h4 className="text-sm font-bold text-white pr-16">{a.title}</h4>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed whitespace-pre-wrap font-medium">{a.content}</p>
                      <span className="text-[9px] text-slate-500 font-mono mt-3 block">
                        Posted {new Date(a.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Scheduled Events lists */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/10 backdrop-blur-md p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-cyan-400" /> Event Calendar
            </h3>
            <div className="space-y-4">
              {events.length === 0 ? (
                <p className="text-xs text-slate-500 font-medium py-2">No events are currently scheduled by this club.</p>
              ) : (
                events.map((e) => (
                  <div key={e.id} className="flex justify-between items-center border-b border-slate-800/40 pb-4 last:border-b-0 last:pb-0">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">
                        <Link href={`/events/${e.id}`} className="hover:text-violet-400 transition-colors">{e.title}</Link>
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-slate-500" /> {e.location}</span>
                        <span className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-slate-500" /> {new Date(e.start_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Link 
                      href={`/events/${e.id}`}
                      className="text-xs px-3.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-900 font-bold transition-all text-slate-300 hover:text-white"
                    >
                      Details
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Side Officers Column */}
        <div className="space-y-6">
          
          {/* Officers roster details widget */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/10 backdrop-blur-md p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="h-4.5 w-4.5 text-amber-400" /> Executive Council
            </h3>
            <div className="space-y-3.5">
              {!orgData.officers || orgData.officers.length === 0 ? (
                <p className="text-xs text-slate-500 font-medium">No officers listed on roster details yet.</p>
              ) : (
                orgData.officers.map((off: any) => (
                  <div key={off.id} className="flex items-center gap-3">
                    {off.user?.avatar ? (
                      <img src={off.user.avatar} alt={off.user.name} className="h-8.5 w-8.5 rounded-full object-cover border border-slate-850" />
                    ) : (
                      <div className="h-8.5 w-8.5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                        {off.user?.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <span className="text-xs font-bold text-white block">{off.user?.name || 'Officer'}</span>
                      <span className="text-[10px] text-amber-400 font-bold tracking-wide">{off.officer_title || 'Officer'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick contact values */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/10 backdrop-blur-md p-6 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Contact Roster</h3>
            <div className="space-y-2 text-xs font-medium">
              <div>
                <span className="text-slate-500 block text-[10px] font-bold">Email Contacts</span>
                <span className="text-slate-300 select-all font-semibold block mt-0.5">
                  {(orgData.acronym || orgData.name.split(' ').filter(Boolean).map((n: string) => n[0]).join('')).toLowerCase()}@school.edu
                </span>
              </div>
              <div className="pt-2">
                <span className="text-slate-500 block text-[10px] font-bold">Campus Room Space</span>
                <span className="text-slate-300 font-semibold block mt-0.5">Hall Room 304, Admin Wing</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
