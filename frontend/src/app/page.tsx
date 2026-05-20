import Link from 'next/link';
import { ArrowRight, Compass, ShieldCheck, Users2, Calendar, Radio } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black overflow-hidden flex flex-col justify-between">
      {/* Visual Background Accent Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[120px]" />
      <div className="absolute top-1/3 left-1/4 -z-10 h-72 w-72 rounded-full bg-cyan-600/10 blur-[100px]" />
      <div className="absolute bottom-10 right-1/4 -z-10 h-80 w-80 rounded-full bg-indigo-600/10 blur-[100px]" />

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-500 text-white font-bold text-lg shadow-md shadow-violet-500/20">
            S
          </div>
          <span className="text-xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            StudentOrg Hub
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
            Login
          </Link>
          <Link 
            href="/register" 
            className="flex items-center gap-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-sm font-semibold text-white px-4 py-2 transition-all"
          >
            Register
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-7xl mx-auto px-6 py-12 flex-grow flex flex-col justify-center items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/5 text-xs text-violet-300 font-semibold mb-6">
          <span className="flex h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
          University Centralized Portal
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-[1.15] bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-100 to-slate-400">
          Empowering Student Organizations to Collaborate & Grow
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mt-6 leading-relaxed">
          Manage profiles, track memberships, coordinate events, publish announcements, and generate comprehensive capstone reports in a single modern interface.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center w-full max-w-xs sm:max-w-none">
          <Link 
            href="/login" 
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:from-violet-500 hover:to-cyan-400 hover:shadow-violet-500/30 hover:scale-[1.02]"
          >
            Explore Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
          <Link 
            href="/register" 
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 hover:border-slate-700 px-6 py-3.5 text-sm font-semibold text-slate-300 hover:text-white transition-all"
          >
            Create Student Account
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-24 max-w-5xl">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm p-6 text-left hover:border-slate-700/60 transition-all duration-300">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 mb-4">
              <Compass className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Explore Clubs</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Discover active student clubs, browse categorized directory lists, and submit join requests with a single click.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm p-6 text-left hover:border-slate-700/60 transition-all duration-300">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 mb-4">
              <Calendar className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Event Planner & Check-in</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Schedule academic or sports events, track RSVPs, log student attendance lists, and build participation reports.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm p-6 text-left hover:border-slate-700/60 transition-all duration-300">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 mb-4">
              <Radio className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Announcements Board</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Post official organization announcements and receive immediate updates from your approved club networks.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-8 border-t border-slate-900 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Student Organization Hub. Developed in Laravel & Next.js.
      </footer>
    </div>
  );
}
