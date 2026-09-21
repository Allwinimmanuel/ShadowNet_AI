import React, { useEffect, useState } from 'react';
import { auditAPI } from '../services/api';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await auditAPI.getLogs();
        setLogs(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) return <div className="p-6 text-slate-300">Loading audit logs...</div>;
  if (error) return <div className="p-6 text-red-400">Error: {error}</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Audit Logs</h2>
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-900 border-b border-slate-700 text-slate-400">
            <tr>
              <th className="p-4 font-semibold text-sm">Time</th>
              <th className="p-4 font-semibold text-sm">Admin ID</th>
              <th className="p-4 font-semibold text-sm">Action</th>
              <th className="p-4 font-semibold text-sm">Target</th>
              <th className="p-4 font-semibold text-sm">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {logs.length === 0 ? (
              <tr><td colSpan="5" className="p-4 text-center text-slate-500">No audit logs found.</td></tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="text-slate-300 hover:bg-slate-750">
                  <td className="p-4 text-sm">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="p-4 text-sm font-medium">{log.admin_id || 'System'}</td>
                  <td className="p-4 text-sm"><span className="px-2 py-1 bg-blue-900/50 text-blue-400 rounded-md text-xs">{log.action}</span></td>
                  <td className="p-4 text-sm">{log.target_entity}</td>
                  <td className="p-4 text-sm">{log.description}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogs;
