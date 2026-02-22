import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

interface TAData {
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  openRequisitions: number;
  totalCandidates: number;
}

export default function TADashboard() {
  const [data, setData] = useState<TAData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/ta/dashboard')
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load TA dashboard'))
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
        {error || 'Unable to load data'}
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    active: 'bg-emerald-500',
    rejected: 'bg-red-500',
    offered: 'bg-violet-500',
    hired: 'bg-blue-500',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Talent Acquisition Dashboard</h1>
        <Link
          to="/candidates/new"
          className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
        >
          Add Candidate
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-500 uppercase">Total Candidates</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{data.totalCandidates}</p>
        </div>
        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-500 uppercase">Open Requisitions</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{data.openRequisitions}</p>
        </div>
        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-500 uppercase">Active</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{data.byStatus.active ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-500 uppercase">Hired</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{data.byStatus.hired ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Pipeline by Status</h2>
          <div className="space-y-3">
            {Object.entries(data.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center gap-4">
                <div
                  className={`w-3 h-3 rounded-full ${statusColors[status] ?? 'bg-slate-300'}`}
                />
                <span className="capitalize text-slate-700 w-24">{status}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${statusColors[status] ?? 'bg-slate-400'}`}
                    style={{
                      width: `${data.totalCandidates ? (count / data.totalCandidates) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-slate-600 w-8">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Source Mix</h2>
          {Object.keys(data.bySource).length === 0 ? (
            <p className="text-slate-500 text-sm">No source data yet. Add candidates with source to see distribution.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(data.bySource).map(([source, count]) => {
                const total = Object.values(data.bySource).reduce((a, b) => a + b, 0);
                const pct = total ? (count / total) * 100 : 0;
                return (
                  <div key={source} className="flex items-center gap-4">
                    <span className="capitalize text-slate-700 w-28">{source}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-violet-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-600 w-16">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <Link
          to="/candidates"
          className="text-violet-600 hover:text-violet-800 font-medium"
        >
          → View all candidates
        </Link>
      </div>
    </div>
  );
}
