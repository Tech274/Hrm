import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

const tiles = [
  {
    id: 'employees',
    title: 'Export Employees',
    description: 'Download employee list as CSV',
    icon: '👥',
  },
  {
    id: 'candidates',
    title: 'Export Candidates',
    description: 'Download candidate list as CSV',
    icon: '📋',
  },
  {
    id: 'attendance',
    title: 'Export Attendance',
    description: 'Download attendance records (month/year)',
    icon: '⏱',
  },
  {
    id: 'leave',
    title: 'Export Leave',
    description: 'Download leave balances by year',
    icon: '📅',
  },
];

function DownloadIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

export default function HRData() {
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [leaveYear, setLeaveYear] = useState(String(new Date().getFullYear()));
  const [loading, setLoading] = useState<string | null>(null);

  const download = async (type: string) => {
    setLoading(type);
    try {
      let url = '';
      if (type === 'employees') url = '/reports/employees?format=csv';
      if (type === 'candidates') url = '/reports/candidates?format=csv';
      if (type === 'attendance') url = `/reports/attendance?month=${month}&year=${year}&format=csv`;
      if (type === 'leave') url = `/reports/leave?year=${leaveYear}&format=csv`;

      const res = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = type === 'employees' ? 'employees.csv' : type === 'candidates' ? 'candidates.csv' : type === 'attendance' ? `attendance-${year}-${month}.csv` : `leave-${leaveYear}.csv`;
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch {
      // Error - API may return JSON error
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">HR Data & Compliance</h1>
      <p className="text-slate-600 mb-8">One-click exports and links to system configuration.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiles.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-lg shadow border border-slate-200 p-6 flex flex-col"
          >
            <div className="text-2xl mb-2">{t.icon}</div>
            <h3 className="font-semibold text-slate-900 mb-1">{t.title}</h3>
            <p className="text-sm text-slate-500 mb-4 flex-1">{t.description}</p>
            {t.id === 'attendance' && (
              <div className="flex gap-2 mb-3">
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="px-2 py-1 border border-slate-300 rounded text-sm"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-20 px-2 py-1 border border-slate-300 rounded text-sm"
                  min="2020"
                  max="2030"
                />
              </div>
            )}
            {t.id === 'leave' && (
              <div className="mb-3">
                <input
                  type="number"
                  value={leaveYear}
                  onChange={(e) => setLeaveYear(e.target.value)}
                  className="w-24 px-2 py-1 border border-slate-300 rounded text-sm"
                  min="2020"
                  max="2030"
                />
              </div>
            )}
            <button
              onClick={() => download(t.id)}
              disabled={loading === t.id}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50 text-sm"
            >
              <DownloadIcon />
              {loading === t.id ? 'Downloading...' : 'Download CSV'}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/audit"
          className="block bg-white rounded-lg shadow border border-slate-200 p-6 hover:border-violet-300 transition-colors"
        >
          <div className="text-2xl mb-2">📜</div>
          <h3 className="font-semibold text-slate-900 mb-1">Audit Log</h3>
          <p className="text-sm text-slate-500">View system audit trail for sensitive changes.</p>
        </Link>
        <div className="bg-white rounded-lg shadow border border-slate-200 p-6 opacity-75">
          <div className="text-2xl mb-2">🏷</div>
          <h3 className="font-semibold text-slate-900 mb-1">Leave Types</h3>
          <p className="text-sm text-slate-500">Manage leave type configuration (Admin).</p>
        </div>
        <div className="bg-white rounded-lg shadow border border-slate-200 p-6 opacity-75">
          <div className="text-2xl mb-2">⏰</div>
          <h3 className="font-semibold text-slate-900 mb-1">Shifts & Holidays</h3>
          <p className="text-sm text-slate-500">Manage shifts and holiday calendar (Admin).</p>
        </div>
      </div>
    </div>
  );
}
