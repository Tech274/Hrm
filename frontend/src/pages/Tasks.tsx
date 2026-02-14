import { useEffect, useState } from 'react';
import api from '../lib/api';

type View = 'week' | 'status';
type TaskStatus = 'not_started' | 'on_going' | 'done';

interface Task {
  id: string;
  title: string;
  dueDate: string;
  status: TaskStatus;
  assignedBy: { id: string; name: string } | null;
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [byStatus, setByStatus] = useState<{ not_started: Task[]; on_going: Task[]; done: Task[] } | null>(null);
  const [weekStart, setWeekStart] = useState<Date | null>(null);
  const [weekEnd, setWeekEnd] = useState<Date | null>(null);
  const [view, setView] = useState<View>('week');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', dueDate: new Date().toISOString().slice(0, 10) });
  const [submitting, setSubmitting] = useState(false);

  const load = (viewParam?: View, week?: string) => {
    setLoading(true);
    const v = viewParam ?? view;
    const q = v === 'status' ? '&view=status' : '';
    const w = week ?? weekStart ? weekStart.toISOString().slice(0, 10) : '';
    api.get(`/tasks/me?week=${w}${q}`).then((r) => {
      const t = r.data.tasks;
      if (Array.isArray(t)) {
        setTasks(t);
        setByStatus(null);
      } else {
        setTasks([]);
        setByStatus(t && (t.not_started || t.on_going || t.done) ? t : null);
      }
      setWeekStart(r.data.weekStart ? new Date(r.data.weekStart) : null);
      setWeekEnd(r.data.weekEnd ? new Date(r.data.weekEnd) : null);
    }).catch(() => { setTasks([]); setByStatus(null); }).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [view]);

  const changeWeek = (delta: number) => {
    const base = weekStart || new Date();
    const next = new Date(base);
    next.setDate(next.getDate() + delta * 7);
    load(view, next.toISOString().slice(0, 10));
  };

  const addTask = () => {
    if (!newTask.title.trim()) return;
    setSubmitting(true);
    api.post('/tasks', { title: newTask.title, dueDate: newTask.dueDate })
      .then(() => { setShowAdd(false); setNewTask({ title: '', dueDate: new Date().toISOString().slice(0, 10) }); load(); })
      .finally(() => setSubmitting(false));
  };

  const updateStatus = (id: string, status: TaskStatus) => {
    api.patch(`/tasks/${id}`, { status }).then(() => load());
  };

  const deleteTask = (id: string) => {
    if (!confirm('Delete this task?')) return;
    api.delete(`/tasks/${id}`).then(() => load());
  };

  const displayTasks = byStatus ? [...(byStatus.not_started || []), ...(byStatus.on_going || []), ...(byStatus.done || [])] : tasks;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Task Management</h1>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex gap-2">
          <button onClick={() => setView('week')} className={`px-3 py-1.5 text-sm font-medium rounded-lg ${view === 'week' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Week</button>
          <button onClick={() => setView('status')} className={`px-3 py-1.5 text-sm font-medium rounded-lg ${view === 'status' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Status</button>
        </div>
        {view === 'week' && weekStart && (
          <div className="flex items-center gap-2">
            <button onClick={() => changeWeek(-1)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50">←</button>
            <span className="text-sm font-medium text-slate-700">
              {weekStart.toLocaleDateString()} – {weekEnd?.toLocaleDateString()}
            </span>
            <button onClick={() => changeWeek(1)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50">→</button>
          </div>
        )}
        <button onClick={() => setShowAdd(true)} className="ml-auto px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 text-sm">Add task</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" /></div>
      ) : view === 'status' && byStatus ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['not_started', 'on_going', 'done'] as const).map((status) => (
            <div key={status} className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-800 mb-3 capitalize">{status.replace('_', ' ')}</h3>
              <ul className="space-y-2">
                {(byStatus[status] || []).map((t) => (
                  <li key={t.id} className="bg-white rounded-lg p-3 border border-slate-200">
                    <p className="font-medium text-slate-900 text-sm">{t.title}</p>
                    <p className="text-xs text-slate-500">{new Date(t.dueDate).toLocaleDateString()} · {t.assignedBy?.name ?? 'Self'}</p>
                    <div className="flex gap-1 mt-2">
                      {(['not_started', 'on_going', 'done'] as const).filter((s) => s !== t.status).map((s) => (
                        <button key={s} onClick={() => updateStatus(t.id, s)} className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">{s.replace('_', ' ')}</button>
                      ))}
                      <button onClick={() => deleteTask(t.id)} className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100">Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-3 font-medium text-slate-700">Title</th>
                <th className="text-left p-3 font-medium text-slate-700">Due date</th>
                <th className="text-left p-3 font-medium text-slate-700">Status</th>
                <th className="text-left p-3 font-medium text-slate-700">Assigned by</th>
                <th className="text-left p-3 font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayTasks.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-slate-500">No tasks for this week.</td></tr>
              ) : (
                displayTasks.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100">
                    <td className="p-3 font-medium">{t.title}</td>
                    <td className="p-3">{new Date(t.dueDate).toLocaleDateString()}</td>
                    <td className="p-3">
                      <select value={t.status} onChange={(e) => updateStatus(t.id, e.target.value as TaskStatus)} className="border border-slate-200 rounded px-2 py-1 text-xs">
                        <option value="not_started">Not started</option>
                        <option value="on_going">On going</option>
                        <option value="done">Done</option>
                      </select>
                    </td>
                    <td className="p-3">{t.assignedBy?.name ?? 'Self'}</td>
                    <td className="p-3"><button onClick={() => deleteTask(t.id)} className="text-red-600 text-xs hover:underline">Delete</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add task</h3>
            <input type="text" placeholder="Title" value={newTask.title} onChange={(e) => setNewTask((f) => ({ ...f, title: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-3" />
            <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask((f) => ({ ...f, dueDate: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4" />
            <div className="flex gap-2">
              <button onClick={addTask} disabled={submitting || !newTask.title.trim()} className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium disabled:opacity-50">Add</button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
