import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle, Shield, HardDrive, Cpu, FileText,
  Activity, ChevronRight, Info, RefreshCw
} from 'lucide-react';

// ── Signal definitions ────────────────────────────────────────────────────
const SIGNALS = [
  {
    id:    'file_mod_rate',
    label: 'File Modification Rate',
    desc:  'Files modified per minute (normal: < 5)',
    icon:  FileText,
    color: '#f97316',
    max:   200,
    normal: 5,
    weight: 0.30,
  },
  {
    id:    'disk_write_volume',
    label: 'Disk Write Volume',
    desc:  'Disk writes per second (normal: < 20 MB/s)',
    icon:  HardDrive,
    color: '#ef4444',
    max:   500,
    normal: 20,
    weight: 0.25,
  },
  {
    id:    'file_type_changes',
    label: 'File Extension Changes',
    desc:  'Files with changed extensions per minute (normal: 0)',
    icon:  FileText,
    color: '#dc2626',
    max:   100,
    normal: 0,
    weight: 0.25,
  },
  {
    id:    'suspicious_processes',
    label: 'Suspicious Processes',
    desc:  'Unusual processes spawned (normal: 0)',
    icon:  Cpu,
    color: '#a855f7',
    max:   20,
    normal: 0,
    weight: 0.12,
  },
  {
    id:    'network_anomaly',
    label: 'Network Anomaly Score',
    desc:  'Outbound connection anomaly (0–100)',
    icon:  Activity,
    color: '#3b82f6',
    max:   100,
    normal: 5,
    weight: 0.08,
  },
];

// ── Compute composite risk ─────────────────────────────────────────────────
function computeRisk(values) {
  let weighted = 0;
  SIGNALS.forEach(s => {
    const val = values[s.id] || 0;
    const norm = Math.min(1, val / s.max);
    weighted += norm * s.weight;
  });
  return Math.round(Math.min(100, weighted * 100));
}

function riskLabel(score) {
  if (score >= 80) return { label: 'CRITICAL — Immediate Action Required', color: '#ef4444', cls: 'bg-red-900/20 border-red-700' };
  if (score >= 60) return { label: 'HIGH RISK — Early Warning Triggered',  color: '#f97316', cls: 'bg-orange-900/20 border-orange-700' };
  if (score >= 35) return { label: 'ELEVATED — Monitor Closely',           color: '#eab308', cls: 'bg-yellow-900/20 border-yellow-700' };
  return                  { label: 'NORMAL — No Threats Detected',          color: '#22c55e', cls: 'bg-green-900/20 border-green-800' };
}

const RECOMMENDED_ACTIONS = [
  { threshold: 80, actions: [
    'Isolate the affected device from the network immediately',
    'Disable all active sessions for users on this endpoint',
    'Take a forensic snapshot of current disk state',
    'Investigate all recently modified files for encryption signatures',
    'Restore from verified, clean backups if encryption confirmed',
    'Notify SOC/IR team and initiate incident response protocol',
  ]},
  { threshold: 60, actions: [
    'Alert the security team and begin investigation',
    'Identify and terminate suspicious processes',
    'Review file modification logs for the last 30 minutes',
    'Check for unusual network connections or exfiltration activity',
    'Prepare for possible device isolation',
  ]},
  { threshold: 35, actions: [
    'Increase monitoring frequency for this endpoint',
    'Verify no unusual user activity is occurring',
    'Review recent process execution logs',
  ]},
  { threshold: 0, actions: [
    'Continue routine monitoring.',
  ]},
];

function getActions(score) {
  return (RECOMMENDED_ACTIONS.find(r => score >= r.threshold) || RECOMMENDED_ACTIONS[3]).actions;
}

// ── Signal Slider ─────────────────────────────────────────────────────────
const SignalSlider = ({ signal, value, onChange }) => {
  const IconCmp = signal.icon;
  const pct = (value / signal.max) * 100;
  const aboveNormal = value > signal.normal;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <IconCmp className="w-4 h-4 flex-shrink-0" style={{ color: signal.color }} />
        <span className="text-sm font-medium text-slate-200">{signal.label}</span>
        {aboveNormal && <span className="text-xs text-orange-400 ml-auto">⚠ Above normal</span>}
      </div>
      <p className="text-xs text-slate-500 mb-3">{signal.desc}</p>
      <div className="flex items-center gap-3">
        <input
          type="range" min={0} max={signal.max} step={1}
          value={value}
          onChange={e => onChange(signal.id, Number(e.target.value))}
          className="flex-1 accent-orange-500"
          style={{ accentColor: signal.color }}
        />
        <span className="text-sm font-bold tabular-nums w-12 text-right" style={{ color: aboveNormal ? signal.color : '#94a3b8' }}>
          {value}
        </span>
      </div>
      <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-200"
          style={{ width: `${pct}%`, backgroundColor: aboveNormal ? signal.color : '#22c55e' }} />
      </div>
    </div>
  );
};

// ── RiskGauge ─────────────────────────────────────────────────────────────
const RiskGauge = ({ score }) => {
  const { color } = riskLabel(score);
  const r = 54, circ = 2 * Math.PI * r;
  const arc = (score / 100) * circ * 0.75;
  return (
    <svg width="140" height="100" viewBox="0 0 140 100">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#1e293b" strokeWidth="12"
        strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} strokeDashoffset={`-${circ * 0.125}`}
        strokeLinecap="round" transform="rotate(135 70 70)" />
      <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="12"
        strokeDasharray={`${arc} ${circ - arc}`} strokeDashoffset={`-${circ * 0.125}`}
        strokeLinecap="round" transform="rotate(135 70 70)" />
      <text x="70" y="75" textAnchor="middle" fill={color} fontSize="28" fontWeight="bold">{score}</text>
      <text x="70" y="90" textAnchor="middle" fill="#64748b" fontSize="10">/100</text>
    </svg>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────
const RansomwareMonitor = () => {
  const [values, setValues] = useState(
    Object.fromEntries(SIGNALS.map(s => [s.id, 0]))
  );
  const [history, setHistory] = useState([]);

  const score = computeRisk(values);
  const { label, cls } = riskLabel(score);
  const actions = getActions(score);

  const handleChange = useCallback((id, val) => {
    setValues(prev => ({ ...prev, [id]: val }));
  }, []);

  // Record history every 2 s
  useEffect(() => {
    const t = setInterval(() => {
      setHistory(prev => {
        const entry = { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), score: computeRisk(values) };
        return [...prev.slice(-19), entry];
      });
    }, 2000);
    return () => clearInterval(t);
  }, [values]);

  const reset = () => setValues(Object.fromEntries(SIGNALS.map(s => [s.id, 0])));

  const simulateAttack = () => {
    setValues({
      file_mod_rate:      150,
      disk_write_volume:  300,
      file_type_changes:  60,
      suspicious_processes: 8,
      network_anomaly:    85,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="text-red-400 w-6 h-6" /> Ransomware Early-Warning Monitor
        </h2>
        <p className="text-slate-500 text-sm mt-0.5">Defensive simulation only — adjust signals to model behavioural indicators</p>
      </div>

      {/* Disclaimer */}
      <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-3 text-xs text-blue-300 flex items-start gap-2">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>
          <strong>Simulation only.</strong> No actual file system, process, or network access occurs. This module models how ransomware behavioral indicators combine into a composite risk score, for educational and defensive training purposes.
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Signal Controls ── */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Behavioural Signals</h3>
            <div className="flex gap-2">
              <button onClick={simulateAttack}
                className="text-xs px-3 py-1.5 bg-red-900/30 border border-red-800 text-red-300 rounded-lg hover:bg-red-900/50 transition-colors">
                Simulate Attack
              </button>
              <button onClick={reset}
                className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
            </div>
          </div>
          {SIGNALS.map(s => (
            <SignalSlider key={s.id} signal={s} value={values[s.id]} onChange={handleChange} />
          ))}
        </div>

        {/* ── Risk Display ── */}
        <div className="space-y-4">
          {/* Gauge */}
          <div className={`rounded-2xl border p-5 text-center ${cls} transition-all duration-500`}>
            <div className="flex justify-center"><RiskGauge score={score} /></div>
            <p className="text-sm font-bold mt-2 text-slate-200">{label}</p>
            <p className="text-xs text-slate-500 mt-1">Composite ransomware risk score</p>
          </div>

          {/* Signal breakdown */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Signal Contribution</h4>
            {SIGNALS.map(s => {
              const pct = Math.round(Math.min(1, (values[s.id] || 0) / s.max) * s.weight * 100);
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 w-28 truncate">{s.label.split(' ').slice(0, 2).join(' ')}</span>
                  <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct * 3.3}%`, backgroundColor: s.color }} />
                  </div>
                  <span className="text-xs tabular-nums w-6 text-right" style={{ color: s.color }}>{pct}</span>
                </div>
              );
            })}
          </div>

          {/* Recommended actions */}
          {score > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Recommended Actions</h4>
              <ul className="space-y-2">
                {actions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <ChevronRight className="w-3 h-3 text-orange-400 mt-0.5 flex-shrink-0" /> {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risk history */}
          {history.length > 1 && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Risk History</h4>
              <div className="flex items-end gap-0.5 h-16">
                {history.map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm"
                    style={{
                      height: `${Math.max(4, h.score)}%`,
                      backgroundColor: h.score >= 80 ? '#ef4444' : h.score >= 60 ? '#f97316' : h.score >= 35 ? '#eab308' : '#22c55e',
                      opacity: 0.7 + (i / history.length) * 0.3,
                    }}
                    title={`${h.time}: ${h.score}`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-600 mt-1">Last {history.length * 2} seconds</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RansomwareMonitor;
