import React, { useEffect, useState, useCallback } from 'react';
import { historyAPI, dashboardAPI } from '../services/api';
import { History, RefreshCw, Clock, Search, ChevronDown } from 'lucide-react';

// ── Helpers ─────────────────────────────────────────────────────────────
const formatDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
};

const ACTION_CONFIG = {
  ALLOWED: { label: 'Allowed', cls: 'bg-green-900/40 text-green-300 border-green-700' },
  DENIED: { label: 'Denied', cls: 'bg-yellow-900/40 text-yellow-300 border-yellow-700' },
  FLAG_SUSPICIOUS: { label: 'Flagged', cls: 'bg-orange-900/40 text-orange-300 border-orange-700' },
  ACCOUNT_LOCKED: { label: 'Account Locked', cls: 'bg-red-900/40 text-red-300 border-red-700' },
  BLOCK_IP: { label: 'IP Blocked', cls: 'bg-red-900/40 text-red-300 border-red-700' },
  BLOCKED_AND_DENIED: { label: 'Blocked / Denied', cls: 'bg-red-900/40 text-red-300 border-red-700' },
};

const PREDICTION_CONFIG = {
  NORMAL: { label: 'NORMAL', cls: 'bg-green-900/40 text-green-300 border-green-700' },
  SUSPICIOUS: { label: 'SUSPICIOUS', cls: 'bg-orange-900/40 text-orange-300 border-orange-700' },
  BRUTE_FORCE: { label: 'BRUTE_FORCE', cls: 'bg-red-900/40 text-red-300 border-red-700' },
  BLOCKED_IP: { label: 'BLOCKED_IP', cls: 'bg-red-900/40 text-red-300 border-red-700' },
};

const ROW_BG = {
  ALLOWED: '',
  DENIED: 'bg-yellow-950/10',
  FLAG_SUSPICIOUS: 'bg-orange-950/10',
  ACCOUNT_LOCKED: 'bg-red-950/20',
  BLOCK_IP: 'bg-red-950/20',
  BLOCKED_AND_DENIED: 'bg-red-950/20',
};

const Badge = ({ cfg, value }) => {
  const c = cfg[value];
  return c
    ? <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${c.cls}`}>{c.label}</span>
    : <span className="px-2 py-0.5 rounded text-xs border bg-slate-800 text-slate-400 border-slate-700">{value || '—'}</span>;
};

// ── Main ─────────────────────────────────────────────────────────────────
const LoginHistory = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [stats, setStats] = useState({
    total_attempts: 0,
    allowed_logins: 0,
    denied_logins: 0,
    blocked_logins: 0,
    suspicious_activity: 0
  });
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');
  const [filterPrediction, setFilterPrediction] = useState('ALL');

  const fetchHistory = useCallback(async () => {
    try {
      const [data, summary] = await Promise.all([
        historyAPI.getAttempts(),
        dashboardAPI.getSummary()
      ]);
      setAttempts(data);
      setStats(summary);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('LoginHistory fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 10000); // refresh every 10 s
    return () => clearInterval(interval);
  }, [fetchHistory]);

  // ── Filter + search ──────────────────────────────────────────────────
  const filtered = attempts.filter(a => {
    const matchSearch = !search
      || a.user_id?.toLowerCase().includes(search.toLowerCase())
      || a.ip_address?.includes(search);
    const matchAction = filterAction === 'ALL' || a.action_taken === filterAction;
    const matchPred = filterPrediction === 'ALL' || a.prediction === filterPrediction;
    return matchSearch && matchAction && matchPred;
  });

  // ── Stats from unified backend ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <History className="text-blue-400 w-6 h-6" />
            Login History
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">Full audit trail · auto-refreshes every 10 s</p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchHistory}
            className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total_attempts, border: 'border-slate-600', text: 'text-slate-300' },
          { label: 'Allowed', value: stats.allowed_logins, border: 'border-green-700', text: 'text-green-400' },
          { label: 'Denied', value: stats.denied_logins, border: 'border-yellow-700', text: 'text-yellow-400' },
          { label: 'Blocked', value: stats.blocked_logins, border: 'border-red-700', text: 'text-red-400' },
          { label: 'Suspicious', value: stats.suspicious_activity, border: 'border-orange-700', text: 'text-orange-400' },
        ].map(({ label, value, border, text }) => (
          <div key={label} className={`bg-slate-800/60 border ${border} rounded-xl px-4 py-3 text-center`}>
            <p className={`text-2xl font-bold tabular-nums ${text}`}>{value}</p>
            <p className="text-xs text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search user or IP…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>
        {/* Action filter */}
        <div className="relative">
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="appearance-none bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 pr-7 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Actions</option>
            <option value="ALLOWED">Allowed</option>
            <option value="DENIED">Denied</option>
            <option value="FLAG_SUSPICIOUS">Flagged Suspicious</option>
            <option value="ACCOUNT_LOCKED">Account Locked</option>
            <option value="BLOCK_IP">IP Blocked</option>
            <option value="BLOCKED_AND_DENIED">Blocked / Denied</option>
          </select>
          <ChevronDown className="absolute right-2 top-2.5 w-3 h-3 text-slate-400 pointer-events-none" />
        </div>
        {/* Prediction filter */}
        <div className="relative">
          <select
            value={filterPrediction}
            onChange={e => setFilterPrediction(e.target.value)}
            className="appearance-none bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 pr-7 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Predictions</option>
            <option value="NORMAL">Normal</option>
            <option value="SUSPICIOUS">Suspicious</option>
            <option value="BRUTE_FORCE">Brute Force</option>
            <option value="BLOCKED_IP">Blocked IP</option>
          </select>
          <ChevronDown className="absolute right-2 top-2.5 w-3 h-3 text-slate-400 pointer-events-none" />
        </div>
        <span className="text-xs text-slate-500 ml-auto">
          {filtered.length} of {attempts.length} records
        </span>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">IP / Location</th>
                <th className="px-5 py-3">Device</th>
                <th className="px-5 py-3">Prediction</th>
                <th className="px-5 py-3">Risk Score</th>
                <th className="px-5 py-3">Action Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin inline mr-2" /> Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-slate-500">
                    No records match the current filter.
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr
                    key={a.id}
                    className={`hover:bg-slate-700/20 transition-colors ${ROW_BG[a.action_taken] || ''}`}
                  >
                    <td className="px-5 py-3 text-xs text-slate-400 font-mono whitespace-nowrap">
                      {formatDateTime(a.created_at)}
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-200">{a.user_id}</td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs text-slate-300">{a.ip_address}</span>
                      {a.location && (
                        <span className="block text-xs text-slate-500">{a.location}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">{a.device_type || '—'}</td>
                    <td className="px-5 py-3">
                      <Badge cfg={PREDICTION_CONFIG} value={a.prediction} />
                      {a.explanation && (
                        <div className="mt-1 text-xs text-slate-500 italic max-w-[150px] whitespace-normal break-words">
                          {(() => {
                            try {
                              const reasons = JSON.parse(a.explanation);
                              return reasons.length > 0 ? reasons.join(", ") : "Login behavior matches the user's usual pattern.";
                            } catch (e) {
                              return "Login behavior matches the user's usual pattern.";
                            }
                          })()}
                        </div>
                      )}
                      {!a.explanation && a.prediction === "NORMAL" && (
                        <div className="mt-1 text-xs text-slate-500 italic max-w-[150px] whitespace-normal break-words">
                          Login behavior matches the user's usual pattern.
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${a.risk_score > 70 ? 'bg-red-500' : a.risk_score > 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(100, Math.max(0, a.risk_score || 0))}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-300 tabular-nums w-8">
                          {Number(a.risk_score || 0).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge cfg={ACTION_CONFIG} value={a.action_taken} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {lastRefresh && (
          <div className="px-5 py-2 bg-slate-900/40 border-t border-slate-700 text-xs text-slate-600 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Last updated {lastRefresh.toLocaleTimeString()} · auto-refreshes every 10 s
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginHistory;
