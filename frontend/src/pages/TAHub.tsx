import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

interface HubData {
  totalCandidates: number;
  activeCandidates: number;
  pendingFeedback: number;
  totalInterviews: number;
  recentOffers: number;
  openRequisitions: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  myPendingInterviews: number;
  recentCandidates: {
    id: string;
    firstName: string;
    lastName: string;
    roleApplied: string;
    stage: string | null;
    status: string;
    createdAt: string;
  }[];
}

interface AnalyticsData {
  avgTimeToHireDays: number | null;
  timeToHireSampleSize: number;
  sourceEffectiveness: { source: string; count: number; share: number }[];
  hireRateBySource: { source: string; total: number; hired: number; hireRate: number }[];
}

export default function TAHub() {
  const [data, setData] = useState<HubData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/ta/hub')
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load TA Hub'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get('/ta/analytics').then((res) => setAnalytics(res.data)).catch(() => setAnalytics(null));
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
        <h1 className="text-2xl font-bold text-slate-900">TA Hub</h1>
        <div className="flex gap-2">
          <Link
            to="/job-requisitions/new"
            className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800"
          >
            New Job Req
          </Link>
          <Link
            to="/candidates/new"
            className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
          >
            Add Candidate
          </Link>
          <Link
            to="/candidates"
            className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50"
          >
            View Candidates
          </Link>
          <Link
            to="/job-requisitions"
            className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50"
          >
            Job Requisitions
          </Link>
        </div>
      </div>

      {data.myPendingInterviews > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800 font-medium">
            You have {data.myPendingInterviews} pending feedback submission(s).
          </p>
          <Link
            to="/candidates"
            className="text-amber-700 underline text-sm mt-1 inline-block"
          >
            View candidates
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Link to="/candidates" className="bg-white rounded-lg shadow border border-slate-200 p-6 hover:border-violet-300 hover:shadow-md transition-all block">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Candidates</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{data.totalCandidates}</p>
        </Link>
        <Link to="/candidates?status=active" className="bg-white rounded-lg shadow border border-slate-200 p-6 hover:border-emerald-300 hover:shadow-md transition-all block">
          <p className="text-xs font-medium text-slate-500 uppercase">Active</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{data.activeCandidates}</p>
        </Link>
        <Link to="/candidates" className="bg-white rounded-lg shadow border border-slate-200 p-6 hover:border-amber-300 hover:shadow-md transition-all block">
          <p className="text-xs font-medium text-slate-500 uppercase">Pending Feedback</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{data.pendingFeedback}</p>
        </Link>
        <Link to="/job-requisitions?status=open" className="bg-white rounded-lg shadow border border-slate-200 p-6 hover:border-violet-300 hover:shadow-md transition-all block">
          <p className="text-xs font-medium text-slate-500 uppercase">Open Reqs</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{data.openRequisitions}</p>
        </Link>
        <Link to="/candidates" className="bg-white rounded-lg shadow border border-slate-200 p-6 hover:border-violet-300 hover:shadow-md transition-all block">
          <p className="text-xs font-medium text-slate-500 uppercase">Interviews</p>
          <p className="text-2xl font-bold text-slate-600 mt-1">{data.totalInterviews}</p>
        </Link>
        <Link to="/candidates?status=offered" className="bg-white rounded-lg shadow border border-slate-200 p-6 hover:border-violet-300 hover:shadow-md transition-all block">
          <p className="text-xs font-medium text-slate-500 uppercase">Offers</p>
          <p className="text-2xl font-bold text-violet-600 mt-1">{data.recentOffers}</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Pipeline by Status</h2>
          <div className="space-y-3">
            {Object.entries(data.byStatus).map(([status, count]) => (
              <Link key={status} to={`/candidates?status=${status}`} className="flex items-center gap-4 py-1 -mx-1 px-1 rounded hover:bg-slate-50">
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
              </Link>
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
                  <Link key={source} to={`/candidates?source=${source}`} className="flex items-center gap-4 hover:bg-slate-50 -mx-2 px-2 py-1 rounded transition-colors">
                    <span className="capitalize text-slate-700 w-28">{source}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-violet-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-600 w-16">{count}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">TA Analytics</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">Avg. Time to Hire</p>
                <p className="text-2xl font-bold text-violet-600">
                  {analytics.avgTimeToHireDays != null ? `${analytics.avgTimeToHireDays} days` : '—'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Based on {analytics.timeToHireSampleSize} hired candidate(s)
                </p>
              </div>
              {analytics.hireRateBySource.length > 0 && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Hire Rate by Source</p>
                  <div className="space-y-2">
                    {analytics.hireRateBySource.map((s) => (
                      <div key={s.source} className="flex items-center gap-3">
                        <span className="capitalize text-slate-700 w-24">{s.source}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${s.hireRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-600 w-16">
                          {s.hired}/{s.total} ({s.hireRate}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Candidates</h2>
          {data.recentCandidates.length === 0 ? (
            <p className="text-slate-500 text-sm">No candidates yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recentCandidates.map((c) => (
                <li key={c.id} className="py-3 first:pt-0">
                  <Link to={`/candidates/${c.id}`} className="flex justify-between items-center hover:text-violet-600">
                    <span className="font-medium">{c.firstName} {c.lastName}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100">{c.status}</span>
                  </Link>
                  <p className="text-sm text-slate-500">{c.roleApplied} · {c.stage ?? '-'}</p>
                </li>
              ))}
            </ul>
          )}
          <Link to="/candidates" className="text-violet-600 text-sm font-medium mt-2 inline-block">
            View all candidates →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/job-requisitions/new"
              className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800"
            >
              New Job Req
            </Link>
            <Link
              to="/job-requisitions"
              className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50"
            >
              Job Requisitions
            </Link>
            <Link
              to="/candidates/new"
              className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
            >
              Add Candidate
            </Link>
            <Link
              to="/candidates"
              className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50"
            >
              View Candidates
            </Link>
            <Link
              to="/audit"
              className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50"
            >
              Audit Log
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
