import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

interface Stats {
  totalCandidates: number;
  activeCandidates: number;
  pendingFeedback: number;
  totalInterviews: number;
  recentOffers: number;
  myPendingInterviews: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/dashboard/stats')
      .then((res) => setStats(res.data))
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

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

  const cards = [
    { label: 'Total Candidates', value: stats?.totalCandidates ?? 0, color: 'bg-blue-500' },
    { label: 'Active Candidates', value: stats?.activeCandidates ?? 0, color: 'bg-emerald-500' },
    { label: 'Pending Feedback', value: stats?.pendingFeedback ?? 0, color: 'bg-amber-500' },
    { label: 'Total Interviews', value: stats?.totalInterviews ?? 0, color: 'bg-slate-600' },
    { label: 'Offers Released', value: stats?.recentOffers ?? 0, color: 'bg-violet-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>

      {stats && stats.myPendingInterviews > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800 font-medium">
            You have {stats.myPendingInterviews} pending feedback submission(s).
          </p>
          <Link
            to="/candidates"
            className="text-amber-700 underline text-sm mt-1 inline-block"
          >
            View candidates
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-lg shadow p-6 border border-slate-200"
          >
            <div className={`w-12 h-1 rounded ${card.color} mb-3`} />
            <p className="text-slate-500 text-sm">{card.label}</p>
            <p className="text-2xl font-bold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/candidates"
            className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800"
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
  );
}
