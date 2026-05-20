'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Users, 
  Building2, 
  Calendar, 
  Megaphone, 
  BarChart3, 
  History, 
  LogOut, 
  Menu, 
  X,
  UserCheck
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, clearAdmin } = useAdminAuthStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = () => {
    clearAdmin();
    router.push('/admin/login');
  };

  const navItems = [
    { name: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Members', href: '/admin/members', icon: Users },
    { name: 'Organizations', href: '/admin/organizations', icon: Building2 },
    { name: 'Events Planner', href: '/admin/events', icon: Calendar },
    { name: 'Announcements', href: '/admin/announcements', icon: Megaphone },
    { name: 'Reports & Export', href: '/admin/reports', icon: BarChart3 },
    { name: 'Activity Logs', href: '/admin/activity-logs', icon: History },
  ];

  // While mounting or if not logged in (middleware will redirect anyway), show full screen loader
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Initializing Admin Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Visual Background Gradients */}
      <div className="absolute top-0 right-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 -z-10 h-72 w-72 rounded-full bg-violet-500/5 blur-[100px] pointer-events-none" />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col shrink-0 border-r border-slate-900 bg-slate-950/80 backdrop-blur-md">
        {/* Brand Header */}
        <div className="h-20 px-8 border-b border-slate-900 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-white text-base">SOMS Admin</h1>
            <p className="text-[10px] font-semibold tracking-wider text-indigo-400 uppercase">Management Portal</p>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 shadow-sm' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50 border border-transparent'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-white'}`} />
                <span>{item.name}</span>
                {isActive && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Profile Footer */}
        <div className="p-4 border-t border-slate-900 flex flex-col gap-3.5">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-900/40 backdrop-blur-sm border border-slate-900">
            <div className="h-10 w-10 rounded-xl bg-indigo-600/25 border border-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-400 shrink-0">
              {admin?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD'}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-bold text-white truncate">{admin?.name || 'Administrator'}</p>
              <p className="text-[9px] font-semibold text-slate-500 truncate uppercase tracking-wider">{admin?.role?.replace('_', ' ') || 'Super Admin'}</p>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-900 hover:bg-indigo-950/20 border border-slate-800 hover:border-indigo-500/30 text-slate-400 hover:text-indigo-400 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-all duration-200"
        />
      )}

      {/* Mobile Drawer */}
      <aside className={`fixed top-0 bottom-0 left-0 w-72 bg-slate-950 border-r border-slate-900 z-50 flex flex-col lg:hidden transform transition-transform duration-300 ease-out ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-20 px-6 border-b border-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="font-bold tracking-tight text-white text-sm">SOMS Admin</span>
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-400' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                }`}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-900 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-900/40 border border-slate-900">
            <div className="h-9 w-9 rounded-lg bg-indigo-600/20 border border-indigo-500/25 flex items-center justify-center text-xs font-bold text-indigo-400">
              {admin?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD'}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-bold text-white truncate">{admin?.name || 'Administrator'}</p>
              <p className="text-[9px] font-semibold text-slate-500 truncate uppercase tracking-wider">{admin?.role || 'Super Admin'}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Header */}
        <header className="h-20 border-b border-slate-900 px-6 sm:px-8 flex items-center justify-between shrink-0 bg-slate-950/40 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white p-2 rounded-lg bg-slate-900/50 border border-slate-850 hover:bg-slate-900 transition-all cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <div className="hidden sm:block">
              <h2 className="text-lg font-bold text-white tracking-wide">
                {navItems.find(item => pathname === item.href || pathname.startsWith(item.href + '/'))?.name || 'Admin Panel'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-3.5 py-1.5 rounded-xl border border-indigo-500/25 bg-indigo-500/5 text-xs font-bold text-indigo-400 flex items-center gap-1.5 uppercase tracking-wide">
              <UserCheck className="h-3.5 w-3.5" />
              <span>Super Administrator</span>
            </div>
          </div>
        </header>

        {/* Content Shell */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto relative">
          {children}
        </main>
      </div>

    </div>
  );
}
