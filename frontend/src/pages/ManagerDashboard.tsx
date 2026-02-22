import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

interface PendingLeave {
  id: string;
  user: { name: string };
  leaveType: { name: string };
  startDate: string;
  endDate: string;
  days: number;
}

interface PendingReg {
  id: string;
  user: { name: string };
  reason: string;
  createdAt: string;
}

interface OpenTask {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  user: { name: string };
}

interface Data {
  teamSize: number;
  attendanceSummary: Record<string, { present: number; total: number }>;
  pendingLeave: PendingLeave[];
  pendingRegularization: PendingReg[];
  openTasks: OpenTask[];
  openRequisitions: number;
}

export default function ManagerDashboard() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/team/manager-dashboard')
      .then((r) => setData(r.data))
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        {error || 'Unable to load'}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Manager Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-500 uppercase">Team size</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{data.teamSize}</p>
        </div>
        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-500 uppercase">Pending leave</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{data.pendingLeave.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-500 uppercase">Pending regularization</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{data.pendingRegularization.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-500 uppercase">Open requisitions</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{data.openRequisitions}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Pending leave approvals</h2>
          <Link to="/leave" className="text-violet-600 text-sm font-medium mb-3 block">Manage in My Leave →</Link>
          {data.pendingLeave.length === 0 ? (
            <p className="text-slate-500 text-sm">No pending approvals.</p>
          ) : (
            <ul className="space-y-2">
              {data.pendingLeave.map((l) => (
                <li key={l.id} className="py-2 border-b border-slate-100">
                  <p className="font-medium">{l.user.name}</p>
                  <p className="text-sm text-slate-600">{l.leaveType.name} · {l.days} days · {new Date(l.startDate).toLocaleDateString()} – {new Date(l.endDate).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Pending regularization</h2>
          <Link to="/attendance" className="text-violet-600 text-sm font-medium mb-3 block">Manage in Attendance →</Link>
          {data.pendingRegularization.length === 0 ? (
            <p className="text-slate-500 text-sm">No pending requests.</p>
          ) : (
            <ul className="space-y-2">
              {data.pendingRegularization.map((r) => (
                <li key={r.id} className="py-2 border-b border-slate-100">
                  <p className="font-medium">{r.user.name}</p>
                  <p className="text-sm text-slate-600">{r.reason}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Team open tasks</h2>
        <Link to="/tasks" className="text-violet-600 text-sm font-medium mb-3 block">View all tasks →</Link>
        {data.openTasks.length === 0 ? (
          <p className="text-slate-500 text-sm">No open tasks.</p>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-sm text-slate-500">
                <th className="pb-2">Task</th>
                <th className="pb-2">Assignee</th>
                <th className="pb-2">Due</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.openTasks.map((t) => (
                <tr key={t.id} className="border-t border-slate-100">
                  <td className="py-2">{t.title}</td>
                  <td className="py-2 text-slate-600">{t.user.name}</td>
                  <td className="py-2 text-slate-600">{new Date(t.dueDate).toLocaleDateString()}</td>
                  <td className="py-2"><span className="px-2 py-0.5 rounded text-xs bg-slate-100">{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
