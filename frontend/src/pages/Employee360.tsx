import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

interface Profile {
  id: string;
  name: string;
  email: string;
  designation: string | null;
  department: string;
  location: string | null;
  manager?: { name: string } | null;
}

interface Task {
  id: string;
  title: string;
  dueDate: string;
  status: string;
}

interface Recognition {
  id: string;
  type: string;
  message: string | null;
  fromUser: { name: string };
  createdAt: string;
}

interface LeaveBalance {
  leaveType: { name: string };
  balance: number;
}

interface OneOnOne {
  id: string;
  scheduledAt: string;
  status: string;
}

interface Data {
  profile: Profile;
  attendanceSummary: { totalDays: number; totalMinutes: number };
  leaveBalances: LeaveBalance[];
  tasks: Task[];
  recognitions: Recognition[];
  oneOnOnes: OneOnOne[];
}

export default function Employee360() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [givingRecognition, setGivingRecognition] = useState(false);
  const [recType, setRecType] = useState('thanks');
  const [recMessage, setRecMessage] = useState('');

  useEffect(() => {
    if (!id) return;
    api
      .get(`/people/${id}/360`)
      .then((r) => setData(r.data))
      .catch(() => setError('Failed to load or access denied'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        {error || 'Not found'}
        <Link to="/people" className="block mt-2 text-sm underline">Back to People</Link>
      </div>
    );
  }

  const { profile, attendanceSummary, leaveBalances, tasks, recognitions, oneOnOnes } = data;
  const totalHours = Math.floor(attendanceSummary.totalMinutes / 60);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Link to="/people" className="text-slate-600 hover:text-slate-900 text-sm font-medium">← People</Link>
        <h1 className="text-2xl font-bold text-slate-900">Employee 360</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Profile</h2>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 text-2xl font-bold">
                {profile.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-lg">{profile.name}</p>
                <p className="text-slate-600">{profile.email}</p>
                <p className="text-slate-600 mt-1">{profile.designation ?? '-'} · {profile.department}</p>
                {profile.location && <p className="text-sm text-slate-500">{profile.location}</p>}
                {profile.manager && <p className="text-sm text-slate-500 mt-1">Manager: {profile.manager.name}</p>}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Tasks</h2>
            {tasks.length === 0 ? (
              <p className="text-slate-500 text-sm">No tasks.</p>
            ) : (
              <ul className="space-y-2">
                {tasks.map((t) => (
                  <li key={t.id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                    <span className="text-slate-800">{t.title}</span>
                    <span className="text-slate-500 text-sm">{new Date(t.dueDate).toLocaleDateString()} · {t.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-slate-900">Recognitions</h2>
              {id !== user?.id && (
                <button
                  type="button"
                  onClick={() => setGivingRecognition(!givingRecognition)}
                  className="text-sm text-violet-600 hover:text-violet-800 font-medium"
                >
                  {givingRecognition ? 'Cancel' : 'Give thanks'}
                </button>
              )}
            </div>
            {givingRecognition && id && (
              <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                <select value={recType} onChange={(e) => setRecType(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-md text-sm mb-2 mr-2">
                  <option value="thanks">Thanks</option>
                  <option value="kudos">Kudos</option>
                  <option value="star">Star</option>
                </select>
                <input
                  placeholder="Message (optional)"
                  value={recMessage}
                  onChange={(e) => setRecMessage(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-md text-sm mb-2 w-full"
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await api.post('/recognition', { toUserId: id, type: recType, message: recMessage || undefined });
                      setGivingRecognition(false);
                      setRecMessage('');
                      const r = await api.get(`/people/${id}/360`);
                      setData(r.data);
                    } catch {}
                  }}
                  className="px-3 py-2 bg-violet-600 text-white rounded-md text-sm hover:bg-violet-700"
                >
                  Send
                </button>
              </div>
            )}
            {recognitions.length === 0 ? (
              <p className="text-slate-500 text-sm">No recognitions yet.</p>
            ) : (
              <ul className="space-y-2">
                {recognitions.map((r) => (
                  <li key={r.id} className="py-2 border-b border-slate-100 last:border-0">
                    <span className="text-amber-600 font-medium">{r.type}</span> from {r.fromUser.name}
                    {r.message && <p className="text-slate-600 text-sm mt-0.5">{r.message}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Attendance (YTD)</h2>
            <p className="text-2xl font-bold text-slate-900">{attendanceSummary.totalDays} days</p>
            <p className="text-slate-600 text-sm">{totalHours} hours total</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Leave balance</h2>
            {leaveBalances.length === 0 ? (
              <p className="text-slate-500 text-sm">No balances.</p>
            ) : (
              <ul className="space-y-2">
                {leaveBalances.map((b, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{b.leaveType.name}</span>
                    <span className="font-medium">{b.balance}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">1:1s</h2>
            {oneOnOnes.length === 0 ? (
              <p className="text-slate-500 text-sm">No 1:1s scheduled.</p>
            ) : (
              <ul className="space-y-2">
                {oneOnOnes.map((o) => (
                  <li key={o.id} className="text-sm">
                    {new Date(o.scheduledAt).toLocaleDateString()} · {o.status}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
