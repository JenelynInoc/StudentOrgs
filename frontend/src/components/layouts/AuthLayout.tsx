'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black overflow-hidden flex flex-col justify-center items-center px-4 py-12">
      {/* Background Accent glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 -z-10 h-[400px] w-[400px] rounded-full bg-violet-600/10 blur-[100px]" />
      <div className="absolute bottom-10 right-1/4 -z-10 h-72 w-72 rounded-full bg-cyan-600/10 blur-[90px]" />

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 text-white font-extrabold text-lg shadow-md shadow-violet-500/25 transition-transform duration-200 group-hover:scale-105">
              S
            </div>
            <span className="text-xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              StudentOrgs
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-slate-900/40 backdrop-blur-md p-8 shadow-2xl border border-slate-800/80">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-extrabold text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-200">{title}</h1>
            {subtitle && <p className="mt-2 text-xs text-slate-400 font-medium">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

