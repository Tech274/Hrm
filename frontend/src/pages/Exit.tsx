import { useEffect, useState } from 'react';
import api from '../lib/api';

interface ExitProcess {
  id: string;
  resignationDate: string;
  lastWorkingDate: string;
  status: string;
  initiatedAt: string;
}

export default function Exit() {
  const [exit, setExit] = useState<ExitProcess | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ resignationDate: '', lastWorkingDate: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/exit/me').then((r) => setExit(r.data || null)).catch(() => setExit(null)).finally(() => setLoading(false));
  }, []);

  const submit = () => {
    if (!form.resignationDate || !form.lastWorkingDate) {
      setError('Please fill both dates.');
      return;
    }
    setSubmitting(true);
    setError('');
    api.post('/exit/initiate', { resignationDate: form.resignationDate, lastWorkingDate: form.lastWorkingDate })
      .then((r) => { setExit(r.data); setShowForm(false); setForm({ resignationDate: '', lastWorkingDate: '' }); })
      .catch((err) => setError(err.response?.data?.error || 'Failed to initiate exit'))
      .finally(() => setSubmitting(false));
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
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Exit</h1>

      {exit ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-lg">
          <h2 className="font-semibold text-slate-900 mb-3">Exit status</h2>
          <ul className="space-y-2 text-sm">
            <li><span className="text-slate-500">Resignation date:</span> <span className="font-medium">{new Date(exit.resignationDate).toLocaleDateString()}</span></li>
            <li><span className="text-slate-500">Last working date:</span> <span className="font-medium">{new Date(exit.lastWorkingDate).toLocaleDateString()}</span></li>
            <li><span className="text-slate-500">Status:</span> <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">{exit.status}</span></li>
            <li><span className="text-slate-500">Initiated:</span> {new Date(exit.initiatedAt).toLocaleString()}</li>
          </ul>
          <p className="text-slate-600 text-sm mt-4">Exit checklist and HR workflow will be visible here (handover, asset return, etc.).</p>
        </div>
      ) : (
        <>
          <p className="text-slate-600 mb-4">Initiate your resignation to start the exit process.</p>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700">Initiate resignation</button>
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Initiate resignation</h3>
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <label className="block text-sm font-medium text-slate-700 mb-1">Resignation date</label>
            <input type="date" value={form.resignationDate} onChange={(e) => setForm((f) => ({ ...f, resignationDate: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-3" />
            <label className="block text-sm font-medium text-slate-700 mb-1">Last working date</label>
            <input type="date" value={form.lastWorkingDate} onChange={(e) => setForm((f) => ({ ...f, lastWorkingDate: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4" />
            <div className="flex gap-2">
              <button onClick={submit} disabled={submitting} className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium disabled:opacity-50">Submit</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
