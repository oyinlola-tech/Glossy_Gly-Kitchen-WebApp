import React, { useEffect, useState } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { apiService } from '../../services/api';
import { toast } from 'sonner';

interface AuditLogRow {
  id: string;
  action: string;
  method: string;
  path: string;
  status_code: number;
  ip_address: string;
  created_at: string;
}

export const AuditLogs: React.FC = () => {
  const { token } = useAdminAuth();
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        const response = await apiService.getAuditLogs(token);
        setLogs(response);
      } catch (error: any) {
        toast.error(error.message || 'Failed to load audit logs');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-1">Audit Logs</h2>
        <p className="text-slate-600">Administrative activity and API traces.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-slate-700">Time</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-700">Action</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-700">Request</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-700">Status</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-700">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-slate-600">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4">{log.action || '-'}</td>
                  <td className="px-6 py-4 font-mono text-xs">{`${log.method || '-'} ${log.path || '-'}`}</td>
                  <td className="px-6 py-4">{log.status_code || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">{log.ip_address || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {logs.length === 0 && (
        <div className="text-center py-10 text-slate-500">No audit logs found.</div>
      )}
    </div>
  );
};
