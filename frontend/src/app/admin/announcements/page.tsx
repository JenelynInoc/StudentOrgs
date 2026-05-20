'use client';

import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { 
  Megaphone, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  AlertCircle,
  Pin,
  ChevronLeft,
  ChevronRight,
  Building,
  User,
  Clock
} from 'lucide-react';

interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  organization_id: string;
  created_by: string;
  created_at: string;
  organization?: { id: string; name: string };
  creator?: { id: string; name: string };
}

interface OrganizationItem {
  id: string;
  name: string;
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [orgs, setOrgs] = useState<OrganizationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [orgFilter, setOrgFilter] = useState('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    organization_id: '',
    is_pinned: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/admin/announcements?page=${currentPage}&per_page=10`;
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      if (orgFilter !== 'all') {
        url += `&organization_id=${orgFilter}`;
      }
      const res = await api.get(url);
      
      // Sort pinned announcements to the top
      const sorted = [...res.data.data].sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setAnnouncements(sorted);
      const meta = res.data.meta?.pagination;
      if (meta) {
        setTotalPages(meta.last_page);
        setTotalItems(meta.total);
      }
    } catch (err: any) {
      console.error('Failed to fetch announcements:', err);
      setError(err.response?.data?.message || 'Failed to load campus announcements board.');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveOrgs = async () => {
    try {
      const res = await api.get('/admin/organizations?per_page=100&status=active');
      setOrgs(res.data.data);
    } catch (err) {
      console.error('Failed to load active organizations:', err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [currentPage, orgFilter]);

  useEffect(() => {
    fetchActiveOrgs();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAnnouncements();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({ ...prev, [name]: val }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = 'Announcement title is required';
    if (!formData.body.trim()) errors.body = 'Announcement message body is required';
    if (!formData.organization_id) errors.organization_id = 'Target organization is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const payload = {
        title: formData.title,
        body: formData.body,
        organization_id: formData.organization_id,
        is_pinned: formData.is_pinned,
      };

      await api.post('/admin/announcements', payload);
      toast.success('Announcement broadcasted successfully.');
      setIsAddModalOpen(false);
      resetForm();
      fetchAnnouncements();
    } catch (err: any) {
      console.error('Failed to broadcast announcement:', err);
      toast.error(err.response?.data?.message || 'Failed to broadcast announcement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (ann: AnnouncementItem) => {
    setSelectedAnnouncement(ann);
    setFormData({
      title: ann.title,
      body: ann.body,
      organization_id: ann.organization_id,
      is_pinned: ann.is_pinned,
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnnouncement || !validateForm()) return;
    setIsSubmitting(true);

    try {
      const payload = {
        title: formData.title,
        body: formData.body,
        is_pinned: formData.is_pinned,
      };

      await api.put(`/admin/announcements/${selectedAnnouncement.id}`, payload);
      toast.success('Announcement updated successfully.');
      setIsEditModalOpen(false);
      resetForm();
      fetchAnnouncements();
    } catch (err: any) {
      console.error('Failed to update announcement:', err);
      toast.error(err.response?.data?.message || 'Failed to update announcement details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (annId: string) => {
    if (!confirm('Are you sure you want to delete this announcement broadcast?')) return;

    try {
      await api.delete(`/admin/announcements/${annId}`);
      toast.success('Announcement deleted successfully.');
      fetchAnnouncements();
    } catch (err: any) {
      console.error('Failed to delete announcement:', err);
      toast.error(err.response?.data?.message || 'Failed to delete announcement.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      body: '',
      organization_id: '',
      is_pinned: false,
    });
    setFormErrors({});
    setSelectedAnnouncement(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">System Announcements Board</h2>
          <p className="text-xs text-slate-500">Broadcast updates, pin critical reminders to dashboards, and filter releases by group</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsAddModalOpen(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white px-5 py-3 shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all cursor-pointer sm:self-start shrink-0"
        >
          <Plus className="h-4 w-4" /> New Announcement
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
              placeholder="Search announcements by title or content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-900 bg-slate-900/20 py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-200 outline-none focus:border-indigo-500 focus:bg-slate-900/40 transition-all placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <select
                value={orgFilter}
                onChange={(e) => { setOrgFilter(e.target.value); setCurrentPage(1); }}
                className="rounded-xl border border-slate-900 bg-slate-900/20 py-2.5 pl-4 pr-10 text-xs font-semibold text-slate-300 outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer max-w-[200px]"
              >
                <option value="all">All Organizations</option>
                {orgs.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
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

      {/* Main Table or Card-based directory */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-900 bg-slate-950">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Gathering Board Bulletins...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="p-16 text-center space-y-2 rounded-2xl border border-slate-900 bg-slate-950">
          <div className="h-12 w-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
            <Megaphone className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-300">No announcements posted</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Create a new announcement to broadcast campus organization events or news.</p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Loop over announcements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.map((ann) => (
              <div 
                key={ann.id} 
                className={`relative rounded-2xl border bg-slate-950 p-5.5 space-y-4 flex flex-col justify-between transition-all group duration-200 ${
                  ann.is_pinned 
                    ? 'border-indigo-500/30 bg-gradient-to-tr from-slate-950 via-slate-950 to-indigo-950/20 shadow-md shadow-indigo-500/5' 
                    : 'border-slate-900 hover:border-slate-800'
                }`}
              >
                
                {/* Ribbon for Pinned */}
                {ann.is_pinned && (
                  <span className="absolute top-4 right-4 text-indigo-400" title="Pinned Announcement">
                    <Pin className="h-4 w-4 fill-indigo-400 rotate-45" />
                  </span>
                )}

                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] font-extrabold bg-slate-900 text-slate-400 border border-slate-850 px-2 py-0.5 rounded flex items-center gap-1">
                      <Building className="h-3 w-3 shrink-0" />
                      <span className="max-w-[120px] truncate">{ann.organization?.name || 'Global'}</span>
                    </span>
                    
                    <span className="text-[10px] text-slate-500 font-semibold font-mono flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-600 shrink-0" />
                      <span>{new Date(ann.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors pr-6 truncate">{ann.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-4 bg-slate-900/10 p-3.5 rounded-xl border border-slate-900/60 font-medium">{ann.body}</p>
                </div>

                <div className="pt-4 border-t border-slate-900/60 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 text-[10px] text-slate-500 font-semibold">
                    <div className="h-6 w-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[9px] font-extrabold text-slate-400">
                      {ann.creator?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD'}
                    </div>
                    <span>{ann.creator?.name || 'Administrator'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditClick(ann)}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-900 bg-slate-950 hover:bg-amber-950/20 hover:border-amber-500/30 text-slate-400 hover:text-amber-400 transition-all cursor-pointer"
                      title="Edit details"
                    >
                      <Edit3 className="h-4.5 w-4.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-900 bg-slate-950 hover:bg-red-950/20 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-all cursor-pointer"
                      title="Delete bulletin"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="rounded-2xl border border-slate-900 bg-slate-950 px-6 py-4.5 flex items-center justify-between text-xs text-slate-500 font-semibold bg-slate-900/5">
              <span>Showing <span className="font-bold text-slate-400">{announcements.length}</span> of <span className="font-bold text-slate-400">{totalItems}</span> bulletins</span>
              
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
      )}

      {/* ADD ANNOUNCEMENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-900 bg-slate-950 p-6.5 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-2">
              <h3 className="text-base font-extrabold text-white">Broadcast Announcement</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="space-y-4.5">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Announcement Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Schedule Alterations for Hackathon Venue"
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/10 py-2.5 px-3.5 text-xs text-slate-200 outline-none focus:border-indigo-500 focus:bg-slate-900/20"
                />
                {formErrors.title && <p className="text-[10px] text-red-400 font-bold mt-1">{formErrors.title}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Broadcast Message</label>
                <textarea
                  name="body"
                  required
                  value={formData.body}
                  onChange={handleInputChange}
                  placeholder="Write clear, comprehensive broadcast descriptions..."
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/10 py-2.5 px-3.5 text-xs text-slate-200 outline-none h-28 focus:border-indigo-500 focus:bg-slate-900/20 resize-none"
                />
                {formErrors.body && <p className="text-[10px] text-red-400 font-bold mt-1">{formErrors.body}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Target Club Organization</label>
                  <select
                    name="organization_id"
                    value={formData.organization_id}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border border-slate-900 bg-slate-900/10 py-2.5 px-3 text-xs text-slate-200 outline-none focus:border-indigo-500 focus:bg-slate-900/20 appearance-none cursor-pointer"
                  >
                    <option value="">Select Target Group</option>
                    {orgs.map((org) => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                  {formErrors.organization_id && <p className="text-[10px] text-red-400 font-bold mt-1">{formErrors.organization_id}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-1.5">
                <input
                  type="checkbox"
                  id="is_pinned"
                  name="is_pinned"
                  checked={formData.is_pinned}
                  onChange={handleInputChange}
                  className="h-4.5 w-4.5 rounded border-slate-900 bg-slate-900 text-indigo-600 focus:ring-indigo-500/20 focus:ring-offset-slate-950 cursor-pointer"
                />
                <label htmlFor="is_pinned" className="text-xs font-bold text-slate-400 hover:text-white cursor-pointer select-none flex items-center gap-1.5">
                  <Pin className="h-3.5 w-3.5 fill-indigo-400 text-indigo-400 rotate-45" /> Pin to Dashboard bulletin
                </label>
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
                  {isSubmitting ? 'Broadcasting...' : 'Broadcast Bulletin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ANNOUNCEMENT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-900 bg-slate-950 p-6.5 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-2">
              <h3 className="text-base font-extrabold text-white">Edit Announcement Details</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4.5">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Announcement Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/10 py-2.5 px-3.5 text-xs text-slate-200 outline-none focus:border-indigo-500 focus:bg-slate-900/20"
                />
                {formErrors.title && <p className="text-[10px] text-red-400 font-bold mt-1">{formErrors.title}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Broadcast Message</label>
                <textarea
                  name="body"
                  required
                  value={formData.body}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/10 py-2.5 px-3.5 text-xs text-slate-200 outline-none h-28 focus:border-indigo-500 focus:bg-slate-900/20 resize-none"
                />
                {formErrors.body && <p className="text-[10px] text-red-400 font-bold mt-1">{formErrors.body}</p>}
              </div>

              <div className="flex items-center gap-2.5 pt-1.5">
                <input
                  type="checkbox"
                  id="is_pinned"
                  name="is_pinned"
                  checked={formData.is_pinned}
                  onChange={handleInputChange}
                  className="h-4.5 w-4.5 rounded border-slate-900 bg-slate-900 text-indigo-600 focus:ring-indigo-500/20 focus:ring-offset-slate-950 cursor-pointer"
                />
                <label htmlFor="is_pinned" className="text-xs font-bold text-slate-400 hover:text-white cursor-pointer select-none flex items-center gap-1.5">
                  <Pin className="h-3.5 w-3.5 fill-indigo-400 text-indigo-400 rotate-45" /> Pin to Dashboard bulletin
                </label>
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
