import { useEffect, useState } from 'react';
import api from '../lib/api';

interface CalEvent {
  date: string;
  type: string;
  title: string;
}

export default function Calendar() {
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ my_leave: true, team_leave: true, holiday: true, week_off: true });

  useEffect(() => {
    setLoading(true);
    api.get(`/calendar/events?month=${month}&year=${year}`).then((r) => setEvents(r.data.events || [])).catch(() => setEvents([])).finally(() => setLoading(false));
  }, [month, year]);

  const filtered = events.filter((e) => filters[e.type as keyof typeof filters] !== false);
  const byDate: Record<string, CalEvent[]> = {};
  filtered.forEach((e) => {
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  });

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  const days: { date: Date; isCurrentMonth: boolean }[] = [];
  const firstDay = start.getDay();
  const pad = firstDay === 0 ? 6 : firstDay - 1;
  for (let i = 0; i < pad; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() - (pad - i));
    days.push({ date: d, isCurrentMonth: false });
  }
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) days.push({ date: new Date(d), isCurrentMonth: true });
  const remainder = 42 - days.length;
  for (let i = 0; i < remainder; i++) {
    const d = new Date(end);
    d.setDate(d.getDate() + i + 1);
    days.push({ date: d, isCurrentMonth: false });
  }

  const prev = () => {
    if (month === 1) setMonth(12), setYear((y) => y - 1);
    else setMonth((m) => m - 1);
  };
  const next = () => {
    if (month === 12) setMonth(1), setYear((y) => y + 1);
    else setMonth((m) => m + 1);
  };

  const typeColor: Record<string, string> = { my_leave: 'bg-violet-100 text-violet-800', team_leave: 'bg-blue-100 text-blue-800', holiday: 'bg-amber-100 text-amber-800', week_off: 'bg-slate-100 text-slate-600' };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Calendar</h1>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button onClick={prev} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50">←</button>
          <span className="font-semibold text-slate-800 min-w-[140px] text-center">{new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
          <button onClick={next} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50">→</button>
        </div>
        <div className="flex flex-wrap gap-3 ml-4">
          {(['my_leave', 'team_leave', 'holiday', 'week_off'] as const).map((key) => (
            <label key={key} className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" checked={filters[key]} onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.checked }))} className="rounded border-slate-300" />
              <span className="capitalize">{key.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-7 text-sm font-medium text-slate-600 border-b border-slate-200">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="p-2 text-center">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 auto-rows-fr min-h-[80px]">
            {days.map(({ date, isCurrentMonth }, i) => {
              const key = date.toISOString().slice(0, 10);
              const dayEvents = byDate[key] || [];
              return (
                <div key={i} className={`border-b border-r border-slate-100 p-2 ${!isCurrentMonth ? 'bg-slate-50' : ''}`}>
                  <p className={`text-sm font-medium ${isCurrentMonth ? 'text-slate-900' : 'text-slate-400'}`}>{date.getDate()}</p>
                  <ul className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 3).map((e, j) => (
                      <li key={j} className={`text-xs px-1.5 py-0.5 rounded truncate ${typeColor[e.type] || 'bg-slate-100'}`} title={e.title}>{e.title}</li>
                    ))}
                    {dayEvents.length > 3 && <li className="text-xs text-slate-500">+{dayEvents.length - 3} more</li>}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
