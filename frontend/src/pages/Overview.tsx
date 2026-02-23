import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

interface OverviewData {
  clockIn: string | null;
  clockOut: string | null;
  avgWorkingHours: string;
  avgBreakDuration: string;
  leave: { raised: number; approved: number; pending: number; rejected: number };
  workFromHome: { raised: number; approved: number; pending: number; rejected: number };
  attendanceRegularization: { raised: number; approved: number; pending: number; rejected: number };
  birthdays: { id: string; name: string; designation?: string; department: string }[];
  anniversaries: { id: string; name: string; designation?: string; department: string }[];
  leaveSuggestions?: { message: string; type: string }[];
}

export default function Overview() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clocking, setClocking] = useState<'in' | 'out' | null>(null);
  const [announcements, setAnnouncements] = useState<{ id: string; title: string; body: string; createdBy: { name: string } }[]>([]);
  const [pulseScore, setPulseScore] = useState<number | null>(null);
  const [pulseSubmitting, setPulseSubmitting] = useState(false);
  const [recognitions, setRecognitions] = useState<{ fromUser: { name: string }; type: string; message: string | null }[]>([]);

  const load = () => {
    api
      .get('/dashboard/overview?days=7')
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load overview'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    api.get('/announcements').then((r) => setAnnouncements(r.data)).catch(() => setAnnouncements([]));
  }, []);

  const loadPulse = () => {
    api.get('/pulse/me?weeks=1').then((r) => {
      const arr = r.data || [];
      if (arr.length) setPulseScore(arr[arr.length - 1].score);
    }).catch(() => {});
  };
  useEffect(() => { loadPulse(); }, []);

  useEffect(() => {
    api.get('/recognition/me').then((r) => setRecognitions((r.data || []).slice(0, 5))).catch(() => setRecognitions([]));
  }, []);

  const submitPulse = (score: number) => {
    setPulseSubmitting(true);
    api.post('/pulse', { score })
      .then(() => { setPulseScore(score); loadPulse(); })
      .catch(() => {})
      .finally(() => setPulseSubmitting(false));
  };

  const handleClockIn = () => {
    setClocking('in');
    api
      .post('/attendance/clock-in')
      .then(() => load())
      .catch(() => setError('Clock-in failed'))
      .finally(() => setClocking(null));
  };

  const handleClockOut = () => {
    setClocking('out');
    api
      .post('/attendance/clock-out')
      .then(() => load())
      .catch(() => setError('Clock-out failed'))
      .finally(() => setClocking(null));
  };

  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const currentDate = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        {error}
      </div>
    );
  }

  const isClockedIn = !!data?.clockIn && !data?.clockOut;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Overview</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <p className="text-slate-500 text-sm font-medium mb-1">Current time</p>
          <p className="text-3xl font-bold text-slate-900">{currentTime}</p>
          <p className="text-slate-600 text-sm mt-1">{currentDate}</p>
          <div className="mt-4 flex gap-2">
            {!data?.clockIn ? (
              <button
                onClick={handleClockIn}
                disabled={!!clocking}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 disabled:opacity-50"
              >
                {clocking === 'in' ? 'Clocking in…' : 'Clock In'}
              </button>
            ) : !data?.clockOut ? (
              <button
                onClick={handleClockOut}
                disabled={!!clocking}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-700 disabled:opacity-50"
              >
                {clocking === 'out' ? 'Clocking out…' : 'Clock Out'}
              </button>
            ) : (
              <span className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-medium">Done for today</span>
            )}
          </div>
          {data?.clockIn && (
            <p className="text-sm text-slate-500 mt-2">
              {isClockedIn ? `Clocked in at ${new Date(data.clockIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : `Clocked out at ${data.clockOut ? new Date(data.clockOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}`}
            </p>
          )}
        </div>

        <Link to="/attendance" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:border-violet-300 hover:shadow-md transition-all block">
          <p className="text-slate-500 text-sm font-medium mb-2">Activity (last 7 days)</p>
          <div className="space-y-2">
            <p className="text-slate-700">Avg working hours: <span className="font-semibold text-slate-900">{data?.avgWorkingHours ?? '-'}</span></p>
            <p className="text-slate-700">Avg break: <span className="font-semibold text-slate-900">{data?.avgBreakDuration ?? '-'}</span></p>
          </div>
        </Link>

        {(data?.leaveSuggestions?.length ?? 0) > 0 && (
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 lg:col-span-3">
            <p className="text-amber-800 font-medium mb-2">Leave tip</p>
            {data.leaveSuggestions!.map((s, i) => (
              <p key={i} className="text-amber-700 text-sm">{s.message}</p>
            ))}
          </div>
        )}
        <Link to="/leave" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:border-violet-300 hover:shadow-md transition-all block">
          <p className="text-slate-500 text-sm font-medium mb-3">Request status</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Leave</span>
              <span>Raised: {data?.leave.raised ?? 0} · Pending: {data?.leave.pending ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Regularization</span>
              <span>Pending: {data?.attendanceRegularization.pending ?? 0}</span>
            </div>
            <p className="text-violet-600 font-medium mt-2">My Leave / My Attendance →</p>
          </div>
        </Link>
      </div>

      {announcements.length > 0 && (
        <div className="mb-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Announcements</h2>
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="border-l-2 border-violet-500 pl-4 py-1">
                <p className="font-medium text-slate-900">{a.title}</p>
                <p className="text-sm text-slate-600 mt-0.5">{a.body}</p>
                <p className="text-xs text-slate-400 mt-1">— {a.createdBy?.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(pulseScore === null || pulseScore !== null) && (
        <div className="mb-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Weekly pulse</h2>
          <p className="text-slate-600 text-sm mb-3">How are you feeling this week? (1–5)</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                disabled={pulseSubmitting}
                onClick={() => submitPulse(n)}
                className={`w-10 h-10 rounded-lg font-medium ${
                  pulseScore === n
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                } disabled:opacity-50`}
              >
                {n}
              </button>
            ))}
          </div>
          {pulseScore !== null && <p className="text-sm text-slate-500 mt-2">Thanks for your feedback.</p>}
        </div>
      )}

      {recognitions.length > 0 && (
        <div className="mb-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Recent recognitions</h2>
          <ul className="space-y-2">
            {recognitions.map((r, i) => (
              <li key={i} className="flex items-center gap-2 py-1">
                <span className="text-amber-500 font-medium">{r.type}</span>
                <span className="text-slate-600">from {r.fromUser.name}</span>
                {r.message && <span className="text-slate-500 text-sm">— {r.message}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/people" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:border-violet-300 hover:shadow-md transition-all block">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Birthdays today</h2>
          {data?.birthdays?.length ? (
            <ul className="space-y-2">
              {data.birthdays.map((u) => (
                <li key={u.id} className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-medium text-sm">{u.name.charAt(0)}</span>
                  <span className="font-medium text-slate-800">{u.name}</span>
                  {u.designation && <span className="text-slate-500 text-sm">· {u.designation}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-sm">No birthdays today.</p>
          )}
        </Link>
        <Link to="/people" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:border-violet-300 hover:shadow-md transition-all block">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Work anniversaries today</h2>
          {data?.anniversaries?.length ? (
            <ul className="space-y-2">
              {data.anniversaries.map((u) => (
                <li key={u.id} className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium text-sm">{u.name.charAt(0)}</span>
                  <span className="font-medium text-slate-800">{u.name}</span>
                  {u.designation && <span className="text-slate-500 text-sm">· {u.designation}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-sm">No anniversaries today.</p>
          )}
        </Link>
      </div>

      <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Quick links</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/attendance" className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm">My Attendance</Link>
          <Link to="/leave" className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm">My Leave</Link>
          <Link to="/calendar" className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm">My Calendar</Link>
        </div>
      </div>
    </div>
  );
}
