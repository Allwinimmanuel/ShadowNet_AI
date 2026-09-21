import React, { useState } from 'react';
import { demoAPI } from '../services/api';
import { Play, Trash2 } from 'lucide-react';

const DemoManager = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  const scenarios = [
    { 
      id: 'NORMAL', 
      name: 'Normal Traffic', 
      desc: 'Simulates 3 standard, successful user logins from recognizable IPs.',
      action: 'Watch the Live Monitor to see them allowed instantly.' 
    },
    { 
      id: 'BRUTE_FORCE', 
      name: 'Brute Force Attack', 
      desc: 'Fires 12 rapid, failed login attempts against a single account using random passwords.',
      action: 'Watch the AI flag the activity and automatically block the IP.' 
    },
    { 
      id: 'CREDENTIAL_STUFFING', 
      name: 'Credential Stuffing', 
      desc: 'Tests a batch of common usernames against leaked passwords across multiple accounts.',
      action: 'Watch the AI detect the high-frequency probing and lock accounts.' 
    },
    { 
      id: 'ANOMALOUS_LOCATION', 
      name: 'Anomalous Location', 
      desc: 'Simulates a login attempt from a known Tor exit node in Moscow, Russia.',
      action: 'Watch the AI block the geographic anomaly despite correct credentials.' 
    },
  ];

  const handleScenario = async (scenarioId) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await demoAPI.triggerScenario(scenarioId);
      setMessage({ type: 'success', text: res.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to delete all demo data? This cannot be undone.')) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await demoAPI.resetData();
      setMessage({ type: 'success', text: res.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Demo Scenario Manager</h2>
        <p className="text-slate-400">
          Use this panel to simulate real-world traffic and attacks. When you trigger a scenario, a background script will instantly generate live HTTP requests against the SecureBank login endpoint. You can then navigate to the <strong className="text-blue-400">Live Monitor</strong> or <strong className="text-blue-400">Security Overview</strong> to watch the AI intercept and block the threats in real-time.
        </p>
      </div>
      
      {message && (
        <div className={`p-4 mb-6 rounded-lg border text-sm font-medium flex items-center justify-between ${
          message.type === 'success' 
            ? 'bg-green-900/30 border-green-800 text-green-300' 
            : 'bg-red-900/30 border-red-800 text-red-300'
        }`}>
          <div>{message.text}</div>
          {message.type === 'success' && (
             <a href="/live-monitor" className="text-blue-400 hover:text-blue-300 underline text-xs ml-4 whitespace-nowrap">
               Go to Live Monitor &rarr;
             </a>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {scenarios.map(s => (
          <div key={s.id} className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">{s.name}</h3>
              <p className="text-slate-400 text-sm mt-2">{s.desc}</p>
              <p className="text-slate-500 text-xs mt-3 italic bg-slate-900/50 p-2 rounded-md border border-slate-700/50">
                <span className="text-blue-400 font-semibold mr-1">Expected Outcome:</span> 
                {s.action}
              </p>
            </div>
            <button 
              onClick={() => handleScenario(s.id)}
              disabled={loading}
              className="mt-6 flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4" /> Trigger Scenario
            </button>
          </div>
        ))}
      </div>

      <div className="bg-red-900/20 border border-red-800 p-6 rounded-xl">
        <h3 className="text-lg font-bold text-red-400">Danger Zone</h3>
        <p className="text-slate-400 text-sm mt-2 mb-4">Resetting the database will delete all logins, incidents, blocks, and audit logs. This gives you a fresh slate for demonstrating the AI.</p>
        <button 
          onClick={handleReset}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 w-full sm:w-auto"
        >
          <Trash2 className="w-4 h-4" /> Reset All Data
        </button>
      </div>
    </div>
  );
};

export default DemoManager;
