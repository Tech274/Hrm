import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface ComplianceItem {
  id: string;
  title: string;
  dueDate: string;
  type: string;
  status: string;
  user?: { id: string; name: string } | null;
}

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
  const { user } = useAuth();
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [leaveYear, setLeaveYear] = useState(String(new Date().getFullYear()));
  const [loading, setLoading] = useState<string | null>(null);
  const [dueItems, setDueItems] = useState<ComplianceItem[]>([]);
  const [allCompliance, setAllCompliance] = useState<ComplianceItem[]>([]);
  const [compTitle, setCompTitle] = useState('');
  const [compDueDate, setCompDueDate] = useState('');
  const [compType, setCompType] = useState('policy_acknowledgment');
  const [addingComp, setAddingComp] = useState(false);

  const canManageCompliance = user?.role === 'admin' || user?.role === 'admin_hr';

  useEffect(() => {
    api.get('/compliance/due').then((r) => setDueItems(r.data?.data ?? [])).catch(() => setDueItems([]));
  }, []);

  useEffect(() => {
    if (canManageCompliance) {
      api.get('/compliance').then((r) => setAllCompliance(r.data?.data ?? [])).catch(() => setAllCompliance([]));
    }
  }, [canManageCompliance]);

  const loadDue = () => api.get('/compliance/due').then((r) => setDueItems(r.data?.data ?? [])).catch(() => {});
  const loadAll = () => canManageCompliance && api.get('/compliance').then((r) => setAllCompliance(r.data?.data ?? [])).catch(() => {});

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

      {canManageCompliance && (
        <Link
          to="/attendance-dashboard"
          className="inline-flex items-center gap-2 mb-6 px-4 py-3 bg-violet-100 text-violet-800 rounded-lg font-medium hover:bg-violet-200 transition-colors"
        >
          <span>View Attendance Dashboard</span>
          <span aria-hidden>→</span>
        </Link>
      )}

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

      <div className="mt-10 bg-white rounded-lg shadow border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Compliance Calendar</h2>
        <p className="text-sm text-slate-600 mb-4">Items due in the next 30 days (assigned to you or organization-wide).</p>
        {dueItems.length === 0 ? (
          <p className="text-slate-500 text-sm">No due items.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {dueItems.map((item) => (
              <li key={item.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-medium text-slate-800">{item.title}</p>
                  <p className="text-sm text-slate-500">{item.type} · Due {new Date(item.dueDate).toLocaleDateString()}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-800">{item.status}</span>
              </li>
            ))}
          </ul>
        )}
        <Link to="/audit" className="text-violet-600 text-sm font-medium mt-3 inline-block">Audit log →</Link>

        {canManageCompliance && (
          <>
            <h3 className="text-base font-semibold text-slate-900 mt-8 mb-3">Manage compliance items</h3>
            <div className="flex flex-wrap gap-3 items-end mb-4">
              <input
                value={compTitle}
                onChange={(e) => setCompTitle(e.target.value)}
                placeholder="Title"
                className="px-3 py-2 border border-slate-300 rounded-md text-sm w-48"
              />
              <input
                type="date"
                value={compDueDate}
                onChange={(e) => setCompDueDate(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
              <select
                value={compType}
                onChange={(e) => setCompType(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-md text-sm"
              >
                <option value="policy_acknowledgment">Policy acknowledgment</option>
                <option value="training">Training</option>
                <option value="review">Review</option>
              </select>
              <button
                onClick={async () => {
                  if (!compTitle.trim() || !compDueDate) return;
                  setAddingComp(true);
                  try {
                    await api.post('/compliance', { title: compTitle.trim(), dueDate: compDueDate, type: compType });
                    setCompTitle('');
                    setCompDueDate('');
                    loadDue();
                    loadAll();
                  } finally {
                    setAddingComp(false);
                  }
                }}
                disabled={addingComp || !compTitle.trim() || !compDueDate}
                className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50 text-sm"
              >
                {addingComp ? 'Adding…' : 'Add'}
              </button>
            </div>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 text-slate-500">Title</th>
                  <th className="text-left py-2 text-slate-500">Due</th>
                  <th className="text-left py-2 text-slate-500">Type</th>
                  <th className="text-left py-2 text-slate-500">Status</th>
                  <th className="text-left py-2 text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allCompliance.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-2">{item.title}</td>
                    <td className="py-2">{new Date(item.dueDate).toLocaleDateString()}</td>
                    <td className="py-2">{item.type}</td>
                    <td className="py-2">{item.status}</td>
                    <td className="py-2">
                      {item.status === 'pending' && (
                        <button
                          onClick={async () => {
                            await api.patch(`/compliance/${item.id}`, { status: 'completed' });
                            loadDue();
                            loadAll();
                          }}
                          className="text-violet-600 hover:underline"
                        >
                          Mark done
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          if (!window.confirm('Delete this item?')) return;
                          await api.delete(`/compliance/${item.id}`);
                          loadDue();
                          loadAll();
                        }}
                        className="text-red-600 hover:underline ml-2"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {allCompliance.length === 0 && <p className="py-4 text-slate-500 text-sm">No compliance items.</p>}
          </>
        )}
      </div>
    </div>
  );
}
