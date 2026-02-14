import { useEffect, useState } from 'react';
import api from '../lib/api';

type Tab = '1on1' | 'updates' | 'feedback' | 'reviews';

interface OneOnOne {
  id: string;
  scheduledAt: string;
  notes: string | null;
  status: string;
  manager: { id: string; name: string; email: string };
}

interface PerfUpdate {
  id: string;
  content: string;
  createdAt: string;
}

interface PerfReview {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: string;
}

export default function Performance() {
  const [tab, setTab] = useState<Tab>('1on1');
  const [oneOnOnes, setOneOnOnes] = useState<OneOnOne[]>([]);
  const [updates, setUpdates] = useState<PerfUpdate[]>([]);
  const [reviews, setReviews] = useState<PerfReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [show1on1, setShow1on1] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [form1on1, setForm1on1] = useState({ managerId: '', scheduledAt: '', notes: '' });
  const [formUpdate, setFormUpdate] = useState({ content: '' });
  const [managers, setManagers] = useState<{ id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    if (tab === '1on1') api.get('/performance/1on1').then((r) => setOneOnOnes(r.data)).catch(() => setOneOnOnes([])).finally(() => setLoading(false));
    else if (tab === 'updates') api.get('/performance/updates').then((r) => setUpdates(r.data)).catch(() => setUpdates([])).finally(() => setLoading(false));
    else if (tab === 'reviews') api.get('/performance/reviews').then((r) => setReviews(r.data)).catch(() => setReviews([])).finally(() => setLoading(false));
    else setLoading(false);
  }, [tab]);

  useEffect(() => {
    api.get('/team/me').then((r) => {
      if (r.data?.manager?.id) setManagers([{ id: r.data.manager.id, name: r.data.manager.name }]);
      setForm1on1((f) => ({ ...f, managerId: r.data?.manager?.id || '' }));
    }).catch(() => setManagers([]));
  }, []);

  const submit1on1 = () => {
    if (!form1on1.managerId || !form1on1.scheduledAt) return;
    setSubmitting(true);
    api.post('/performance/1on1', { managerId: form1on1.managerId, scheduledAt: form1on1.scheduledAt, notes: form1on1.notes || undefined })
      .then(() => { setShow1on1(false); setForm1on1({ managerId: '', scheduledAt: '', notes: '' }); api.get('/performance/1on1').then((r) => setOneOnOnes(r.data)); })
      .finally(() => setSubmitting(false));
  };

  const submitUpdate = () => {
    if (!formUpdate.content.trim()) return;
    setSubmitting(true);
    api.post('/performance/updates', { content: formUpdate.content })
      .then(() => { setShowUpdate(false); setFormUpdate({ content: '' }); api.get('/performance/updates').then((r) => setUpdates(r.data)); })
      .finally(() => setSubmitting(false));
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: '1on1', label: 'My 1:1' },
    { id: 'updates', label: 'Updates' },
    { id: 'feedback', label: 'Regular feedback' },
    { id: 'reviews', label: 'Reviews' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Performance</h1>

      <div className="flex gap-2 border-b border-slate-200 mb-6">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 text-sm font-medium rounded-t-lg ${tab === t.id ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{t.label}</button>
        ))}
      </div>

      {tab === '1on1' && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShow1on1(true)} className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 text-sm">Schedule 1:1</button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-3 font-medium text-slate-700">Scheduled at</th>
                  <th className="text-left p-3 font-medium text-slate-700">Manager</th>
                  <th className="text-left p-3 font-medium text-slate-700">Notes</th>
                  <th className="text-left p-3 font-medium text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {oneOnOnes.length === 0 ? <tr><td colSpan={4} className="p-6 text-center text-slate-500">No 1:1s scheduled.</td></tr> : oneOnOnes.map((o) => (
                  <tr key={o.id} className="border-b border-slate-100">
                    <td className="p-3">{new Date(o.scheduledAt).toLocaleString()}</td>
                    <td className="p-3">{o.manager.name}</td>
                    <td className="p-3">{o.notes || '-'}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded text-xs bg-slate-100">{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'updates' && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowUpdate(true)} className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 text-sm">Add update</button>
          </div>
          <ul className="space-y-3">
            {updates.length === 0 ? <li className="text-slate-500 text-sm">No updates yet.</li> : updates.map((u) => (
              <li key={u.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-slate-800">{u.content}</p>
                <p className="text-xs text-slate-500 mt-1">{new Date(u.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        </>
      )}

      {tab === 'feedback' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-slate-600">Regular feedback and goal/competency placeholders can be added here.</p>
        </div>
      )}

      {tab === 'reviews' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-3 font-medium text-slate-700">Period</th>
                <th className="text-left p-3 font-medium text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 ? <tr><td colSpan={2} className="p-6 text-center text-slate-500">No reviews yet.</td></tr> : reviews.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="p-3">{new Date(r.periodStart).toLocaleDateString()} – {new Date(r.periodEnd).toLocaleDateString()}</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded text-xs bg-slate-100">{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {show1on1 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Schedule 1:1</h3>
            <select value={form1on1.managerId} onChange={(e) => setForm1on1((f) => ({ ...f, managerId: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-3">
              <option value="">Select manager</option>
              {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <input type="datetime-local" value={form1on1.scheduledAt} onChange={(e) => setForm1on1((f) => ({ ...f, scheduledAt: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-3" />
            <textarea placeholder="Notes" value={form1on1.notes} onChange={(e) => setForm1on1((f) => ({ ...f, notes: e.target.value }))} rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4" />
            <div className="flex gap-2">
              <button onClick={submit1on1} disabled={submitting || !form1on1.managerId || !form1on1.scheduledAt} className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium disabled:opacity-50">Schedule</button>
              <button onClick={() => setShow1on1(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showUpdate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add update</h3>
            <textarea placeholder="Content" value={formUpdate.content} onChange={(e) => setFormUpdate((f) => ({ ...f, content: e.target.value }))} rows={4} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4" />
            <div className="flex gap-2">
              <button onClick={submitUpdate} disabled={submitting || !formUpdate.content.trim()} className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium disabled:opacity-50">Add</button>
              <button onClick={() => setShowUpdate(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
