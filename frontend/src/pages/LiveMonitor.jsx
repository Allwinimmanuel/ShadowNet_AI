import React, { useState, useEffect, useCallback } from 'react';
import { historyAPI } from '../services/api';
import { Shield, ShieldAlert, Clock, RefreshCw, Wifi } from 'lucide-react';

// ── Helpers ─────────────────────────────────────────────────────────────
const formatTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
  return d.toLocaleString(undefined, {
    month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
};

const ACTION_CONFIG = {
  ALLOW_LOGIN:      { label: 'Allowed',               cls: 'bg-green-900/40 text-green-300 border-green-700'  },
  DENY_CREDENTIALS: { label: 'Denied',                cls: 'bg-yellow-900/40 text-yellow-300 border-yellow-700' },
  LOCK_ACCOUNT:     { label: 'Account Locked',        cls: 'bg-red-900/40 text-red-300 border-red-700'        },
  BLOCK_IP:         { label: 'IP Blocked',            cls: 'bg-red-900/40 text-red-300 border-red-700'        },
  BLOCK_AND_VERIFY: { label: 'Blocked / Verify',      cls: 'bg-red-900/40 text-red-300 border-red-700'        },
};

const PREDICTION_CONFIG = {
  NORMAL:    { label: 'NORMAL',     cls: 'bg-green-900/40 text-green-300 border-green-700'   },
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

// ── Live Clock ───────────────────────────────────────────────────────────
const LiveClock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return <span className="text-xs font-mono text-slate-400 tabular-nums">{now.toLocaleTimeString()}</span>;
};

// ── Main ─────────────────────────────────────────────────────────────────
const LiveMonitor = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [newIds, setNewIds] = useState(new Set());

  const fetchAttempts = useCallback(async () => {
    try {
      const data = await historyAPI.getAttempts();
      const top20 = data.slice(0, 20);
      setAttempts(prev => {
        const prevIds = new Set(prev.map(a => a.id));
        const fresh = new Set(top20.filter(a => !prevIds.has(a.id)).map(a => a.id));
        if (fresh.size > 0) {
          setNewIds(fresh);
          setTimeout(() => setNewIds(new Set()), 3000);
        }
        return top20;
      });
      setLastRefresh(new Date());
    } catch (err) {
      console.error('LiveMonitor fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttempts();
    const interval = setInterval(fetchAttempts, 5000);
    return () => clearInterval(interval);
  }, [fetchAttempts]);

  const blocked    = attempts.filter(a => ['LOCK_ACCOUNT','BLOCK_IP','BLOCK_AND_VERIFY'].includes(a.action_taken)).length;
  const suspicious = attempts.filter(a => a.prediction === 'SUSPICIOUS' && a.action_taken === 'DENY_CREDENTIALS').length;
  const allowed    = attempts.filter(a => a.action_taken === 'ALLOW_LOGIN').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
          </div>
          <h2 className="text-2xl font-bold">Live Monitor</h2>
          <span className="text-xs text-blue-400 bg-blue-900/20 border border-blue-800 px-2 py-0.5 rounded">LIVE</span>
        </div>
        <div className="flex items-center gap-3">
          <Wifi className="w-4 h-4 text-green-400" />
          <LiveClock />
          <button
            onClick={fetchAttempts}
            className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Allowed',    value: allowed,    cls: 'border-green-700 bg-green-900/10',  text: 'text-green-400'  },
          { label: 'Suspicious', value: suspicious, cls: 'border-orange-700 bg-orange-900/10', text: 'text-orange-400' },
          { label: 'Blocked',    value: blocked,    cls: 'border-red-700 bg-red-900/10',      text: 'text-red-400'    },
        ].map(({ label, value, cls, text }) => (
          <div key={label} className={`${cls} border rounded-xl px-4 py-3 text-center`}>
            <p className={`text-2xl font-bold tabular-nums ${text}`}>{value}</p>
            <p className="text-xs text-slate-400">{label} (last 20)</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">Device</th>
                <th className="px-4 py-3">Prediction</th>
                <th className="px-4 py-3">Risk</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {loading && (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin inline mr-2" /> Loading…
                  </td>
                </tr>
              )}
              {!loading && attempts.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                    No activity yet. Login or run the simulator to see events here.
                  </td>
                </tr>
              )}
              {attempts.map((a) => (
                <tr
                  key={a.id}
                  className={`transition-all duration-500 hover:bg-slate-700/20 ${ROW_BG[a.action_taken] || ''} ${newIds.has(a.id) ? 'ring-1 ring-inset ring-blue-500/50' : ''}`}
                >
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap font-mono">
                    {formatTime(a.login_time || a.created_at)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-200">{a.user_id}</td>
                  <td className="px-4 py-3 font-mono text-slate-400 text-xs">{a.ip_address}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{a.device_type || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge cfg={PREDICTION_CONFIG} value={a.prediction} />
                  </td>
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3">
                    <Badge cfg={ACTION_CONFIG} value={a.action_taken} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {lastRefresh && (
          <div className="px-4 py-2 bg-slate-900/40 border-t border-slate-700 text-xs text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Updated {lastRefresh.toLocaleTimeString()} · auto-refreshes every 5 s
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveMonitor;
