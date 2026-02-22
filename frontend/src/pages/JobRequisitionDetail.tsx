import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';

interface JobRequisitionDetail {
  id: string;
  title: string;
  department: string;
  status: string;
  openedAt: string;
  closedAt: string | null;
  targetHireDate: string | null;
  recruiter: { id: string; name: string; email: string } | null;
  candidates: {
    id: string;
    firstName: string;
    lastName: string;
    status: string;
    stage: string | null;
    roleApplied: string;
  }[];
}

export default function JobRequisitionDetail() {
  const { id } = useParams<{ id: string }>();
  const [req, setReq] = useState<JobRequisitionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api
      .get(`/job-requisitions/${id}`)
      .then((res) => setReq(res.data))
      .catch(() => setError('Failed to load job requisition'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
      </div>
    );
  }

  if (error || !req) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        {error || 'Job requisition not found'}
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
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{req.title}</h1>
          <p className="text-slate-600 mt-1">
            {req.department} · Opened {new Date(req.openedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/job-requisitions/${req.id}/edit`}
            className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
          >
            Edit
          </Link>
          <Link
            to="/job-requisitions"
            className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50"
          >
            Back to list
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Details</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-slate-500">Status</dt>
              <dd>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-medium text-white ${
                    statusColors[req.status] ?? 'bg-slate-300'
                  }`}
                >
                  {req.status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Target Hire Date</dt>
              <dd className="text-slate-900">
                {req.targetHireDate ? new Date(req.targetHireDate).toLocaleDateString() : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Assigned Recruiter</dt>
              <dd className="text-slate-900">{req.recruiter?.name ?? '—'}</dd>
              {req.recruiter?.email && (
                <dd className="text-sm text-slate-500">{req.recruiter.email}</dd>
              )}
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Candidates ({req.candidates.length})</h2>
          <Link
            to={`/candidates/new?jobRequisitionId=${req.id}`}
            className="text-violet-600 text-sm font-medium hover:underline"
          >
            Add candidate
          </Link>
        </div>
        {req.candidates.length === 0 ? (
          <p className="text-slate-500 text-sm">No candidates yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {req.candidates.map((c) => (
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
      </div>
    </div>
  );
}
