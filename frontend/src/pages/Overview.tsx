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
}

export default function Overview() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clocking, setClocking] = useState<'in' | 'out' | null>(null);

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

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <p className="text-slate-500 text-sm font-medium mb-2">Activity (last 7 days)</p>
          <div className="space-y-2">
            <p className="text-slate-700">Avg working hours: <span className="font-semibold text-slate-900">{data?.avgWorkingHours ?? '-'}</span></p>
            <p className="text-slate-700">Avg break: <span className="font-semibold text-slate-900">{data?.avgBreakDuration ?? '-'}</span></p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
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
            <Link to="/leave" className="text-violet-600 font-medium mt-2 inline-block">My Leave</Link>
            <span className="mx-2 text-slate-300">|</span>
            <Link to="/attendance" className="text-violet-600 font-medium inline-block">My Attendance</Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
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
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
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
        </div>
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
