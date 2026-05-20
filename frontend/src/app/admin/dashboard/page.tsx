'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { Category, Organization, Event } from '@/types';
import {
  ShieldCheck, Users, BookOpen, LayoutDashboard, LogOut, Plus,
  X, MapPin, Calendar, AlertCircle, Building2, Trash2, Check, Eye
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);

  // Data states
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Organization Members Management Modal
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedOrgDetails, setSelectedOrgDetails] = useState<any>(null);
  const [membersModalLoading, setMembersModalLoading] = useState(false);

  // Category Modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Organization Modal
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgAcronym, setNewOrgAcronym] = useState('');
  const [newOrgDesc, setNewOrgDesc] = useState('');
  const [newOrgCatId, setNewOrgCatId] = useState('');

  // Banner
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [statsRes, catsRes, orgsRes, usersRes] = await Promise.all([
        api.get('/dashboard-stats'),
        api.get('/categories'),
        api.get('/organizations'),
        api.get('/users'),
      ]);
      setDashboardStats(statsRes.data);
      setCategories(catsRes.data);
      setOrganizations(orgsRes.data);
      setAllUsers(usersRes.data);
    } catch (err) {
      console.error('Failed to load admin dashboard', err);
      showBanner('Failed to retrieve dashboard content.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadDashboardData();
    }
  }, [user]);

  const showBanner = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  // ===== Admin Actions =====
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
    if (!confirm('Are you sure you want to delete this category?')) return;
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

  // ===== Org Membership Management Actions for Admin =====
  const handleOpenMembersModal = async (orgId: number) => {
    setMembersModalLoading(true);
    setShowMembersModal(true);
    try {
      const res = await api.get(`/organizations/${orgId}`);
      setSelectedOrgDetails(res.data);
    } catch (err) {
      showBanner('Failed to load organization details.', 'error');
      setShowMembersModal(false);
    } finally {
      setMembersModalLoading(false);
    }
  };

  const refreshModalDetails = async (orgId: number) => {
    try {
      const res = await api.get(`/organizations/${orgId}`);
      setSelectedOrgDetails(res.data);
      loadDashboardData();
    } catch (err) {
      console.error('Failed to refresh modal details', err);
    }
  };

  const handleAdminUpdateMembershipStatus = async (membershipId: number, status: 'approved' | 'rejected') => {
    if (!selectedOrgDetails?.organization) return;
    try {
      await api.put(`/memberships/${membershipId}/status`, { status });
      showBanner(`Membership request ${status}.`, 'success');
      refreshModalDetails(selectedOrgDetails.organization.id);
    } catch (err) {
      showBanner('Failed to update membership status.', 'error');
    }
  };

  const handleAdminAssignOfficerRole = async (membershipId: number, makeOfficer: boolean) => {
    if (!selectedOrgDetails?.organization) return;
    try {
      if (makeOfficer) {
        const title = prompt('Enter officer title (e.g. President, Vice President, Treasurer):');
        if (title === null) return;
        await api.put(`/memberships/${membershipId}/role`, { role: 'officer', officer_title: title || 'Officer' });
      } else {
        if (!confirm('Are you sure you want to demote this officer to regular member?')) return;
        await api.put(`/memberships/${membershipId}/role`, { role: 'member' });
      }
      showBanner('Member role updated successfully.', 'success');
      refreshModalDetails(selectedOrgDetails.organization.id);
    } catch (err) {
      showBanner('Failed to update role.', 'error');
    }
  };

  const handleAdminRemoveMember = async (membershipId: number) => {
    if (!selectedOrgDetails?.organization) return;
    if (!confirm('Are you sure you want to remove this member from the organization?')) return;
    try {
      await api.delete(`/memberships/${membershipId}`);
      showBanner('Member removed successfully.', 'success');
      refreshModalDetails(selectedOrgDetails.organization.id);
    } catch (err) {
      showBanner('Failed to remove member.', 'error');
    }
  };

  const handleChangeUserRole = async (userId: number, newRole: string) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      showBanner('User role updated successfully.', 'success');
      loadDashboardData();
    } catch (err: any) {
      showBanner(err.response?.data?.message || 'Failed to update user role.', 'error');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await api.delete(`/users/${userId}`);
      showBanner('User deleted successfully.', 'success');
      loadDashboardData();
    } catch (err: any) {
      showBanner(err.response?.data?.message || 'Failed to delete user.', 'error');
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <div className="text-center">
          <svg className="h-10 w-10 animate-spin text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm text-gray-400">Loading admin session...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-200">

      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-900 bg-gray-950 flex-col justify-between hidden md:flex">
        <div>
          <div className="px-6 py-6 border-b border-gray-900 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-red-600 to-amber-500 text-white font-bold shadow-md shadow-red-500/10">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="font-bold tracking-tight text-white text-lg">Admin Panel</span>
          </div>

          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'home' ? 'bg-red-600/10 border border-red-500/20 text-red-400' : 'text-gray-400 hover:text-white hover:bg-gray-900/50'}`}
            >
              <LayoutDashboard className="h-4 w-4" /> Overview
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'categories' ? 'bg-red-600/10 border border-red-500/20 text-red-400' : 'text-gray-400 hover:text-white hover:bg-gray-900/50'}`}
            >
              <BookOpen className="h-4 w-4" /> Categories
            </button>
            <button
              onClick={() => setActiveTab('organizations')}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'organizations' ? 'bg-red-600/10 border border-red-500/20 text-red-400' : 'text-gray-400 hover:text-white hover:bg-gray-900/50'}`}
            >
              <Building2 className="h-4 w-4" /> Organizations
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-red-600/10 border border-red-500/20 text-red-400' : 'text-gray-400 hover:text-white hover:bg-gray-900/50'}`}
            >
              <Users className="h-4 w-4" /> Manage Users
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-gray-900 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-red-600/25 border border-red-500/20 flex items-center justify-center text-sm font-bold text-red-400">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-gray-500 truncate">System Administrator</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full py-2 border border-gray-800 hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400 rounded-xl text-xs font-semibold text-gray-400 transition-all duration-200"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-gray-900 px-6 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white tracking-wide uppercase">
            {activeTab === 'home' ? 'Dashboard Overview' : activeTab}
          </h2>
          <div className="px-3 py-1 rounded-full border border-red-500/20 bg-red-500/5 text-[11px] font-semibold text-red-400">
            Administrator
          </div>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          {message && (
            <div className={`mb-6 p-4 rounded-xl border flex items-center gap-2.5 text-sm transition-all duration-200 ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' : 'bg-red-500/10 border-red-500/25 text-red-400'}`}>
              <AlertCircle className="h-4 w-4" />
              {message.text}
            </div>
          )}

          {loading ? (
            <div className="flex h-full items-center justify-center">
              <svg className="h-8 w-8 animate-spin text-red-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : (
            <>
              {/* HOME TAB */}
              {activeTab === 'home' && dashboardStats && (
                <div className="space-y-6">
                  <div className="relative rounded-2xl overflow-hidden border border-gray-800 bg-gradient-to-r from-red-600/20 via-gray-950/20 to-gray-950 p-8 shadow-lg">
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white">Welcome, {user.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-xl">
                      System administrator dashboard. Manage all categories, organizations, and monitor platform metrics.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
                    <div className="rounded-xl border border-gray-900 bg-gray-900/30 p-5 hover:border-gray-800 transition-all">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Registered Users</p>
                      <h4 className="text-3xl font-extrabold text-white mt-1">{dashboardStats.total_users}</h4>
                    </div>
                    <div className="rounded-xl border border-gray-900 bg-gray-900/30 p-5 hover:border-gray-800 transition-all">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Organizations</p>
                      <h4 className="text-3xl font-extrabold text-white mt-1">{dashboardStats.total_organizations}</h4>
                    </div>
                    <div className="rounded-xl border border-gray-900 bg-gray-900/30 p-5 hover:border-gray-800 transition-all">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Categories</p>
                      <h4 className="text-3xl font-extrabold text-white mt-1">{dashboardStats.total_categories}</h4>
                    </div>
                    <div className="rounded-xl border border-gray-900 bg-gray-900/30 p-5 hover:border-gray-800 transition-all">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Events</p>
                      <h4 className="text-3xl font-extrabold text-white mt-1">{dashboardStats.total_events}</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-gray-900 bg-gray-900/20 p-6">
                      <h3 className="text-base font-bold text-white mb-4">Upcoming University Events</h3>
                      <div className="space-y-4">
                        {dashboardStats.upcoming_events?.length === 0 ? (
                          <p className="text-sm text-gray-500">No upcoming events listed.</p>
                        ) : (
                          dashboardStats.upcoming_events?.map((e: Event) => (
                            <div key={e.id} className="flex justify-between items-start border-b border-gray-900 pb-3">
                              <div>
                                <h4 className="text-sm font-semibold text-white">{e.title}</h4>
                                <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                                  <MapPin className="h-3 w-3" /> {e.location}
                                </p>
                              </div>
                              <span className="text-[10px] bg-gray-900 text-gray-400 px-2 py-0.5 rounded-full border border-gray-800">
                                {new Date(e.start_time).toLocaleDateString()}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-900 bg-gray-900/20 p-6">
                      <h3 className="text-base font-bold text-white mb-4">Organization Members Count</h3>
                      <div className="space-y-3">
                        {dashboardStats.organization_stats?.length === 0 ? (
                          <p className="text-sm text-gray-500">No organizations listed.</p>
                        ) : (
                          dashboardStats.organization_stats?.map((org: any, i: number) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                              <span className="text-gray-400 font-medium">{org.name} ({org.acronym})</span>
                              <span className="font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/15">
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

              {/* CATEGORIES TAB */}
              {activeTab === 'categories' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Manage Categories</h3>
                    <button
                      onClick={() => setShowCategoryModal(true)}
                      className="flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-semibold text-white px-4 py-2 transition-all shadow-md shadow-red-500/10"
                    >
                      <Plus className="h-4 w-4" /> Add Category
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-gray-900 bg-gray-900/10">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-900 bg-gray-900/30 text-xs font-semibold text-gray-400 uppercase">
                          <th className="p-4">Name</th>
                          <th className="p-4">Description</th>
                          <th className="p-4">Orgs Count</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-900 text-sm">
                        {categories.map((cat) => (
                          <tr key={cat.id} className="hover:bg-gray-900/20">
                            <td className="p-4 font-semibold text-white">{cat.name}</td>
                            <td className="p-4 text-gray-400 max-w-md truncate">{cat.description || 'N/A'}</td>
                            <td className="p-4 text-gray-400">{cat.organizations_count || 0}</td>
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

              {/* ORGANIZATIONS TAB */}
              {activeTab === 'organizations' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Manage Organizations</h3>
                    <button
                      onClick={() => setShowOrgModal(true)}
                      className="flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-semibold text-white px-4 py-2 transition-all shadow-md shadow-red-500/10"
                    >
                      <Plus className="h-4 w-4" /> Add Organization
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-gray-900 bg-gray-900/10">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-900 bg-gray-900/30 text-xs font-semibold text-gray-400 uppercase">
                          <th className="p-4">Name</th>
                          <th className="p-4">Acronym</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-900 text-sm">
                        {organizations.map((org) => (
                          <tr key={org.id} className="hover:bg-gray-900/20">
                            <td className="p-4 font-semibold text-white">{org.name}</td>
                            <td className="p-4 text-red-400 font-mono font-bold">{org.acronym}</td>
                            <td className="p-4 text-gray-400">{org.category?.name || 'N/A'}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${org.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-900 text-gray-500 border border-gray-800'}`}>
                                {org.status}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              <button
                                onClick={() => handleOpenMembersModal(org.id)}
                                className="text-violet-400 hover:text-violet-300 font-semibold text-xs border border-violet-900 bg-violet-950/20 px-2.5 py-1 rounded-lg"
                              >
                                Manage Members
                              </button>
                              <button
                                onClick={() => handleDeleteOrganization(org.id)}
                                className="text-red-400 hover:text-red-300 font-semibold text-xs border border-red-950 bg-red-950/20 px-2.5 py-1 rounded-lg"
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

              {/* USERS TAB */}
              {activeTab === 'users' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Manage Users</h3>
                    <span className="text-xs text-gray-500">{allUsers.length} total users</span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-gray-900 bg-gray-900/10">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-900 bg-gray-900/30 text-xs font-semibold text-gray-400 uppercase">
                          <th className="p-4">Name</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Student ID</th>
                          <th className="p-4">Role</th>
                          <th className="p-4">Memberships</th>
                          <th className="p-4">Registered</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-900 text-sm">
                        {allUsers.map((u: any) => (
                          <tr key={u.id} className="hover:bg-gray-900/20">
                            <td className="p-4 font-semibold text-white">{u.name}</td>
                            <td className="p-4 text-gray-400">{u.email}</td>
                            <td className="p-4 text-gray-400 font-mono">{u.student_id || '—'}</td>
                            <td className="p-4">
                              <select
                                value={u.role}
                                onChange={(e) => handleChangeUserRole(u.id, e.target.value)}
                                disabled={u.id === user.id}
                                className="rounded-lg border border-gray-800 bg-gray-950 py-1 px-2 text-xs text-gray-200 outline-none focus:border-red-500 disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <option value="student">Student</option>
                                <option value="officer">Officer</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td className="p-4 text-gray-400">{u.memberships_count}</td>
                            <td className="p-4 text-gray-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                            <td className="p-4 text-right">
                              {u.id !== user.id ? (
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="text-red-400 hover:text-red-300 font-semibold text-xs inline-flex items-center gap-1"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Delete
                                </button>
                              ) : (
                                <span className="text-[10px] text-gray-600">Current user</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* CREATE CATEGORY MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">New Category</h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Category Name</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Technology & Science"
                  className="w-full rounded-xl border border-gray-800 bg-gray-950/80 py-2 pl-3 pr-3 text-sm text-gray-200 outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Description</label>
                <textarea
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Brief description of the category..."
                  className="w-full rounded-xl border border-gray-800 bg-gray-950/80 py-2 pl-3 pr-3 text-sm text-gray-200 outline-none h-24 focus:border-red-500 resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 border border-gray-800 rounded-xl text-xs font-semibold text-gray-400 hover:text-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white transition-all"
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
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">New Organization</h3>
              <button onClick={() => setShowOrgModal(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateOrganization} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Organization Name</label>
                <input
                  type="text"
                  required
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Computer Science Society"
                  className="w-full rounded-xl border border-gray-800 bg-gray-950/80 py-2 pl-3 pr-3 text-sm text-gray-200 outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Acronym</label>
                <input
                  type="text"
                  required
                  value={newOrgAcronym}
                  onChange={(e) => setNewOrgAcronym(e.target.value)}
                  placeholder="CSS"
                  className="w-full rounded-xl border border-gray-800 bg-gray-950/80 py-2 pl-3 pr-3 text-sm text-gray-200 outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Description</label>
                <textarea
                  value={newOrgDesc}
                  onChange={(e) => setNewOrgDesc(e.target.value)}
                  placeholder="Brief description of the organization..."
                  className="w-full rounded-xl border border-gray-800 bg-gray-950/80 py-2 pl-3 pr-3 text-sm text-gray-200 outline-none h-20 focus:border-red-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Category</label>
                <select
                  required
                  value={newOrgCatId}
                  onChange={(e) => setNewOrgCatId(e.target.value)}
                  className="w-full rounded-xl border border-gray-800 bg-gray-950/80 py-2 px-3 text-sm text-gray-200 outline-none focus:border-red-500"
                >
                  <option value="">Select a category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowOrgModal(false)}
                  className="px-4 py-2 border border-gray-800 rounded-xl text-xs font-semibold text-gray-400 hover:text-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white transition-all"
                >
                  Create Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN MEMBERSHIP MANAGEMENT MODAL */}
      {showMembersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Manage Organization Roster
                </h3>
                {selectedOrgDetails?.organization && (
                  <p className="text-xs text-gray-400 mt-1">
                    {selectedOrgDetails.organization.name} ({selectedOrgDetails.organization.acronym})
                  </p>
                )}
              </div>
              <button onClick={() => setShowMembersModal(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {membersModalLoading ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <svg className="h-8 w-8 animate-spin text-red-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : selectedOrgDetails ? (
              <div className="overflow-y-auto flex-1 space-y-6 pr-1">
                {/* Pending Requests */}
                <div>
                  <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                    Pending Applications
                    {selectedOrgDetails.pending_members?.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 font-bold">
                        {selectedOrgDetails.pending_members.length} new
                      </span>
                    )}
                  </h4>
                  {selectedOrgDetails.pending_members?.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No pending applications for this organization.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-950">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-gray-950 bg-gray-950/40 text-gray-400 uppercase font-semibold">
                            <th className="p-3">Student ID</th>
                            <th className="p-3">Name</th>
                            <th className="p-3">Email</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-950 text-gray-300">
                          {selectedOrgDetails.pending_members.map((m: any) => (
                            <tr key={m.id} className="hover:bg-gray-900/10">
                              <td className="p-3 font-mono">{m.user?.student_id || '—'}</td>
                              <td className="p-3 font-semibold text-white">{m.user?.name}</td>
                              <td className="p-3 text-gray-400">{m.user?.email}</td>
                              <td className="p-3 text-right space-x-2">
                                <button
                                  onClick={() => handleAdminUpdateMembershipStatus(m.id, 'approved')}
                                  className="text-emerald-400 hover:text-emerald-350 font-bold bg-emerald-950/15 border border-emerald-900 px-2 py-1 rounded"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleAdminUpdateMembershipStatus(m.id, 'rejected')}
                                  className="text-red-400 hover:text-red-350 font-bold bg-red-950/15 border border-red-900 px-2 py-1 rounded"
                                >
                                  Reject
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Roster / Active Members */}
                <div>
                  <h4 className="text-sm font-bold text-white mb-2">Active Members & Officers ({selectedOrgDetails.members_count})</h4>
                  {selectedOrgDetails.members?.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No approved members found.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-950">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-gray-950 bg-gray-950/40 text-gray-400 uppercase font-semibold">
                            <th className="p-3">Student ID</th>
                            <th className="p-3">Name</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Role</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-950 text-gray-300">
                          {selectedOrgDetails.members.map((m: any) => (
                            <tr key={m.id} className="hover:bg-gray-900/10">
                              <td className="p-3 font-mono">{m.user?.student_id || '—'}</td>
                              <td className="p-3 font-semibold text-white">{m.user?.name}</td>
                              <td className="p-3 text-gray-400">{m.user?.email}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${m.role === 'officer' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-gray-900 text-gray-500 border border-gray-800'}`}>
                                  {m.role === 'officer' ? (m.officer_title || 'Officer') : 'Member'}
                                </span>
                              </td>
                              <td className="p-3 text-right space-x-2">
                                {m.role === 'member' ? (
                                  <button
                                    onClick={() => handleAdminAssignOfficerRole(m.id, true)}
                                    className="text-red-400 hover:text-red-300 font-semibold px-2 py-1 border border-red-950 bg-red-950/10 rounded"
                                  >
                                    Assign Officer
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleAdminAssignOfficerRole(m.id, false)}
                                    className="text-gray-400 hover:text-gray-300 font-semibold px-2 py-1 border border-gray-800 bg-gray-900 rounded"
                                  >
                                    Demote
                                  </button>
                                )}
                                <button
                                  onClick={() => handleAdminRemoveMember(m.id)}
                                  className="text-red-500 hover:text-red-400 font-bold px-2 py-1 border border-red-950 bg-red-950/20 rounded"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 py-8 text-center">Failed to load organization details.</p>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-800 mt-4">
              <button
                onClick={() => setShowMembersModal(false)}
                className="px-5 py-2 border border-gray-800 rounded-xl text-xs font-semibold text-gray-400 hover:text-gray-200 transition-all"
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
