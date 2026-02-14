import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';

interface Interview {
  id: string;
  roundName: string;
  candidate: { firstName: string; lastName: string };
}

export default function FeedbackForm() {
  const { id, interviewId } = useParams<{ id: string; interviewId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [interview, setInterview] = useState<Interview | null>(null);
  const [form, setForm] = useState({
    scoreTechnical: 3,
    scoreCommunication: 3,
    scoreProblemSolving: 3,
    scoreCultureFit: 3,
    strengths: '',
    concerns: '',
    riskLevel: 'low' as 'low' | 'medium' | 'high',
    recommendation: 'hold' as 'strong_hire' | 'hire' | 'hold' | 'reject',
    signedOff: false,
  });

  useEffect(() => {
    if (!interviewId) return;
    api
      .get(`/interviews/${interviewId}`)
      .then((res) => {
        const i = res.data;
        setInterview({ id: i.id, roundName: i.roundName, candidate: i.candidate });
        if (i.feedback) {
          const f = i.feedback;
          setForm({
            scoreTechnical: f.scoreTechnical,
            scoreCommunication: f.scoreCommunication,
            scoreProblemSolving: f.scoreProblemSolving,
            scoreCultureFit: f.scoreCultureFit,
            strengths: f.strengths,
            concerns: f.concerns,
            riskLevel: f.riskLevel,
            recommendation: f.recommendation,
            signedOff: f.signedOff,
          });
        }
      })
      .catch(() => setInterview({ id: interviewId!, roundName: 'Interview', candidate: { firstName: '', lastName: '' } }));
  }, [interviewId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const avg =
        (form.scoreTechnical +
          form.scoreCommunication +
          form.scoreProblemSolving +
          form.scoreCultureFit) /
        4;
      const payload = {
        ...form,
        interviewId,
        averageScore: Math.round(avg * 100) / 100,
      };
      const intRes = await api.get(`/interviews/${interviewId}`).catch(() => null);
      const existingFeedback = intRes?.data?.feedback;
      if (existingFeedback?.id) {
        await api.put(`/feedback/${existingFeedback.id}`, payload);
      } else {
        await api.post('/feedback', payload);
      }
      navigate(`/candidates/${id}`);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to submit'
      );
    } finally {
      setLoading(false);
    }
  };

  const update = (k: keyof typeof form, v: string | number | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        Feedback: {interview?.roundName ?? 'Interview'}
      </h1>
      {interview?.candidate && (
        <p className="text-slate-600 mb-6">
          {interview.candidate.firstName} {interview.candidate.lastName}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow border border-slate-200 p-6 max-w-2xl"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            ['scoreTechnical', 'Technical'],
            ['scoreCommunication', 'Communication'],
            ['scoreProblemSolving', 'Problem Solving'],
            ['scoreCultureFit', 'Culture Fit'],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {label} (1-5)
              </label>
              <select
                value={form[key as keyof typeof form] as number}
                onChange={(e) => update(key as keyof typeof form, parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-slate-300 rounded-md"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Strengths (required)
          </label>
          <textarea
            value={form.strengths}
            onChange={(e) => update('strengths', e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-md"
            rows={3}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Concerns (required)
          </label>
          <textarea
            value={form.concerns}
            onChange={(e) => update('concerns', e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-md"
            rows={3}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Risk Level
          </label>
          <select
            value={form.riskLevel}
            onChange={(e) => update('riskLevel', e.target.value as typeof form.riskLevel)}
            className="w-full px-4 py-2 border border-slate-300 rounded-md"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Recommendation
          </label>
          <select
            value={form.recommendation}
            onChange={(e) =>
              update('recommendation', e.target.value as typeof form.recommendation)
            }
            className="w-full px-4 py-2 border border-slate-300 rounded-md"
          >
            <option value="strong_hire">Strong Hire</option>
            <option value="hire">Hire</option>
            <option value="hold">Hold</option>
            <option value="reject">Reject</option>
          </select>
        </div>

        <div className="mb-6 flex items-center gap-2">
          <input
            type="checkbox"
            id="signedOff"
            checked={form.signedOff}
            onChange={(e) => update('signedOff', e.target.checked)}
          />
          <label htmlFor="signedOff" className="text-sm font-medium text-slate-700">
            I digitally sign off on this feedback
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Submit Feedback'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/candidates/${id}`)}
            className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
