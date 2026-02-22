import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';

const SOURCE_OPTIONS = ['', 'referral', 'job_board', 'linkedin', 'agency', 'website', 'other'];
const STAGE_OPTIONS = ['', 'Sourced', 'Screening', 'Interview', 'Offer', 'Hired'];
const STATUS_OPTIONS = ['active', 'rejected', 'offered', 'hired'];

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  roleApplied: string;
  stage: string | null;
  source: string | null;
  status: string;
  currentCtc: number | null;
  expectedCtc: number | null;
  presentCompany: string | null;
  experienceYears: number | null;
  noticePeriodDays: number | null;
  technologies: string[] | null;
}

export default function CandidateEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [techInput, setTechInput] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    roleApplied: '',
    stage: '',
    source: '',
    status: 'active',
    currentCtc: '',
    expectedCtc: '',
    presentCompany: '',
    experienceYears: '',
    noticePeriodDays: '',
    technologies: [] as string[],
  });

  useEffect(() => {
    if (!id) return;
    api
      .get<Candidate>(`/candidates/${id}`)
      .then((res) => {
        const c = res.data;
        setForm({
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          phone: c.phone || '',
          roleApplied: c.roleApplied,
          stage: c.stage || '',
          source: c.source || '',
          status: c.status,
          currentCtc: c.currentCtc != null ? String(c.currentCtc) : '',
          expectedCtc: c.expectedCtc != null ? String(c.expectedCtc) : '',
          presentCompany: c.presentCompany || '',
          experienceYears: c.experienceYears != null ? String(c.experienceYears) : '',
          noticePeriodDays: c.noticePeriodDays != null ? String(c.noticePeriodDays) : '',
          technologies: c.technologies && Array.isArray(c.technologies) ? c.technologies : [],
        });
      })
      .catch(() => setError('Failed to load candidate'))
      .finally(() => setLoading(false));
  }, [id]);

  const update = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const addTech = () => {
    const t = techInput.trim();
    if (t && !form.technologies.includes(t)) {
      setForm((f) => ({ ...f, technologies: [...f.technologies, t] }));
      setTechInput('');
    }
  };

  const removeTech = (idx: number) => {
    setForm((f) => ({ ...f, technologies: f.technologies.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        roleApplied: form.roleApplied,
        stage: form.stage || undefined,
        source: form.source || undefined,
        status: form.status,
        currentCtc: form.currentCtc ? parseFloat(form.currentCtc) : undefined,
        expectedCtc: form.expectedCtc ? parseFloat(form.expectedCtc) : undefined,
        presentCompany: form.presentCompany || undefined,
        experienceYears: form.experienceYears ? parseFloat(form.experienceYears) : undefined,
        noticePeriodDays: form.noticePeriodDays ? parseInt(form.noticePeriodDays, 10) : undefined,
        technologies: form.technologies.length > 0 ? form.technologies : undefined,
      };
      await api.put(`/candidates/${id}`, payload);
      navigate(`/candidates/${id}`);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to update candidate'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error && !form.firstName) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        {error}
        <Link to="/candidates" className="block mt-2 text-sm underline">Back to Candidates</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to={`/candidates/${id}`} className="text-slate-600 hover:text-slate-900 text-sm font-medium">← Back to Profile</Link>
        <h1 className="text-2xl font-bold text-slate-900">Edit Candidate</h1>
      </div>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow border border-slate-200 p-6 max-w-2xl"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => update('status', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Stage</label>
            <select
              value={form.stage}
              onChange={(e) => update('stage', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md"
            >
              {STAGE_OPTIONS.map((o) => (
                <option key={o || 'all'} value={o}>{o || '— Select —'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
            <select
              value={form.source}
              onChange={(e) => update('source', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md"
            >
              {SOURCE_OPTIONS.map((o) => (
                <option key={o || 'all'} value={o}>{o || '— Select —'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Current CTC (LPA)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.currentCtc}
              onChange={(e) => update('currentCtc', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Expected CTC (LPA)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.expectedCtc}
              onChange={(e) => update('expectedCtc', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Present Company</label>
            <input
              value={form.presentCompany}
              onChange={(e) => update('presentCompany', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Experience (years)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="50"
              value={form.experienceYears}
              onChange={(e) => update('experienceYears', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notice Period (days)</label>
            <input
              type="number"
              min="0"
              max="365"
              value={form.noticePeriodDays}
              onChange={(e) => update('noticePeriodDays', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Technologies / Skills</label>
          <div className="flex gap-2 flex-wrap">
            {form.technologies.map((t, i) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2 py-1 bg-violet-100 text-violet-800 rounded text-sm"
              >
                {t}
                <button type="button" onClick={() => removeTech(i)} className="hover:text-violet-900">×</button>
              </span>
            ))}
            <span className="flex gap-2">
              <input
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTech())}
                className="px-3 py-1.5 border border-slate-300 rounded-md text-sm w-36"
                placeholder="Add skill"
              />
              <button type="button" onClick={addTech} className="px-2 py-1 text-sm text-violet-600 hover:text-violet-800">
                Add
              </button>
            </span>
          </div>
        </div>
        <div className="flex gap-4 mt-6">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <Link
            to={`/candidates/${id}`}
            className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
