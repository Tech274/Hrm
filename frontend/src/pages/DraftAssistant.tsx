import { useState } from 'react';
import api from '../lib/api';

type DraftType = 'policy' | 'email';

export default function DraftAssistant() {
  const [type, setType] = useState<DraftType>('policy');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult('');
    setLoading(true);
    try {
      const res = await api.post('/drafts', { type, prompt });
      setResult(res.data.content);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Failed to generate draft');
    } finally {
      setLoading(false);
    }
  };

  const placeholders: Record<DraftType, string> = {
    policy:
      'e.g. Interview feedback must be submitted within 48 hours of the interview. All feedback must include scoring and justification.',
    email:
      'e.g. Send a thank-you email to a candidate after their interview, mentioning we will get back within 3 days.',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Draft Assistant</h1>
      <p className="text-slate-600 mb-6">
        Use AI to draft policies and recruitment emails. Describe what you need below.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow border border-slate-200 p-6 max-w-2xl"
      >
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Type
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="policy"
                checked={type === 'policy'}
                onChange={() => setType('policy')}
              />
              Policy
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="email"
                checked={type === 'email'}
                onChange={() => setType('email')}
              />
              Email
            </label>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Describe what you need
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={placeholders[type]}
            className="w-full px-4 py-3 border border-slate-300 rounded-md min-h-[120px]"
            required
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Draft'}
        </button>
      </form>

      {result && (
        <div className="mt-6 bg-white rounded-lg shadow border border-slate-200 p-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Draft</h2>
          <div className="whitespace-pre-wrap text-slate-700 border border-slate-200 rounded-md p-4 bg-slate-50 max-h-96 overflow-y-auto">
            {result}
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(result)}
            className="mt-4 px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 text-sm"
          >
            Copy to clipboard
          </button>
        </div>
      )}
    </div>
  );
}
