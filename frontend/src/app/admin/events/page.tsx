'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  X, 
  AlertCircle,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Building
} from 'lucide-react';

interface EventItem {
  id: string;
  title: string;
  description: string | null;
  venue: string | null;
  start_at: string;
  end_at: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  organization_id: string;
  created_at: string;
  organization?: { id: string; name: string };
  creator?: { id: string; name: string };
}

interface OrganizationItem {
  id: string;
  name: string;
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [orgs, setOrgs] = useState<OrganizationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orgFilter, setOrgFilter] = useState('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venue: '',
    start_at: '',
    end_at: '',
    status: 'upcoming' as 'upcoming' | 'ongoing' | 'completed' | 'cancelled',
    organization_id: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/admin/events?page=${currentPage}&per_page=10`;
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      if (orgFilter !== 'all') {
        url += `&organization_id=${orgFilter}`;
      }
      const res = await api.get(url);
      setEvents(res.data.data);
      const meta = res.data.meta?.pagination;
      if (meta) {
        setTotalPages(meta.last_page);
        setTotalItems(meta.total);
      }
    } catch (err: any) {
      console.error('Failed to fetch events:', err);
      setError(err.response?.data?.message || 'Failed to load system events planner.');
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
    fetchEvents();
  }, [currentPage, statusFilter, orgFilter]);

  useEffect(() => {
    fetchActiveOrgs();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchEvents();
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
    if (!formData.title.trim()) errors.title = 'Event title is required';
    if (!formData.start_at) errors.start_at = 'Start date and time is required';
    if (!formData.end_at) errors.end_at = 'End date and time is required';
    if (formData.start_at && formData.end_at && new Date(formData.start_at) >= new Date(formData.end_at)) {
      errors.end_at = 'End date must be after the start date';
    }
    if (!isEditModalOpen && !formData.organization_id) {
      errors.organization_id = 'Organization affiliation is required';
    }
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
        description: formData.description || null,
        venue: formData.venue || null,
        start_at: formData.start_at,
        end_at: formData.end_at,
        status: formData.status,
        organization_id: formData.organization_id,
      };

      await api.post('/admin/events', payload);
      toast.success('Event planner registered successfully.');
      setIsAddModalOpen(false);
      resetForm();
      fetchEvents();
    } catch (err: any) {
      console.error('Failed to register event:', err);
      toast.error(err.response?.data?.message || 'Failed to register new event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (event: EventItem) => {
    setSelectedEvent(event);
    
    // Format dates to ISO strings for input[type="datetime-local"]
    const startIso = new Date(event.start_at).toISOString().slice(0, 16);
    const endIso = new Date(event.end_at).toISOString().slice(0, 16);

    setFormData({
      title: event.title,
      description: event.description || '',
      venue: event.venue || '',
      start_at: startIso,
      end_at: endIso,
      status: event.status,
      organization_id: event.organization_id,
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !validateForm()) return;
    setIsSubmitting(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description || null,
        venue: formData.venue || null,
        start_at: formData.start_at,
        end_at: formData.end_at,
        status: formData.status,
      };

      await api.put(`/admin/events/${selectedEvent.id}`, payload);
      toast.success('Event details updated successfully.');
      setIsEditModalOpen(false);
      resetForm();
      fetchEvents();
    } catch (err: any) {
      console.error('Failed to update event:', err);
      toast.error(err.response?.data?.message || 'Failed to update event details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? All registered attendance items will be permanently erased.')) return;

    try {
      await api.delete(`/admin/events/${eventId}`);
      toast.success('Event deleted successfully.');
      fetchEvents();
    } catch (err: any) {
      console.error('Failed to delete event:', err);
      toast.error(err.response?.data?.message || 'Failed to delete event.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      venue: '',
      start_at: '',
      end_at: '',
      status: 'upcoming',
      organization_id: '',
    });
    setFormErrors({});
    setSelectedEvent(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">System Events Planner</h2>
          <p className="text-xs text-slate-500">Plan upcoming schedules, coordinate venues, and audit QR codes & attendance rosters</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsAddModalOpen(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white px-5 py-3 shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all cursor-pointer sm:self-start shrink-0"
        >
          <Plus className="h-4 w-4" /> Add University Event
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
              placeholder="Search events by title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-900 bg-slate-900/20 py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-200 outline-none focus:border-indigo-500 focus:bg-slate-900/40 transition-all placeholder:text-slate-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="rounded-xl border border-slate-900 bg-slate-900/20 py-2.5 pl-4 pr-10 text-xs font-semibold text-slate-300 outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

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

      {/* Main Table */}
      <div className="rounded-2xl border border-slate-900 bg-slate-950 overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Populating Events Calendar...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
              <Calendar className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-300">No scheduled events found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Try refining your filter conditions or planning a new schedule.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-900/10 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                  <th className="p-4 pl-6">Event Title & Organizer</th>
                  <th className="p-4">Venue</th>
                  <th className="p-4">Schedule Time</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created By</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60 text-xs text-slate-300">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-900/10 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-start gap-3.5 max-w-md">
                        <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center font-bold text-slate-400 shrink-0">
                          <Calendar className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div className="overflow-hidden min-w-0">
                          <p className="font-bold text-white group-hover:text-indigo-400 transition-colors truncate">{event.title}</p>
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                            <Building className="h-3 w-3 shrink-0" />
                            <span className="truncate">{event.organization?.name || 'Independent Affiliation'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {event.venue ? (
                        <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                          <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          <span>{event.venue}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[10px]">No Venue Designated</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 text-slate-300 font-semibold font-mono text-[11px]">
                          <Clock className="h-3 w-3 text-indigo-400 shrink-0" />
                          <span>{new Date(event.start_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(event.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 pl-4 font-medium">
                          to {new Date(event.end_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(event.end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
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
                    </td>
                    <td className="p-4 text-slate-500 font-medium">
                      {event.creator?.name || 'Administrator'}
                    </td>
                    <td className="p-4 pr-6 text-right space-x-2">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="inline-flex items-center justify-center h-8.5 w-8.5 rounded-lg border border-slate-900 bg-slate-950 hover:bg-indigo-950/20 hover:border-indigo-500/30 text-slate-400 hover:text-indigo-400 transition-all cursor-pointer"
                        title="Manage Attendance & QR Code"
                      >
                        <Eye className="h-4.5 w-4.5" />
                      </Link>

                      <button
                        onClick={() => handleEditClick(event)}
                        className="inline-flex items-center justify-center h-8.5 w-8.5 rounded-lg border border-slate-900 bg-slate-950 hover:bg-amber-950/20 hover:border-amber-500/30 text-slate-400 hover:text-amber-400 transition-all cursor-pointer"
                        title="Edit Details"
                      >
                        <Edit3 className="h-4.5 w-4.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(event.id)}
                        className="inline-flex items-center justify-center h-8.5 w-8.5 rounded-lg border border-slate-900 bg-slate-950 hover:bg-red-950/20 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-all cursor-pointer"
                        title="Delete Event"
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
        {!loading && events.length > 0 && (
          <div className="px-6 py-4.5 border-t border-slate-900 flex items-center justify-between text-xs text-slate-500 font-semibold bg-slate-900/5">
            <span>Showing <span className="font-bold text-slate-400">{events.length}</span> of <span className="font-bold text-slate-400">{totalItems}</span> events</span>
            
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

      {/* ADD UNIVERSITY EVENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-900 bg-slate-950 p-6.5 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-2">
              <h3 className="text-base font-extrabold text-white">Create University Event</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="space-y-4.5">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Event Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Hackathon Opening Ceremony"
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/10 py-2.5 px-3.5 text-xs text-slate-200 outline-none focus:border-indigo-500 focus:bg-slate-900/20"
                />
                {formErrors.title && <p className="text-[10px] text-red-400 font-bold mt-1">{formErrors.title}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Outline schedules, speakers, or items to bring..."
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/10 py-2.5 px-3.5 text-xs text-slate-200 outline-none h-20 focus:border-indigo-500 focus:bg-slate-900/20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Start At</label>
                  <input
                    type="datetime-local"
                    name="start_at"
                    required
                    value={formData.start_at}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-900 bg-slate-900/10 py-2.5 px-3 text-xs text-slate-200 outline-none focus:border-indigo-500 focus:bg-slate-900/20 appearance-none cursor-pointer"
                  />
                  {formErrors.start_at && <p className="text-[10px] text-red-400 font-bold mt-1">{formErrors.start_at}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">End At</label>
                  <input
                    type="datetime-local"
                    name="end_at"
                    required
                    value={formData.end_at}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-900 bg-slate-900/10 py-2.5 px-3 text-xs text-slate-200 outline-none focus:border-indigo-500 focus:bg-slate-900/20 appearance-none cursor-pointer"
                  />
                  {formErrors.end_at && <p className="text-[10px] text-red-400 font-bold mt-1">{formErrors.end_at}</p>}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Venue Location</label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleInputChange}
                  placeholder="e.g. AL-203 Multimedia Lab"
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/10 py-2.5 px-3.5 text-xs text-slate-200 outline-none focus:border-indigo-500 focus:bg-slate-900/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Organization Affiliate</label>
                  <select
                    name="organization_id"
                    value={formData.organization_id}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border border-slate-900 bg-slate-900/10 py-2.5 px-3 text-xs text-slate-200 outline-none focus:border-indigo-500 focus:bg-slate-900/20 appearance-none cursor-pointer"
                  >
                    <option value="">Select Host Organization</option>
                    {orgs.map((org) => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                  {formErrors.organization_id && <p className="text-[10px] text-red-400 font-bold mt-1">{formErrors.organization_id}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-900 bg-slate-900/10 py-2.5 px-3 text-xs text-slate-200 outline-none focus:border-indigo-500 focus:bg-slate-900/20 cursor-pointer"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
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
                  {isSubmitting ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT UNIVERSITY EVENT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-900 bg-slate-950 p-6.5 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-2">
              <h3 className="text-base font-extrabold text-white">Edit Event Details</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4.5">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Event Title</label>
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
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/10 py-2.5 px-3.5 text-xs text-slate-200 outline-none h-20 focus:border-indigo-500 focus:bg-slate-900/20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Start At</label>
                  <input
                    type="datetime-local"
                    name="start_at"
                    required
                    value={formData.start_at}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-900 bg-slate-900/10 py-2.5 px-3 text-xs text-slate-200 outline-none focus:border-indigo-500 focus:bg-slate-900/20 appearance-none cursor-pointer"
                  />
                  {formErrors.start_at && <p className="text-[10px] text-red-400 font-bold mt-1">{formErrors.start_at}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">End At</label>
                  <input
                    type="datetime-local"
                    name="end_at"
                    required
                    value={formData.end_at}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-900 bg-slate-900/10 py-2.5 px-3 text-xs text-slate-200 outline-none focus:border-indigo-500 focus:bg-slate-900/20 appearance-none cursor-pointer"
                  />
                  {formErrors.end_at && <p className="text-[10px] text-red-400 font-bold mt-1">{formErrors.end_at}</p>}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Venue Location</label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/10 py-2.5 px-3.5 text-xs text-slate-200 outline-none focus:border-indigo-500 focus:bg-slate-900/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/10 py-2.5 px-3 text-xs text-slate-200 outline-none focus:border-indigo-500 focus:bg-slate-900/20 cursor-pointer"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
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
