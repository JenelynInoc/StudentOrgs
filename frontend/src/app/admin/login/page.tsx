'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Mail, Lock } from 'lucide-react';

export default function AdminLoginPage() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        err.response?.data?.errors?.email?.[0] || 
        'Invalid administrator credentials.'
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black p-4">
      {/* Subtle background glows */}
      <div className="absolute top-1/4 left-1/3 -z-10 h-72 w-72 rounded-full bg-red-600/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/3 -z-10 h-72 w-72 rounded-full bg-amber-600/10 blur-3xl" />

      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60 backdrop-blur-xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 text-white shadow-lg shadow-red-500/20 mb-4">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Admin Portal</h1>
          <p className="text-sm text-gray-400 mt-1">Restricted access — authorized administrators only</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5" htmlFor="admin-email">
              Administrator Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <Mail className="h-5 w-5" />
              </span>
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@school.edu"
                className="w-full rounded-xl border border-gray-800 bg-gray-950/80 py-2.5 pl-10 pr-4 text-gray-200 placeholder-gray-600 outline-none transition-all duration-200 focus:border-red-500/80 focus:ring-1 focus:ring-red-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5" htmlFor="admin-password">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <Lock className="h-5 w-5" />
              </span>
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-800 bg-gray-950/80 py-2.5 pl-10 pr-4 text-gray-200 placeholder-gray-600 outline-none transition-all duration-200 focus:border-red-500/80 focus:ring-1 focus:ring-red-500/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center rounded-xl bg-gradient-to-r from-red-600 to-amber-500 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition-all duration-200 hover:from-red-500 hover:to-amber-400 hover:shadow-red-500/35 focus:outline-none disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Authenticating...
              </span>
            ) : (
              'Sign In as Administrator'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-600">
            This page is not publicly listed. Only authorized personnel may access this portal.
          </p>
        </div>
      </div>
    </div>
  );
}
