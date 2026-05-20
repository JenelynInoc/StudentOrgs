'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Search, Compass, Users2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/services/api';

export default function ExploreOrganizations() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [myMemberships, setMyMemberships] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all active organizations
      const orgsRes = await api.get('/member/organizations');
      if (orgsRes.data?.data) {
        setOrganizations(orgsRes.data.data);
      }

      // 2. Fetch my memberships status
      const mineRes = await api.get('/member/organizations/mine');
      if (mineRes.data?.data) {
        setMyMemberships(mineRes.data.data);
      }

      // 3. Extract unique departments from the organizations list or fetch them if endpoint exists
      // In SOMS Admin, we retrieved all departments from /api/admin/departments. Let's extract them dynamically 
      // from the organization records to be safe and avoid hitting admin protected routes.
      if (orgsRes.data?.data) {
        const uniqueDeps = Array.from(
          new Map(orgsRes.data.data.map((item: any) => [item.department?.id, item.department])).values()
        ).filter(Boolean);
        setDepartments(uniqueDeps);
      }
    } catch (error) {
      console.error('Failed to load explore organizations data', error);
      toast.error('Failed to load campus organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getMembershipState = (orgId: string) => {
    const found = myMemberships.find(m => m.organization_id === orgId);
    return found ? found.status : null; // approved, pending, rejected, or null
  };

  const handleJoin = async (orgId: string) => {
    setJoiningId(orgId);
    try {
      const response = await api.post(`/member/organizations/${orgId}/join`);
      if (response.data) {
        toast.success('Join request submitted successfully!');
        // Update my memberships status locally
        setMyMemberships(prev => [
          ...prev, 
          { organization_id: orgId, status: 'pending' }
        ]);
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to submit join request';
      toast.error(msg);
    } finally {
      setJoiningId(null);
    }
  };

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = 
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (org.acronym || org.name.split(' ').filter(Boolean).map((n: string) => n[0]).join('')).toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesDept = 
      selectedDepartment === 'all' || 
      org.department?.id === selectedDepartment;

    return matchesSearch && matchesDept;
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
      
      {/* Header Info */}
      <div>
        <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Compass className="h-5 w-5 text-violet-400" /> Explore Student Organizations
        </h3>
        <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
          Browse through the list of official university student organizations, check your membership statuses, and join new student roster networks.
        </p>
      </div>

      {/* Filter panel */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center py-4 border-b border-slate-900">
        
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input 
            type="text"
            placeholder="Search by name or acronym..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-4 py-2 border border-slate-800 rounded-xl bg-slate-950/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
          />
        </div>

        {/* Category selections */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-bold hidden sm:inline">Department:</span>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full sm:w-auto rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-300 outline-none focus:border-violet-500 font-medium transition-all"
          >
            <option value="all">All Departments</option>
            {departments.map((dept: any) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid listing */}
      {filteredOrganizations.length === 0 ? (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/10 p-12 text-center shadow-md">
          <ShieldAlert className="h-10 w-10 text-slate-500 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">No Organizations Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
            No active student clubs match your current search queries or department filtering selections.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrganizations.map((org) => {
            const status = getMembershipState(org.id);
            return (
              <div 
                key={org.id} 
                className="group relative rounded-2xl border border-slate-800 bg-slate-900/10 backdrop-blur-md p-6 hover:border-slate-700/80 transition-all duration-300 shadow-lg flex flex-col justify-between"
              >
                <div>
                  {/* Card Header badges */}
                  <div className="flex justify-between items-start mb-4 gap-2">
                    <span className="px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/5 text-[9px] font-extrabold text-violet-400 tracking-wider uppercase">
                      {org.department?.name || 'General'}
                    </span>
                    {status && (
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                        status === 'approved' 
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' 
                          : status === 'pending'
                          ? 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                          : 'border-red-500/20 bg-red-500/10 text-red-400'
                      }`}>
                        {status}
                      </span>
                    )}
                  </div>

                  {/* Title acronym */}
                  <Link href={`/organizations/${org.id}`} className="block group-hover:text-violet-400 transition-colors">
                    <h4 className="text-lg font-extrabold text-white leading-tight">
                      {org.name}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono block mt-1 tracking-wider uppercase font-bold">
                      {org.acronym || org.name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase()}
                    </span>
                  </Link>

                  {/* description block */}
                  <p className="text-xs text-slate-400 leading-relaxed font-medium mt-3.5 line-clamp-3">
                    {org.description || 'No club summary details provided.'}
                  </p>
                </div>

                {/* Footer Controls */}
                <div className="mt-6 pt-4 border-t border-slate-900/60 flex items-center gap-3">
                  <Link 
                    href={`/organizations/${org.id}`}
                    className="flex-1 text-center text-xs py-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-900 font-bold transition-all text-slate-300 hover:text-white"
                  >
                    View Details
                  </Link>

                  {status === 'approved' ? (
                    <div className="px-4 py-2 rounded-xl border border-emerald-500/25 bg-emerald-500/5 text-[10px] font-extrabold text-emerald-400 text-center uppercase">
                      Joined
                    </div>
                  ) : status === 'pending' ? (
                    <div className="px-4 py-2 rounded-xl border border-amber-500/25 bg-amber-500/5 text-[10px] font-extrabold text-amber-400 text-center uppercase">
                      Pending
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleJoin(org.id)}
                      variant="primary"
                      className="flex-1 py-2 text-xs"
                      isLoading={joiningId === org.id}
                    >
                      Join Club
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
