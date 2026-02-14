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

export default function CandidatesList() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/candidates')
      .then((res) => setCandidates(res.data.data))
      .catch(() => setError('Failed to load candidates'))
      .finally(() => setLoading(false));
  }, []);

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

      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
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
