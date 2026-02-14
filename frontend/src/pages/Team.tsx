import { useEffect, useState } from 'react';
import api from '../lib/api';

type Tab = 'overview' | 'members' | 'attendance' | 'leave' | 'performance' | 'tasks';

interface TeamMe {
  manager: { id: string; name: string; email: string; designation: string | null; department: string } | null;
  directReports: { id: string; name: string; email: string; designation: string | null; department: string; location: string | null; employeeId: string | null }[];
  hierarchy: { id: string; name: string; directReportsCount: number }[];
}

interface TeamOverview {
  teamSize: number;
  attendancePercent: number;
  avgWorkingHours: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  employeeId: string | null;
  designation: string | null;
  department: string;
  location: string | null;
  isActive: boolean;
}

export default function Team() {
  const [tab, setTab] = useState<Tab>('overview');
  const [teamMe, setTeamMe] = useState<TeamMe | null>(null);
  const [overview, setOverview] = useState<TeamOverview | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ department: '', designation: '' });

  useEffect(() => {
    api.get('/team/me').then((r) => setTeamMe(r.data)).catch(() => setTeamMe(null)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'overview') api.get('/team/overview').then((r) => setOverview(r.data)).catch(() => setOverview(null));
    if (tab === 'members') {
      const params = new URLSearchParams();
      if (filters.department) params.set('department', filters.department);
      if (filters.designation) params.set('designation', filters.designation);
      api.get(`/team/members?${params}`).then((r) => setMembers(r.data)).catch(() => setMembers([]));
    }
  }, [tab, filters.department, filters.designation]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'members', label: 'Members' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'leave', label: 'Leave' },
    { id: 'performance', label: 'Performance' },
    { id: 'tasks', label: 'Tasks' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Team</h1>

      <div className="flex gap-2 border-b border-slate-200 mb-6 flex-wrap">
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

      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-slate-500 text-sm">Team size</p>
              <p className="text-2xl font-semibold text-slate-900">{overview?.teamSize ?? 0}</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-slate-500 text-sm">Attendance % (this month)</p>
              <p className="text-2xl font-semibold text-slate-900">{overview?.attendancePercent ?? 0}%</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-slate-500 text-sm">Avg working hours</p>
              <p className="text-2xl font-semibold text-slate-900">{overview?.avgWorkingHours ?? '-'}</p>
            </div>
          </div>
          {teamMe && (
            <div className="space-y-4">
              {teamMe.manager && (
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-slate-500 text-sm mb-1">My manager</p>
                  <p className="font-medium text-slate-900">{teamMe.manager.name}</p>
                  <p className="text-sm text-slate-600">{teamMe.manager.designation} · {teamMe.manager.department}</p>
                </div>
              )}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-slate-500 text-sm mb-2">Direct reports</p>
                {teamMe.directReports.length === 0 ? (
                  <p className="text-slate-500 text-sm">No direct reports.</p>
                ) : (
                  <ul className="space-y-2">
                    {teamMe.directReports.map((r) => (
                      <li key={r.id} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                        <span className="font-medium text-slate-800">{r.name}</span>
                        <span className="text-sm text-slate-500">{r.designation ?? '-'} · {r.department}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'members' && (
        <>
          <div className="flex flex-wrap gap-3 mb-4">
            <input
              placeholder="Department"
              value={filters.department}
              onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-40"
            />
            <input
              placeholder="Designation"
              value={filters.designation}
              onChange={(e) => setFilters((f) => ({ ...f, designation: e.target.value }))}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-40"
            />
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-3 font-medium text-slate-700">Name</th>
                  <th className="text-left p-3 font-medium text-slate-700">Employee ID</th>
                  <th className="text-left p-3 font-medium text-slate-700">Designation</th>
                  <th className="text-left p-3 font-medium text-slate-700">Department</th>
                  <th className="text-left p-3 font-medium text-slate-700">Location</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-slate-500">No team members.</td></tr>
                ) : (
                  members.map((m) => (
                    <tr key={m.id} className="border-b border-slate-100">
                      <td className="p-3 font-medium">{m.name}</td>
                      <td className="p-3">{m.employeeId ?? '-'}</td>
                      <td className="p-3">{m.designation ?? '-'}</td>
                      <td className="p-3">{m.department}</td>
                      <td className="p-3">{m.location ?? '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {(tab === 'attendance' || tab === 'leave' || tab === 'performance' || tab === 'tasks') && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-slate-600">Team-level {tab} view can be expanded here (e.g. team attendance summary, team leave calendar).</p>
        </div>
      )}
    </div>
  );
}
