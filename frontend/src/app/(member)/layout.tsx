'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  Compass,
  Calendar,
  User,
  LogOut,
  Bell,
  Menu,
  X,
  Check,
  CheckSquare
} from 'lucide-react';
import { useMemberAuthStore } from '@/store/memberAuthStore';
import api from '@/services/api';

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearUser, token } = useMemberAuthStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Enforce session security
  useEffect(() => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('member_token') : null;
    if (!token && !storedToken) {
      router.push('/login');
    }
  }, [token, router]);

  // Load notifications
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const response = await api.get('/member/notifications');
      if (response.data?.data) {
        setNotifications(response.data.data);
        setUnreadCount(response.data.data.filter((n: any) => !n.read).length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchNotifications();
      // Poll notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/member/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/member/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/member/logout');
    } catch (err) {
      console.error('Logout API failed, forcing client session clear');
    } finally {
      clearUser();
      toast.success('Logged out successfully');
      router.push('/login');
    }
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Explore Clubs', href: '/organizations', icon: Compass },
    { name: 'Club Events', href: '/events', icon: Calendar },
    { name: 'Profile Panel', href: '/profile', icon: User },
  ];

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <svg className="h-10 w-10 animate-spin text-violet-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm text-slate-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  const userInitials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200 overflow-hidden">

      {/* Dynamic Background Accent Glows */}
      <div className="absolute top-0 left-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-violet-600/5 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-[400px] w-[400px] rounded-full bg-cyan-600/5 blur-[100px]" />

      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-slate-800/60 bg-slate-950/40 backdrop-blur-md flex flex-col justify-between hidden md:flex z-20">
        <div>
          {/* Logo Area */}
          <div className="px-6 py-6 border-b border-slate-800/60 flex items-center gap-2.5">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-500 text-white font-bold shadow-md shadow-violet-500/10 transition-transform duration-200 group-hover:scale-105">
                S
              </div>
              <span className="font-bold tracking-tight text-white text-lg bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                StudentOrgs
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${isActive
                    ? 'bg-violet-600/10 border-violet-500/20 text-violet-400 shadow-inner'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/40 border-transparent hover:border-slate-800/30'
                    }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-slate-800/60 flex flex-col gap-3">
          <Link href="/profile" className="flex items-center gap-3 px-2 group">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-9 w-9 rounded-full object-cover border border-violet-500/30 group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-sm font-bold text-violet-400 group-hover:scale-105 transition-transform duration-200">
                {userInitials}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate group-hover:text-violet-300 transition-colors">{user.name}</p>
              <p className="text-[10px] text-slate-500 truncate font-mono">Student Account</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2.5 border border-slate-800/80 hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400 rounded-xl text-xs font-semibold text-slate-400 transition-all duration-200"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* Navigation Header */}
        <header className="h-16 border-b border-slate-800/60 bg-slate-950/20 backdrop-blur-md px-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-400 hover:text-white md:hidden transition-all"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-sm font-bold text-white tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              {pathname === '/dashboard' ? 'Overview Dashboard' :
                pathname.startsWith('/organizations') ? 'Explore Clubs' :
                  pathname.startsWith('/events') ? 'Club Events' :
                    pathname.startsWith('/profile') ? 'Profile settings' : 'Student Hub'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications Dropdown */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-900/50 text-slate-400 hover:text-white transition-all duration-200"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[9px] font-bold text-white ring-2 ring-slate-950 animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-slate-800 bg-slate-950/90 backdrop-blur-md shadow-2xl p-4 z-50 text-left">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-900 mb-2">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[10px] font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
                      >
                        <CheckSquare className="h-3 w-3" /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2 py-1 pr-1 custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-500 font-medium">
                        No notifications found
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-xl border text-xs transition-all relative ${n.read
                            ? 'bg-slate-950/40 border-slate-900 text-slate-400'
                            : 'bg-violet-600/5 border-violet-500/15 text-white'
                            }`}
                        >
                          <p className="font-medium pr-4">{n.data?.message || 'New notification'}</p>
                          <span className="text-[9px] text-slate-500 font-mono block mt-1">
                            {new Date(n.created_at).toLocaleDateString()}
                          </span>
                          {!n.read && (
                            <button
                              onClick={() => handleMarkAsRead(n.id)}
                              className="absolute top-2.5 right-2 text-violet-400 hover:text-white transition-colors"
                              title="Mark as read"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-slate-800/80 hidden sm:block" />

            {/* Quick Profile Widget */}
            <div className="hidden sm:flex items-center gap-2.5">
              <span className="text-xs font-semibold text-slate-400">Student ID:</span>
              <span className="px-3 py-1 rounded-full border border-slate-800 bg-slate-950/60 text-[10px] font-mono text-slate-300">
                {user.student_id || 'NOTSET'}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <div className="flex-1 overflow-y-auto p-6 relative">
          {children}
        </div>
      </main>

      {/* Mobile Hamburger Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop mask */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
          />

          <aside className="relative flex w-64 max-w-xs flex-col bg-slate-950 border-r border-slate-800/60 p-5 z-10 text-left">
            <div className="flex items-center justify-between pb-6 border-b border-slate-900 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-500 text-white font-bold text-sm">
                  S
                </div>
                <span className="font-bold text-white tracking-tight">StudentOrgs</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${isActive
                      ? 'bg-violet-600/10 border-violet-500/20 text-violet-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900 border-transparent hover:border-slate-850'
                      }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Footer Profiling */}
            <div className="pt-6 border-t border-slate-900 flex flex-col gap-3">
              <div className="flex items-center gap-3 px-2">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-9 w-9 rounded-full object-cover border border-violet-500/30" />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-sm font-bold text-violet-400">
                    {userInitials}
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-500 truncate font-mono">Student Account</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full py-2.5 border border-slate-850 hover:bg-red-500/5 hover:border-red-500/20 hover:text-red-400 rounded-xl text-xs font-semibold text-slate-400 transition-all duration-200"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
