import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import {
  Brain, ShieldAlert, RefreshCw, TrendingUp, Users, Wifi,
  CheckCircle, AlertTriangle, Zap, Info, ChevronRight, BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar, Cell
} from 'recharts';

// ── Helpers ──────────────────────────────────────────────────────────────
const SEVERITY_STYLE = {
  CRITICAL: 'bg-red-900/40 text-red-300 border-red-700',
  HIGH:     'bg-orange-900/40 text-orange-300 border-orange-700',
  MEDIUM:   'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  LOW:      'bg-blue-900/40 text-blue-300 border-blue-700',
  INFO:     'bg-slate-700/60 text-slate-300 border-slate-600',
};

const RISK_COLOR = (r) =>
  r >= 80 ? '#ef4444' : r >= 60 ? '#f97316' : r >= 40 ? '#eab308' : '#22c55e';

const RiskGauge = ({ score, size = 120 }) => {
  const r = (size / 2) - 10;
  const circ = 2 * Math.PI * r;
  const arc  = (score / 100) * circ * 0.75;
  const offset = circ * 0.125;
  const color = RISK_COLOR(score);
  return (
    <svg width={size} height={size * 0.75} viewBox={`0 0 ${size} ${size * 0.75}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e293b" strokeWidth="10"
        strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} strokeDashoffset={-offset}
        strokeLinecap="round" transform={`rotate(135 ${size/2} ${size/2})`} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${arc} ${circ - arc}`} strokeDashoffset={-offset}
        strokeLinecap="round" transform={`rotate(135 ${size/2} ${size/2})`} />
      <text x={size/2} y={size * 0.55} textAnchor="middle" fill={color} fontSize="22" fontWeight="bold">{score}</text>
      <text x={size/2} y={size * 0.70} textAnchor="middle" fill="#94a3b8" fontSize="9">/ 100</text>
    </svg>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────
const ThreatIntelligence = () => {
  const [prediction, setPrediction] = useState(null);
  const [riskScores, setRiskScores] = useState({ users: [], ips: [] });
  const [loading, setLoading]       = useState(true);
  const [activeEntity, setActiveEntity] = useState(null);
  const [tab, setTab] = useState('users');

  const fetchAll = useCallback(async () => {
    try {
      const [pred, scores] = await Promise.all([
        api.get('/threat/prediction').then(r => r.data),
        api.get('/threat/risk-scores').then(r => r.data),
      ]);
      setPrediction(pred);
      setRiskScores(scores);
    } catch (e) {
      console.error('ThreatIntelligence fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 30000);
    return () => clearInterval(t);
  }, [fetchAll]);

  if (loading) return (
    <div className="flex items-center gap-3 text-slate-400 py-16 justify-center">
      <RefreshCw className="w-6 h-6 animate-spin text-blue-400" /> Analysing threats…
    </div>
  );

  const entitiesForTab = tab === 'users' ? riskScores.users : riskScores.ips;
  const barData = entitiesForTab.slice(0, 8).map(e => ({
    name: e.id.length > 12 ? e.id.slice(0, 12) + '…' : e.id,
    risk: e.risk_score,
    fill: RISK_COLOR(e.risk_score),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="text-purple-400 w-6 h-6" /> Threat Intelligence
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">AI-powered sequence analysis · refreshes every 30 s</p>
        </div>
        <button onClick={fetchAll} className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* ── Threat Prediction Card ── */}
      {prediction && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" /> AI Threat Prediction
            <span className="text-xs text-slate-600 normal-case font-normal">— {prediction.event_window} · {prediction.events_analyzed} events analysed</span>
          </h3>

          <div className="flex flex-wrap gap-6 items-center">
            <RiskGauge score={prediction.risk_score} size={140} />
            <div className="flex-1 min-w-60">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h4 className="text-xl font-bold text-white">{prediction.threat_type}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${SEVERITY_STYLE[prediction.severity] || SEVERITY_STYLE.INFO}`}>
                  {prediction.severity}
                </span>
              </div>
              <div className="flex gap-4 text-sm mb-3">
                <span className="text-slate-400">Confidence: <strong className="text-white">{prediction.confidence}%</strong></span>
                <span className="text-slate-400">Max Risk: <strong className="text-white">{prediction.max_risk_seen}%</strong></span>
                <span className="text-slate-400">Avg Risk: <strong className="text-white">{prediction.avg_risk}%</strong></span>
              </div>

              {/* Why flagged */}
              {prediction.indicators?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Why this threat was flagged:</p>
                  <ul className="space-y-1">
                    {prediction.indicators.map((ind, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                        {ind}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Recommended action */}
          <div className="mt-5 border-t border-slate-700 pt-4">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Recommended Action</p>
            <p className="text-sm text-blue-300 flex items-start gap-2">
              <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {prediction.recommended_action}
            </p>
          </div>

          <p className="text-xs text-slate-600 mt-3 flex items-center gap-1">
            <Info className="w-3 h-3" />
            This is a risk assessment, not a guarantee. Predictions are based on observed event patterns.
          </p>
        </div>
      )}

      {/* ── Entity Risk Scoreboard ── */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" /> Entity Risk Scoreboard
          <span className="text-slate-600 font-normal text-xs normal-case">— Last 7 days</span>
        </h3>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {[{ key: 'users', label: 'Users', icon: Users }, { key: 'ips', label: 'IP Addresses', icon: Wifi }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors ${tab === t.key ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase border-b border-slate-700">
                  <th className="text-left py-2 pr-3">{tab === 'users' ? 'User' : 'IP Address'}</th>
                  <th className="text-left py-2 pr-3">Risk</th>
                  <th className="text-left py-2 pr-3">Severity</th>
                  <th className="text-left py-2">Attempts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {entitiesForTab.slice(0, 12).map(e => (
                  <tr key={e.id}
                    onClick={() => setActiveEntity(e)}
                    className={`cursor-pointer hover:bg-slate-700/30 transition-colors ${activeEntity?.id === e.id ? 'bg-slate-700/40' : ''}`}>
                    <td className="py-2 pr-3 font-mono text-xs text-slate-200">{e.id}</td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${e.risk_score}%`, backgroundColor: RISK_COLOR(e.risk_score) }} />
                        </div>
                        <span className="text-xs tabular-nums" style={{ color: RISK_COLOR(e.risk_score) }}>{e.risk_score}%</span>
                      </div>
                    </td>
                    <td className="py-2 pr-3">
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${SEVERITY_STYLE[e.severity] || SEVERITY_STYLE.INFO}`}>{e.severity}</span>
                    </td>
                    <td className="py-2 text-xs text-slate-400">{e.total_attempts}</td>
                  </tr>
                ))}
                {entitiesForTab.length === 0 && (
                  <tr><td colSpan="4" className="py-6 text-center text-slate-500 text-xs">No data for the last 7 days.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Bar chart */}
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis domain={[0,100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }} />
                <Bar dataKey="risk" name="Risk Score" radius={[3,3,0,0]}>
                  {barData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Entity detail panel */}
        {activeEntity && (
          <div className="mt-4 bg-slate-900/60 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono font-semibold text-slate-200">{activeEntity.id}</span>
              <button onClick={() => setActiveEntity(null)} className="text-xs text-slate-500 hover:text-slate-300">✕ Close</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                { label: 'Risk Score', value: `${activeEntity.risk_score}%`, color: RISK_COLOR(activeEntity.risk_score) },
                { label: 'Severity',   value: activeEntity.severity,         color: null },
                { label: 'Attempts',   value: activeEntity.total_attempts,   color: null },
                { label: 'Failed',     value: activeEntity.failed,           color: activeEntity.failed > 0 ? '#ef4444' : '#22c55e' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-slate-800 rounded-lg p-3">
                  <p className="text-slate-500 mb-0.5">{label}</p>
                  <p className="font-bold text-sm" style={color ? { color } : {}}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreatIntelligence;
