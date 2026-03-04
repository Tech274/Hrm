import { useEffect, useState, useCallback } from 'react';
import { Navigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

type AttendanceStatus = 'present_in' | 'present_out' | 'absent' | 'on_leave' | 'week_off' | 'auto_clocked_out';

interface LiveItem {
  userId: string;
  name: string;
  department: string;
  clockIn: string | null;
  clockOut: string | null;
  remark: string;
  status: AttendanceStatus;
}

interface LiveSummary {
  present_in: number;
  present_out: number;
  absent: number;
  on_leave: number;
  week_off: number;
  auto_clocked_out: number;
  total: number;
}

interface LiveResponse {
  list: LiveItem[];
  summary: LiveSummary;
  date: string;
}

interface WeeklyByDay {
  date: string;
  present: number;
  absent: number;
  on_leave: number;
  week_off: number;
}

interface WeeklyByEmployee {
  userId: string;
  name: string;
  department: string;
  daysPresent: number;
  daysOnLeave: number;
  daysWeekOff: number;
  daysAbsent: number;
}

interface WeeklyResponse {
  from: string;
  to: string;
  byDay: WeeklyByDay[];
  byEmployee: WeeklyByEmployee[];
}

interface MonthlyEmployee {
  userId: string;
  name: string;
  department: string;
  daysPresent: number;
  daysAbsent: number;
  daysOnLeave: number;
  daysWeekOff: number;
}

interface MonthlyResponse {
  month: number;
  year: number;
  from: string;
  to: string;
  totalEmployees: number;
  totals: { daysPresent: number; daysAbsent: number; daysOnLeave: number; daysWeekOff: number };
  byEmployee: MonthlyEmployee[];
}

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present_in: 'Present (in office)',
  present_out: 'Left for the day',
  absent: 'Absent',
  on_leave: 'On leave',
  week_off: 'Week off',
  auto_clocked_out: 'Auto clocked out',
};

function formatTime(iso: string | null) {
  if (!iso) return '–';
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function EmployeeListModal({
  status,
  list,
  statusLabels,
  formatTime,
  onClose,
}: {
  status: AttendanceStatus | 'total';
  list: LiveItem[];
  statusLabels: Record<AttendanceStatus, string>;
  formatTime: (iso: string | null) => string;
  onClose: () => void;
}) {
  const rows = status === 'total' ? list : list.filter((r) => r.status === status);
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-900">
            {status === 'total' ? 'All employees' : statusLabels[status]}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-700 p-1">✕</button>
        </div>
        <div className="overflow-auto flex-1">
          {rows.length === 0 ? (
            <p className="p-4 text-slate-500 text-sm">No employees in this category.</p>
          ) : (
            rows.map((row) => (
              <div key={row.userId} className="flex items-center justify-between px-4 py-3 border-b border-slate-100 hover:bg-slate-50">
                <div>
                  <p className="font-medium text-slate-900">{row.name}</p>
                  <p className="text-sm text-slate-500">{row.department} · {formatTime(row.clockIn)} – {formatTime(row.clockOut)}</p>
                </div>
                <Link to={`/people/${row.userId}`} className="text-violet-600 text-sm font-medium hover:underline">View details</Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function HRAttendanceDashboard() {
  const { user } = useAuth();
  const [section, setSection] = useState<'live' | 'daily' | 'weekly' | 'monthly'>('live');
  const [department, setDepartment] = useState<string>('');

  const [liveData, setLiveData] = useState<LiveResponse | null>(null);
  const [liveLoading, setLiveLoading] = useState(true);
  const [dailyDate, setDailyDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dailyData, setDailyData] = useState<LiveResponse | null>(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [weeklyFrom, setWeeklyFrom] = useState('');
  const [weeklyTo, setWeeklyTo] = useState('');
  const [weeklyData, setWeeklyData] = useState<WeeklyResponse | null>(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [monthlyMonth, setMonthlyMonth] = useState(() => String(new Date().getMonth() + 1));
  const [monthlyYear, setMonthlyYear] = useState(() => String(new Date().getFullYear()));
  const [monthlyData, setMonthlyData] = useState<MonthlyResponse | null>(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus | 'total' | null>(null);

  const isHR = user?.role === 'admin' || user?.role === 'admin_hr';
  if (!user) return null;
  if (!isHR) return <Navigate to="/overview" replace />;

  const loadLive = useCallback(() => {
    setLiveLoading(true);
    const params = department ? `?department=${encodeURIComponent(department)}` : '';
    api
      .get<LiveResponse>(`/reports/attendance/live${params}`)
      .then((res) => setLiveData(res.data))
      .catch(() => setLiveData(null))
      .finally(() => setLiveLoading(false));
  }, [department]);

  const loadDaily = useCallback(() => {
    setDailyLoading(true);
    const params = new URLSearchParams({ date: dailyDate });
    if (department) params.set('department', department);
    api
      .get<LiveResponse>(`/reports/attendance/daily?${params}`)
      .then((res) => setDailyData(res.data))
      .catch(() => setDailyData(null))
      .finally(() => setDailyLoading(false));
  }, [dailyDate, department]);

  const loadWeekly = useCallback(() => {
    setWeeklyLoading(true);
    const params = weeklyFrom && weeklyTo ? { from: weeklyFrom, to: weeklyTo } : {};
    const qs = new URLSearchParams(params as Record<string, string>);
    if (department) qs.set('department', department);
    api
      .get<WeeklyResponse>(`/reports/attendance/weekly?${qs}`)
      .then((res) => setWeeklyData(res.data))
      .catch(() => setWeeklyData(null))
      .finally(() => setWeeklyLoading(false));
  }, [weeklyFrom, weeklyTo, department]);

  const loadMonthly = useCallback(() => {
    setMonthlyLoading(true);
    const params = new URLSearchParams({ month: monthlyMonth, year: monthlyYear });
    if (department) params.set('department', department);
    api
      .get<MonthlyResponse>(`/reports/attendance/monthly?${params}`)
      .then((res) => setMonthlyData(res.data))
      .catch(() => setMonthlyData(null))
      .finally(() => setMonthlyLoading(false));
  }, [monthlyMonth, monthlyYear, department]);

  useEffect(() => {
    api.get<{ data: { department: string }[] }>('/reports/employees').then((res) => {
      const deps = [...new Set((res.data?.data || []).map((u: { department: string }) => u.department).filter(Boolean))].sort();
      setDepartments(deps);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (section === 'live') loadLive();
  }, [section, loadLive]);

  useEffect(() => {
    if (section === 'live') {
      const t = setInterval(loadLive, 90 * 1000);
      return () => clearInterval(t);
    }
  }, [section, loadLive]);

  useEffect(() => {
    if (section === 'daily') loadDaily();
  }, [section, loadDaily]);

  useEffect(() => {
    if (section === 'weekly') loadWeekly();
  }, [section, loadWeekly]);

  useEffect(() => {
    if (section === 'monthly') loadMonthly();
  }, [section, loadMonthly]);

  const sections = [
    { id: 'live' as const, label: 'Live (today)' },
    { id: 'daily' as const, label: 'Daily' },
    { id: 'weekly' as const, label: 'Weekly' },
    { id: 'monthly' as const, label: 'Monthly overview' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">HR Attendance Dashboard</h1>
      <p className="text-slate-600 mb-6">View live and historical attendance across the organization.</p>

      <div className="flex flex-wrap gap-2 items-center mb-6">
        <div className="flex gap-2 border-b border-slate-200">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
                section === s.id ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-4">
          <label className="text-sm text-slate-600">Department</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="">All</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {section === 'live' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Live attendance (today)</h2>
            <button onClick={loadLive} disabled={liveLoading} className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50">
              {liveLoading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
          {liveLoading && !liveData ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" /></div>
          ) : liveData ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {(Object.entries(liveData.summary) as [keyof LiveSummary, number][]).filter(([k]) => k !== 'total').map(([key, count]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedStatus(key as AttendanceStatus)}
                    className="bg-white rounded-lg border border-slate-200 p-4 text-left hover:border-violet-300 hover:shadow-md transition-all cursor-pointer"
                  >
                    <p className="text-slate-500 text-xs uppercase tracking-wide">{STATUS_LABELS[key as AttendanceStatus]}</p>
                    <p className="text-xl font-semibold text-slate-900">{count}</p>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedStatus('total')}
                  className="bg-white rounded-lg border border-slate-200 p-4 text-left hover:border-violet-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <p className="text-slate-500 text-xs uppercase tracking-wide">Total</p>
                  <p className="text-xl font-semibold text-slate-900">{liveData.summary.total}</p>
                </button>
              </div>
              {selectedStatus && (
                <EmployeeListModal
                  status={selectedStatus}
                  list={liveData.list}
                  statusLabels={STATUS_LABELS}
                  formatTime={formatTime}
                  onClose={() => setSelectedStatus(null)}
                />
              )}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left p-3 font-medium text-slate-700">Employee</th>
                      <th className="text-left p-3 font-medium text-slate-700">Department</th>
                      <th className="text-left p-3 font-medium text-slate-700">Clock In</th>
                      <th className="text-left p-3 font-medium text-slate-700">Clock Out</th>
                      <th className="text-left p-3 font-medium text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveData.list.map((row) => (
                      <tr key={row.userId} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-3 font-medium">{row.name}</td>
                        <td className="p-3">{row.department}</td>
                        <td className="p-3">{formatTime(row.clockIn)}</td>
                        <td className="p-3">{formatTime(row.clockOut)}</td>
                        <td className="p-3"><span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">{STATUS_LABELS[row.status]}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-slate-500">Unable to load live attendance.</p>
          )}
        </div>
      )}

      {section === 'daily' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-sm font-medium text-slate-700">Date</label>
            <input type="date" value={dailyDate} onChange={(e) => setDailyDate(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            <button onClick={loadDaily} disabled={dailyLoading} className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">Apply</button>
          </div>
          {dailyLoading && !dailyData ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" /></div>
          ) : dailyData ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {(Object.entries(dailyData.summary) as [keyof LiveSummary, number][]).filter(([k]) => k !== 'total').map(([key, count]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedStatus(key as AttendanceStatus)}
                    className="bg-white rounded-lg border border-slate-200 p-4 text-left hover:border-violet-300 hover:shadow-md transition-all cursor-pointer"
                  >
                    <p className="text-slate-500 text-xs uppercase tracking-wide">{STATUS_LABELS[key as AttendanceStatus]}</p>
                    <p className="text-xl font-semibold text-slate-900">{count}</p>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedStatus('total')}
                  className="bg-white rounded-lg border border-slate-200 p-4 text-left hover:border-violet-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <p className="text-slate-500 text-xs uppercase tracking-wide">Total</p>
                  <p className="text-xl font-semibold text-slate-900">{dailyData.summary.total}</p>
                </button>
              </div>
              {selectedStatus && dailyData && (
                <EmployeeListModal
                  status={selectedStatus}
                  list={dailyData.list}
                  statusLabels={STATUS_LABELS}
                  formatTime={formatTime}
                  onClose={() => setSelectedStatus(null)}
                />
              )}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left p-3 font-medium text-slate-700">Employee</th>
                      <th className="text-left p-3 font-medium text-slate-700">Department</th>
                      <th className="text-left p-3 font-medium text-slate-700">Clock In</th>
                      <th className="text-left p-3 font-medium text-slate-700">Clock Out</th>
                      <th className="text-left p-3 font-medium text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyData.list.map((row) => (
                      <tr key={row.userId} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-3 font-medium">{row.name}</td>
                        <td className="p-3">{row.department}</td>
                        <td className="p-3">{formatTime(row.clockIn)}</td>
                        <td className="p-3">{formatTime(row.clockOut)}</td>
                        <td className="p-3"><span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">{STATUS_LABELS[row.status]}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-slate-500">Select a date and click Apply.</p>
          )}
        </div>
      )}

      {section === 'weekly' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-sm font-medium text-slate-700">From</label>
            <input type="date" value={weeklyFrom} onChange={(e) => setWeeklyFrom(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            <label className="text-sm font-medium text-slate-700">To</label>
            <input type="date" value={weeklyTo} onChange={(e) => setWeeklyTo(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            <button onClick={loadWeekly} disabled={weeklyLoading} className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">Apply</button>
          </div>
          {weeklyLoading && !weeklyData ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" /></div>
          ) : weeklyData ? (
            <>
              <h3 className="font-semibold text-slate-900">By day</h3>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left p-3 font-medium text-slate-700">Date</th>
                      <th className="text-right p-3 font-medium text-slate-700">Present</th>
                      <th className="text-right p-3 font-medium text-slate-700">On leave</th>
                      <th className="text-right p-3 font-medium text-slate-700">Week off</th>
                      <th className="text-right p-3 font-medium text-slate-700">Absent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyData.byDay.map((d) => (
                      <tr key={d.date} className="border-b border-slate-100">
                        <td className="p-3">{new Date(d.date).toLocaleDateString()}</td>
                        <td className="p-3 text-right">{d.present}</td>
                        <td className="p-3 text-right">{d.on_leave}</td>
                        <td className="p-3 text-right">{d.week_off}</td>
                        <td className="p-3 text-right">{d.absent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <h3 className="font-semibold text-slate-900 mt-6">By employee</h3>
              <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left p-3 font-medium text-slate-700">Employee</th>
                      <th className="text-left p-3 font-medium text-slate-700">Department</th>
                      <th className="text-right p-3 font-medium text-slate-700">Present</th>
                      <th className="text-right p-3 font-medium text-slate-700">On leave</th>
                      <th className="text-right p-3 font-medium text-slate-700">Week off</th>
                      <th className="text-right p-3 font-medium text-slate-700">Absent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyData.byEmployee.map((e) => (
                      <tr key={e.userId} className="border-b border-slate-100">
                        <td className="p-3 font-medium">{e.name}</td>
                        <td className="p-3">{e.department}</td>
                        <td className="p-3 text-right">{e.daysPresent}</td>
                        <td className="p-3 text-right">{e.daysOnLeave}</td>
                        <td className="p-3 text-right">{e.daysWeekOff}</td>
                        <td className="p-3 text-right">{e.daysAbsent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-slate-500">Select date range and click Apply (or leave empty for current week).</p>
          )}
        </div>
      )}

      {section === 'monthly' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <select value={monthlyMonth} onChange={(e) => setMonthlyMonth(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
              {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
            <input type="number" value={monthlyYear} onChange={(e) => setMonthlyYear(e.target.value)} min={2020} max={2030} className="w-24 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            <button onClick={loadMonthly} disabled={monthlyLoading} className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">Apply</button>
          </div>
          {monthlyLoading && !monthlyData ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" /></div>
          ) : monthlyData ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <p className="text-slate-500 text-sm">Total employees</p>
                  <p className="text-xl font-semibold text-slate-900">{monthlyData.totalEmployees}</p>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <p className="text-slate-500 text-sm">Days present (total)</p>
                  <p className="text-xl font-semibold text-slate-900">{monthlyData.totals.daysPresent}</p>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <p className="text-slate-500 text-sm">Days on leave</p>
                  <p className="text-xl font-semibold text-slate-900">{monthlyData.totals.daysOnLeave}</p>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <p className="text-slate-500 text-sm">Days absent</p>
                  <p className="text-xl font-semibold text-slate-900">{monthlyData.totals.daysAbsent}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left p-3 font-medium text-slate-700">Employee</th>
                      <th className="text-left p-3 font-medium text-slate-700">Department</th>
                      <th className="text-right p-3 font-medium text-slate-700">Present</th>
                      <th className="text-right p-3 font-medium text-slate-700">On leave</th>
                      <th className="text-right p-3 font-medium text-slate-700">Week off</th>
                      <th className="text-right p-3 font-medium text-slate-700">Absent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.byEmployee.map((e) => (
                      <tr key={e.userId} className="border-b border-slate-100">
                        <td className="p-3 font-medium">{e.name}</td>
                        <td className="p-3">{e.department}</td>
                        <td className="p-3 text-right">{e.daysPresent}</td>
                        <td className="p-3 text-right">{e.daysOnLeave}</td>
                        <td className="p-3 text-right">{e.daysWeekOff}</td>
                        <td className="p-3 text-right">{e.daysAbsent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-slate-500">Select month/year and click Apply.</p>
          )}
        </div>
      )}
    </div>
  );
}
