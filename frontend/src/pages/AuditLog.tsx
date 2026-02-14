import { useEffect, useState } from 'react';
import api from '../lib/api';

interface Log {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: { name: string; email: string } | null;
  timestamp: string;
  metadata: Record<string, unknown> | null;
}

export default function AuditLog() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [entityType, setEntityType] = useState('');
  const [entityId, setEntityId] = useState('');

  useEffect(() => {
    const params: Record<string, string> = {};
    if (entityType) params.entityType = entityType;
    if (entityId) params.entityId = entityId;
    api
      .get('/audit', { params })
      .then((res) => setLogs(res.data.data))
      .catch(() => setError('Failed to load audit log'))
      .finally(() => setLoading(false));
  }, [entityType, entityId]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const params: Record<string, string> = {};
    if (entityType) params.entityType = entityType;
    if (entityId) params.entityId = entityId;
    api
      .get('/audit', { params })
      .then((res) => setLogs(res.data.data))
      .catch(() => setError('Failed to load audit log'))
      .finally(() => setLoading(false));
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Audit Log</h1>

      <form onSubmit={handleFilter} className="mb-6 flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Entity Type"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-md"
        />
        <input
          type="text"
          placeholder="Entity ID"
          value={entityId}
          onChange={(e) => setEntityId(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-md"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800"
        >
          Filter
        </button>
      </form>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500">Entity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500">By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {log.entityType} / {log.entityId.slice(0, 8)}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{log.action}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {log.performedBy?.name ?? '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
