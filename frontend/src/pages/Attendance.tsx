import { useEffect, useState } from 'react';
import api from '../lib/api';

type Tab = 'status' | 'regularize' | 'approve' | 'shift' | 'policy';

interface AttendanceRecord {
  id: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  breakMinutes: number;
  totalMinutes: number;
  remark: string;
  regularizationRequested: boolean;
}

interface AttendanceResponse {
  records: AttendanceRecord[];
  summary: {
    avgWorkingHours: string;
    avgInTime: string;
    avgOutTime: string;
    avgBreakTime: string;
    paidDays: number;
  };
}

interface RegRequest {
  id: string;
  requestedClockIn: string;
  requestedClockOut: string;
  reason: string;
  status: string;
  attendanceRecord: { date: string };
}

interface PendingRegRequest extends RegRequest {
  user: { id: string; name: string; email: string };
}

interface Shift {
  id: string;
  name: string;
  inTime: string;
  outTime: string;
  breakMinutes: number;
}

export default function Attendance() {
  const [tab, setTab] = useState<Tab>('status');
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [attendance, setAttendance] = useState<AttendanceResponse | null>(null);
  const [regRequests, setRegRequests] = useState<RegRequest[]>([]);
  const [pendingTeamReg, setPendingTeamReg] = useState<PendingRegRequest[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [regularizeModal, setRegularizeModal] = useState<AttendanceRecord | null>(null);
  const [regForm, setRegForm] = useState({ requestedClockIn: '', requestedClockOut: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (tab === 'status') {
      setLoading(true);
      api.get(`/attendance/me?month=${month}&year=${year}`)
        .then((res) => setAttendance(res.data))
        .finally(() => setLoading(false));
    } else if (tab === 'regularize') {
      api.get('/attendance/regularize-requests').then((res) => setRegRequests(res.data));
    } else if (tab === 'approve') {
      api.get('/attendance/regularize-pending').then((res) => setPendingTeamReg(res.data)).catch(() => setPendingTeamReg([]));
    } else if (tab === 'shift') {
      api.get('/attendance/shifts').then((res) => setShifts(res.data));
    }
  }, [tab, month, year]);

  const handleRegularize = (record: AttendanceRecord) => {
    setRegularizeModal(record);
    setRegForm({
      requestedClockIn: record.clockIn ? new Date(record.clockIn).toISOString().slice(0, 16) : '',
      requestedClockOut: record.clockOut ? new Date(record.clockOut).toISOString().slice(0, 16) : '',
      reason: '',
    });
  };

  const submitRegularize = () => {
    if (!regularizeModal || !regForm.requestedClockIn || !regForm.requestedClockOut || !regForm.reason) return;
    setSubmitting(true);
    api.post('/attendance/regularize', {
      attendanceRecordId: regularizeModal.id,
      requestedClockIn: new Date(regForm.requestedClockIn).toISOString(),
      requestedClockOut: new Date(regForm.requestedClockOut).toISOString(),
      reason: regForm.reason,
    })
      .then(() => {
        setRegularizeModal(null);
        api.get('/attendance/regularize-requests').then((res) => setRegRequests(res.data));
        api.get(`/attendance/me?month=${month}&year=${year}`).then((res) => setAttendance(res.data));
      })
      .finally(() => setSubmitting(false));
  };

  const handleRegApprove = (id: string, status: 'approved' | 'rejected') => {
    api.patch(`/attendance/regularize/${id}`, { status }).then(() => {
      setPendingTeamReg((prev) => prev.filter((r) => r.id !== id));
    });
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'status', label: 'Status' },
    { id: 'regularize', label: 'Regularize Requests' },
    { id: 'approve', label: 'Approve (Team)' },
    { id: 'shift', label: 'Shift Details' },
    { id: 'policy', label: 'Policy Details' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Attendance</h1>

      <div className="flex gap-2 border-b border-slate-200 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
              tab === t.id ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'status' && (
        <>
          <div className="flex flex-wrap gap-4 mb-6">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              {[year - 2, year - 1, year, year + 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" /></div>
          ) : attendance && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <p className="text-slate-500 text-sm">Avg working hours</p>
                  <p className="text-xl font-semibold text-slate-900">{attendance.summary.avgWorkingHours}</p>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <p className="text-slate-500 text-sm">Avg in time</p>
                  <p className="text-xl font-semibold text-slate-900">{attendance.summary.avgInTime}</p>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <p className="text-slate-500 text-sm">Avg out time</p>
                  <p className="text-xl font-semibold text-slate-900">{attendance.summary.avgOutTime}</p>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <p className="text-slate-500 text-sm">Avg break</p>
                  <p className="text-xl font-semibold text-slate-900">{attendance.summary.avgBreakTime}</p>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <p className="text-slate-500 text-sm">Paid days</p>
                  <p className="text-xl font-semibold text-slate-900">{attendance.summary.paidDays}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left p-3 font-medium text-slate-700">Date</th>
                      <th className="text-left p-3 font-medium text-slate-700">Clock In</th>
                      <th className="text-left p-3 font-medium text-slate-700">Clock Out</th>
                      <th className="text-left p-3 font-medium text-slate-700">Total</th>
                      <th className="text-left p-3 font-medium text-slate-700">Remark</th>
                      <th className="text-left p-3 font-medium text-slate-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.records.map((r) => (
                      <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-3">{new Date(r.date).toLocaleDateString()}</td>
                        <td className="p-3">{r.clockIn ? new Date(r.clockIn).toLocaleTimeString() : '-'}</td>
                        <td className="p-3">{r.clockOut ? new Date(r.clockOut).toLocaleTimeString() : '-'}</td>
                        <td className="p-3">{r.totalMinutes ? `${Math.floor(r.totalMinutes / 60)}h ${r.totalMinutes % 60}m` : '-'}</td>
                        <td className="p-3">{r.remark}</td>
                        <td className="p-3">
                          {!r.regularizationRequested && (r.clockIn || r.clockOut) && (
                            <button onClick={() => handleRegularize(r)} className="text-violet-600 font-medium hover:underline">Regularize</button>
                          )}
                          {r.regularizationRequested && <span className="text-slate-500 text-xs">Requested</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {tab === 'regularize' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-3 font-medium text-slate-700">Date</th>
                <th className="text-left p-3 font-medium text-slate-700">Requested In</th>
                <th className="text-left p-3 font-medium text-slate-700">Requested Out</th>
                <th className="text-left p-3 font-medium text-slate-700">Reason</th>
                <th className="text-left p-3 font-medium text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {regRequests.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-slate-500">No regularization requests.</td></tr>
              ) : (
                regRequests.map((req) => (
                  <tr key={req.id} className="border-b border-slate-100">
                    <td className="p-3">{new Date(req.attendanceRecord.date).toLocaleDateString()}</td>
                    <td className="p-3">{new Date(req.requestedClockIn).toLocaleString()}</td>
                    <td className="p-3">{new Date(req.requestedClockOut).toLocaleString()}</td>
                    <td className="p-3">{req.reason}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      req.status === 'approved' ? 'bg-green-100 text-green-800' : req.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                    }`}>{req.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'approve' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <p className="p-3 text-slate-600 text-sm border-b border-slate-200">Attendance regularization requests from your direct reports.</p>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-3 font-medium text-slate-700">Employee</th>
                <th className="text-left p-3 font-medium text-slate-700">Date</th>
                <th className="text-left p-3 font-medium text-slate-700">Requested In</th>
                <th className="text-left p-3 font-medium text-slate-700">Requested Out</th>
                <th className="text-left p-3 font-medium text-slate-700">Reason</th>
                <th className="text-left p-3 font-medium text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingTeamReg.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-slate-500">No pending regularization requests.</td></tr>
              ) : (
                pendingTeamReg.map((req) => (
                  <tr key={req.id} className="border-b border-slate-100">
                    <td className="p-3 font-medium">{req.user.name}</td>
                    <td className="p-3">{new Date(req.attendanceRecord.date).toLocaleDateString()}</td>
                    <td className="p-3">{new Date(req.requestedClockIn).toLocaleString()}</td>
                    <td className="p-3">{new Date(req.requestedClockOut).toLocaleString()}</td>
                    <td className="p-3">{req.reason}</td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => handleRegApprove(req.id, 'approved')} className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded hover:bg-green-200">Approve</button>
                      <button onClick={() => handleRegApprove(req.id, 'rejected')} className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded hover:bg-red-200">Reject</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'shift' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-3 font-medium text-slate-700">Shift</th>
                <th className="text-left p-3 font-medium text-slate-700">In time</th>
                <th className="text-left p-3 font-medium text-slate-700">Out time</th>
                <th className="text-left p-3 font-medium text-slate-700">Break (min)</th>
              </tr>
            </thead>
            <tbody>
              {shifts.length === 0 ? (
                <tr><td colSpan={4} className="p-6 text-center text-slate-500">No shifts configured.</td></tr>
              ) : (
                shifts.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100">
                    <td className="p-3 font-medium">{s.name}</td>
                    <td className="p-3">{s.inTime}</td>
                    <td className="p-3">{s.outTime}</td>
                    <td className="p-3">{s.breakMinutes}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'policy' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-2">Attendance policy</h3>
          <p className="text-slate-600 text-sm">Standard working hours and regularization rules are as per company policy. For detailed policy documents, visit the Knowledge Base.</p>
        </div>
      )}

      {regularizeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Request regularization</h3>
            <p className="text-slate-600 text-sm mb-4">Date: {new Date(regularizeModal.date).toLocaleDateString()}</p>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">Requested clock in</label>
              <input type="datetime-local" value={regForm.requestedClockIn} onChange={(e) => setRegForm((f) => ({ ...f, requestedClockIn: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <label className="block text-sm font-medium text-slate-700">Requested clock out</label>
              <input type="datetime-local" value={regForm.requestedClockOut} onChange={(e) => setRegForm((f) => ({ ...f, requestedClockOut: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <label className="block text-sm font-medium text-slate-700">Reason</label>
              <textarea value={regForm.reason} onChange={(e) => setRegForm((f) => ({ ...f, reason: e.target.value }))} rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Reason for regularization" />
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={submitRegularize} disabled={submitting || !regForm.reason} className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 disabled:opacity-50">Submit</button>
              <button onClick={() => setRegularizeModal(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
