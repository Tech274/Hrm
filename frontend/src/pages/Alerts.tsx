import { useEffect, useState } from 'react';
import api from '../lib/api';

interface Alert {
  id: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/alerts/me').then((r) => setAlerts(r.data)).catch(() => setAlerts([])).finally(() => setLoading(false));
  }, []);

  const markRead = (id: string) => {
    api.patch(`/alerts/${id}/read`).then(() => setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, readAt: new Date().toISOString() } : a))));
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
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Alerts</h1>

      {alerts.length === 0 ? (
        <p className="text-slate-500">No notifications.</p>
      ) : (
        <ul className="space-y-3">
          {alerts.map((a) => (
            <li key={a.id} className={`rounded-xl border p-4 ${a.readAt ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="font-medium text-slate-900">{a.title}</p>
                  <p className="text-sm text-slate-600 mt-1">{a.body}</p>
                  <p className="text-xs text-slate-500 mt-2">{new Date(a.createdAt).toLocaleString()}</p>
                </div>
                {!a.readAt && (
                  <button onClick={() => markRead(a.id)} className="shrink-0 px-3 py-1 text-sm bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200">Mark read</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
