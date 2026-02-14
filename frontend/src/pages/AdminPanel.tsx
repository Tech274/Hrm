import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  isActive: boolean;
  createdAt: string;
  employeeId?: string | null;
  designation?: string | null;
  location?: string | null;
}

const roleLabel: Record<string, string> = {
  admin: 'Super Admin',
  admin_hr: 'Admin HR',
  employee: 'Employee',
  manager: 'Manager',
  recruiter: 'Recruiter',
  interviewer: 'Interviewer',
};

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/users')
      .then((res) => setUsers(res.data.data))
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Admin Panel</h1>

      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap">{u.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{u.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-0.5 rounded text-xs bg-slate-100">{roleLabel[u.role] ?? u.role}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{u.department}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-sm">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    to={`/admin/users/${u.id}`}
                    className="text-violet-600 hover:text-violet-800 text-sm font-medium"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
