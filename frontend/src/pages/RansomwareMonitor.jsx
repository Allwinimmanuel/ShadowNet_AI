import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle, Shield, HardDrive, Cpu, FileText,
  Activity, ChevronRight, Info, CheckCircle, Search, Zap, Crosshair
} from 'lucide-react';

// ── Signal definitions ────────────────────────────────────────────────────
const SIGNALS = [
  {
    id:    'file_mod_rate',
    label: 'File Modification Rate',
    desc:  'How quickly files are being changed.',
    icon:  FileText,
    color: '#f97316',
    max:   200,
    normal: 5,
    weight: 0.30,
  },
  {
    id:    'disk_write_volume',
    label: 'Disk Write Volume',
    desc:  'How much data is being written to the disk.',
    icon:  HardDrive,
    color: '#ef4444',
    max:   500,
    normal: 20,
    weight: 0.25,
  },
  {
    id:    'file_type_changes',
    label: 'File Extension Changes',
    desc:  'Whether many files are suddenly changing their file types or extensions.',
    icon:  FileText,
    color: '#dc2626',
    max:   100,
    normal: 0,
    weight: 0.25,
  },
  {
    id:    'suspicious_processes',
    label: 'Suspicious Processes',
    desc:  'Whether unknown or unusual programs are running.',
    icon:  Cpu,
    color: '#a855f7',
    max:   20,
    normal: 0,
    weight: 0.12,
  },
  {
    id:    'network_anomaly',
    label: 'Network Anomaly Score',
    desc:  'Whether the computer is communicating with unusual or suspicious network destinations.',
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
  if (score >= 80) return { 
    label: 'CRITICAL', 
    detected: 'Ransomware-like behavior detected. The system recommends isolating the device to prevent further damage.',
    color: '#ef4444', 
    cls: 'bg-red-900/20 border-red-700 text-red-300' 
  };
  if (score >= 60) return { 
    label: 'HIGH RISK',  
    detected: 'Multiple suspicious behaviors detected. The system recommends investigating and stopping suspicious activity.',
    color: '#f97316', 
    cls: 'bg-orange-900/20 border-orange-700 text-orange-300' 
  };
  if (score >= 35) return { 
    label: 'ELEVATED',           
    detected: 'Some unusual activity was detected. Further investigation is recommended.',
    color: '#eab308', 
    cls: 'bg-yellow-900/20 border-yellow-700 text-yellow-300' 
  };
  return { 
    label: 'NORMAL',          
    detected: 'No unusual behavior detected.',
    color: '#22c55e', 
    cls: 'bg-green-900/20 border-green-800 text-green-300' 
  };
}

const RECOMMENDED_ACTIONS = [
  { threshold: 80, actions: [
    'Isolate the affected device from the network immediately.'
  ]},
  { threshold: 60, actions: [
    'Stop suspicious processes and notify the security team.'
  ]},
  { threshold: 35, actions: [
    'Continue monitoring and investigate unusual activity.'
  ]},
  { threshold: 0, actions: [
    'Continue routine monitoring.'
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
    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <IconCmp className="w-4 h-4 flex-shrink-0" style={{ color: signal.color }} />
        <span className="text-sm font-medium text-slate-200">{signal.label}</span>
      </div>
      <p className="text-xs text-slate-400 mb-3">{signal.desc}</p>
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
const RiskGauge = ({ score, color }) => {
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
  const { label, detected, color, cls } = riskLabel(score);
  const actions = getActions(score);

  const handleChange = useCallback((id, val) => {
    setValues(prev => ({ ...prev, [id]: val }));
  }, []);

  const valuesRef = React.useRef(values);
  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  // Record history every 2 s
  useEffect(() => {
    const t = setInterval(() => {
      setHistory(prev => {
        const score = computeRisk(valuesRef.current);
        const entry = { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), score };
        return [...prev.slice(-19), entry];
      });
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const simulateNormal = () => setValues({
    file_mod_rate: 2, disk_write_volume: 5, file_type_changes: 0, suspicious_processes: 0, network_anomaly: 2
  });
  
  const simulateSuspicious = () => setValues({
    file_mod_rate: 40, disk_write_volume: 80, file_type_changes: 2, suspicious_processes: 1, network_anomaly: 10
  });

  const simulateRansomware = () => setValues({
    file_mod_rate: 180, disk_write_volume: 400, file_type_changes: 85, suspicious_processes: 6, network_anomaly: 85
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* 1. Header */}
      <div>
        <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-100">
          <Shield className="text-red-400 w-8 h-8" /> Ransomware Detection Simulator
        </h2>
        <p className="text-slate-400 text-base mt-2">See how ShadowNet AI identifies suspicious file activity and recommends defensive actions.</p>
      </div>

      {/* 2. Purpose / Info Box */}
      <div className="bg-blue-900/10 border border-blue-800/50 rounded-xl p-5 text-blue-300">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-400 text-sm mb-1">Purpose of this page:</h3>
            <p className="text-sm text-blue-200/80 leading-relaxed">
              This safe simulation demonstrates how ransomware-like behavior can be detected using multiple activity signals. It does not attack real files or devices.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Choose a Scenario */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Choose a Scenario</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <button onClick={simulateNormal} className="text-left bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-green-600 rounded-xl p-5 transition-all group">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <h4 className="font-semibold text-slate-200 group-hover:text-green-400 transition-colors">NORMAL ACTIVITY</h4>
            </div>
            <p className="text-xs text-slate-400 mb-3 h-12 leading-relaxed">Normal computer usage such as opening documents, browsing websites, and using regular applications.</p>
            <div className="text-[11px] bg-slate-900/50 p-2 rounded text-slate-300">
              <span className="text-slate-500">Expected:</span> Low risk and Continue Monitoring.
            </div>
          </button>

          <button onClick={simulateSuspicious} className="text-left bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-yellow-600 rounded-xl p-5 transition-all group">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <h4 className="font-semibold text-slate-200 group-hover:text-yellow-400 transition-colors">SUSPICIOUS ACTIVITY</h4>
            </div>
            <p className="text-xs text-slate-400 mb-3 h-12 leading-relaxed">An unknown application starts modifying an unusual number of files.</p>
            <div className="text-[11px] bg-slate-900/50 p-2 rounded text-slate-300">
              <span className="text-slate-500">Expected:</span> Elevated risk and Investigate Activity.
            </div>
          </button>

          <button onClick={simulateRansomware} className="text-left bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-red-600 rounded-xl p-5 transition-all group">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
              <h4 className="font-semibold text-slate-200 group-hover:text-red-400 transition-colors">RANSOMWARE OUTBREAK</h4>
            </div>
            <p className="text-xs text-slate-400 mb-3 h-12 leading-relaxed">Files are rapidly modified, file extensions change, suspicious processes run, and unusual network activity is detected.</p>
            <div className="text-[11px] bg-slate-900/50 p-2 rounded text-slate-300">
              <span className="text-slate-500">Expected:</span> Critical risk and Isolate Device.
            </div>
          </button>

        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Results & Explanation */}
        <div className="space-y-6">
          
          {/* 4. Current Threat Level / Risk Score */}
          <div className={`rounded-2xl border p-6 ${cls} transition-colors duration-500 shadow-lg`}>
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0">
                <RiskGauge score={score} color={color} />
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-80">Current Threat Level</h4>
                <p className="text-2xl font-bold mb-2">{label}</p>
                <p className="text-sm opacity-90 leading-relaxed">{detected}</p>
              </div>
            </div>
          </div>

          {/* 6. Recommended Response */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Recommended Action</h4>
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-slate-300 mt-0.5" />
              <p className="text-sm text-slate-200 font-medium">{actions[0]}</p>
            </div>
          </div>

          {/* 5. How Ransomware Detection Works */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">How Ransomware Detection Works</h4>
            <div className="space-y-5">
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 flex-shrink-0 mt-0.5">1</div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">Step 1 — Observe</p>
                  <p className="text-xs text-slate-400 mt-1">The system monitors file, process, disk, and network activity.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 flex-shrink-0 mt-0.5">2</div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">Step 2 — Analyze</p>
                  <p className="text-xs text-slate-400 mt-1">The AI compares the activity with normal computer behavior.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 flex-shrink-0 mt-0.5">3</div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">Step 3 — Calculate Risk</p>
                  <p className="text-xs text-slate-400 mt-1">Multiple suspicious signals are combined into one risk score.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 flex-shrink-0 mt-0.5">4</div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">Step 4 — Respond</p>
                  <p className="text-xs text-slate-400 mt-1">Based on the risk level, the system recommends monitoring, investigation, or device isolation.</p>
                </div>
              </div>
            </div>
          </div>
          
        </div>

        {/* Right Column: Advanced Details & Charts */}
        <div className="space-y-6">
          
          {/* 7. Advanced Detection Signals */}
          <details className="bg-slate-800 border border-slate-700 rounded-xl group shadow-sm">
            <summary className="p-5 cursor-pointer flex items-center justify-between outline-none">
              <h4 className="text-sm font-semibold text-slate-300">Advanced Detection Signals</h4>
              <ChevronRight className="w-5 h-5 text-slate-500 transition-transform group-open:rotate-90" />
            </summary>
            <div className="p-5 pt-0 border-t border-slate-700 mt-2 space-y-4">
              <p className="text-xs text-slate-400 mb-4 bg-slate-900/50 p-3 rounded-lg leading-relaxed">
                These are the internal behavioral signals used by the AI risk engine. Advanced users can adjust them manually to understand how each signal affects the overall risk score.
              </p>
              {SIGNALS.map(s => (
                <SignalSlider key={s.id} signal={s} value={values[s.id]} onChange={handleChange} />
              ))}
            </div>
          </details>

          {/* Signal Contribution */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Signal Contribution</h4>
            <div className="space-y-3">
              {SIGNALS.map(s => {
                const pct = Math.round(Math.min(1, (values[s.id] || 0) / s.max) * s.weight * 100);
                return (
                  <div key={s.id} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-32 truncate">{s.label}</span>
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct * 3.3}%`, backgroundColor: s.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Threat Level History */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Threat Level History</h4>
            <div className="relative h-24 w-full border-b border-l border-slate-600 mt-4 mb-2 flex items-end gap-1 pt-2 ml-4 pr-4">
              {/* Y-axis labels */}
              <div className="absolute -left-6 top-0 text-[9px] text-slate-500">100</div>
              <div className="absolute -left-5 top-1/2 -translate-y-1/2 text-[9px] text-slate-500">50</div>
              <div className="absolute -left-4 bottom-0 text-[9px] text-slate-500">0</div>
              {/* Horizontal grid lines */}
              <div className="absolute left-0 top-0 w-full border-t border-slate-700/50 border-dashed" />
              <div className="absolute left-0 top-1/2 w-full border-t border-slate-700/50 border-dashed" />

              {Array.from({ length: Math.max(0, 20 - history.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="flex-1" />
              ))}
              {history.map((h, i) => (
                <div key={`hist-${i}`} className="flex-1 rounded-t-sm transition-all duration-300 relative z-10"
                  style={{
                    height: `${Math.max(2, h.score)}%`,
                    backgroundColor: h.score >= 80 ? '#ef4444' : h.score >= 60 ? '#f97316' : h.score >= 35 ? '#eab308' : '#22c55e',
                    opacity: 0.7 + (i / history.length) * 0.3,
                  }}
                  title={`${h.time}: ${h.score}`}
                />
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-3 text-center">Time (Last 40 seconds)</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RansomwareMonitor;
