import { useState, useEffect } from 'react';
import { AlertTriangle, ShieldCheck, Cpu } from 'lucide-react';

export const SecurityLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:8000/api/logs?limit=50')
      .then(res => res.json())
      .then(data => setLogs(data))
      .catch(err => console.error("Error fetching logs:", err));
  }, []);

  return (
    <div className="p-8 h-full flex flex-col gap-6 overflow-y-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold glow-text mb-2">Security Logs</h1>
          <p className="text-gray-400">Real-time event streams with AI anomaly detection.</p>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-surface/50 text-gray-300 border-b border-gray-800 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Timestamp</th>
                <th className="px-6 py-4 font-semibold tracking-wider">User</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Event</th>
                <th className="px-6 py-4 font-semibold tracking-wider">IP Address</th>
                <th className="px-6 py-4 font-semibold tracking-wider">AI Risk Score</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50 bg-background/30">
              {logs.map((log, i) => (
                <tr key={i} className="hover:bg-surface/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-xs">
                        {log.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-gray-300 font-medium">{log.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-surface rounded text-gray-300 border border-gray-700">
                      {log.event_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-500">{log.ip_address}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-800 rounded-full h-1.5 max-w-[100px]">
                        <div 
                          className={`h-1.5 rounded-full ${log.risk_score > 70 ? 'bg-danger' : log.risk_score > 30 ? 'bg-warning' : 'bg-primary'}`} 
                          style={{ width: `${log.risk_score}%` }}
                        ></div>
                      </div>
                      <span className={log.risk_score > 70 ? 'text-danger font-bold' : 'text-gray-400'}>
                        {log.risk_score.toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {log.risk_score > 70 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-danger/10 text-danger border border-danger/20">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Anomalous
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Normal
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Cpu className="w-8 h-8 text-gray-600 animate-pulse" />
                      <p>Initializing connection to data streams...</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
