import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface Shift {
  id: string;
  name: string;
  inTime: string;
  outTime: string;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface UserDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  isActive: boolean;
  employeeId: string | null;
  managerId: string | null;
  designation: string | null;
  location: string | null;
  joiningDate: string | null;
  birthday: string | null;
  organization: string | null;
  avatarUrl: string | null;
  assignedShiftId: string | null;
  manager?: { id: string; name: string; email: string } | null;
  assignedShift?: { id: string; name: string; inTime: string; outTime: string } | null;
}

const ROLE_OPTIONS = [
  { value: 'employee', label: 'Employee' },
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'interviewer', label: 'Interviewer' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin_hr', label: 'Admin HR' },
  { value: 'admin', label: 'Super Admin' },
];

function toDateInputValue(d: string | null): string {
  if (!d) return '';
  const date = new Date(d);
  return date.toISOString().slice(0, 10);
}

export default function UserEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [managers, setManagers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isSuperAdmin = currentUser?.role === 'admin';

  const [form, setForm] = useState({
    name: '',
    email: '',
    department: '',
    role: 'employee',
    isActive: true,
    employeeId: '',
    managerId: '',
    designation: '',
    location: '',
    joiningDate: '',
    birthday: '',
    organization: '',
    avatarUrl: '',
    assignedShiftId: '',
  });

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/users/${id}`),
      api.get('/attendance/shifts').catch(() => ({ data: [] })),
      api.get('/users').then((r) => r.data.data || []),
    ])
      .then(([userRes, shiftsRes, usersList]) => {
        const u = userRes.data as UserDetail;
        setUser(u);
        setForm({
          name: u.name,
          email: u.email,
          department: u.department,
          role: u.role,
          isActive: u.isActive,
          employeeId: u.employeeId || '',
          managerId: u.managerId || '',
          designation: u.designation || '',
          location: u.location || '',
          joiningDate: toDateInputValue(u.joiningDate),
          birthday: toDateInputValue(u.birthday),
          organization: u.organization || '',
          avatarUrl: u.avatarUrl || '',
          assignedShiftId: u.assignedShiftId || '',
        });
        setShifts(Array.isArray(shiftsRes.data) ? shiftsRes.data : []);
        setManagers(usersList.filter((x: UserOption) => x.id !== u.id));
      })
      .catch(() => setError('Failed to load user'))
      .finally(() => setLoading(false));
  }, [id]);

  const update = (key: keyof typeof form, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        department: form.department,
        isActive: form.isActive,
        employeeId: form.employeeId || undefined,
        managerId: form.managerId || undefined,
        designation: form.designation || undefined,
        location: form.location || undefined,
        joiningDate: form.joiningDate || undefined,
        birthday: form.birthday || undefined,
        organization: form.organization || undefined,
        avatarUrl: form.avatarUrl || undefined,
        assignedShiftId: form.assignedShiftId || undefined,
      };
      if (isSuperAdmin) {
        payload.role = form.role;
      }
      await api.put(`/users/${id}`, payload);
      navigate('/admin');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
      </div>
    );
  }
  if (error && !user) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        {error}
        <Link to="/admin" className="block mt-2 text-sm underline">Back to Admin</Link>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/admin" className="text-slate-600 hover:text-slate-900 text-sm font-medium">← Back to Admin</Link>
        <h1 className="text-2xl font-bold text-slate-900">Edit User</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow border border-slate-200 p-6 max-w-2xl space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input value={form.name} onChange={(e) => update('name', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-md" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-md" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
            <input value={form.department} onChange={(e) => update('department', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-md" required />
          </div>
          {isSuperAdmin && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select value={form.role} onChange={(e) => update('role', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-md">
                  {ROLE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select value={form.isActive ? 'active' : 'inactive'} onChange={(e) => update('isActive', e.target.value === 'active')} className="w-full px-4 py-2 border border-slate-300 rounded-md">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Employee ID</label>
            <input value={form.employeeId} onChange={(e) => update('employeeId', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Manager</label>
            <select value={form.managerId} onChange={(e) => update('managerId', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-md">
              <option value="">— None —</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Designation</label>
            <input value={form.designation} onChange={(e) => update('designation', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
            <input value={form.location} onChange={(e) => update('location', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Joining Date</label>
            <input type="date" value={form.joiningDate} onChange={(e) => update('joiningDate', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Birthday</label>
            <input type="date" value={form.birthday} onChange={(e) => update('birthday', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Organization</label>
            <input value={form.organization} onChange={(e) => update('organization', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Shift</label>
            <select value={form.assignedShiftId} onChange={(e) => update('assignedShiftId', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-md">
              <option value="">— None —</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.inTime}–{s.outTime})</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Avatar URL</label>
            <input value={form.avatarUrl} onChange={(e) => update('avatarUrl', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-md" placeholder="https://..." />
          </div>
        </div>
        <div className="flex gap-4">
          <button type="submit" disabled={saving} className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
          <Link to="/admin" className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
