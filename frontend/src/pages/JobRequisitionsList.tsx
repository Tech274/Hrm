import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

interface JobRequisition {
  id: string;
  title: string;
  department: string;
  status: string;
  openedAt: string;
  closedAt: string | null;
  targetHireDate: string | null;
  recruiter: { id: string; name: string; email: string } | null;
  _count: { candidates: number };
}

export default function JobRequisitionsList() {
  const [data, setData] = useState<{ data: JobRequisition[]; total: number; page: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (statusFilter) params.set('status', statusFilter);
    api
      .get(`/job-requisitions?${params}`)
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load job requisitions'))
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

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
        {error || 'Unable to load data'}
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    open: 'bg-emerald-500',
    closed: 'bg-slate-400',
    on_hold: 'bg-amber-500',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Job Requisitions</h1>
        <Link
          to="/job-requisitions/new"
          className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
        >
          New Job Requisition
        </Link>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm font-medium text-slate-700">Filter:</label>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 border border-slate-300 rounded-md text-sm"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="on_hold">On hold</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
        {data.data.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No job requisitions found.{' '}
            <Link to="/job-requisitions/new" className="text-violet-600 font-medium">
              Create one
            </Link>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Candidates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Recruiter</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Target Hire</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.data.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <Link to={`/job-requisitions/${req.id}`} className="font-medium text-violet-600 hover:underline">
                      {req.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{req.department}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium text-white ${
                        statusColors[req.status] ?? 'bg-slate-300'
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{req._count.candidates}</td>
                  <td className="px-6 py-4 text-slate-700">{req.recruiter?.name ?? '—'}</td>
                  <td className="px-6 py-4 text-slate-700">
                    {req.targetHireDate ? new Date(req.targetHireDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/job-requisitions/${req.id}/edit`}
                      className="text-violet-600 text-sm font-medium hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data.total > 20 && (
        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-slate-600">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} of {data.total}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 border border-slate-300 rounded-md text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={page * 20 >= data.total}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 border border-slate-300 rounded-md text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
