'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { 
  Users, 
  Search, 
  Filter, 
  UserCheck, 
  UserX, 
  Trash2, 
  Eye, 
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

interface UserItem {
  id: string;
  name: string;
  email: string;
  student_id: string | null;
  role: 'student' | 'officer' | 'admin';
  is_suspended: boolean;
  created_at: string;
}

export default function AdminMembersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [suspendedFilter, setSuspendedFilter] = useState<string>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/admin/users?page=${currentPage}&per_page=10`;
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      if (suspendedFilter !== 'all') {
        url += `&is_suspended=${suspendedFilter === 'suspended' ? '1' : '0'}`;
      }

      const res = await api.get(url);
      setUsers(res.data.data);
      const meta = res.data.meta?.pagination;
      if (meta) {
        setTotalPages(meta.last_page);
        setTotalItems(meta.total);
      }
    } catch (err: any) {
      console.error('Failed to load users list:', err);
      setError(err.response?.data?.message || 'Failed to retrieve members directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, suspendedFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const toggleSuspension = async (userId: string, currentSuspended: boolean) => {
    const action = currentSuspended ? 'restore' : 'suspend';
    const confirmMessage = currentSuspended 
      ? 'Are you sure you want to restore access for this student?' 
      : 'Are you sure you want to suspend this user? They will lose dashboard access immediately.';
      
    if (!confirm(confirmMessage)) return;

    try {
      const res = await api.patch(`/admin/users/${userId}/${action}`);
      toast.success(res.data.message || `User successfully ${action}ed`);
      fetchUsers();
    } catch (err: any) {
      console.error(`Failed to ${action} user:`, err);
      toast.error(err.response?.data?.message || `Failed to complete operation.`);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('WARNING: Are you sure you want to delete this user from the system? This action is permanent.')) return;

    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('Member record deleted successfully.');
      fetchUsers();
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      toast.error(err.response?.data?.message || 'Failed to delete member.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">University Members Directory</h2>
          <p className="text-xs text-slate-500">Search student profiles and manage account authorization status</p>
        </div>
      </div>

      {/* Filters & Actions Panel */}
      <div className="rounded-2xl border border-slate-900 bg-slate-950 p-4.5">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4.5">
          {/* Search bar */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search by name, email, student ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-900 bg-slate-900/20 py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-200 outline-none focus:border-indigo-500 focus:bg-slate-900/40 transition-all placeholder:text-slate-500"
            />
          </div>

          {/* Suspended Filter dropdown */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                <Filter className="h-4 w-4" />
              </span>
              <select
                value={suspendedFilter}
                onChange={(e) => { setSuspendedFilter(e.target.value); setCurrentPage(1); }}
                className="rounded-xl border border-slate-900 bg-slate-900/20 py-2.5 pl-10 pr-6 text-xs font-semibold text-slate-300 outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Suspended Filter</option>
                <option value="active">Active Members Only</option>
                <option value="suspended">Suspended Accounts Only</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all cursor-pointer shrink-0"
            >
              Apply Filter
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/25 bg-red-500/5 text-xs text-red-400 flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Table */}
      <div className="rounded-2xl border border-slate-900 bg-slate-950 overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Populating Roster Directories...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
              <Users className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-300">No member records found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Try refining your searches or adjusting active filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-900/10 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                  <th className="p-4 pl-6">Student Roster Details</th>
                  <th className="p-4">Student ID</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4">Register Date</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60 text-xs text-slate-300">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/10 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center font-bold text-slate-400">
                          {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="overflow-hidden min-w-0">
                          <p className="font-bold text-white group-hover:text-indigo-400 transition-colors truncate">{u.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-400">{u.student_id || '—'}</td>
                    <td className="p-4">
                      {u.is_suspended ? (
                        <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase border bg-red-500/10 text-red-400 border-red-500/15 inline-flex items-center gap-1">
                          <ShieldAlert className="h-3 w-3" /> Suspended
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase border bg-emerald-500/10 text-emerald-400 border-emerald-500/15 inline-flex items-center gap-1">
                          <UserCheck className="h-3 w-3" /> Active
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500">{new Date(u.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="p-4 pr-6 text-right space-x-2">
                      <Link
                        href={`/admin/members/${u.id}`}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-900 bg-slate-950 hover:bg-indigo-950/20 hover:border-indigo-500/30 text-slate-400 hover:text-indigo-400 transition-all cursor-pointer"
                        title="View Member Dossier"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>

                      <button
                        onClick={() => toggleSuspension(u.id, u.is_suspended)}
                        className={`inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-900 bg-slate-950 transition-all cursor-pointer ${
                          u.is_suspended
                            ? 'hover:bg-emerald-950/20 hover:border-emerald-500/30 text-emerald-400'
                            : 'hover:bg-amber-950/20 hover:border-amber-500/30 text-amber-400'
                        }`}
                        title={u.is_suspended ? 'Restore Student Access' : 'Suspend Student Account'}
                      >
                        {u.is_suspended ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                      </button>

                      <button
                        onClick={() => deleteUser(u.id)}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-900 bg-slate-950 hover:bg-red-950/20 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-all cursor-pointer"
                        title="Delete User Record"
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

        {/* Table Footer / Pagination */}
        {!loading && users.length > 0 && (
          <div className="px-6 py-4.5 border-t border-slate-900 flex items-center justify-between text-xs text-slate-500 font-semibold bg-slate-900/5">
            <span>Showing <span className="font-bold text-slate-400">{users.length}</span> of <span className="font-bold text-slate-400">{totalItems}</span> members</span>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-8.5 w-8.5 rounded-lg border border-slate-900 bg-slate-950 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="px-3">Page <span className="font-bold text-slate-300">{currentPage}</span> of {totalPages}</span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-8.5 w-8.5 rounded-lg border border-slate-900 bg-slate-950 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
