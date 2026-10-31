import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { LoadingState } from '../../components/ui/LoadingState.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { formatDate } from '../../lib/utils.js';
import { History, ShieldCheck, RefreshCw } from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<any>('/admin/audit-logs', { page, pageSize: 25 });
      setLogs(Array.isArray(res) ? res : res.logs || []);
      setTotal(res?.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Security Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable log of grading actions, user provisioning, course assignments, and resource deletions
          </p>
        </div>

        <button
          type="button"
          onClick={loadLogs}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Log
        </button>
      </div>

      {isLoading ? (
        <LoadingState message="Loading security audit records..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadLogs} />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No audit records logged yet"
          description="Administrative mutations and faculty grading operations will appear here."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Log ID</th>
                  <th className="px-5 py-3.5">Action Event</th>
                  <th className="px-5 py-3.5">Entity</th>
                  <th className="px-5 py-3.5">Entity UUID</th>
                  <th className="px-5 py-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-slate-400">#{log.id}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 font-sans">{log.action}</td>
                    <td className="px-5 py-3.5 text-brand-700 uppercase">{log.entity}</td>
                    <td className="px-5 py-3.5 text-slate-500">{log.entityId || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-400 font-sans">{formatDate(log.at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
