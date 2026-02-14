import { useEffect, useState } from 'react';
import api from '../lib/api';

type Tab = 'status' | 'requests' | 'approvals' | 'holidays';

interface LeaveBalance {
  id: string;
  year: number;
  accrued: number;
  used: number;
  requested: number;
  balance: number;
  leaveType: { id: string; name: string };
}

interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  status: string;
  leaveType: { name: string };
  createdAt: string;
}

interface PendingApproval extends LeaveRequest {
  user: { id: string; name: string; email: string; designation: string | null };
}

interface LeaveType {
  id: string;
  name: string;
  unit: string;
}

interface Holiday {
  id: string;
  name: string;
  date: string;
  isOptional: boolean;
}

export default function Leave() {
  const [tab, setTab] = useState<Tab>('status');
  const [year] = useState(() => new Date().getFullYear());
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyModal, setApplyModal] = useState(false);
  const [applyForm, setApplyForm] = useState({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (tab === 'status') {
      setLoading(true);
      api.get(`/leave/balances?year=${year}`).then((res) => setBalances(res.data)).finally(() => setLoading(false));
      api.get('/leave/types').then((res) => setLeaveTypes(res.data));
    } else if (tab === 'requests') {
      api.get('/leave/requests').then((res) => setRequests(res.data));
    } else if (tab === 'approvals') {
      api.get('/leave/pending-approvals').then((res) => setPendingApprovals(res.data)).catch(() => setPendingApprovals([]));
    } else if (tab === 'holidays') {
      api.get('/leave/holidays?period=365').then((res) => setHolidays(res.data));
    }
  }, [tab, year]);

  const openApply = () => {
    setApplyForm({ leaveTypeId: leaveTypes[0]?.id ?? '', startDate: '', endDate: '', reason: '' });
    setApplyModal(true);
    setError('');
  };

  const submitApply = () => {
    if (!applyForm.leaveTypeId || !applyForm.startDate || !applyForm.endDate) {
      setError('Leave type, start date and end date are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    api.post('/leave/apply', {
      leaveTypeId: applyForm.leaveTypeId,
      startDate: applyForm.startDate,
      endDate: applyForm.endDate,
      reason: applyForm.reason || undefined,
    })
      .then(() => {
        setApplyModal(false);
        api.get(`/leave/balances?year=${year}`).then((res) => setBalances(res.data));
        api.get('/leave/requests').then((res) => setRequests(res.data));
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to apply leave'))
      .finally(() => setSubmitting(false));
  };

  const handleApprove = (requestId: string, status: 'approved' | 'rejected') => {
    api.patch(`/leave/requests/${requestId}`, { status }).then(() => {
      setPendingApprovals((prev) => prev.filter((r) => r.id !== requestId));
      api.get('/leave/requests').then((res) => setRequests(res.data));
      api.get(`/leave/balances?year=${year}`).then((res) => setBalances(res.data));
    });
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'status', label: 'Status' },
    { id: 'requests', label: 'Requests' },
    { id: 'approvals', label: 'Approvals' },
    { id: 'holidays', label: 'Holiday List' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Leave</h1>

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
          <div className="flex justify-end mb-4">
            <button onClick={openApply} className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700">Apply Leave</button>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" /></div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left p-3 font-medium text-slate-700">Leave type</th>
                    <th className="text-left p-3 font-medium text-slate-700">Year</th>
                    <th className="text-left p-3 font-medium text-slate-700">Accrued</th>
                    <th className="text-left p-3 font-medium text-slate-700">Used</th>
                    <th className="text-left p-3 font-medium text-slate-700">Requested</th>
                    <th className="text-left p-3 font-medium text-slate-700">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {balances.length === 0 ? (
                    <tr><td colSpan={6} className="p-6 text-center text-slate-500">No leave balances. Leave types may need to be seeded.</td></tr>
                  ) : (
                    balances.map((b) => (
                      <tr key={b.id} className="border-b border-slate-100">
                        <td className="p-3 font-medium">{b.leaveType.name}</td>
                        <td className="p-3">{b.year}</td>
                        <td className="p-3">{b.accrued}</td>
                        <td className="p-3">{b.used}</td>
                        <td className="p-3">{b.requested}</td>
                        <td className="p-3 font-semibold text-slate-900">{b.balance}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'requests' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-3 font-medium text-slate-700">Leave type</th>
                <th className="text-left p-3 font-medium text-slate-700">Start</th>
                <th className="text-left p-3 font-medium text-slate-700">End</th>
                <th className="text-left p-3 font-medium text-slate-700">Days</th>
                <th className="text-left p-3 font-medium text-slate-700">Reason</th>
                <th className="text-left p-3 font-medium text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-slate-500">No leave requests.</td></tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100">
                    <td className="p-3">{r.leaveType.name}</td>
                    <td className="p-3">{new Date(r.startDate).toLocaleDateString()}</td>
                    <td className="p-3">{new Date(r.endDate).toLocaleDateString()}</td>
                    <td className="p-3">{r.days}</td>
                    <td className="p-3">{r.reason || '-'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        r.status === 'approved' ? 'bg-green-100 text-green-800' : r.status === 'rejected' || r.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>{r.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'approvals' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <p className="p-3 text-slate-600 text-sm border-b border-slate-200">Leave requests from your direct reports pending your approval.</p>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-3 font-medium text-slate-700">Employee</th>
                <th className="text-left p-3 font-medium text-slate-700">Leave type</th>
                <th className="text-left p-3 font-medium text-slate-700">Start</th>
                <th className="text-left p-3 font-medium text-slate-700">End</th>
                <th className="text-left p-3 font-medium text-slate-700">Days</th>
                <th className="text-left p-3 font-medium text-slate-700">Reason</th>
                <th className="text-left p-3 font-medium text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingApprovals.length === 0 ? (
                <tr><td colSpan={7} className="p-6 text-center text-slate-500">No pending leave requests to approve.</td></tr>
              ) : (
                pendingApprovals.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100">
                    <td className="p-3 font-medium">{r.user.name}</td>
                    <td className="p-3">{r.leaveType.name}</td>
                    <td className="p-3">{new Date(r.startDate).toLocaleDateString()}</td>
                    <td className="p-3">{new Date(r.endDate).toLocaleDateString()}</td>
                    <td className="p-3">{r.days}</td>
                    <td className="p-3">{r.reason || '-'}</td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => handleApprove(r.id, 'approved')} className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded hover:bg-green-200">Approve</button>
                      <button onClick={() => handleApprove(r.id, 'rejected')} className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded hover:bg-red-200">Reject</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'holidays' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-3 font-medium text-slate-700">Date</th>
                <th className="text-left p-3 font-medium text-slate-700">Holiday</th>
                <th className="text-left p-3 font-medium text-slate-700">Optional</th>
              </tr>
            </thead>
            <tbody>
              {holidays.length === 0 ? (
                <tr><td colSpan={3} className="p-6 text-center text-slate-500">No holidays in the selected period.</td></tr>
              ) : (
                holidays.map((h) => (
                  <tr key={h.id} className="border-b border-slate-100">
                    <td className="p-3">{new Date(h.date).toLocaleDateString()}</td>
                    <td className="p-3 font-medium">{h.name}</td>
                    <td className="p-3">{h.isOptional ? 'Yes' : 'No'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {applyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Apply leave</h3>
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">Leave type</label>
              <select value={applyForm.leaveTypeId} onChange={(e) => setApplyForm((f) => ({ ...f, leaveTypeId: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                {leaveTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <label className="block text-sm font-medium text-slate-700">Start date</label>
              <input type="date" value={applyForm.startDate} onChange={(e) => setApplyForm((f) => ({ ...f, startDate: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <label className="block text-sm font-medium text-slate-700">End date</label>
              <input type="date" value={applyForm.endDate} onChange={(e) => setApplyForm((f) => ({ ...f, endDate: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <label className="block text-sm font-medium text-slate-700">Reason (optional)</label>
              <textarea value={applyForm.reason} onChange={(e) => setApplyForm((f) => ({ ...f, reason: e.target.value }))} rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={submitApply} disabled={submitting} className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 disabled:opacity-50">Submit</button>
              <button onClick={() => setApplyModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
