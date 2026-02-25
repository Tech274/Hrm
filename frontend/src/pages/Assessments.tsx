import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

interface Question {
  id: string;
  title: string;
  body: string | null;
  type: string;
  options: string[] | null;
  sortOrder: number;
}

export default function Assessments() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', body: '', type: 'text', optionsStr: '', sortOrder: 0 });

  const load = () => {
    api.get('/assessments/questions').then((r) => setQuestions(r.data?.data ?? [])).catch(() => setError('Failed to load questions')).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const options = form.optionsStr.trim() ? form.optionsStr.split(',').map((s) => s.trim()) : null;
    try {
      if (editingId) {
        await api.patch(`/assessments/questions/${editingId}`, {
          title: form.title,
          body: form.body || undefined,
          type: form.type,
          options: options ?? undefined,
          sortOrder: form.sortOrder,
        });
      } else {
        await api.post('/assessments/questions', {
          title: form.title,
          body: form.body || undefined,
          type: form.type,
          options: options ?? undefined,
          sortOrder: form.sortOrder,
        });
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ title: '', body: '', type: 'text', optionsStr: '', sortOrder: 0 });
      load();
    } catch {
      setError('Failed to save question');
    }
  };

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setForm({
      title: q.title,
      body: q.body ?? '',
      type: q.type,
      optionsStr: Array.isArray(q.options) ? q.options.join(', ') : '',
      sortOrder: q.sortOrder,
    });
    setShowForm(true);
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await api.delete(`/assessments/questions/${id}`);
      load();
    } catch {
      setError('Failed to delete');
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Assessment Questions</h1>
        <button
          onClick={() => {
            setEditingId(null);
            setForm({ title: '', body: '', type: 'text', optionsStr: '', sortOrder: questions.length });
            setShowForm(true);
          }}
          className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
        >
          Add Question
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
      )}

      {showForm && (
        <form onSubmit={save} className="bg-white rounded-lg shadow border border-slate-200 p-6 mb-8 max-w-xl">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">{editingId ? 'Edit' : 'New'} Question</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Question text (optional)</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-md"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-md"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="single_choice">Single choice</option>
                <option value="multi_choice">Multi choice</option>
              </select>
            </div>
            {(form.type === 'single_choice' || form.type === 'multi_choice') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Options (comma-separated)</label>
                <input
                  value={form.optionsStr}
                  onChange={(e) => setForm((f) => ({ ...f, optionsStr: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md"
                  placeholder="Option A, Option B, Option C"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value, 10) || 0 }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-md"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700">
              Save
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
        {questions.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No assessment questions yet. Add questions to use them on candidate profiles.
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {questions.map((q) => (
              <li key={q.id} className="p-4 flex justify-between items-start">
                <div>
                  <p className="font-medium text-slate-900">{q.title}</p>
                  {q.body && <p className="text-sm text-slate-600 mt-0.5">{q.body}</p>}
                  <p className="text-xs text-slate-500 mt-1">Type: {q.type} · Order: {q.sortOrder}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(q)} className="text-violet-600 text-sm hover:underline">
                    Edit
                  </button>
                  <button onClick={() => remove(q.id)} className="text-red-600 text-sm hover:underline">
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-4 text-sm text-slate-500">
        Use these questions on the <Link to="/candidates" className="text-violet-600 hover:underline">Candidates</Link> list → open a candidate → Assessments tab to record answers.
      </p>
    </div>
  );
}
