'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { 
  User, Organization, Category, Event, Announcement, Membership, EventParticipation 
} from '@/types';
import { 
  Users, BookOpen, Calendar, Radio, LayoutDashboard, LogOut, Search, Plus, 
  Check, X, FileSpreadsheet, ChevronRight, UserPlus, Settings, Trophy, 
  MapPin, Clock, Edit2, AlertCircle, Eye
} from 'lucide-react';

export default function DashboardPage() {
  const { user, loading: authLoading, logout, refreshUser } = useAuth();
  const router = useRouter();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);

  // Data states
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  // Officer Specific Org Details
  const [officerOrgDetails, setOfficerOrgDetails] = useState<any>(null);
  const [selectedOfficerOrgId, setSelectedOfficerOrgId] = useState<number | null>(null);

  // Search/Filter states
  const [orgSearch, setOrgSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

  // Form states & Modal visibility
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const [showOrgModal, setShowOrgModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgAcronym, setNewOrgAcronym] = useState('');
  const [newOrgDesc, setNewOrgDesc] = useState('');
  const [newOrgCatId, setNewOrgCatId] = useState('');

  const [showEventModal, setShowEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventLoc, setNewEventLoc] = useState('');
  const [newEventStart, setNewEventStart] = useState('');
  const [newEventEnd, setNewEventEnd] = useState('');

  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');

  const [showEditOrgModal, setShowEditOrgModal] = useState(false);
  const [editOrgName, setEditOrgName] = useState('');
  const [editOrgAcronym, setEditOrgAcronym] = useState('');
  const [editOrgDesc, setEditOrgDesc] = useState('');
  const [editOrgCatId, setEditOrgCatId] = useState('');

  // Selected event for RSVP/Attendance check
  const [selectedEventDetails, setSelectedEventDetails] = useState<any>(null);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);

  // Organization detail modal (student view)
  const [selectedOrgDetails, setSelectedOrgDetails] = useState<any>(null);
  const [showOrgDetailModal, setShowOrgDetailModal] = useState(false);

  // Report Modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [reportType, setReportType] = useState<'members' | 'events'>('members');

  // Error/Success state
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Redirect if not authenticated or if admin (admins have their own dashboard)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (!authLoading && user && user.role === 'admin') {
      router.push('/admin/dashboard');
    }
  }, [user, authLoading, router]);

  // Load Dashboard Data
  const loadDashboardData = async (orgIdParam?: number) => {
    if (!user) return;
    setLoading(true);
    try {
      const activeOrgId = orgIdParam !== undefined ? orgIdParam : selectedOfficerOrgId;
      const url = activeOrgId 
        ? `/dashboard-stats?organization_id=${activeOrgId}` 
        : '/dashboard-stats';

      // 1. Fetch dashboard stats (varies by role)
      const statsRes = await api.get(url);
      setDashboardStats(statsRes.data);

      if (user.role === 'officer' && !selectedOfficerOrgId && statsRes.data.organization?.id) {
        setSelectedOfficerOrgId(statsRes.data.organization.id);
      }

      // 2. Fetch shared resources
      const catsRes = await api.get('/categories');
      setCategories(catsRes.data);

      const orgsRes = await api.get('/organizations');
      setOrganizations(orgsRes.data);

      // Role specific secondary fetches
      if (user.role === 'admin') {
        // Admins can see everything
      } else if (user.role === 'officer') {
        // Load details for the officer's organization
        const orgId = statsRes.data.organization?.id;
        if (orgId) {
          const officerOrgRes = await api.get(`/organizations/${orgId}`);
          setOfficerOrgDetails(officerOrgRes.data);
        } else {
          console.warn('Officer has no assigned organization.');
          setOfficerOrgDetails(null);
        }
      } else {
        // Student: fetch announcements and events in their organization networks
        const announceRes = await api.get('/announcements');
        setAnnouncements(announceRes.data);

        const eventsRes = await api.get('/events?upcoming=true');
        setEvents(eventsRes.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics', err);
      showBanner('Failed to retrieve dashboard content.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOfficerOrgChange = (orgId: number) => {
    setSelectedOfficerOrgId(orgId);
    loadDashboardData(orgId);
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const showBanner = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  // ================= ADMIN ACTIONS =================
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/categories', { name: newCatName, description: newCatDesc });
      showBanner('Category created successfully.', 'success');
      setNewCatName('');
      setNewCatDesc('');
      setShowCategoryModal(false);
      loadDashboardData();
    } catch (err: any) {
      showBanner(err.response?.data?.message || 'Failed to create category.', 'error');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category? All organizations under it will be deleted.')) return;
    try {
      await api.delete(`/categories/${id}`);
      showBanner('Category deleted successfully.', 'success');
      loadDashboardData();
    } catch (err) {
      showBanner('Failed to delete category.', 'error');
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/organizations', {
        name: newOrgName,
        acronym: newOrgAcronym,
        description: newOrgDesc,
        category_id: parseInt(newOrgCatId),
      });
      showBanner('Organization created successfully.', 'success');
      setNewOrgName('');
      setNewOrgAcronym('');
      setNewOrgDesc('');
      setNewOrgCatId('');
      setShowOrgModal(false);
      loadDashboardData();
    } catch (err: any) {
      showBanner(err.response?.data?.message || 'Failed to create organization.', 'error');
    }
  };

  const handleDeleteOrganization = async (id: number) => {
    if (!confirm('Are you sure you want to delete this organization?')) return;
    try {
      await api.delete(`/organizations/${id}`);
      showBanner('Organization deleted successfully.', 'success');
      loadDashboardData();
    } catch (err) {
      showBanner('Failed to delete organization.', 'error');
    }
  };

  // ================= OFFICER ACTIONS =================
  const handleEditOrganizationProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerOrgDetails?.organization) return;
    try {
      await api.put(`/organizations/${officerOrgDetails.organization.id}`, {
        name: editOrgName,
        acronym: editOrgAcronym,
        description: editOrgDesc,
        category_id: parseInt(editOrgCatId),
      });
      showBanner('Organization profile updated.', 'success');
      setShowEditOrgModal(false);
      loadDashboardData();
    } catch (err: any) {
      showBanner(err.response?.data?.message || 'Failed to update profile.', 'error');
    }
  };

  const triggerEditOrgModal = () => {
    if (!officerOrgDetails?.organization) return;
    const org = officerOrgDetails.organization;
    setEditOrgName(org.name);
    setEditOrgAcronym(org.acronym);
    setEditOrgDesc(org.description);
    setEditOrgCatId(org.category_id.toString());
    setShowEditOrgModal(true);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const orgId = officerOrgDetails?.organization?.id;
    if (!orgId) return;

    try {
      await api.post('/events', {
        organization_id: orgId,
        title: newEventTitle,
        description: newEventDesc,
        location: newEventLoc,
        start_time: newEventStart,
        end_time: newEventEnd,
      });
      showBanner('Event scheduled successfully.', 'success');
      setNewEventTitle('');
      setNewEventDesc('');
      setNewEventLoc('');
      setNewEventStart('');
      setNewEventEnd('');
      setShowEventModal(false);
      loadDashboardData();
    } catch (err: any) {
      showBanner(err.response?.data?.message || 'Failed to schedule event.', 'error');
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const orgId = officerOrgDetails?.organization?.id;
    if (!orgId) return;

    try {
      await api.post('/announcements', {
        organization_id: orgId,
        title: newAnnTitle,
        content: newAnnContent,
      });
      showBanner('Announcement posted successfully.', 'success');
      setNewAnnTitle('');
      setNewAnnContent('');
      setShowAnnounceModal(false);
      loadDashboardData();
    } catch (err: any) {
      showBanner(err.response?.data?.message || 'Failed to post announcement.', 'error');
    }
  };

  const handleUpdateMembershipStatus = async (id: number, status: 'approved' | 'rejected') => {
    try {
      await api.put(`/memberships/${id}/status`, { status });
      showBanner(`Membership request ${status}.`, 'success');
      loadDashboardData();
    } catch (err) {
      showBanner('Failed to update membership status.', 'error');
    }
  };

  const handleAssignOfficerRole = async (id: number, makeOfficer: boolean) => {
    try {
      if (makeOfficer) {
        const title = prompt('Enter officer title (e.g. Vice President, Treasurer):');
        if (title === null) return; // cancelled
        await api.put(`/memberships/${id}/role`, { role: 'officer', officer_title: title || 'Officer' });
      } else {
        if (!confirm('Are you sure you want to demote this officer to regular member?')) return;
        await api.put(`/memberships/${id}/role`, { role: 'member' });
      }
      showBanner('Member role updated successfully.', 'success');
      loadDashboardData();
    } catch (err) {
      showBanner('Failed to update role.', 'error');
    }
  };

  const handleRemoveMember = async (id: number) => {
    if (!confirm('Are you sure you want to remove this member from the organization?')) return;
    try {
      await api.delete(`/memberships/${id}`);
      showBanner('Member removed successfully.', 'success');
      loadDashboardData();
    } catch (err) {
      showBanner('Failed to remove member.', 'error');
    }
  };

  const viewEventDetails = async (id: number) => {
    try {
      const res = await api.get(`/events/${id}`);
      setSelectedEventDetails(res.data);
      setShowEventDetailsModal(true);
    } catch (err) {
      showBanner('Failed to retrieve event participation details.', 'error');
    }
  };

  const handleMarkAttendance = async (eventId: number, studentUserId: number, status: 'attended' | 'absent' | 'registered') => {
    try {
      await api.post(`/events/${eventId}/attendance`, {
        user_id: studentUserId,
        status: status,
      });
      // Refetch event details
      const res = await api.get(`/events/${eventId}`);
      setSelectedEventDetails(res.data);
      showBanner('Attendance status logged.', 'success');
    } catch (err) {
      showBanner('Failed to update attendance status.', 'error');
    }
  };

  const handleDownloadMembersReport = async () => {
    const orgId = officerOrgDetails?.organization?.id;
    if (!orgId) return;

    try {
      const res = await api.get(`/organizations/${orgId}/members/report`);
      setReportType('members');
      setReportData(res.data);
      setShowReportModal(true);
    } catch (err) {
      showBanner('Failed to compile members report.', 'error');
    }
  };

  const handleDownloadEventReport = async (eventId: number) => {
    try {
      const res = await api.get(`/events/${eventId}/report`);
      setReportType('events');
      setReportData(res.data);
      setShowReportModal(true);
    } catch (err) {
      showBanner('Failed to compile event participation report.', 'error');
    }
  };

  // Export report data to CSV string
  const exportToCSV = () => {
    if (!reportData) return;

    let csvContent = '';
    if (reportType === 'members') {
      csvContent += `Organization Membership Report\n`;
      csvContent += `Organization: ,${reportData.organization_name} (${reportData.acronym})\n`;
      csvContent += `Generated At: ,${reportData.generated_at}\n`;
      csvContent += `Total Members: ,${reportData.total_members}\n\n`;
      csvContent += `Student ID,Name,Email,Role,Title,Joined Date\n`;
      reportData.members.forEach((m: any) => {
        csvContent += `"${m.student_id}","${m.name}","${m.email}","${m.role_in_org}","${m.officer_title}","${m.joined_at}"\n`;
      });
    } else {
      csvContent += `Event Participation Report\n`;
      csvContent += `Event: ,${reportData.event_title}\n`;
      csvContent += `Host: ,${reportData.organization_name}\n`;
      csvContent += `Time: ,${reportData.start_time}\n`;
      csvContent += `Location: ,${reportData.location}\n`;
      csvContent += `Total RSVP: ,${reportData.total_rsvps}\n`;
      csvContent += `Total Attended: ,${reportData.total_attended}\n\n`;
      csvContent += `Student ID,Name,Email,Status,Last Updated\n`;
      reportData.participations.forEach((p: any) => {
        csvContent += `"${p.student_id}","${p.name}","${p.email}","${p.status}","${p.updated_at}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${reportType}_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ================= STUDENT ACTIONS =================
  const handleJoinRequest = async (orgId: number) => {
    try {
      await api.post('/memberships/join', { organization_id: orgId });
      showBanner('Join request submitted. Awaiting officer approval.', 'success');
      refreshUser();
      loadDashboardData();
    } catch (err: any) {
      showBanner(err.response?.data?.message || 'Failed to submit join request.', 'error');
    }
  };

  const handleRSVPEvent = async (eventId: number) => {
    try {
      const res = await api.post(`/events/${eventId}/rsvp`);
      showBanner(res.data.message, 'success');
      loadDashboardData();
    } catch (err) {
      showBanner('Failed to RSVP for this event.', 'error');
    }
  };

  const viewOrgDetails = async (orgId: number) => {
    try {
      const res = await api.get(`/organizations/${orgId}`);
      setSelectedOrgDetails(res.data);
      setShowOrgDetailModal(true);
    } catch (err) {
      showBanner('Failed to load organization details.', 'error');
    }
  };

  const getMembershipStatus = (orgId: number) => {
    if (!user?.memberships) return 'Join';
    const membership = user.memberships.find(m => m.organization_id === orgId);
    if (!membership) return 'Join';
    return membership.status; // pending, approved, rejected
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <svg className="h-10 w-10 animate-spin text-violet-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm text-slate-400">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-900 bg-slate-950 flex flex-col justify-between hidden md:flex">
        <div>
          {/* Logo */}
          <div className="px-6 py-6 border-b border-slate-900 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-500 text-white font-bold shadow-md shadow-violet-500/10">
              S
            </div>
            <span className="font-bold tracking-tight text-white text-lg">OrgHub Portal</span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <button 
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'home' ? 'bg-violet-600/10 border border-violet-500/20 text-violet-400' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'}`}
            >
              <LayoutDashboard className="h-4.5 w-4.5" /> Dashboard
            </button>

            {/* Admin Tabs */}
            {user.role === 'admin' && (
              <>
                <button 
                  onClick={() => setActiveTab('categories')}
                  className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'categories' ? 'bg-violet-600/10 border border-violet-500/20 text-violet-400' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'}`}
                >
                  <BookOpen className="h-4.5 w-4.5" /> Org Categories
                </button>
                <button 
                  onClick={() => setActiveTab('organizations')}
                  className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'organizations' ? 'bg-violet-600/10 border border-violet-500/20 text-violet-400' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'}`}
                >
                  <Users className="h-4.5 w-4.5" /> Organizations
                </button>
              </>
            )}

            {/* Officer Tabs */}
            {user.role === 'officer' && (
              <>
                <button 
                  onClick={() => setActiveTab('officer-members')}
                  className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'officer-members' ? 'bg-violet-600/10 border border-violet-500/20 text-violet-400' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'}`}
                >
                  <Users className="h-4.5 w-4.5" /> Club Members
                </button>
                <button 
                  onClick={() => setActiveTab('officer-events')}
                  className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'officer-events' ? 'bg-violet-600/10 border border-violet-500/20 text-violet-400' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'}`}
                >
                  <Calendar className="h-4.5 w-4.5" /> Event Schedules
                </button>
                <button 
                  onClick={() => setActiveTab('officer-announcements')}
                  className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'officer-announcements' ? 'bg-violet-600/10 border border-violet-500/20 text-violet-400' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'}`}
                >
                  <Radio className="h-4.5 w-4.5" /> Announcements
                </button>
              </>
            )}

            {/* Student Tabs */}
            {user.role === 'student' && (
              <>
                <button 
                  onClick={() => setActiveTab('student-orgs')}
                  className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'student-orgs' ? 'bg-violet-600/10 border border-violet-500/20 text-violet-400' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'}`}
                >
                  <Users className="h-4.5 w-4.5" /> Browse Clubs
                </button>
                <button 
                  onClick={() => setActiveTab('student-events')}
                  className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'student-events' ? 'bg-violet-600/10 border border-violet-500/20 text-violet-400' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'}`}
                >
                  <Calendar className="h-4.5 w-4.5" /> Club Events
                </button>
                <button 
                  onClick={() => setActiveTab('student-announcements')}
                  className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'student-announcements' ? 'bg-violet-600/10 border border-violet-500/20 text-violet-400' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'}`}
                >
                  <Radio className="h-4.5 w-4.5" /> Announcements Feed
                </button>
              </>
            )}
          </nav>
        </div>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-slate-900 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-violet-600/25 border border-violet-500/20 flex items-center justify-center text-sm font-bold text-violet-400">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 truncate capitalize">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full py-2 border border-slate-800 hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400 rounded-xl text-xs font-semibold text-slate-400 transition-all duration-200"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* App Header Header */}
        <header className="h-16 border-b border-slate-900 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 md:hidden">Menu</span>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">
              {activeTab.replace('-', ' ')}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {user.role === 'officer' && dashboardStats?.my_organizations && (
              <div className="flex items-center gap-2 mr-2">
                <span className="text-xs text-slate-500 font-semibold">Active Club:</span>
                <select
                  value={selectedOfficerOrgId || dashboardStats.organization?.id || ''}
                  onChange={(e) => handleOfficerOrgChange(parseInt(e.target.value))}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-200 outline-none focus:border-violet-500 font-medium"
                >
                  {dashboardStats.my_organizations.map((o: any) => (
                    <option key={o.id} value={o.id}>
                      {o.acronym}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/5 text-[11px] font-semibold text-violet-400 capitalize">
              Role: {user.role}
            </div>
            {user.student_id && (
              <div className="px-3 py-1 rounded-full border border-slate-800 bg-slate-900/50 text-[11px] text-slate-400">
                ID: {user.student_id}
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Inner Panels */}
        <div className="flex-1 p-6 overflow-y-auto">
          {message && (
            <div className={`mb-6 p-4 rounded-xl border flex items-center gap-2.5 text-sm transition-all duration-200 ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' : 'bg-red-500/10 border-red-500/25 text-red-400'}`}>
              <AlertCircle className="h-4.5 w-4.5" />
              {message.text}
            </div>
          )}

          {loading ? (
            <div className="flex h-full items-center justify-center">
              <svg className="h-8 w-8 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : (
            <>
              {/* TAB 1: HOME/DASHBOARD WIDGETS */}
              {activeTab === 'home' && (
                <div className="space-y-6">
                  {/* Banner */}
                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-gradient-to-r from-violet-600/30 via-violet-950/20 to-slate-950 p-8 shadow-lg">
                    <div className="absolute top-0 right-0 -z-10 h-full w-1/3 bg-radial-gradient from-violet-500/20 to-transparent blur-2xl" />
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white">Hello, {user.name}</h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                      Welcome to the portal. You have access to organization profile builders, event participations, announcements, and school capstone reports.
                    </p>
                  </div>

                  {/* ADMIN STATS */}
                  {user.role === 'admin' && dashboardStats && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
                        <div className="rounded-xl border border-slate-900 bg-slate-900/30 p-5 hover:border-slate-800 transition-all">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Registered Users</p>
                          <h4 className="text-3xl font-extrabold text-white mt-1">{dashboardStats.total_users}</h4>
                        </div>
                        <div className="rounded-xl border border-slate-900 bg-slate-900/30 p-5 hover:border-slate-800 transition-all">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Organizations</p>
                          <h4 className="text-3xl font-extrabold text-white mt-1">{dashboardStats.total_organizations}</h4>
                        </div>
                        <div className="rounded-xl border border-slate-900 bg-slate-900/30 p-5 hover:border-slate-800 transition-all">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Categories</p>
                          <h4 className="text-3xl font-extrabold text-white mt-1">{dashboardStats.total_categories}</h4>
                        </div>
                        <div className="rounded-xl border border-slate-900 bg-slate-900/30 p-5 hover:border-slate-800 transition-all">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Events Scheduled</p>
                          <h4 className="text-3xl font-extrabold text-white mt-1">{dashboardStats.total_events}</h4>
                        </div>
                      </div>

                      {/* Admin Upcoming Events list */}
                      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6">
                          <h3 className="text-base font-bold text-white mb-4">Upcoming University Events</h3>
                          <div className="space-y-4">
                            {dashboardStats.upcoming_events?.length === 0 ? (
                              <p className="text-sm text-slate-500">No upcoming events listed.</p>
                            ) : (
                              dashboardStats.upcoming_events?.map((e: Event) => (
                                <div key={e.id} className="flex justify-between items-start border-b border-slate-900 pb-3">
                                  <div>
                                    <h4 className="text-sm font-semibold text-white">{e.title}</h4>
                                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                                      <MapPin className="h-3 w-3" /> {e.location}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded-full border border-slate-850">
                                      {new Date(e.start_time).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Club Sizes list */}
                        <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6">
                          <h3 className="text-base font-bold text-white mb-4">Organization Members Count</h3>
                          <div className="space-y-3">
                            {dashboardStats.organization_stats?.length === 0 ? (
                              <p className="text-sm text-slate-500">No organizations listed.</p>
                            ) : (
                              dashboardStats.organization_stats?.map((org: any, i: number) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                  <span className="text-slate-400 font-medium">{org.name} ({org.acronym})</span>
                                  <span className="font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-500/15">
                                    {org.memberships_count} members
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* OFFICER STATS */}
                  {user.role === 'officer' && dashboardStats && (
                    <div className="space-y-6">
                      <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl">
                        <Trophy className="h-5 w-5 text-violet-400" />
                        <div>
                          <span className="text-xs text-slate-500 font-semibold block uppercase">Managing Organization</span>
                          <span className="text-sm font-bold text-white">{dashboardStats.organization?.name} ({dashboardStats.organization?.acronym})</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
                        <div className="rounded-xl border border-slate-900 bg-slate-900/30 p-5">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Approved Members</p>
                          <h4 className="text-3xl font-extrabold text-white mt-1">{dashboardStats.total_members}</h4>
                        </div>
                        <div className="rounded-xl border border-slate-900 bg-slate-900/30 p-5">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pending Join Requests</p>
                          <h4 className={`text-3xl font-extrabold mt-1 ${dashboardStats.pending_requests > 0 ? 'text-amber-400' : 'text-white'}`}>{dashboardStats.pending_requests}</h4>
                        </div>
                        <div className="rounded-xl border border-slate-900 bg-slate-900/30 p-5">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Events Run</p>
                          <h4 className="text-3xl font-extrabold text-white mt-1">{dashboardStats.total_events}</h4>
                        </div>
                        <div className="rounded-xl border border-slate-900 bg-slate-900/30 p-5">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Announcements</p>
                          <h4 className="text-3xl font-extrabold text-white mt-1">{dashboardStats.total_announcements}</h4>
                        </div>
                      </div>

                      {/* Officer dashboard options */}
                      <div className="flex gap-4 flex-wrap">
                        <button 
                          onClick={() => {
                            setActiveTab('officer-members');
                            loadDashboardData();
                          }}
                          className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white px-5 py-3 shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20 transition-all"
                        >
                          <Users className="h-4.5 w-4.5" /> Manage Members & Requests
                        </button>
                        <button 
                          onClick={() => setShowEventModal(true)}
                          className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-300 hover:text-white transition-all"
                        >
                          <Plus className="h-4.5 w-4.5" /> Schedule New Event
                        </button>
                        <button 
                          onClick={handleDownloadMembersReport}
                          className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-300 hover:text-white transition-all"
                        >
                          <FileSpreadsheet className="h-4.5 w-4.5" /> Member List Report
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STUDENT STATS */}
                  {user.role === 'student' && dashboardStats && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                        <div className="rounded-xl border border-slate-900 bg-slate-900/30 p-5">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">My Approved Clubs</p>
                          <h4 className="text-3xl font-extrabold text-white mt-1">{dashboardStats.my_memberships_count}</h4>
                        </div>
                        <div className="rounded-xl border border-slate-900 bg-slate-900/30 p-5">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pending Request Applications</p>
                          <h4 className="text-3xl font-extrabold text-white mt-1">{dashboardStats.pending_memberships_count}</h4>
                        </div>
                        <div className="rounded-xl border border-slate-900 bg-slate-900/30 p-5">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Active School Clubs</p>
                          <h4 className="text-3xl font-extrabold text-white mt-1">{dashboardStats.total_organizations}</h4>
                        </div>
                      </div>

                      {/* Student upcoming events lists */}
                      <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 max-w-2xl">
                        <h3 className="text-base font-bold text-white mb-4">Upcoming Events in My Organizations</h3>
                        <div className="space-y-4">
                          {dashboardStats.upcoming_events?.length === 0 ? (
                            <p className="text-sm text-slate-500">No events found. Join some organizations to track their events!</p>
                          ) : (
                            dashboardStats.upcoming_events?.map((e: Event) => (
                              <div key={e.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-900 pb-3 gap-2">
                                <div>
                                  <h4 className="text-sm font-semibold text-white">{e.title}</h4>
                                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {e.location}</span>
                                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {new Date(e.start_time).toLocaleString()}</span>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => handleRSVPEvent(e.id)}
                                  className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg border border-violet-500/30 hover:bg-violet-600/10 text-xs font-semibold text-violet-400 hover:text-white transition-all text-center"
                                >
                                  Toggle RSVP
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CATEGORIES (ADMIN ONLY) */}
              {activeTab === 'categories' && user.role === 'admin' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Manage Categories</h3>
                    <button 
                      onClick={() => setShowCategoryModal(true)}
                      className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white px-4 py-2 transition-all shadow-md shadow-violet-500/10"
                    >
                      <Plus className="h-4.5 w-4.5" /> Add Category
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-900 bg-slate-900/10">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-900 bg-slate-900/30 text-xs font-semibold text-slate-400 uppercase">
                          <th className="p-4">Name</th>
                          <th className="p-4">Description</th>
                          <th className="p-4">Organizations Count</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 text-sm">
                        {categories.map((cat) => (
                          <tr key={cat.id} className="hover:bg-slate-900/20">
                            <td className="p-4 font-semibold text-white">{cat.name}</td>
                            <td className="p-4 text-slate-400 max-w-md truncate">{cat.description || 'N/A'}</td>
                            <td className="p-4 text-slate-400">{cat.organizations_count || 0}</td>
                            <td className="p-4 text-right">
                              <button 
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="text-red-400 hover:text-red-300 font-semibold text-xs"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: ORGANIZATIONS (ADMIN ONLY) */}
              {activeTab === 'organizations' && user.role === 'admin' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Manage Organizations</h3>
                    <button 
                      onClick={() => setShowOrgModal(true)}
                      className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white px-4 py-2 transition-all shadow-md shadow-violet-500/10"
                    >
                      <Plus className="h-4.5 w-4.5" /> Add Organization
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-900 bg-slate-900/10">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-900 bg-slate-900/30 text-xs font-semibold text-slate-400 uppercase">
                          <th className="p-4">Name</th>
                          <th className="p-4">Acronym</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 text-sm">
                        {organizations.map((org) => (
                          <tr key={org.id} className="hover:bg-slate-900/20">
                            <td className="p-4 font-semibold text-white">{org.name}</td>
                            <td className="p-4 text-violet-400 font-mono font-bold">{org.acronym}</td>
                            <td className="p-4 text-slate-400">{org.category?.name || 'N/A'}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${org.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}>
                                {org.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button 
                                onClick={() => handleDeleteOrganization(org.id)}
                                className="text-red-400 hover:text-red-300 font-semibold text-xs"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: CLUB MEMBERS (OFFICER ONLY) */}
              {activeTab === 'officer-members' && user.role === 'officer' && officerOrgDetails && (
                <div className="space-y-8">
                  {/* Pending Request Members Table */}
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      Join Applications 
                      {officerOrgDetails.pending_members?.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 font-bold">
                          {officerOrgDetails.pending_members.length} new
                        </span>
                      )}
                    </h3>
                    
                    {officerOrgDetails.pending_members?.length === 0 ? (
                      <p className="text-sm text-slate-500">No pending join applications.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-900 bg-slate-900/10">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-900 bg-slate-900/30 text-xs font-semibold text-slate-400 uppercase">
                              <th className="p-4">Student ID</th>
                              <th className="p-4">Name</th>
                              <th className="p-4">Email</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900 text-sm">
                            {officerOrgDetails.pending_members.map((m: Membership) => (
                              <tr key={m.id} className="hover:bg-slate-900/20">
                                <td className="p-4 text-slate-400 font-mono">{m.user?.student_id || 'N/A'}</td>
                                <td className="p-4 font-semibold text-white">{m.user?.name}</td>
                                <td className="p-4 text-slate-400">{m.user?.email}</td>
                                <td className="p-4 text-right space-x-3">
                                  <button 
                                    onClick={() => handleUpdateMembershipStatus(m.id, 'approved')}
                                    className="text-emerald-400 hover:text-emerald-300 font-bold text-xs inline-flex items-center gap-1"
                                  >
                                    <Check className="h-3 w-3" /> Approve
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateMembershipStatus(m.id, 'rejected')}
                                    className="text-red-400 hover:text-red-300 font-bold text-xs inline-flex items-center gap-1"
                                  >
                                    <X className="h-3 w-3" /> Reject
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Approved Members List */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-base font-bold text-white">Approved Member List</h3>
                      <button 
                        onClick={handleDownloadMembersReport}
                        className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-1.5 transition-all"
                      >
                        <FileSpreadsheet className="h-4 w-4" /> Export Members Report
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-900 bg-slate-900/10">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-900 bg-slate-900/30 text-xs font-semibold text-slate-400 uppercase">
                            <th className="p-4">Student ID</th>
                            <th className="p-4">Name</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Club Role</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900 text-sm">
                          {officerOrgDetails.members?.map((m: Membership) => (
                            <tr key={m.id} className="hover:bg-slate-900/20">
                              <td className="p-4 text-slate-400 font-mono">{m.user?.student_id || 'N/A'}</td>
                              <td className="p-4 font-semibold text-white">{m.user?.name}</td>
                              <td className="p-4 text-slate-400">{m.user?.email}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${m.role === 'officer' ? 'bg-violet-500/15 text-violet-400 border border-violet-500/20' : 'bg-slate-900 text-slate-500 border border-slate-850'}`}>
                                  {m.role === 'officer' ? (m.officer_title || 'Officer') : 'Member'}
                                </span>
                              </td>
                              <td className="p-4 text-right space-x-3">
                                {m.role === 'member' ? (
                                  <button 
                                    onClick={() => handleAssignOfficerRole(m.id, true)}
                                    className="text-violet-400 hover:text-violet-300 font-semibold text-xs"
                                  >
                                    Assign Officer
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => handleAssignOfficerRole(m.id, false)}
                                    className="text-slate-400 hover:text-slate-300 font-semibold text-xs"
                                  >
                                    Demote
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleRemoveMember(m.id)}
                                  className="text-red-400 hover:text-red-300 font-semibold text-xs"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: EVENT SCHEDULES (OFFICER ONLY) */}
              {activeTab === 'officer-events' && user.role === 'officer' && officerOrgDetails && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Event Planner</h3>
                    <button 
                      onClick={() => setShowEventModal(true)}
                      className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white px-4 py-2 transition-all shadow-md shadow-violet-500/10"
                    >
                      <Plus className="h-4.5 w-4.5" /> Schedule Event
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {officerOrgDetails.events?.length === 0 ? (
                      <p className="text-sm text-slate-500">No events scheduled yet.</p>
                    ) : (
                      officerOrgDetails.events.map((e: Event) => (
                        <div key={e.id} className="rounded-xl border border-slate-900 bg-slate-900/30 p-5 flex flex-col justify-between hover:border-slate-800 transition-all">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="text-base font-bold text-white">{e.title}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${e.status === 'scheduled' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : e.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                {e.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-3">{e.description}</p>
                            
                            <div className="space-y-1.5 text-xs text-slate-500 mb-6">
                              <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {e.location}</p>
                              <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {new Date(e.start_time).toLocaleString()} - {new Date(e.end_time).toLocaleTimeString()}</p>
                            </div>
                          </div>

                          <div className="flex gap-3 mt-auto">
                            <button 
                              onClick={() => viewEventDetails(e.id)}
                              className="flex-1 py-2 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition-all text-center"
                            >
                              Log Attendance
                            </button>
                            <button 
                              onClick={() => handleDownloadEventReport(e.id)}
                              className="px-3.5 py-2 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-300 hover:text-white transition-all"
                              title="Export RSVP list"
                            >
                              <FileSpreadsheet className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: ANNOUNCEMENTS (OFFICER ONLY) */}
              {activeTab === 'officer-announcements' && user.role === 'officer' && officerOrgDetails && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Club Announcements</h3>
                    <button 
                      onClick={() => setShowAnnounceModal(true)}
                      className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white px-4 py-2 transition-all shadow-md shadow-violet-500/10"
                    >
                      <Plus className="h-4.5 w-4.5" /> Post Announcement
                    </button>
                  </div>

                  <div className="space-y-4 max-w-3xl">
                    {officerOrgDetails.announcements?.length === 0 ? (
                      <p className="text-sm text-slate-500">No announcements posted yet.</p>
                    ) : (
                      officerOrgDetails.announcements.map((a: Announcement) => (
                        <div key={a.id} className="rounded-xl border border-slate-900 bg-slate-900/20 p-5">
                          <h4 className="text-base font-bold text-white">{a.title}</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">Posted on {new Date(a.created_at).toLocaleString()} by {a.author?.name || 'Officer'}</p>
                          <p className="text-sm text-slate-400 leading-relaxed mt-3.5 whitespace-pre-wrap">{a.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 7: BROWSE CLUBS (STUDENT ONLY) */}
              {activeTab === 'student-orgs' && user.role === 'student' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <h3 className="text-lg font-bold text-white">Browse Organizations</h3>
                    
                    <div className="flex w-full sm:w-auto gap-3">
                      <div className="relative flex-1 sm:w-64">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                          <Search className="h-4 w-4" />
                        </span>
                        <input 
                          type="text" 
                          placeholder="Search club or acronym..."
                          value={orgSearch}
                          onChange={(e) => setOrgSearch(e.target.value)}
                          className="w-full rounded-lg border border-slate-900 bg-slate-900/30 py-1.5 pl-9 pr-4 text-xs text-slate-200 outline-none focus:border-violet-500/80"
                        />
                      </div>
                      
                      <select
                        value={selectedCategoryFilter}
                        onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                        className="rounded-lg border border-slate-900 bg-slate-900/30 px-3 py-1.5 text-xs text-slate-300 outline-none"
                      >
                        <option value="">All Categories</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id.toString()}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {organizations
                      .filter(org => {
                        const matchesSearch = org.name.toLowerCase().includes(orgSearch.toLowerCase()) || org.acronym.toLowerCase().includes(orgSearch.toLowerCase());
                        const matchesCategory = selectedCategoryFilter ? org.category_id.toString() === selectedCategoryFilter : true;
                        return matchesSearch && matchesCategory;
                      })
                      .map(org => {
                        const status = getMembershipStatus(org.id);
                        return (
                          <div key={org.id} className="rounded-xl border border-slate-900 bg-slate-900/30 p-5 flex flex-col justify-between hover:border-slate-800 transition-all">
                            <div>
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="text-base font-bold text-white">{org.name}</h4>
                                  <span className="text-xs text-violet-400 font-semibold tracking-wide uppercase font-mono">{org.acronym}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-900 text-slate-500'}`}>
                                  {status === 'Join' ? 'Not Joined' : status.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed mt-3.5 mb-4 line-clamp-3">{org.description}</p>
                              <div className="text-[10px] text-slate-500 bg-slate-900/50 px-2 py-1 rounded-md inline-block">
                                Category: {org.category?.name || 'Uncategorized'}
                              </div>
                            </div>

                            <div className="mt-6 flex justify-between items-center">
                              <button
                                onClick={() => viewOrgDetails(org.id)}
                                className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all"
                              >
                                <Eye className="h-3.5 w-3.5" /> View Details
                              </button>
                              <div>
                                {status === 'Join' && (
                                  <button 
                                    onClick={() => handleJoinRequest(org.id)}
                                    className="flex items-center gap-1 py-1.5 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white transition-all shadow-md shadow-violet-500/10"
                                  >
                                    Request to Join <ChevronRight className="h-3 w-3" />
                                  </button>
                                )}
                                {status === 'pending' && (
                                  <span className="text-xs text-slate-500 font-semibold italic">Join Pending Approval</span>
                                )}
                                {status === 'approved' && (
                                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Approved Member</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* TAB 8: STUDENT EVENTS (STUDENT ONLY) */}
              {activeTab === 'student-events' && user.role === 'student' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-white">Upcoming Events</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                    {events.length === 0 ? (
                      <p className="text-sm text-slate-500">No upcoming events listed from your organization network.</p>
                    ) : (
                      events.map(e => (
                        <div key={e.id} className="rounded-xl border border-slate-900 bg-slate-900/30 p-5 flex flex-col justify-between hover:border-slate-800 transition-all">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="text-base font-bold text-white">{e.title}</h4>
                              <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded-full border border-slate-850">
                                {e.organization?.acronym}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-3">{e.description}</p>
                            
                            <div className="space-y-1.5 text-xs text-slate-500 mb-6">
                              <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {e.location}</p>
                              <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {new Date(e.start_time).toLocaleString()} - {new Date(e.end_time).toLocaleTimeString()}</p>
                            </div>
                          </div>

                          <div className="mt-auto">
                            <button 
                              onClick={() => handleRSVPEvent(e.id)}
                              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white transition-all shadow-md shadow-violet-500/10 hover:shadow-violet-500/20 text-center"
                            >
                              Toggle RSVP Status
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 9: STUDENT ANNOUNCEMENTS (STUDENT ONLY) */}
              {activeTab === 'student-announcements' && user.role === 'student' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-white">Official Announcements Feed</h3>

                  <div className="space-y-4 max-w-3xl">
                    {announcements.length === 0 ? (
                      <p className="text-sm text-slate-500">No announcements posted in your networks.</p>
                    ) : (
                      announcements.map((a) => (
                        <div key={a.id} className="rounded-xl border border-slate-900 bg-slate-900/20 p-5">
                          <div className="flex justify-between items-start">
                            <h4 className="text-base font-bold text-white">{a.title}</h4>
                            <span className="text-xs text-violet-400 font-bold font-mono">{a.organization?.acronym}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">Posted on {new Date(a.created_at).toLocaleString()} by {a.author?.name || 'Officer'}</p>
                          <p className="text-sm text-slate-400 leading-relaxed mt-3.5 whitespace-pre-wrap">{a.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ================= MODALS AND POPUPS ================= */}

      {/* CREATE CATEGORY MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Add New Category</h3>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Category Name</label>
                <input 
                  type="text" 
                  required 
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Academic, Sports, Arts"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-3 pr-3 text-sm text-slate-200 outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Description</label>
                <textarea 
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Brief description of category..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-3 pr-3 text-sm text-slate-200 outline-none h-24 focus:border-violet-500 resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-850 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white transition-all"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ORGANIZATION MODAL */}
      {showOrgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Add New Organization</h3>
            <form onSubmit={handleCreateOrganization} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Organization Name</label>
                  <input 
                    type="text" 
                    required 
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="Computer Science Society"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-3 pr-3 text-sm text-slate-200 outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Acronym</label>
                  <input 
                    type="text" 
                    required 
                    value={newOrgAcronym}
                    onChange={(e) => setNewOrgAcronym(e.target.value)}
                    placeholder="CSS"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-3 pr-3 text-sm text-slate-200 outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Category</label>
                  <select 
                    required 
                    value={newOrgCatId}
                    onChange={(e) => setNewOrgCatId(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-3 pr-3 text-sm text-slate-300 outline-none focus:border-violet-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id.toString()}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Description</label>
                <textarea 
                  required
                  value={newOrgDesc}
                  onChange={(e) => setNewOrgDesc(e.target.value)}
                  placeholder="Club mission, vision, and activities..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-3 pr-3 text-sm text-slate-200 outline-none h-24 focus:border-violet-500 resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowOrgModal(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-850 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white transition-all"
                >
                  Create Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ORG PROFILE MODAL */}
      {showEditOrgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Edit Club Profile</h3>
            <form onSubmit={handleEditOrganizationProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Organization Name</label>
                  <input 
                    type="text" 
                    required 
                    value={editOrgName}
                    onChange={(e) => setEditOrgName(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-3 pr-3 text-sm text-slate-200 outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Acronym</label>
                  <input 
                    type="text" 
                    required 
                    value={editOrgAcronym}
                    onChange={(e) => setEditOrgAcronym(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-3 pr-3 text-sm text-slate-200 outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Category</label>
                  <select 
                    required 
                    value={editOrgCatId}
                    onChange={(e) => setEditOrgCatId(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-3 pr-3 text-sm text-slate-300 outline-none focus:border-violet-500"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id.toString()}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Description</label>
                <textarea 
                  required
                  value={editOrgDesc}
                  onChange={(e) => setEditOrgDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-3 pr-3 text-sm text-slate-200 outline-none h-24 focus:border-violet-500 resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowEditOrgModal(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-850 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white transition-all"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Schedule New Event</h3>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Event Title</label>
                <input 
                  type="text" 
                  required 
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="Introductory Coding Workshop"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-3 pr-3 text-sm text-slate-200 outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Location</label>
                <input 
                  type="text" 
                  required 
                  value={newEventLoc}
                  onChange={(e) => setNewEventLoc(e.target.value)}
                  placeholder="Seminar Room A / Virtual"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-3 pr-3 text-sm text-slate-200 outline-none focus:border-violet-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Start Time</label>
                  <input 
                    type="datetime-local" 
                    required 
                    value={newEventStart}
                    onChange={(e) => setNewEventStart(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-3 pr-3 text-xs text-slate-300 outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">End Time</label>
                  <input 
                    type="datetime-local" 
                    required 
                    value={newEventEnd}
                    onChange={(e) => setNewEventEnd(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-3 pr-3 text-xs text-slate-300 outline-none focus:border-violet-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Description</label>
                <textarea 
                  required
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  placeholder="Detail schedule, topics covered, speakers..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-3 pr-3 text-sm text-slate-200 outline-none h-24 focus:border-violet-500 resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-850 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white transition-all"
                >
                  Schedule Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ANNOUNCEMENT MODAL */}
      {showAnnounceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Post Announcement</h3>
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Title</label>
                <input 
                  type="text" 
                  required 
                  value={newAnnTitle}
                  onChange={(e) => setNewAnnTitle(e.target.value)}
                  placeholder="Hackathon Team Registration Open"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-3 pr-3 text-sm text-slate-200 outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Content</label>
                <textarea 
                  required
                  value={newAnnContent}
                  onChange={(e) => setNewAnnContent(e.target.value)}
                  placeholder="Write the full body of the announcement..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-3 pr-3 text-sm text-slate-200 outline-none h-32 focus:border-violet-500 resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAnnounceModal(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-850 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white transition-all"
                >
                  Post Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EVENT ATTENDANCE / RSVP DETAILS MODAL */}
      {showEventDetailsModal && selectedEventDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl h-[550px] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-white">{selectedEventDetails.event?.title}</h3>
                <button 
                  onClick={() => setShowEventDetailsModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-6">
                <MapPin className="h-3.5 w-3.5" /> {selectedEventDetails.event?.location}
              </p>

              <h4 className="text-sm font-bold text-white mb-3">Event RSVPs & Attendance Log</h4>
              
              <div className="overflow-y-auto max-h-[320px] rounded-xl border border-slate-950 pr-1">
                {selectedEventDetails.participations?.length === 0 ? (
                  <p className="text-xs text-slate-500 p-4 text-center">No students registered/RSVP'd for this event.</p>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-950 bg-slate-950/40 text-slate-400 uppercase font-semibold">
                        <th className="p-3">Student</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Update Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-950">
                      {selectedEventDetails.participations.map((p: EventParticipation) => (
                        <tr key={p.id} className="hover:bg-slate-900/10">
                          <td className="p-3">
                            <span className="font-semibold text-white block">{p.user?.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{p.user?.student_id || 'N/A'}</span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${p.status === 'attended' ? 'bg-emerald-500/10 text-emerald-400' : p.status === 'absent' ? 'bg-red-500/10 text-red-400' : 'bg-slate-900 text-slate-500'}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <button 
                              onClick={() => handleMarkAttendance(selectedEventDetails.event.id, p.user_id, 'attended')}
                              className="text-emerald-400 hover:underline font-semibold"
                            >
                              Present
                            </button>
                            <button 
                              onClick={() => handleMarkAttendance(selectedEventDetails.event.id, p.user_id, 'absent')}
                              className="text-red-400 hover:underline font-semibold"
                            >
                              Absent
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-950">
              <button 
                type="button" 
                onClick={() => setShowEventDetailsModal(false)}
                className="px-5 py-2 border border-slate-800 hover:bg-slate-850 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all animate-fade-in"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT COMPILER / CSV PREVIEW MODAL */}
      {showReportModal && reportData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl h-[550px] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-1">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-violet-400" /> 
                  {reportType === 'members' ? 'Membership Roster Report' : 'Event Participation Audit'}
                </h3>
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-6">Generated At: {reportData.generated_at}</p>

              {/* CSV Sheet Grid Preview */}
              <div className="overflow-y-auto max-h-[320px] rounded-xl border border-slate-950 text-xs">
                {reportType === 'members' ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-950 bg-slate-950/40 text-slate-400 uppercase font-semibold">
                        <th className="p-3">Student ID</th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Title</th>
                        <th className="p-3">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-950 text-slate-300">
                      {reportData.members.map((m: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-900/10">
                          <td className="p-3 font-mono">{m.student_id}</td>
                          <td className="p-3 font-semibold text-white">{m.name}</td>
                          <td className="p-3 text-slate-400">{m.email}</td>
                          <td className="p-3 capitalize">{m.role_in_org}</td>
                          <td className="p-3">{m.officer_title}</td>
                          <td className="p-3 text-[10px] text-slate-500">{m.joined_at}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-950 bg-slate-950/40 text-slate-400 uppercase font-semibold">
                        <th className="p-3">Student ID</th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Updated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-950 text-slate-300">
                      {reportData.participations.map((p: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-900/10">
                          <td className="p-3 font-mono">{p.student_id}</td>
                          <td className="p-3 font-semibold text-white">{p.name}</td>
                          <td className="p-3 text-slate-400">{p.email}</td>
                          <td className="p-3 capitalize">{p.status}</td>
                          <td className="p-3 text-[10px] text-slate-500">{p.updated_at}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-950 mt-4">
              <span className="text-xs text-slate-400">
                {reportType === 'members' ? `Total Records: ${reportData.total_members}` : `Total RSVP: ${reportData.total_rsvps} | Attended: ${reportData.total_attended}`}
              </span>
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-850 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all"
                >
                  Close
                </button>
                <button 
                  type="button" 
                  onClick={exportToCSV}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white transition-all shadow-md shadow-violet-500/10"
                >
                  <FileSpreadsheet className="h-4 w-4" /> Download CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ORGANIZATION DETAIL MODAL (STUDENT VIEW) */}
      {showOrgDetailModal && selectedOrgDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedOrgDetails.organization?.name}</h3>
                <span className="text-xs text-violet-400 font-mono font-bold">{selectedOrgDetails.organization?.acronym}</span>
                <span className="text-xs text-slate-500 ml-3">• {selectedOrgDetails.organization?.category?.name}</span>
              </div>
              <button onClick={() => setShowOrgDetailModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed mb-6">{selectedOrgDetails.organization?.description}</p>

            <div className="overflow-y-auto flex-1 space-y-6 pr-1">
              {/* Members Section */}
              <div>
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-violet-400" /> Members ({selectedOrgDetails.members_count})
                </h4>
                {selectedOrgDetails.members?.length === 0 ? (
                  <p className="text-xs text-slate-500">No approved members yet.</p>
                ) : (
                  <div className="rounded-xl border border-slate-950 overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-950 bg-slate-950/40 text-slate-400 uppercase font-semibold">
                          <th className="p-3">Name</th>
                          <th className="p-3">Student ID</th>
                          <th className="p-3">Role</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-950">
                        {selectedOrgDetails.members.map((m: any) => (
                          <tr key={m.id} className="hover:bg-slate-900/10">
                            <td className="p-3 font-semibold text-white">{m.user?.name}</td>
                            <td className="p-3 text-slate-500 font-mono">{m.user?.student_id || '—'}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${m.role === 'officer' ? 'bg-violet-500/15 text-violet-400 border border-violet-500/20' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}>
                                {m.role === 'officer' ? (m.officer_title || 'Officer') : 'Member'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Events Section */}
              <div>
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-cyan-400" /> Events ({selectedOrgDetails.events?.length || 0})
                </h4>
                {selectedOrgDetails.events?.length === 0 ? (
                  <p className="text-xs text-slate-500">No events scheduled.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedOrgDetails.events.map((e: any) => (
                      <div key={e.id} className="rounded-lg border border-slate-950 bg-slate-950/30 p-3.5">
                        <div className="flex justify-between items-start">
                          <h5 className="text-sm font-bold text-white">{e.title}</h5>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${e.status === 'scheduled' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                            {e.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{e.description}</p>
                        <div className="flex gap-4 mt-2 text-[10px] text-slate-500">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.location}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(e.start_time).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Announcements Section */}
              <div>
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Radio className="h-4 w-4 text-amber-400" /> Announcements ({selectedOrgDetails.announcements?.length || 0})
                </h4>
                {selectedOrgDetails.announcements?.length === 0 ? (
                  <p className="text-xs text-slate-500">No announcements posted.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedOrgDetails.announcements.map((a: any) => (
                      <div key={a.id} className="rounded-lg border border-slate-950 bg-slate-950/30 p-3.5">
                        <h5 className="text-sm font-bold text-white">{a.title}</h5>
                        <p className="text-[10px] text-slate-500 mt-0.5">Posted on {new Date(a.created_at).toLocaleString()} by {a.author?.name || 'Officer'}</p>
                        <p className="text-xs text-slate-400 leading-relaxed mt-2 whitespace-pre-wrap">{a.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-950 mt-4">
              <button
                onClick={() => setShowOrgDetailModal(false)}
                className="px-5 py-2 border border-slate-800 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
