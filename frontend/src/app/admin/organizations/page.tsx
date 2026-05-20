'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { 
  Building2, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  X, 
  AlertCircle,
  FolderLock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface OrganizationItem {
  id: string;
  name: string;
  description: string | null;
  department_id: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  department?: { name: string; code: string };
  members_count?: number;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<OrganizationItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department_id: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOrgs = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/admin/organizations?page=${currentPage}&per_page=10`;
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      const res = await api.get(url);
      setOrgs(res.data.data);
      const meta = res.data.meta?.pagination;
      if (meta) {
        setTotalPages(meta.last_page);
        setTotalItems(meta.total);
      }
    } catch (err: any) {
      console.error('Failed to fetch organizations:', err);
      setError(err.response?.data?.message || 'Failed to load school organizations.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/admin/departments');
      setDepartments(res.data.data);
    } catch (err) {
      console.error('Failed to load departments list:', err);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, [currentPage, statusFilter]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOrgs();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Organization name is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        department_id: formData.department_id || null,
        status: formData.status,
      };

      await api.post('/admin/organizations', payload);
      toast.success('Organization created successfully.');
      setIsAddModalOpen(false);
      resetForm();
      fetchOrgs();
    } catch (err: any) {
      console.error('Failed to create organization:', err);
      toast.error(err.response?.data?.message || 'Failed to create organization.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (org: OrganizationItem) => {
    setSelectedOrg(org);
    setFormData({
      name: org.name,
      description: org.description || '',
      department_id: org.department_id || '',
      status: org.status,
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg || !validateForm()) return;
    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        department_id: formData.department_id || null,
        status: formData.status,
      };

      await api.put(`/admin/organizations/${selectedOrg.id}`, payload);
      toast.success('Organization updated successfully.');
      setIsEditModalOpen(false);
      resetForm();
      fetchOrgs();
    } catch (err: any) {
      console.error('Failed to update organization:', err);
      toast.error(err.response?.data?.message || 'Failed to update organization.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (orgId: string) => {
    if (!confirm('Are you sure you want to delete this organization? All active and pending memberships will be suspended.')) return;

    try {
      await api.delete(`/admin/organizations/${orgId}`);
      toast.success('Organization soft-deleted successfully.');
      fetchOrgs();
    } catch (err: any) {
      console.error('Failed to delete organization:', err);
      toast.error(err.response?.data?.message || 'Failed to delete organization.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      department_id: '',
      status: 'active',
    });
    setFormErrors({});
    setSelectedOrg(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">System Organizations Portal</h2>
          <p className="text-xs text-slate-500">Register new campus groups, assign department affiliations, and audit active directories</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsAddModalOpen(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white px-5 py-3 shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all cursor-pointer sm:self-start shrink-0"
        >
          <Plus className="h-4 w-4" /> Add Organization
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-900 bg-slate-950 p-4.5">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4.5">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search organizations by name or desc..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-900 bg-slate-900/20 py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-200 outline-none focus:border-indigo-500 focus:bg-slate-900/40 transition-all placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="rounded-xl border border-slate-900 bg-slate-900/20 py-2.5 pl-4 pr-10 text-xs font-semibold text-slate-300 outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Groups Only</option>
                <option value="inactive">Inactive Groups Only</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white border border-slate-800 rounded-xl transition-all cursor-pointer shrink-0"
            >
              Search
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
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Populating Organizations Directory...</p>
          </div>
        ) : orgs.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
              <Building2 className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-300">No organizations found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Try refining your searches or registering a new group.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-900/10 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                  <th className="p-4 pl-6">Organization Details</th>
                  <th className="p-4">Department Affiliation</th>
                  <th className="p-4">Roster Enrollment</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60 text-xs text-slate-300">
                {orgs.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-900/10 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-start gap-3.5 max-w-md">
                        <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center font-bold text-slate-400 shrink-0">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="overflow-hidden min-w-0">
                          <p className="font-bold text-white group-hover:text-indigo-400 transition-colors truncate">{org.name}</p>
                          <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{org.description || 'No description provided.'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {org.department ? (
                        <span className="font-mono text-slate-400 font-bold bg-slate-900/40 border border-slate-900 px-2 py-0.5 rounded text-[10px]" title={org.department.name}>
                          {org.department.code}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">None</span>
                      )}
                    </td>
                    <td className="p-4 font-mono font-bold text-indigo-400">
                      {org.members_count || 0} members
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase border ${
                        org.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15' 
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}>
                        {org.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(org.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="p-4 pr-6 text-right space-x-2">
                      <Link
                        href={`/admin/organizations/${org.id}`}
                        className="inline-flex items-center justify-center h-8.5 w-8.5 rounded-lg border border-slate-900 bg-slate-950 hover:bg-indigo-950/20 hover:border-indigo-500/30 text-slate-400 hover:text-indigo-400 transition-all cursor-pointer"
                        title="Manage Roster & Events"
                      >
                        <Eye className="h-4.5 w-4.5" />
                      </Link>

                      <button
                        onClick={() => handleEditClick(org)}
                        className="inline-flex items-center justify-center h-8.5 w-8.5 rounded-lg border border-slate-900 bg-slate-950 hover:bg-amber-950/20 hover:border-amber-500/30 text-slate-400 hover:text-amber-400 transition-all cursor-pointer"
                        title="Edit Details"
                      >
                        <Edit3 className="h-4.5 w-4.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(org.id)}
                        className="inline-flex items-center justify-center h-8.5 w-8.5 rounded-lg border border-slate-900 bg-slate-950 hover:bg-red-950/20 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-all cursor-pointer"
                        title="Delete Organization"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {!loading && orgs.length > 0 && (
          <div className="px-6 py-4.5 border-t border-slate-900 flex items-center justify-between text-xs text-slate-500 font-semibold bg-slate-900/5">
            <span>Showing <span className="font-bold text-slate-400">{orgs.length}</span> of <span className="font-bold text-slate-400">{totalItems}</span> clubs</span>
            
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

      {/* ADD ORGANIZATION MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-900 bg-slate-950 p-6.5 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-2">
              <h3 className="text-base font-extrabold text-white">Create Campus Organization</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="space-y-4.5">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Organization Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Computer Science Society"
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/10 py-2.5 px-3.5 text-xs text-slate-200 outline-none focus:border-indigo-500 focus:bg-slate-900/20"
                />
                {formErrors.name && <p className="text-[10px] text-red-400 font-bold mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the club's goals or requirements..."
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/10 py-2.5 px-3.5 text-xs text-slate-200 outline-none h-20 focus:border-indigo-500 focus:bg-slate-900/20 resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Department Affiliation</label>
                <select
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/10 py-2.5 px-3 text-xs text-slate-200 outline-none focus:border-indigo-500 focus:bg-slate-900/20 appearance-none cursor-pointer"
                >
                  <option value="">No Department Affiliation (Independent)</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/10 py-2.5 px-3 text-xs text-slate-200 outline-none focus:border-indigo-500 focus:bg-slate-900/20 cursor-pointer"
                >
                  <option value="active">Active Directory</option>
                  <option value="inactive">Inactive Directory</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-900 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/10 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Register Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ORGANIZATION MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-900 bg-slate-950 p-6.5 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-2">
              <h3 className="text-base font-extrabold text-white">Edit Organization Profile</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4.5">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Organization Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/10 py-2.5 px-3.5 text-xs text-slate-200 outline-none focus:border-indigo-500 focus:bg-slate-900/20"
                />
                {formErrors.name && <p className="text-[10px] text-red-400 font-bold mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/10 py-2.5 px-3.5 text-xs text-slate-200 outline-none h-20 focus:border-indigo-500 focus:bg-slate-900/20 resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Department Affiliation</label>
                <select
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/10 py-2.5 px-3 text-xs text-slate-200 outline-none focus:border-indigo-500 focus:bg-slate-900/20 appearance-none cursor-pointer"
                >
                  <option value="">No Department Affiliation (Independent)</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/10 py-2.5 px-3 text-xs text-slate-200 outline-none focus:border-indigo-500 focus:bg-slate-900/20 cursor-pointer"
                >
                  <option value="active">Active Directory</option>
                  <option value="inactive">Inactive Directory</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-900 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/10 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
