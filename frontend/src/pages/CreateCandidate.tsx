import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function CreateCandidate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    roleApplied: '',
    stage: '',
  });

  const update = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/candidates', {
        ...form,
        phone: form.phone || undefined,
        stage: form.stage || undefined,
      });
      navigate(`/candidates/${res.data.id}`);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to create candidate'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Add Candidate</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow border border-slate-200 p-6 max-w-md"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
            <input
              value={form.firstName}
              onChange={(e) => update('firstName', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
            <input
              value={form.lastName}
              onChange={(e) => update('lastName', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role Applied</label>
            <input
              value={form.roleApplied}
              onChange={(e) => update('roleApplied', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Stage</label>
            <input
              value={form.stage}
              onChange={(e) => update('stage', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md"
              placeholder="e.g. Screening"
            />
          </div>
        </div>
        <div className="flex gap-4 mt-6">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/candidates')}
            className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
