import React, { useEffect, useState, useCallback } from 'react';
import { dashboardAPI } from '../services/api';
import { ShieldAlert, ShieldCheck, UserX, AlertTriangle, RefreshCw, Activity } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

const BLOCKED_ACTIONS = ['BLOCK_AND_VERIFY', 'BLOCK_IP', 'LOCK_ACCOUNT'];

// ── Live Clock ──────────────────────────────────────────────────────────
const LiveClock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="text-xs text-slate-400 font-mono tabular-nums">
      {now.toLocaleString()}
    </span>
  );
};

// ── Stat Card ───────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon, borderColor, bgColor, trend }) => (
  <div className={`bg-slate-800 p-6 rounded-xl shadow flex items-start justify-between border border-slate-700 border-l-4 ${borderColor}`}>
    <div>
      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{title}</p>
      <p className="text-4xl font-bold mt-2 tabular-nums">{value !== undefined ? value : '—'}</p>
      {trend && <p className="text-xs text-slate-500 mt-1">{trend}</p>}
    </div>
    <div className={`p-3 ${bgColor} rounded-xl`}>
      {icon}
    </div>
  </div>
);

// ── Main Component ──────────────────────────────────────────────────────
const SecurityOverview = () => {
  const [summary, setSummary] = useState(null);
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchSummary = useCallback(async () => {
    try {
      const data = await dashboardAPI.getSummary();
      setSummary(data);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 10000); // refresh every 10 s
    return () => clearInterval(interval);
  }, [fetchSummary]);

  if (loading) return (
    <div className="flex items-center gap-3 text-slate-400 py-8">
      <RefreshCw className="w-5 h-5 animate-spin" /> Loading dashboard…
    </div>
  );
  if (error) return (
    <div className="text-red-400 bg-red-900/20 border border-red-800 p-4 rounded-xl">
      Error: {error}
    </div>
  );

  // ── Chart data ──────────────────────────────────────────────────────
  const pieData = [
    { name: 'Normal',     value: summary?.normal_logins   || 0, color: '#22c55e' },
    { name: 'Suspicious', value: summary?.suspicious_logins || 0, color: '#f97316' },
    { name: 'Blocked',    value: summary?.blocked_attempts  || 0, color: '#ef4444' },
  ];

  const barData = [
    { name: 'Total',      count: summary?.total_attempts    || 0, fill: '#3b82f6' },
    { name: 'Normal',     count: summary?.normal_logins     || 0, fill: '#22c55e' },
    { name: 'Suspicious', count: summary?.suspicious_logins || 0, fill: '#f97316' },
    { name: 'Blocked',    count: summary?.blocked_attempts  || 0, fill: '#ef4444' },
    { name: 'Incidents',  count: summary?.active_incidents  || 0, fill: '#eab308' },
  ];

  const safeRate = summary?.total_attempts
    ? ((summary.normal_logins / summary.total_attempts) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="text-blue-400 w-6 h-6" />
            Security Overview
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">Live security statistics · auto-refreshes every 10 s</p>
        </div>
        <div className="flex items-center gap-4">
          <LiveClock />
          <button
            onClick={fetchSummary}
            className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Attempts"
          value={summary?.total_attempts}
          icon={<ShieldCheck className="text-blue-400 w-7 h-7" />}
          borderColor="border-l-blue-500"
          bgColor="bg-blue-900/20"
          trend={`Safe rate: ${safeRate}%`}
        />
        <StatCard
          title="Blocked Logins"
          value={summary?.blocked_attempts}
          icon={<UserX className="text-red-400 w-7 h-7" />}
          borderColor="border-l-red-500"
          bgColor="bg-red-900/20"
          trend="BLOCK_IP · LOCK_ACCOUNT · BLOCK_AND_VERIFY"
        />
        <StatCard
          title="Suspicious Activity"
          value={summary?.suspicious_logins}
          icon={<ShieldAlert className="text-orange-400 w-7 h-7" />}
          borderColor="border-l-orange-500"
          bgColor="bg-orange-900/20"
          trend="Flagged but not hard-blocked"
        />
        <StatCard
          title="Active Incidents"
          value={summary?.active_incidents}
          icon={<AlertTriangle className="text-yellow-400 w-7 h-7" />}
          borderColor="border-l-yellow-500"
          bgColor="bg-yellow-900/20"
          trend={summary?.active_incidents > 0 ? '⚠ Requires attention' : '✓ All clear'}
        />
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-400">
        {[
          { color: 'bg-blue-500',   label: 'Total Attempts   — all login events recorded' },
          { color: 'bg-green-500',  label: 'Normal           — NORMAL prediction + ALLOW_LOGIN' },
          { color: 'bg-orange-500', label: 'Suspicious       — SUSPICIOUS prediction but not hard-blocked (e.g. wrong password)' },
          { color: 'bg-red-500',    label: 'Blocked          — BLOCK_IP / LOCK_ACCOUNT / BLOCK_AND_VERIFY' },
          { color: 'bg-yellow-500', label: 'Active Incidents — OPEN security incidents needing resolution' },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${color} flex-shrink-0`} />
            {label}
          </span>
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie */}
        <div className="bg-slate-800 p-6 rounded-xl shadow border border-slate-700">
          <h3 className="text-base font-semibold mb-4">Traffic Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => value > 0 ? `${name} (${value})` : ''}
                  labelLine={false}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', borderRadius: '8px' }}
                />
                <Legend
                  formatter={(value) => <span className="text-slate-300 text-xs">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar */}
        <div className="bg-slate-800 p-6 rounded-xl shadow border border-slate-700">
          <h3 className="text-base font-semibold mb-4">Activity Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', borderRadius: '8px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {lastRefresh && (
        <p className="text-xs text-slate-600 text-right">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
};

export default SecurityOverview;
