import React, { useEffect, useState, useCallback } from 'react';
import { historyAPI } from '../services/api';
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
  ALLOW_LOGIN:      { label: 'Allowed',          cls: 'bg-green-900/40 text-green-300 border-green-700'   },
  DENY_CREDENTIALS: { label: 'Denied',           cls: 'bg-yellow-900/40 text-yellow-300 border-yellow-700' },
  LOCK_ACCOUNT:     { label: 'Account Locked',   cls: 'bg-red-900/40 text-red-300 border-red-700'         },
  BLOCK_IP:         { label: 'IP Blocked',       cls: 'bg-red-900/40 text-red-300 border-red-700'         },
  BLOCK_AND_VERIFY: { label: 'Blocked / Verify', cls: 'bg-red-900/40 text-red-300 border-red-700'         },
};

const PREDICTION_CONFIG = {
  NORMAL:    { label: 'NORMAL',     cls: 'bg-green-900/40 text-green-300 border-green-700'    },
  SUSPICIOUS:{ label: 'SUSPICIOUS', cls: 'bg-orange-900/40 text-orange-300 border-orange-700' },
};

const ROW_BG = {
  ALLOW_LOGIN:      '',
  DENY_CREDENTIALS: 'bg-yellow-950/10',
  LOCK_ACCOUNT:     'bg-red-950/20',
  BLOCK_IP:         'bg-red-950/20',
  BLOCK_AND_VERIFY: 'bg-red-950/20',
};

const Badge = ({ cfg, value }) => {
  const c = cfg[value];
  return c
    ? <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${c.cls}`}>{c.label}</span>
    : <span className="px-2 py-0.5 rounded text-xs border bg-slate-800 text-slate-400 border-slate-700">{value || '—'}</span>;
};

// ── Main ─────────────────────────────────────────────────────────────────
const LoginHistory = () => {
  const [attempts, setAttempts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [search, setSearch]       = useState('');
  const [filterAction, setFilterAction] = useState('ALL');
  const [filterPrediction, setFilterPrediction] = useState('ALL');

  const fetchHistory = useCallback(async () => {
    try {
      const data = await historyAPI.getAttempts();
      setAttempts(data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('LoginHistory fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 15000); // refresh every 15 s
    return () => clearInterval(interval);
  }, [fetchHistory]);

  // ── Filter + search ──────────────────────────────────────────────────
  const filtered = attempts.filter(a => {
    const matchSearch = !search
      || a.user_id?.toLowerCase().includes(search.toLowerCase())
      || a.ip_address?.includes(search);
    const matchAction = filterAction === 'ALL' || a.action_taken === filterAction;
    const matchPred   = filterPrediction === 'ALL' || a.prediction === filterPrediction;
    return matchSearch && matchAction && matchPred;
  });

  // ── Stats ────────────────────────────────────────────────────────────
  const stats = {
    total:     attempts.length,
    allowed:   attempts.filter(a => a.action_taken === 'ALLOW_LOGIN').length,
    denied:    attempts.filter(a => a.action_taken === 'DENY_CREDENTIALS').length,
    blocked:   attempts.filter(a => ['LOCK_ACCOUNT','BLOCK_IP','BLOCK_AND_VERIFY'].includes(a.action_taken)).length,
    suspicious:attempts.filter(a => a.prediction === 'SUSPICIOUS').length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <History className="text-blue-400 w-6 h-6" />
            Login History
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">Full audit trail · auto-refreshes every 15 s</p>
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
          { label: 'Total',      value: stats.total,      cls: 'border-slate-600  text-slate-300'  },
          { label: 'Allowed',    value: stats.allowed,    cls: 'border-green-700  text-green-400'  },
          { label: 'Denied',     value: stats.denied,     cls: 'border-yellow-700 text-yellow-400' },
          { label: 'Blocked',    value: stats.blocked,    cls: 'border-red-700    text-red-400'    },
          { label: 'Suspicious', value: stats.suspicious, cls: 'border-orange-700 text-orange-400' },
        ].map(({ label, value, cls }) => (
          <div key={label} className={`bg-slate-800/60 border ${cls.split(' ')[0]} rounded-xl px-4 py-3 text-center`}>
            <p className={`text-2xl font-bold tabular-nums ${cls.split(' ')[1]}`}>{value}</p>
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
            <option value="ALLOW_LOGIN">Allowed</option>
            <option value="DENY_CREDENTIALS">Denied</option>
            <option value="LOCK_ACCOUNT">Account Locked</option>
            <option value="BLOCK_IP">IP Blocked</option>
            <option value="BLOCK_AND_VERIFY">Blocked / Verify</option>
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
            <Clock className="w-3 h-3" /> Last updated {lastRefresh.toLocaleTimeString()} · auto-refreshes every 15 s
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginHistory;
