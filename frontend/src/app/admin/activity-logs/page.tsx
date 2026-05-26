'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import { 
  History,
  Trash2,
  Search, 
  Clock, 
  User, 
  Database,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';

interface ActivityLogItem {
  id: string;
  user_id: string | null;
  action: string;
  model_type: string | null;
  model_id: string | null;
  properties: Record<string, any> | null;
  created_at: string;
  user?: { id: string; name: string; student_id: string; email: string };
}

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Expand log item detail state
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/admin/activity-logs?page=${currentPage}&per_page=15`;
      
      if (actionFilter !== 'all') {
        url += `&action=${actionFilter}`;
      }
      if (dateFrom) {
        url += `&date_from=${dateFrom}`;
      }
      if (dateTo) {
        url += `&date_to=${dateTo}`;
      }

      const res = await api.get(url);
      setLogs(res.data.data);
      const meta = res.data.meta?.pagination;
      if (meta) {
        setTotalPages(meta.last_page);
        setTotalItems(meta.total);
      }
    } catch (err: any) {
      console.error('Failed to fetch activity logs:', err);
      setError(err.response?.data?.message || 'Failed to retrieve administrative activity logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, actionFilter, dateFrom, dateTo]);

  const handleFilterReset = () => {
    setActionFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const toggleExpandLog = (id: string) => {
    setExpandedLogId(prev => (prev === id ? null : id));
  };

  const handleClearAll = async () => {
    if (!confirm('Are you absolute sure you want to PERMANENTLY clear all activity logs? This action cannot be undone.')) return;
    
    try {
      setLoading(true);
      await api.delete('/admin/activity-logs/clear');
      toast.success('All activity logs have been cleared.');
      fetchLogs();
    } catch (err: any) {
      console.error('Failed to clear logs:', err);
      toast.error(err.response?.data?.message || 'Failed to clear activity logs.');
      setLoading(false);
    }
  };

  // Classify actions for color badges
  const getActionBadgeColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('create') || act.includes('store') || act.includes('register')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15';
    }
    if (act.includes('update') || act.includes('edit')) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/15';
    }
    if (act.includes('delete') || act.includes('remove') || act.includes('suspend') || act.includes('reject')) {
      return 'bg-red-500/10 text-red-400 border-red-500/15';
    }
    return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/15';
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">System Audit & Activity Logs</h2>
          <p className="text-xs text-slate-500">Trace chronological administrative operations, membership approvals, database modifications, and check-in logs</p>
        </div>
        <button
          onClick={handleClearAll}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600/10 hover:bg-red-600 text-xs font-bold text-red-400 hover:text-white px-5 py-3 border border-red-500/20 hover:border-red-500 transition-all cursor-pointer sm:self-start shrink-0"
        >
          <Trash2 className="h-4 w-4" /> Clear All Logs
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-900 bg-slate-950 p-4.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4.5 items-end">
          
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Select Action Type</label>
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-xl border border-slate-900 bg-slate-900/20 py-2.5 px-3 text-xs font-semibold text-slate-200 outline-none focus:border-indigo-500 focus:bg-slate-900/40 cursor-pointer"
            >
              <option value="all">All Actions</option>
              <option value="login">User Login</option>
              <option value="register">User Registered</option>
              <option value="suspend">User Suspended</option>
              <option value="restore">User Restored</option>
              <option value="approve_membership">Membership Approval</option>
              <option value="create_organization">Create Organization</option>
              <option value="delete_organization">Delete Organization</option>
              <option value="create_event">Create Event</option>
              <option value="delete_event">Delete Event</option>
              <option value="manual_checkin">Manual Checkin</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-xl border border-slate-900 bg-slate-900/20 py-2.5 px-3 text-xs font-semibold text-slate-200 outline-none focus:border-indigo-500 focus:bg-slate-900/40 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-xl border border-slate-900 bg-slate-900/20 py-2.5 px-3 text-xs font-semibold text-slate-200 outline-none focus:border-indigo-500 focus:bg-slate-900/40 cursor-pointer"
            />
          </div>

          <div>
            <button
              onClick={handleFilterReset}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-400 hover:text-white border border-slate-800 rounded-xl transition-all cursor-pointer"
            >
              Reset Audit Filters
            </button>
          </div>

        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/25 bg-red-500/5 text-xs text-red-400 flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Audit Trail list */}
      <div className="rounded-2xl border border-slate-900 bg-slate-950 overflow-hidden">
        
        <div className="px-6 py-4.5 border-b border-slate-900/60 flex items-center justify-between bg-slate-900/10">
          <h3 className="text-xs font-extrabold text-white flex items-center gap-2">
            <History className="h-4.5 w-4.5 text-indigo-400" /> Chronological Audit Trails
          </h3>
          <span className="text-[10px] font-mono text-slate-500">Total: <span className="font-bold text-slate-400">{totalItems}</span> operations audited</span>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Consulting University Audit ledger...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-600 mx-auto">
              <History className="h-5 w-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-400">No activity logs recorded</h4>
            <p className="text-[10px] text-slate-600">Try adjusting filter parameters or creating system activity.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-900/80">
            {logs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              return (
                <div key={log.id} className="hover:bg-slate-900/10 transition-colors p-4.5 space-y-3.5">
                  
                  {/* Top line summary */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
                    <div className="flex items-start sm:items-center gap-3">
                      {/* Color indicator dot */}
                      <span className={`h-2.5 w-2.5 rounded-full ${
                        log.action.includes('delete') || log.action.includes('suspend')
                          ? 'bg-red-500 shadow-sm shadow-red-500/50'
                          : log.action.includes('create') || log.action.includes('store')
                          ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                          : 'bg-indigo-500 shadow-sm shadow-indigo-500/50'
                      } shrink-0 mt-1 sm:mt-0`} />

                      <div className="space-y-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase border ${getActionBadgeColor(log.action)}`}>
                            {log.action.replace('_', ' ')}
                          </span>

                          <span className="text-xs font-bold text-white">
                            {log.user ? log.user.name : 'System Core'}
                          </span>

                          {log.user && (
                            <span className="font-mono text-[10px] text-slate-500">
                              (Student ID: {log.user.student_id})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5 shrink-0 self-end sm:self-auto">
                      <span className="text-[10px] font-semibold text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                        <span>{new Date(log.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </span>

                      <button
                        onClick={() => toggleExpandLog(log.id)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-white transition-all cursor-pointer p-1 rounded hover:bg-slate-900 border border-transparent hover:border-slate-800"
                      >
                        {isExpanded ? (
                          <><span>Collapse</span><ChevronUp className="h-3.5 w-3.5" /></>
                        ) : (
                          <><span>Inspect</span><ChevronDown className="h-3.5 w-3.5" /></>
                        )}
                      </button>
                    </div>

                  </div>

                  {/* Expander content */}
                  {isExpanded && (
                    <div className="pl-5.5 space-y-3.5 animate-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        {/* Target Model Context */}
                        <div className="p-3.5 rounded-xl border border-slate-900 bg-slate-900/10 space-y-1.5">
                          <h4 className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Database className="h-3.5 w-3.5 text-indigo-400" /> Target Database Entity
                          </h4>
                          <div className="text-xs space-y-1">
                            <p className="text-slate-400">Model Type: <span className="font-mono font-bold text-white text-[11px]">{log.model_type || 'N/A'}</span></p>
                            <p className="text-slate-400">Record UUID: <span className="font-mono font-bold text-white text-[11px] truncate max-w-[200px] inline-block align-middle">{log.model_id || 'N/A'}</span></p>
                          </div>
                        </div>

                        {/* Actor details */}
                        <div className="p-3.5 rounded-xl border border-slate-900 bg-slate-900/10 space-y-1.5">
                          <h4 className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-indigo-400" /> Audit Operator
                          </h4>
                          <div className="text-xs space-y-1">
                            <p className="text-slate-400">Operator: <span className="font-bold text-white">{log.user?.name || 'Automated System Pipeline'}</span></p>
                            <p className="text-slate-400">Email: <span className="font-mono text-white text-[11px]">{log.user?.email || 'system-core@soms.local'}</span></p>
                          </div>
                        </div>

                      </div>

                      {/* Raw Metadata details */}
                      <div className="p-4.5 rounded-xl border border-slate-900 bg-slate-900/20 space-y-2">
                        <h4 className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Info className="h-3.5 w-3.5 text-indigo-400" /> Audit Properties Metadata
                        </h4>
                        
                        {log.properties && Object.keys(log.properties).length > 0 ? (
                          <pre className="text-[10px] font-mono text-indigo-300 overflow-x-auto bg-slate-950 p-3 rounded-lg border border-slate-900 select-all leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                            {JSON.stringify(log.properties, null, 2)}
                          </pre>
                        ) : (
                          <p className="text-[10px] text-slate-600 font-semibold">No additional properties logged for this operation.</p>
                        )}
                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

        {/* Pagination footer */}
        {!loading && logs.length > 0 && (
          <div className="px-6 py-4.5 border-t border-slate-900 flex items-center justify-between text-xs text-slate-500 font-semibold bg-slate-900/5">
            <span>Showing <span className="font-bold text-slate-400">{logs.length}</span> of <span className="font-bold text-slate-400">{totalItems}</span> logs</span>
            
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

    </div>
  );
}
