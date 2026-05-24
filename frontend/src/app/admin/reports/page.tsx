'use client';

import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { 
  BarChart3, 
  Search, 
  Printer, 
  Calendar as CalendarIcon, 
  Filter, 
  UserCheck, 
  QrCode, 
  MousePointerClick, 
  FileSpreadsheet,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

interface AttendanceReportItem {
  id: string;
  event_id: string;
  user_id: string;
  checked_in_at: string;
  method: 'self' | 'qr' | 'manual';
  created_at: string;
  event?: { id: string; title: string };
  user?: { id: string; name: string; student_id: string; email: string };
}

interface EventItem {
  id: string;
  title: string;
}

export default function AdminReportsPage() {
  const [reportData, setReportData] = useState<AttendanceReportItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Summary stats
  const [summary, setSummary] = useState({
    total_records: 0,
    checked_in: 0,
    not_checked_in: 0,
    qr_method: 0,
    manual_method: 0
  });

  // Filter States
  const [selectedEventId, setSelectedEventId] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchEvents = async () => {
    try {
      const res = await api.get('/admin/events?per_page=100');
      setEvents(res.data.data);
    } catch (err) {
      console.error('Failed to load events for filter options:', err);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/admin/reports/attendance?page=${currentPage}&per_page=10`;
      
      if (selectedEventId !== 'all') {
        url += `&event_id=${selectedEventId}`;
      }
      if (dateFrom) {
        url += `&date_from=${dateFrom}`;
      }
      if (dateTo) {
        url += `&date_to=${dateTo}`;
      }

      const res = await api.get(url);
      setReportData(res.data.data);

      const meta = res.data.meta;
      if (meta?.summary) {
        setSummary(meta.summary);
      }
      if (meta?.pagination) {
        setTotalPages(meta.pagination.last_page);
        setTotalItems(meta.pagination.total);
      }
    } catch (err: any) {
      console.error('Failed to fetch attendance reports:', err);
      setError(err.response?.data?.message || 'Failed to retrieve attendance analytics report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [currentPage, selectedEventId]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchReport();
  };

  const handleResetFilters = () => {
    setSelectedEventId('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe percentage calculator
  const qrPercent = summary.total_records > 0 ? Math.round((summary.qr_method / summary.total_records) * 100) : 0;
  const manualPercent = summary.total_records > 0 ? Math.round((summary.manual_method / summary.total_records) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* CSS Stylesheet injected for printable Media rules */}
      <style jsx global>{`
        @media print {
          /* Hide sidebar, headers, footers, control boxes, filters */
          aside, header, nav, button, form, .no-print {
            display: none !important;
          }
          
          body {
            background: white !important;
            color: black !important;
            font-size: 12px !important;
            margin: 0 !important;
            padding: 1.5cm !important;
          }

          .print-container {
            width: 100% !important;
            display: block !important;
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
          }

          .print-header {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            margin-bottom: 25px !important;
            border-bottom: 2px solid #e2e8f0 !important;
            padding-bottom: 15px !important;
          }

          .print-logo {
            font-size: 22px !important;
            font-weight: 800 !important;
            color: #1e1b4b !important;
            margin-bottom: 5px !important;
          }

          .print-subtitle {
            font-size: 11px !important;
            color: #64748b !important;
            text-transform: uppercase !important;
            letter-spacing: 0.1em !important;
            font-weight: 600 !important;
          }

          .print-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 15px !important;
            margin-bottom: 25px !important;
          }

          .print-card {
            border: 1px solid #e2e8f0 !important;
            border-radius: 8px !important;
            padding: 12px !important;
            background: #f8fafc !important;
            text-align: center !important;
          }

          .print-card-val {
            font-size: 20px !important;
            font-weight: bold !important;
            color: #1e1b4b !important;
          }

          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 20px !important;
          }

          .print-table th {
            background-color: #f1f5f9 !important;
            color: #1e293b !important;
            font-weight: bold !important;
            border: 1px solid #cbd5e1 !important;
            padding: 8px !important;
            text-transform: uppercase !important;
            font-size: 10px !important;
          }

          .print-table td {
            border: 1px solid #cbd5e1 !important;
            padding: 8px !important;
            color: #334155 !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Analytics & Report Sheet</h2>
          <p className="text-xs text-slate-500">Query university event check-ins, measure active attendance method rates, and output PDF records</p>
        </div>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white px-5 py-3 shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all cursor-pointer sm:self-start shrink-0"
        >
          <Printer className="h-4 w-4" /> Export Printable PDF
        </button>
      </div>

      {/* Hidden Print Header (Only visible in Print view) */}
      <div className="hidden print-header">
        <div className="print-logo">SOMS - Student Organization Management System</div>
        <div className="print-subtitle">Official Attendance & Engagement Report</div>
        <p style={{ margin: '5px 0 0 0', fontSize: '10px', color: '#64748b' }}>Generated on: {new Date().toLocaleString()}</p>
      </div>

      {/* Filters (No-print) */}
      <div className="rounded-2xl border border-slate-900 bg-slate-950 p-4.5 no-print">
        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4.5 items-end">
          
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Select Event Affiliation</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full rounded-xl border border-slate-900 bg-slate-900/20 py-2.5 px-3 text-xs font-semibold text-slate-200 outline-none focus:border-indigo-500 focus:bg-slate-900/40 cursor-pointer"
            >
              <option value="all">All Scheduled Events</option>
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>{evt.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-xl border border-slate-900 bg-slate-900/20 py-2.5 px-3 text-xs font-semibold text-slate-200 outline-none focus:border-indigo-500 focus:bg-slate-900/40 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-xl border border-slate-900 bg-slate-900/20 py-2.5 px-3 text-xs font-semibold text-slate-200 outline-none focus:border-indigo-500 focus:bg-slate-900/40 cursor-pointer"
            />
          </div>

          <div className="flex gap-2.5">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Filter className="h-4 w-4" /> Filter Sheet
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-400 hover:text-white border border-slate-800 rounded-xl transition-all cursor-pointer"
            >
              Clear
            </button>
          </div>

        </form>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/25 bg-red-500/5 text-xs text-red-400 flex items-center gap-2.5 no-print">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: Stat cards & Circular Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print-grid">
        
        {/* Total Records */}
        <div className="rounded-2xl border border-slate-900 bg-slate-950 p-5 space-y-2 flex flex-col justify-between print-card">
          <div className="flex items-center justify-between no-print">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Total Check-Ins</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/15 text-indigo-400">
              <UserCheck className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <h4 className="text-[10px] font-bold text-slate-500 hidden print:block">Total Check-Ins</h4>
            <div className="text-3xl font-black text-white font-mono tracking-tight print-card-val">{summary.total_records}</div>
            <p className="text-[10px] text-slate-500 font-semibold no-print">Checked in across filtered items</p>
          </div>
        </div>


        {/* Manual Administration Method */}
        <div className="rounded-2xl border border-slate-900 bg-slate-950 p-5 space-y-2 flex flex-col justify-between print-card">
          <div className="flex items-center justify-between no-print">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Manual Administrative</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/15 text-indigo-400">
              <MousePointerClick className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <h4 className="text-[10px] font-bold text-slate-500 hidden print:block">Manual Administrative</h4>
            <div className="text-3xl font-black text-white font-mono tracking-tight print-card-val">
              {summary.manual_method} <span className="text-xs text-amber-400 font-bold">({manualPercent}%)</span>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold no-print">Registered manually by admins</p>
          </div>
        </div>

      </div>



      {/* Printable Roster Sheet */}
      <div className="rounded-2xl border border-slate-900 bg-slate-950 overflow-hidden print-container">
        
        <div className="px-6 py-4.5 border-b border-slate-900/60 flex items-center justify-between bg-slate-900/10 no-print">
          <h3 className="text-xs font-extrabold text-white flex items-center gap-2">
            <FileSpreadsheet className="h-4.5 w-4.5 text-indigo-400" /> Attendance Ledger Log
          </h3>
          <span className="text-[10px] font-mono text-slate-500">Page {currentPage} of {totalPages || 1}</span>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 no-print">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Compiling Reports data...</p>
          </div>
        ) : reportData.length === 0 ? (
          <div className="p-16 text-center space-y-2 no-print">
            <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-600 mx-auto">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-400">No attendance data matching filter</h4>
            <p className="text-[10px] text-slate-600">Select alternative university schedules or different calendars.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse print-table">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-900/10 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest print:border-b-2">
                <th className="p-3.5 pl-6">Student Roster</th>
                <th className="p-3.5">Student ID</th>
                <th className="p-3.5">Scheduled Event</th>
                <th className="p-3.5">Checked-in Time</th>
                <th className="p-3.5 pr-6">Check-in Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/40 text-xs text-slate-300 print:divide-y">
              {reportData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-900/10 transition-colors">
                  <td className="p-3.5 pl-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-white print:text-black">{item.user?.name || 'Unknown Student'}</span>
                      <span className="text-[10px] text-slate-500 print:text-gray-500">{item.user?.email || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] font-bold text-slate-400 print:text-black">
                    {item.user?.student_id || 'N/A'}
                  </td>
                  <td className="p-3.5 font-bold text-slate-400 print:text-black">
                    {item.event?.title || 'Unknown Event'}
                  </td>
                  <td className="p-3.5 font-semibold text-slate-300 print:text-black">
                    {new Date(item.checked_in_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(item.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-3.5 pr-6">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase border print:border-none print:p-0 ${
                      item.method === 'self'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15 print:text-black'
                        : item.method === 'qr' 
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/15 print:text-black'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/15 print:text-black'
                    }`}>
                      {item.method === 'self' ? 'Self Check-in' : item.method === 'qr' ? 'QR App Scan' : 'Manual Entry'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination footer (No-print) */}
        {!loading && reportData.length > 0 && (
          <div className="px-6 py-4.5 border-t border-slate-900 flex items-center justify-between text-xs text-slate-500 font-semibold bg-slate-900/5 no-print">
            <span>Showing <span className="font-bold text-slate-400">{reportData.length}</span> of <span className="font-bold text-slate-400">{totalItems}</span> check-ins</span>
            
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
