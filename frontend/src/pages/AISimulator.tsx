import { useState } from 'react';
import { ShieldAlert, ShieldCheck, Terminal, Play, ServerCrash, Skull, Download, UserX, Loader2, Cpu, Zap, StopCircle } from 'lucide-react';

const ATTACKS = [
  {
    id: 'BRUTE_FORCE',
    label: 'Brute Force Attack',
    description: 'Simulates 25 rapid failed login attempts from a foreign IP.',
    icon: UserX,
    hoverColor: 'hover:border-danger/50 hover:bg-danger/5',
    iconColor: 'group-hover:text-danger',
    playColor: 'group-hover:text-danger',
    payload: { event_type: "LOGIN_FAILED", login_status: "FAILED", failed_attempts: 25, data_download_mb: 0.1, files_accessed: 0, file_modifications: 0, process_activity: 12.0, ip_address: "185.22.44.11" }
  },
  {
    id: 'DATA_EXFILTRATION',
    label: 'Mass Data Exfiltration',
    description: 'Simulates an authorized user downloading 4.5GB of sensitive data.',
    icon: Download,
    hoverColor: 'hover:border-warning/50 hover:bg-warning/5',
    iconColor: 'group-hover:text-warning',
    playColor: 'group-hover:text-warning',
    payload: { event_type: "MASS_FILE_DOWNLOAD", login_status: "SUCCESS", failed_attempts: 0, data_download_mb: 4500.5, files_accessed: 850, file_modifications: 12, process_activity: 40.0, ip_address: "10.0.0.5" }
  },
  {
    id: 'RANSOMWARE',
    label: 'Ransomware Behavior',
    description: 'Simulates mass file encryption and extremely high process activity.',
    icon: Skull,
    hoverColor: 'hover:border-danger/50 hover:bg-danger/5',
    iconColor: 'group-hover:text-danger',
    playColor: 'group-hover:text-danger',
    payload: { event_type: "UNUSUAL_PROCESS", login_status: "SUCCESS", failed_attempts: 0, data_download_mb: 0.5, files_accessed: 200, file_modifications: 1500, process_activity: 99.9, ip_address: "172.16.0.4" }
  },
  {
    id: 'NORMAL',
    label: 'Normal Baseline Activity',
    description: 'Simulates standard employee login and regular file access.',
    icon: ShieldCheck,
    hoverColor: 'hover:border-primary/50 hover:bg-primary/5',
    iconColor: 'group-hover:text-primary',
    playColor: 'group-hover:text-primary',
    payload: { event_type: "LOGIN", login_status: "SUCCESS", failed_attempts: 0, data_download_mb: 1.5, files_accessed: 2, file_modifications: 0, process_activity: 14.0, ip_address: "192.168.1.12" }
  },
];

const BASE_PAYLOAD = {
  timestamp: "", user_id: "user_7", username: "user_7_account",
  location: "US-East", device: "Windows PC",
};

export const AISimulator = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog(prev => [...prev.slice(-8), msg]);

  const simulateAttack = async (attackId: string) => {
    const attack = ATTACKS.find(a => a.id === attackId);
    if (!attack) return;

    setLoading(true);
    addLog(`> Injecting ${attack.label}...`);

    const payload = { ...BASE_PAYLOAD, ...attack.payload, timestamp: new Date().toISOString() };

    try {
      const response = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      await new Promise(r => setTimeout(r, 800));
      setResult(data);
      addLog(`> AI Score: ${data.risk_score.toFixed(1)} — Verdict: ${data.predicted_threat}`);
    } catch {
      addLog('> ERROR: Backend unreachable. Is Uvicorn running?');
    }
    setLoading(false);
  };

  const runFullDemo = async () => {
    setDemoRunning(true);
    setLog([]);
    setResult(null);
    addLog('> SHADOWNET DEMO MODE ACTIVATED');
    addLog('> Running full attack sequence...');

    for (let i = 0; i < ATTACKS.length; i++) {
      setDemoStep(i);
      await new Promise(r => setTimeout(r, 500));
      await simulateAttack(ATTACKS[i].id);
      await new Promise(r => setTimeout(r, 1500));
    }

    addLog('> Demo complete. All attack vectors tested.');
    setDemoRunning(false);
    setDemoStep(0);
  };

  return (
    <div className="p-6 h-full flex flex-col gap-5 overflow-y-auto pb-20">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black glow-text mb-1">AI Threat Simulator</h1>
          <p className="text-gray-500 text-sm">Inject synthetic attacks and watch the AI model classify them in real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          {!demoRunning ? (
            <button 
              onClick={runFullDemo}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/15 border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/25 transition-all disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              Run Full Demo
            </button>
          ) : (
            <button 
              onClick={() => setDemoRunning(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-danger/15 border border-danger/30 text-danger text-sm font-semibold hover:bg-danger/25 transition-all"
            >
              <StopCircle className="w-4 h-4" />
              Stop Demo
            </button>
          )}
          <div className="px-3 py-2 bg-danger/10 border border-danger/20 rounded-lg text-danger flex items-center gap-2 text-xs font-semibold">
            <Terminal className="w-3.5 h-3.5" />
            LIVE ENVIRONMENT
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Attack Vectors */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <ServerCrash className="w-4 h-4 text-warning" />
            Attack Vectors
          </h2>
          
          {ATTACKS.map((attack, idx) => {
            const Icon = attack.icon;
            const isActive = demoRunning && demoStep === idx;
            return (
              <button 
                key={attack.id}
                onClick={() => simulateAttack(attack.id)}
                disabled={loading || demoRunning}
                className={`glass-card p-4 flex items-center justify-between group transition-all text-left ${attack.hoverColor} ${isActive ? 'border-primary/50 bg-primary/5' : ''} disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                <div>
                  <h3 className={`font-bold text-gray-200 group-hover:text-white flex items-center gap-2 text-sm`}>
                    <Icon className={`w-4 h-4 text-gray-500 ${attack.iconColor} transition-colors ${isActive ? 'text-primary animate-pulse' : ''}`} />
                    {attack.label}
                    {isActive && <span className="text-[9px] text-primary animate-pulse ml-1">● RUNNING</span>}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{attack.description}</p>
                </div>
                <Play className={`w-7 h-7 text-gray-700 ${attack.playColor} transition-all shrink-0 ml-3`} />
              </button>
            );
          })}
        </div>

        {/* Output Panel */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            AI Inference Output
          </h2>
          
          <div className="glass-card flex-1 min-h-[420px] p-5 flex flex-col font-mono text-sm relative overflow-hidden scan-line">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            
            {/* Terminal log */}
            <div className="flex flex-col gap-1 mb-4 min-h-[80px]">
              {log.map((line, i) => (
                <p key={i} className={`text-xs ${line.includes('ERROR') ? 'text-danger' : line.includes('Score') ? 'text-success' : 'text-gray-500'} font-mono`}>
                  {line}
                </p>
              ))}
              {log.length === 0 && <p className="text-xs text-gray-700">Awaiting simulation trigger...</p>}
            </div>

            <div className="border-t border-gray-800/50 pt-4 flex-1 flex flex-col">
              {!loading && !result && (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-3">
                  <Terminal className="w-10 h-10 opacity-20" />
                  <p className="text-xs">Click an attack vector to begin</p>
                </div>
              )}

              {loading && (
                <div className="flex-1 flex flex-col items-center justify-center text-primary gap-3">
                  <Loader2 className="w-10 h-10 animate-spin" />
                  <p className="text-xs animate-pulse">Processing through Isolation Forest model...</p>
                </div>
              )}

              {result && !loading && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surface/60 p-4 rounded-lg border border-gray-800">
                      <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">AI Risk Score</p>
                      <p className={`text-3xl font-black ${result.risk_score > 70 ? 'text-danger glow-danger' : result.risk_score > 30 ? 'text-warning' : 'text-success'}`}>
                        {result.risk_score.toFixed(1)}
                        <span className="text-base font-normal text-gray-500">/100</span>
                      </p>
                    </div>
                    <div className="bg-surface/60 p-4 rounded-lg border border-gray-800">
                      <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Verdict</p>
                      <p className={`text-sm font-bold mt-2 ${result.predicted_threat !== "NONE" ? 'text-danger' : 'text-success'}`}>
                        {result.predicted_threat === "NONE" ? "✓ Benign" : "⚠ " + result.predicted_threat}
                      </p>
                    </div>
                  </div>

                  {/* Risk bar */}
                  <div>
                    <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                      <span>Anomaly Score</span><span>{(result.anomaly_score * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-1000 ${result.risk_score > 70 ? 'bg-danger shadow-[0_0_8px_rgba(239,68,68,0.6)]' : result.risk_score > 30 ? 'bg-warning' : 'bg-success'}`}
                        style={{ width: `${result.risk_score}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-background/80 p-3 rounded-lg border border-gray-800">
                    <p className="text-[10px] text-gray-600 mb-1.5">RAW PAYLOAD FEATURES</p>
                    <pre className="text-[10px] text-primary/70 overflow-x-auto">
{JSON.stringify({ event: result.event_type, ip: result.ip_address, failed: result.failed_attempts, download_mb: result.data_download_mb?.toFixed(1), files: result.files_accessed, cpu: result.process_activity }, null, 2)}
                    </pre>
                  </div>

                  {result.risk_score > 70 && (
                    <div className="bg-danger/8 border border-danger/25 p-3 rounded-lg flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-danger font-bold text-xs">Automated Response Triggered</p>
                        <p className="text-danger/70 text-[10px] mt-0.5">Session terminated. IP flagged. Security team notified.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
