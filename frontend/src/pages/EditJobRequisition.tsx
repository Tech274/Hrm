import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';

interface RecruiterOption {
  id: string;
  name: string;
  email: string;
}

const STATUS_OPTIONS = ['open', 'closed', 'on_hold'];

export default function EditJobRequisition() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [recruiters, setRecruiters] = useState<RecruiterOption[]>([]);
  const [form, setForm] = useState({
    title: '',
    department: '',
    status: '',
    targetHireDate: '',
    recruiterId: '',
  });

  useEffect(() => {
    api.get('/users/recruiters').then((r) => setRecruiters(r.data?.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/job-requisitions/${id}`)
      .then((res) => {
        const r = res.data;
        setForm({
          title: r.title ?? '',
          department: r.department ?? '',
          status: r.status ?? 'open',
          targetHireDate: r.targetHireDate ? r.targetHireDate.slice(0, 10) : '',
          recruiterId: r.recruiter?.id ?? '',
        });
      })
      .catch(() => setError('Failed to load job requisition'))
      .finally(() => setLoading(false));
  }, [id]);

  const update = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError('');
    setSaving(true);
    try {
      await api.patch(`/job-requisitions/${id}`, {
        title: form.title || 'Untitled',
        department: form.department || 'General',
        status: form.status || 'open',
        targetHireDate: form.targetHireDate || undefined,
        recruiterId: form.recruiterId || undefined,
      });
      navigate(`/job-requisitions/${id}`);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to update job requisition'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Edit Job Requisition</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow border border-slate-200 p-6 max-w-2xl"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
            <input
              value={form.department}
              onChange={(e) => update('department', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => update('status', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Target Hire Date</label>
            <input
              type="date"
              value={form.targetHireDate}
              onChange={(e) => update('targetHireDate', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Recruiter</label>
            <select
              value={form.recruiterId}
              onChange={(e) => update('recruiterId', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md"
            >
              <option value="">— None —</option>
              {recruiters.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.email})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
