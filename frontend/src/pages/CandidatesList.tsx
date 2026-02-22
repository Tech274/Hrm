import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleApplied: string;
  stage: string | null;
  status: string;
  createdBy: { name: string };
  _count: { interviews: number };
}

const STAGE_OPTIONS = ['Sourced', 'Screening', 'Interview', 'Offer', 'Hired'];

export default function CandidatesList() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkAction, setBulkAction] = useState<'stage' | 'reject' | ''>('');
  const [bulkStage, setBulkStage] = useState('');

  const fetchCandidates = () => {
    const params = new URLSearchParams();
    if (filterStage) params.set('stage', filterStage);
    if (filterSource) params.set('source', filterSource);
    setLoading(true);
    api
      .get(`/candidates?${params.toString()}`)
      .then((res) => setCandidates(res.data.data))
      .catch(() => setError('Failed to load candidates'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCandidates();
  }, [filterStage, filterSource]);

  const toggleSelect = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === candidates.length) setSelected(new Set());
    else setSelected(new Set(candidates.map((c) => c.id)));
  };

  const runBulkAction = async () => {
    if (selected.size === 0) return;
    if (bulkAction === 'stage' && !bulkStage) return;
    setBulkLoading(true);
    try {
      await api.patch('/candidates/bulk', {
        candidateIds: Array.from(selected),
        action: bulkAction,
        value: bulkAction === 'stage' ? bulkStage : undefined,
      });
      setSelected(new Set());
      setBulkAction('');
      setBulkStage('');
      fetchCandidates();
    } catch {
      setError('Bulk action failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-800',
      rejected: 'bg-red-100 text-red-800',
      offered: 'bg-violet-100 text-violet-800',
      hired: 'bg-blue-100 text-blue-800',
    };
    return (
      <span
        className={`px-2 py-0.5 rounded text-xs font-medium ${map[status] ?? 'bg-slate-100 text-slate-800'}`}
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Candidates</h1>
        <Link
          to="/candidates/new"
          className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800"
        >
          Add Candidate
        </Link>
      </div>

      {selected.size > 0 && (
        <div className="mb-4 p-4 bg-violet-50 border border-violet-200 rounded-lg flex flex-wrap items-center gap-3">
          <span className="font-medium text-violet-900">{selected.size} selected</span>
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value as 'stage' | 'reject' | '')}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="">— Bulk action —</option>
            <option value="stage">Update stage</option>
            <option value="reject">Reject</option>
          </select>
          {bulkAction === 'stage' && (
            <select
              value={bulkStage}
              onChange={(e) => setBulkStage(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              <option value="">— Stage —</option>
              {STAGE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
          <button
            onClick={runBulkAction}
            disabled={bulkLoading || (bulkAction === 'stage' && !bulkStage)}
            className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50 text-sm"
          >
            {bulkLoading ? 'Applying…' : 'Apply'}
          </button>
          <button
            onClick={() => { setSelected(new Set()); setBulkAction(''); setBulkStage(''); }}
            className="px-4 py-2 border border-slate-300 rounded-md text-sm hover:bg-slate-50"
          >
            Clear
          </button>
        </div>
      )}

      <div className="flex gap-4 mb-4">
        <select
          value={filterStage}
          onChange={(e) => setFilterStage(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm"
        >
          <option value="">All stages</option>
          <option value="Screening">Screening</option>
          <option value="Interview">Interview</option>
          <option value="Offer">Offer</option>
          <option value="Hired">Hired</option>
        </select>
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm"
        >
          <option value="">All sources</option>
          <option value="referral">Referral</option>
          <option value="job_board">Job Board</option>
          <option value="linkedin">LinkedIn</option>
          <option value="agency">Agency</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={candidates.length > 0 && selected.size === candidates.length}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Stage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Interviews
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {candidates.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggleSelect(c.id)}
                    className="rounded border-slate-300"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link to={`/candidates/${c.id}`} className="text-blue-600 hover:underline">
                    {c.firstName} {c.lastName}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                  {c.roleApplied}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                  {c.stage ?? '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{statusBadge(c.status)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                  {c._count.interviews}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    to={`/candidates/${c.id}`}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    View
                  </Link>
                  {' | '}
                  <Link
                    to={`/candidates/${c.id}/offer`}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    Offer
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
