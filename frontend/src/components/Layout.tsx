import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const navItems = [
  { path: '/overview', label: 'Overview', icon: HomeIcon },
  { path: '/team', label: 'My Team', icon: TeamIcon },
  { path: '/leave', label: 'My Leave', icon: LeaveIcon },
  { path: '/attendance', label: 'My Attendance', icon: AttendanceIcon },
  { path: '/performance', label: 'My Performance', icon: PerfIcon },
  { path: '/tasks', label: 'My Task Management', icon: TaskIcon },
  { path: '/exit', label: 'My Exit', icon: ExitIcon },
  { path: '/alerts', label: 'Alerts', icon: BellIcon },
  { path: '/calendar', label: 'My Calendar', icon: CalendarIcon },
  { path: '/people', label: 'People', icon: PeopleIcon },
  { path: '/knowledge-base', label: 'Knowledge Base', icon: BookIcon },
];

function ClipboardCheckIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

const hrNavItems = [
  { path: '/ta-hub', label: 'TA Hub', icon: BriefcaseIcon },
  { path: '/job-requisitions', label: 'Job Requisitions', icon: BriefcaseIcon },
  { path: '/candidates', label: 'Candidates', icon: UserPlusIcon },
  { path: '/assessments', label: 'Assessments', icon: ClipboardCheckIcon },
  { path: '/policies', label: 'Policies', icon: ShieldIcon },
  { path: '/drafts', label: 'Draft Assistant', icon: FileEditIcon },
  { path: '/audit', label: 'Audit Log', icon: FileTextIcon },
];

const recruiterNavItems = [
  { path: '/ta-hub', label: 'TA Hub', icon: BriefcaseIcon },
  { path: '/job-requisitions', label: 'Job Requisitions', icon: BriefcaseIcon },
  { path: '/candidates', label: 'Candidates', icon: UserPlusIcon },
  { path: '/assessments', label: 'Assessments', icon: ClipboardCheckIcon },
  { path: '/policies', label: 'Policies', icon: ShieldIcon },
  { path: '/drafts', label: 'Draft Assistant', icon: FileEditIcon },
  { path: '/audit', label: 'Audit Log', icon: FileTextIcon },
  { path: '/people', label: 'People', icon: PeopleIcon },
  { path: '/knowledge-base', label: 'Knowledge Base', icon: BookIcon },
  { path: '/hr-data', label: 'HR Data', icon: FileTextIcon },
];

function HomeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}
function TeamIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}
function LeaveIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
function AttendanceIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}
function PerfIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
  );
}
function TaskIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}
function ExitIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
function PeopleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}
function BookIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}
function BriefcaseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}
function UserPlusIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
function FileEditIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}
function FileTextIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  useEffect(() => {
    api.get('/alerts/me').then((r) => setUnreadAlerts((r.data || []).filter((a: { readAt: string | null }) => !a.readAt).length)).catch(() => setUnreadAlerts(0));
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/people?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const isRecruiter = user?.role === 'recruiter';
  const recruiterBlockedPaths = ['/overview', '/team', '/leave', '/attendance', '/performance', '/tasks', '/exit', '/alerts', '/calendar', '/manager-dashboard', '/admin'];
  const isOnBlockedPath = recruiterBlockedPaths.some(
    (p) => location.pathname === p || location.pathname.startsWith(p + '/')
  );
  if (isRecruiter && isOnBlockedPath) {
    return <Navigate to="/ta-hub" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-700">
          <Link to={isRecruiter ? '/ta-hub' : '/overview'} className="text-xl font-semibold text-white">
            HIREFLOW
          </Link>
          <p className="text-xs text-slate-400 mt-0.5">{isRecruiter ? 'Talent Acquisition' : 'HRMS'}</p>
        </div>
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.role}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {isRecruiter ? (
            <>
              <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Talent Acquisition
              </p>
              {recruiterNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm ${
                    isActive(item.path) ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon />
                  {item.label}
                </Link>
              ))}
            </>
          ) : (
            <>
              <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Employee
              </p>
              {(user?.role === 'manager' || user?.role === 'admin' || user?.role === 'admin_hr') && (
                <Link
                  to="/manager-dashboard"
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm ${
                    isActive('/manager-dashboard') ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <BriefcaseIcon />
                  Manager Dashboard
                </Link>
              )}
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm ${
                    isActive(item.path) ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon />
                  {item.label}
                </Link>
              ))}
              {user?.role !== 'employee' && (
                <>
                  <p className="px-4 py-2 mt-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Recruitment
                  </p>
                  {hrNavItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm ${
                        isActive(item.path) ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <item.icon />
                      {item.label}
                    </Link>
                  ))}
                </>
              )}
              {(user?.role === 'admin' || user?.role === 'admin_hr') && (
                <>
                  <Link
                    to="/admin"
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm mt-2 ${
                      isActive('/admin') ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <SettingsIcon />
                    Admin
                  </Link>
                  <Link
                    to="/hr-data"
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm ${
                      isActive('/hr-data') ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <FileTextIcon />
                    HR Data
                  </Link>
                </>
              )}
            </>
          )}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <input
              type="search"
              placeholder="Search by name, department or location"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-80 px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
            <button type="submit" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md">Search</button>
          </form>
          <div className="flex items-center gap-4">
            {!isRecruiter && (
            <Link to="/alerts" className="relative p-2 text-slate-500 hover:text-slate-700">
              <BellIcon />
              {unreadAlerts > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-violet-600 text-white text-xs font-medium">
                  {unreadAlerts > 99 ? '99+' : unreadAlerts}
                </span>
              )}
            </Link>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">{user?.name}</span>
              <span className="px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-600">{user?.role}</span>
              <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-slate-700">
                Logout
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
