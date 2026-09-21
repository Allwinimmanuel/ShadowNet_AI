import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import {
  UserCheck, AlertTriangle, RefreshCw, Clock,
  CheckCircle, ChevronRight, Activity, Search
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────
const fmt = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
  return d.toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
};

const SEV_STYLE = {
  CRITICAL: 'bg-red-900/40 text-red-300 border-red-700',
  HIGH:     'bg-orange-900/40 text-orange-300 border-orange-700',
  MEDIUM:   'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  LOW:      'bg-blue-900/40 text-blue-300 border-blue-700',
};

const ACTION_CONFIG = {
  ALLOW_LOGIN: { label: 'Allowed', cls: 'bg-green-900/40 text-green-300 border-green-700' },
  DENY_CREDENTIALS: { label: 'Denied', cls: 'bg-yellow-900/40 text-yellow-300 border-yellow-700' },
  FLAG_SUSPICIOUS: { label: 'Flagged', cls: 'bg-orange-900/40 text-orange-300 border-orange-700' },
  LOCK_ACCOUNT: { label: 'Account Locked', cls: 'bg-red-900/40 text-red-300 border-red-700' },
  BLOCK_IP: { label: 'IP Blocked', cls: 'bg-red-900/40 text-red-300 border-red-700' },
  BLOCK_AND_VERIFY: { label: 'Blocked / Verify', cls: 'bg-red-900/40 text-red-300 border-red-700' },
};

const Badge = ({ cfg, value }) => {
  const c = cfg[value];
  return c
    ? <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${c.cls}`}>{c.label}</span>
    : <span className="px-2 py-0.5 rounded text-xs border bg-slate-800 text-slate-400 border-slate-700">{value || '—'}</span>;
};

// ── Anomaly Card ─────────────────────────────────────────────────────────
const AnomalyCard = ({ a, onSelect, active }) => (
  <div
    onClick={() => onSelect(a.user_id)}
    className={`cursor-pointer rounded-xl border p-4 transition-all hover:border-orange-600 ${
      active ? 'border-orange-500 bg-orange-900/10' : 'border-slate-700 bg-slate-800/60'
    }`}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0" />
        <span className="font-semibold text-slate-200">{a.user_id}</span>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${SEV_STYLE[a.severity] || SEV_STYLE.LOW}`}>
        {a.severity}
      </span>
    </div>
    <div className="mt-2 flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-orange-500" style={{ width: `${a.anomaly_score}%` }} />
      </div>
      <span className="text-xs font-bold text-orange-300 tabular-nums w-12 text-right">
        {a.anomaly_score}% deviation
      </span>
    </div>
    {a.explanations?.length > 0 && (
      <ul className="mt-2 space-y-0.5">
        {a.explanations.slice(0, 2).map((e, i) => (
          <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
            <ChevronRight className="w-3 h-3 text-orange-400 mt-0.5 flex-shrink-0" /> {e}
          </li>
        ))}
        {a.explanations.length > 2 && (
          <li className="text-xs text-slate-600">+{a.explanations.length - 2} more…</li>
        )}
      </ul>
    )}
  </div>
);

// ── User Detail Panel ─────────────────────────────────────────────────────
const UserDetail = ({ userId, onClose }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/ueba/user/${userId}`)
      .then(r => setReport(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex justify-center py-12">
      <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
    </div>
  );
  if (!report) return null;

  const { baseline, recent_events = [], summary, max_anomaly_score, anomaly_severity } = report;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-blue-400" /> UEBA Report: {userId}
        </h3>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-sm">✕ Close</button>
      </div>

      {/* Summary banner */}
      <div className={`rounded-xl p-4 border ${max_anomaly_score >= 50 ? 'bg-orange-900/20 border-orange-700' : 'bg-green-900/20 border-green-800'}`}>
        <p className="text-sm text-slate-300">{summary}</p>
        <div className="flex gap-4 mt-2 text-xs">
          <span className="text-slate-400">Max Anomaly Score: <strong className="text-white">{max_anomaly_score}%</strong></span>
          <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${SEV_STYLE[anomaly_severity] || SEV_STYLE.LOW}`}>{anomaly_severity}</span>
        </div>
      </div>

      {/* Baseline */}
      {baseline && (
        <div>
          <h4 className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Normal Behaviour Baseline</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              { label: 'Typical Hours',   value: `${baseline.typical_hour_range?.start}:00 – ${baseline.typical_hour_range?.end}:00` },
              { label: 'Peak Login Hours',value: baseline.peak_hours?.join(', ') || '—' },
              { label: 'Known IPs',       value: baseline.common_ips?.join(', ') || '—' },
              { label: 'Known Devices',   value: baseline.common_devices?.join(', ') || '—' },
              { label: 'Avg Risk Score',  value: `${baseline.avg_risk}%` },
              { label: 'Success Rate',    value: `${baseline.success_rate}%` },
              { label: 'Sample Size',     value: `${baseline.sample_size} events` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-900/60 rounded-lg p-2.5">
                <p className="text-slate-500 mb-0.5">{label}</p>
                <p className="font-medium text-slate-200 truncate">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent events */}
      <div>
        <h4 className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Recent Events (Last 7 Days)</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-slate-700">
                <th className="text-left py-1.5 pr-3">Time</th>
                <th className="text-left py-1.5 pr-3">IP</th>
                <th className="text-left py-1.5 pr-3">Action</th>
                <th className="text-left py-1.5 pr-3">Risk</th>
                <th className="text-left py-1.5">Anomaly</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {recent_events.map(ev => (
                <tr key={ev.id} className={ev.anomaly_score >= 30 ? 'bg-orange-950/20' : ''}>
                  <td className="py-1.5 pr-3 font-mono whitespace-nowrap text-slate-400">{fmt(ev.timestamp)}</td>
                  <td className="py-1.5 pr-3 font-mono text-slate-300">{ev.ip_address}</td>
                  <td className="py-1.5 pr-3">
                    <Badge cfg={ACTION_CONFIG} value={ev.action_taken} />
                  </td>
                  <td className="py-1.5 pr-3 text-slate-300">{ev.risk_score}%</td>
                  <td className="py-1.5">
                    {ev.anomaly_score > 0 ? (
                      <span className={`font-bold ${ev.anomaly_score >= 50 ? 'text-orange-400' : 'text-yellow-400'}`}>
                        {ev.anomaly_score}%
                      </span>
                    ) : (
                      <span className="text-green-500">Normal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────
const UEBADashboard = () => {
  const [anomalies, setAnomalies]     = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [lastRefresh, setLastRefresh]   = useState(null);

  const fetchAnomalies = useCallback(async () => {
    try {
      const data = await api.get('/ueba/anomalies').then(r => r.data);
      setAnomalies(Array.isArray(data) ? data : []);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('UEBA fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnomalies();
    const t = setInterval(fetchAnomalies, 60000);
    return () => clearInterval(t);
  }, [fetchAnomalies]);

  const filtered = anomalies.filter(a => !search || a.user_id.toLowerCase().includes(search.toLowerCase()));
  const critical = anomalies.filter(a => a.severity === 'CRITICAL').length;
  const high     = anomalies.filter(a => a.severity === 'HIGH').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="text-cyan-400 w-6 h-6" /> User Behavior Analytics
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">UEBA — baseline deviation detection · refreshes every 60 s</p>
        </div>
        <div className="flex items-center gap-2">
          {lastRefresh && <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {lastRefresh.toLocaleTimeString()}</span>}
          <button onClick={fetchAnomalies} className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Anomalies', value: anomalies.length, cls: 'border-blue-700 text-blue-300' },
          { label: 'Critical',        value: critical,          cls: 'border-red-700 text-red-300' },
          { label: 'High',            value: high,              cls: 'border-orange-700 text-orange-300' },
        ].map(({ label, value, cls }) => (
          <div key={label} className={`bg-slate-800 border ${cls.split(' ')[0]} rounded-xl p-4 text-center`}>
            <p className={`text-3xl font-bold tabular-nums ${cls.split(' ')[1]}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* How baselines work */}
      <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-4 text-xs text-blue-300">
        <strong>How this works:</strong> Each user's 30-day login history establishes a behavioral baseline (typical hours, IP addresses, devices). The system flags recent activity that deviates significantly from this baseline. Click any card to view the full analysis.
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
        <input
          type="text" placeholder="Filter by user ID…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-blue-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 animate-spin text-blue-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
          <p className="text-sm">No behavioral anomalies detected in the last 24 hours.</p>
          <p className="text-xs mt-1">All users are behaving within their normal baseline patterns.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(a => (
            <AnomalyCard key={a.user_id} a={a}
              onSelect={uid => setSelectedUser(uid === selectedUser ? null : uid)}
              active={selectedUser === a.user_id}
            />
          ))}
        </div>
      )}

      {/* Detail panel */}
      {selectedUser && (
        <UserDetail userId={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  );
};

export default UEBADashboard;
