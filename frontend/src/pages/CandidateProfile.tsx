import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface AuditLog {
  entityType: string;
  action: string;
  timestamp: string;
  performedBy: { name: string } | null;
}

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  roleApplied: string;
  stage: string | null;
  status: string;
  currentCtc?: number | null;
  expectedCtc?: number | null;
  presentCompany?: string | null;
  experienceYears?: number | null;
  noticePeriodDays?: number | null;
  technologies?: string[] | null;
  createdBy: { name: string; email: string };
  interviews: Array<{
    id: string;
    roundName: string;
    status: string;
    feedbackStatus: string;
    scheduledAt: string;
    interviewer: { name: string };
    feedback: { id: string; averageScore: number; recommendation: string; signedOff: boolean } | null;
  }>;
  approvals: Array<{
    id: string;
    status: string;
    approvedAt: string | null;
    manager: { name: string };
  }>;
  offers: Array<{
    id: string;
    status: string;
    releasedAt: string | null;
    releasedBy: { name: string } | null;
  }>;
}

type Tab = 'overview' | 'interviews' | 'feedback' | 'approvals' | 'notes' | 'audit';

interface CandidateNote {
  id: string;
  body: string;
  isPrivate: boolean;
  createdAt: string;
  author: { id: string; name: string; email: string };
}

export default function CandidateProfile() {
  const { id } = useParams<{ id: string }>();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notes, setNotes] = useState<CandidateNote[]>([]);
  const [noteBody, setNoteBody] = useState('');
  const [notePrivate, setNotePrivate] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const { user } = useAuth();
  const canApprove = user?.role === 'manager' || user?.role === 'admin' || user?.role === 'admin_hr';
  const canEdit = user?.role === 'recruiter' || user?.role === 'admin' || user?.role === 'admin_hr';

  useEffect(() => {
    if (!id) return;
    api
      .get(`/candidates/${id}`)
      .then((res) => setCandidate(res.data))
      .catch(() => setError('Failed to load candidate'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || activeTab !== 'audit') return;
    api
      .get(`/candidates/${id}/audit`)
      .then((res) => setAuditLogs(res.data.data))
      .catch(() => setAuditLogs([]));
  }, [id, activeTab]);

  useEffect(() => {
    if (!id || activeTab !== 'notes') return;
    api
      .get(`/candidates/${id}/notes`)
      .then((res) => setNotes(res.data.data ?? []))
      .catch(() => setNotes([]));
  }, [id, activeTab]);

  const addNote = async () => {
    if (!id || !noteBody.trim()) return;
    setAddingNote(true);
    try {
      const res = await api.post(`/candidates/${id}/notes`, {
        body: noteBody.trim(),
        isPrivate: notePrivate,
      });
      setNotes((prev) => [res.data, ...prev]);
      setNoteBody('');
      setNotePrivate(false);
    } catch {
      // ignore
    } finally {
      setAddingNote(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-800',
      rejected: 'bg-red-100 text-red-800',
      offered: 'bg-violet-100 text-violet-800',
      hired: 'bg-blue-100 text-blue-800',
      pending: 'bg-amber-100 text-amber-800',
      submitted: 'bg-emerald-100 text-emerald-800',
      approved: 'bg-emerald-100 text-emerald-800',
      locked: 'bg-slate-100 text-slate-800',
      ready: 'bg-emerald-100 text-emerald-800',
      released: 'bg-violet-100 text-violet-800',
    };
    return (
      <span
        className={`px-2 py-0.5 rounded text-xs font-medium ${map[status] ?? 'bg-slate-100 text-slate-800'}`}
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        {error || 'Candidate not found'}
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'interviews', label: 'Interviews' },
    { key: 'feedback', label: 'Feedback' },
    { key: 'approvals', label: 'Approvals' },
    { key: 'notes', label: 'Notes' },
    { key: 'audit', label: 'Audit' },
  ];

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">
          {candidate.firstName} {candidate.lastName}
        </h1>
        <div className="flex gap-4">
          {canEdit && (
            <Link
              to={`/candidates/${id}/edit`}
              className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50"
            >
              Edit
            </Link>
          )}
          <Link
            to={`/candidates/${id}/offer`}
            className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800"
          >
            Offer
          </Link>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 font-medium border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="bg-white rounded-lg shadow border border-slate-200 p-6 space-y-4">
          <div><strong>Email:</strong> {candidate.email}</div>
          <div><strong>Phone:</strong> {candidate.phone ?? '-'}</div>
          <div><strong>Role Applied:</strong> {candidate.roleApplied}</div>
          <div><strong>Stage:</strong> {candidate.stage ?? '-'}</div>
          <div><strong>Status:</strong> {statusBadge(candidate.status)}</div>
          {(candidate.currentCtc != null || candidate.expectedCtc != null) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              {candidate.currentCtc != null && <div><strong>Current CTC (LPA):</strong> {candidate.currentCtc}</div>}
              {candidate.expectedCtc != null && <div><strong>Expected CTC (LPA):</strong> {candidate.expectedCtc}</div>}
            </div>
          )}
          {candidate.presentCompany && <div><strong>Present Company:</strong> {candidate.presentCompany}</div>}
          {candidate.experienceYears != null && <div><strong>Experience:</strong> {candidate.experienceYears} years</div>}
          {candidate.noticePeriodDays != null && <div><strong>Notice Period:</strong> {candidate.noticePeriodDays} days</div>}
          {candidate.technologies && candidate.technologies.length > 0 && (
            <div><strong>Technologies / Skills:</strong> {candidate.technologies.join(', ')}</div>
          )}
          <div><strong>Created By:</strong> {candidate.createdBy.name}</div>
        </div>
      )}

      {activeTab === 'interviews' && (
        <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500">Round</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500">Interviewer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500">Feedback</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {candidate.interviews.map((i) => (
                <tr key={i.id}>
                  <td className="px-6 py-4">{i.roundName}</td>
                  <td className="px-6 py-4">{i.interviewer.name}</td>
                  <td className="px-6 py-4">{statusBadge(i.status)}</td>
                  <td className="px-6 py-4">{statusBadge(i.feedbackStatus)}</td>
                  <td className="px-6 py-4">
                    {i.feedback ? (
                      <Link
                        to={`/candidates/${id}/feedback/${i.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        View/Edit
                      </Link>
                    ) : (
                      <Link
                        to={`/candidates/${id}/feedback/${i.id}`}
                        className="text-amber-600 hover:underline"
                      >
                        Submit
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="space-y-4">
          {candidate.interviews.map((i) =>
            i.feedback ? (
              <div
                key={i.id}
                className="bg-white rounded-lg shadow border border-slate-200 p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold">{i.roundName}</h3>
                  <Link
                    to={`/candidates/${id}/feedback/${i.id}`}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    Edit
                  </Link>
                </div>
                <p>Average: {i.feedback.averageScore} | Recommendation: {i.feedback.recommendation}</p>
                <p>Signed Off: {i.feedback.signedOff ? 'Yes' : 'No'}</p>
              </div>
            ) : (
              <div
                key={i.id}
                className="bg-amber-50 rounded-lg border border-amber-200 p-4"
              >
                <p className="text-amber-800">No feedback for {i.roundName}</p>
                <Link
                  to={`/candidates/${id}/feedback/${i.id}`}
                  className="text-amber-700 underline text-sm mt-1 inline-block"
                >
                  Submit feedback
                </Link>
              </div>
            )
          )}
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="space-y-4">
          {canEdit && (
            <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
              <h3 className="font-semibold mb-2">Add Note</h3>
              <textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder="Add a note..."
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-md text-sm"
              />
              <div className="mt-2 flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={notePrivate}
                    onChange={(e) => setNotePrivate(e.target.checked)}
                    className="rounded"
                  />
                  Private (HR only)
                </label>
                <button
                  onClick={addNote}
                  disabled={addingNote || !noteBody.trim()}
                  className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50 text-sm"
                >
                  {addingNote ? 'Adding…' : 'Add Note'}
                </button>
              </div>
            </div>
          )}
          {notes.length === 0 ? (
            <p className="text-slate-500">No notes yet.</p>
          ) : (
            <div className="space-y-3">
              {notes.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-lg border p-4 ${
                    n.isPrivate ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'
                  }`}
                >
                  <p className="text-slate-800 whitespace-pre-wrap">{n.body}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    {n.author.name} · {new Date(n.createdAt).toLocaleString()}
                    {n.isPrivate && ' · Private'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {canApprove && (
            <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
              <h3 className="font-semibold mb-2">Add Approval</h3>
              <div className="flex gap-4">
                <button
                  onClick={async () => {
                    try {
                      await api.post('/approvals', {
                        candidateId: id,
                        status: 'approved',
                      });
                      const res = await api.get(`/candidates/${id}`);
                      setCandidate(res.data);
                    } catch {}
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                >
                  Approve
                </button>
                <button
                  onClick={async () => {
                    try {
                      await api.post('/approvals', {
                        candidateId: id,
                        status: 'rejected',
                      });
                      const res = await api.get(`/candidates/${id}`);
                      setCandidate(res.data);
                    } catch {}
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            </div>
          )}
          {candidate.approvals.length === 0 ? (
            <p className="text-slate-500">No approvals yet</p>
          ) : (
            candidate.approvals.map((a) => (
              <div
                key={a.id}
                className="bg-white rounded-lg shadow border border-slate-200 p-6"
              >
                <p><strong>Manager:</strong> {a.manager.name}</p>
                <p><strong>Status:</strong> {statusBadge(a.status)}</p>
                <p><strong>Approved At:</strong> {a.approvedAt ? new Date(a.approvedAt).toLocaleString() : '-'}</p>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500">By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {auditLogs.map((log, idx) => (
                <tr key={log.entityType + log.timestamp + idx}>
                  <td className="px-6 py-4">{log.action}</td>
                  <td className="px-6 py-4">{log.performedBy?.name ?? '-'}</td>
                  <td className="px-6 py-4">{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
