import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../lib/api';

interface Person {
  id: string;
  name: string;
  email: string;
  employeeId: string | null;
  designation: string | null;
  department: string;
  location: string | null;
}

export default function People() {
  const [searchParams] = useSearchParams();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [department, setDepartment] = useState(() => searchParams.get('department') || '');
  const [location, setLocation] = useState(() => searchParams.get('location') || '');

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setDepartment(searchParams.get('department') || '');
    setLocation(searchParams.get('location') || '');
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (department) params.set('department', department);
    if (location) params.set('location', location);
    api.get(`/people?${params}`).then((r) => setPeople(r.data)).catch(() => setPeople([])).finally(() => setLoading(false));
  }, [search, department, location]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">People</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="search"
          placeholder="Search by name, email or employee ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
        <input
          placeholder="Department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-40"
        />
        <input
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-40"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {people.length === 0 ? (
            <p className="col-span-full text-center text-slate-500 py-8">No people found.</p>
          ) : (
            people.map((p) => (
              <Link key={p.id} to={`/people/${p.id}`} className="block">
                <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-violet-300 transition-all cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-semibold text-sm mb-3">{p.name.charAt(0)}</div>
                  <p className="font-medium text-slate-900">{p.name}</p>
                  <p className="text-sm text-slate-500 truncate">{p.email}</p>
                  <p className="text-sm text-slate-600 mt-1">{p.designation ?? '-'} · {p.department}</p>
                  {p.location && <p className="text-xs text-slate-500 mt-0.5">{p.location}</p>}
                  <p className="text-xs text-violet-600 mt-2">View 360 →</p>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
