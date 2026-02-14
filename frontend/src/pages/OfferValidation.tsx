import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';

interface GovernanceResult {
  canRelease: boolean;
  status: 'locked' | 'ready';
  checks: {
    allFeedbackSubmitted: boolean;
    allFeedbackSignedOff: boolean;
    managerApproved: boolean;
    noHighRiskWithoutOverride: boolean;
    hasOffer: boolean;
  };
  errors: string[];
}

export default function OfferValidation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [governance, setGovernance] = useState<GovernanceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api
      .post(`/offers/${id}/validate`)
      .then((res) => setGovernance(res.data))
      .catch(() => setError('Failed to load governance status'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCreateOffer = async () => {
    if (!id) return;
    setReleasing(true);
    setError('');
    try {
      await api.post(`/offers/${id}`);
      setLoading(true);
      const res = await api.post(`/offers/${id}/validate`);
      setGovernance(res.data);
      setLoading(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data;
      setError(msg?.error || 'Failed to create offer');
    } finally {
      setReleasing(false);
    }
  };

  const handleRelease = async () => {
    if (!id || !governance?.canRelease) return;
    setReleasing(true);
    setError('');
    try {
      await api.post(`/offers/${id}/release`);
      navigate(`/candidates/${id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string; details?: string[] } } })?.response?.data;
      setError(msg?.error + (msg?.details?.length ? ': ' + msg.details.join(', ') : ''));
    } finally {
      setReleasing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error && !governance) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        {error}
      </div>
    );
  }

  const isReady = governance?.status === 'ready';
  const canRelease = governance?.canRelease ?? false;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Offer Validation</h1>

      <div
        className={`rounded-lg p-6 mb-6 ${
          isReady ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'
        }`}
      >
        <h2 className="text-lg font-semibold mb-2">
          Governance Status:{' '}
          <span className={isReady ? 'text-emerald-800' : 'text-amber-800'}>
            {isReady ? 'Ready to Release' : 'Locked'}
          </span>
        </h2>
        {governance?.errors && governance.errors.length > 0 && (
          <ul className="list-disc list-inside text-amber-800 space-y-1">
            {governance.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-lg shadow border border-slate-200 p-6 mb-6">
        <h3 className="font-semibold mb-4">Validation Checks</h3>
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            {governance?.checks.allFeedbackSubmitted ? (
              <span className="text-emerald-600">✓</span>
            ) : (
              <span className="text-red-600">✗</span>
            )}
            All feedback submitted
          </li>
          <li className="flex items-center gap-2">
            {governance?.checks.allFeedbackSignedOff ? (
              <span className="text-emerald-600">✓</span>
            ) : (
              <span className="text-red-600">✗</span>
            )}
            All feedback signed off
          </li>
          <li className="flex items-center gap-2">
            {governance?.checks.managerApproved ? (
              <span className="text-emerald-600">✓</span>
            ) : (
              <span className="text-red-600">✗</span>
            )}
            Manager approved
          </li>
          <li className="flex items-center gap-2">
            {governance?.checks.noHighRiskWithoutOverride ? (
              <span className="text-emerald-600">✓</span>
            ) : (
              <span className="text-red-600">✗</span>
            )}
            No high risk without override
          </li>
          <li className="flex items-center gap-2">
            {governance?.checks.hasOffer ? (
              <span className="text-emerald-600">✓</span>
            ) : (
              <span className="text-red-600">✗</span>
            )}
            Offer exists
          </li>
        </ul>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        {!governance?.checks.hasOffer && (
          <button
            onClick={handleCreateOffer}
            disabled={releasing}
            className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 disabled:opacity-50"
          >
            {releasing ? 'Creating...' : 'Create Offer'}
          </button>
        )}
        <button
          onClick={handleRelease}
          disabled={!canRelease || releasing}
          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {releasing ? 'Releasing...' : 'Release Offer'}
        </button>
        <button
          onClick={() => navigate(`/candidates/${id}`)}
          className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50"
        >
          Back
        </button>
      </div>
    </div>
  );
}
