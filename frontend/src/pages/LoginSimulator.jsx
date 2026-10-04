import React, { useState } from 'react';
import { authAPI } from '../services/api';
import { 
  Shield, ShieldAlert, CheckCircle2, XCircle, Zap, Cpu, 
  Globe, Smartphone, AlertTriangle, HelpCircle, Activity, Info
} from 'lucide-react';

const PRESETS = [
  {
    id: 'normal',
    name: 'Normal Login',
    icon: CheckCircle2,
    badge: 'Risk ~0',
    data: {
      user_id: 'USR001',
      email: 'usr001@demo.com',
      ip_address: '192.168.1.100',
      device_type: 'Desktop',
      browser: 'Chrome 120',
      location: 'New York, USA',
      login_hour: 14,
      failed_attempts: 0,
      login_frequency: 1,
      time_since_last_login: 86400,
      is_new_ip: 0,
      is_new_device: 0,
      location_changed: 0,
      is_password_valid: true
    }
  },
  {
    id: 'brute',
    name: 'Brute Force',
    icon: ShieldAlert,
    badge: 'Risk >90',
    data: {
      user_id: 'USR001',
      email: 'usr001@demo.com',
      ip_address: '198.51.100.44',
      device_type: 'Desktop',
      browser: 'Firefox',
      location: 'New York, USA',
      login_hour: 14,
      failed_attempts: 6,
      login_frequency: 45,
      time_since_last_login: 10,
      is_new_ip: 1,
      is_new_device: 1,
      location_changed: 0,
      is_password_valid: false
    }
  },
  {
    id: 'impossible_travel',
    name: 'Impossible Travel',
    icon: Globe,
    badge: 'Risk >80',
    data: {
      user_id: 'USR001',
      email: 'usr001@demo.com',
      ip_address: '45.12.33.11',
      device_type: 'Desktop',
      browser: 'Opera',
      location: 'Moscow, RU',
      login_hour: 14,
      failed_attempts: 0,
      login_frequency: 2,
      time_since_last_login: 3,
      is_new_ip: 1,
      is_new_device: 1,
      location_changed: 1,
      is_password_valid: true
    }
  },
  {
    id: 'account_takeover',
    name: 'Account Takeover (Tor)',
    icon: AlertTriangle,
    badge: 'Risk >75',
    data: {
      user_id: 'USR001',
      email: 'usr001@demo.com',
      ip_address: '185.220.101.45',
      device_type: 'Kali-Linux Headless',
      browser: 'Tor Browser',
      location: 'Unknown, Tor Exit',
      login_hour: 3,
      failed_attempts: 0,
      login_frequency: 3,
      time_since_last_login: 600,
      is_new_ip: 1,
      is_new_device: 1,
      location_changed: 1,
      is_password_valid: true
    }
  },
  {
    id: 'new_device',
    name: 'Unfamiliar Device',
    icon: Smartphone,
    badge: 'Risk ~45',
    data: {
      user_id: 'USR001',
      email: 'usr001@demo.com',
      ip_address: '192.168.1.188',
      device_type: 'Samsung-SmartTV-Tizen',
      browser: 'SmartTV Browser 4.0',
      location: 'New York, USA',
      login_hour: 14,
      failed_attempts: 0,
      login_frequency: 1,
      time_since_last_login: 86400,
      is_new_ip: 1,
      is_new_device: 1,
      location_changed: 0,
      is_password_valid: true
    }
  }
];

const LoginSimulator = () => {
  const [formData, setFormData] = useState(PRESETS[0].data);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const applyPreset = (preset) => {
    setFormData({ ...preset.data });
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await authAPI.analyze(formData);
      setResult(res);
    } catch (err) {
      setError(err.message || 'Analysis request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    }));
  };

  const getRiskColor = (score) => {
    if (score >= 80) return 'text-rose-400 bg-rose-950/40 border-rose-800/60';
    if (score >= 50) return 'text-amber-400 bg-amber-950/40 border-amber-800/60';
    if (score >= 30) return 'text-yellow-400 bg-yellow-950/40 border-yellow-800/60';
    return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white tracking-tight">Security Event Simulator & XAI Analyzer</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Real-Time Inference
          </span>
        </div>
        <p className="text-slate-400 text-sm mt-1">
          Simulate contextual login vectors, evaluate them through the multi-signal Risk Fusion Engine, and observe full mathematical Explainable AI (XAI) feature contributions.
        </p>
      </div>

      {/* Preset Quick-Buttons */}
      <div>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          Simulation Presets:
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2 transition-all hover:border-slate-500"
              >
                <Icon className="w-3.5 h-3.5 text-blue-400" />
                <span>{p.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">({p.badge})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid: Form & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: 7 cols */}
        <div className="lg:col-span-6 bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 shadow-lg">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            Request Context Parameters
          </h3>

          <form onSubmit={handleAnalyze} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target User ID</label>
                <input 
                  type="text" 
                  name="user_id" 
                  value={formData.user_id} 
                  onChange={handleChange} 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Client IP Address</label>
                <input 
                  type="text" 
                  name="ip_address" 
                  value={formData.ip_address} 
                  onChange={handleChange} 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Device Profile</label>
                <input 
                  type="text" 
                  name="device_type" 
                  value={formData.device_type} 
                  onChange={handleChange} 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Browser / Client</label>
                <input 
                  type="text" 
                  name="browser" 
                  value={formData.browser} 
                  onChange={handleChange} 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Geolocation</label>
                <input 
                  type="text" 
                  name="location" 
                  value={formData.location} 
                  onChange={handleChange} 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Login Hour (0-23)</label>
                <input 
                  type="number" 
                  name="login_hour" 
                  min="0" 
                  max="23" 
                  value={formData.login_hour} 
                  onChange={handleChange} 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Failed Attempts</label>
                <input 
                  type="number" 
                  name="failed_attempts" 
                  min="0" 
                  value={formData.failed_attempts} 
                  onChange={handleChange} 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Velocity (freq/min)</label>
                <input 
                  type="number" 
                  name="login_frequency" 
                  min="1" 
                  value={formData.login_frequency} 
                  onChange={handleChange} 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Password Valid</label>
                <select
                  name="is_password_valid"
                  value={formData.is_password_valid ? "true" : "false"}
                  onChange={(e) => setFormData(p => ({ ...p, is_password_valid: e.target.value === "true" }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="true">True (Valid)</option>
                  <option value="false">False (Invalid)</option>
                </select>
              </div>
            </div>

            {/* Checkbox Flags */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/60 text-xs">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="is_new_ip" 
                  checked={formData.is_new_ip === 1} 
                  onChange={(e) => setFormData(p => ({ ...p, is_new_ip: e.target.checked ? 1 : 0 }))} 
                  className="rounded bg-slate-900 border-slate-700 text-blue-500"
                />
                Unfamiliar IP
              </label>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="is_new_device" 
                  checked={formData.is_new_device === 1} 
                  onChange={(e) => setFormData(p => ({ ...p, is_new_device: e.target.checked ? 1 : 0 }))} 
                  className="rounded bg-slate-900 border-slate-700 text-blue-500"
                />
                Unfamiliar Device
              </label>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="location_changed" 
                  checked={formData.location_changed === 1} 
                  onChange={(e) => setFormData(p => ({ ...p, location_changed: e.target.checked ? 1 : 0 }))} 
                  className="rounded bg-slate-900 border-slate-700 text-blue-500"
                />
                Location Jump
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-2.5 px-4 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 transition-colors shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>Evaluating Security Pipeline...</>
              ) : (
                <>Run Risk Fusion & AI Analysis</>
              )}
            </button>
          </form>
        </div>

        {/* Right Result: 6 cols */}
        <div className="lg:col-span-6 space-y-4">
          {error && (
            <div className="p-4 rounded-xl border border-rose-800/60 bg-rose-950/40 text-rose-300 text-xs">
              <strong>Error: </strong> {error}
            </div>
          )}

          {!result && !error && (
            <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-8 text-center flex flex-col items-center justify-center h-full min-h-[350px]">
              <Cpu className="w-12 h-12 text-slate-600 mb-3" />
              <h4 className="text-sm font-bold text-slate-300">Awaiting Simulation Request</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Choose a preset or customize parameters on the left, then click 'Run Risk Fusion & AI Analysis' to view complete XAI reasoning.
              </p>
            </div>
          )}

          {result && (
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-4 shadow-xl animate-fadeIn">
              {/* Top Decision Bar */}
              <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-700">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Enforced Policy Action</span>
                  <span className={`text-base font-extrabold tracking-wide ${
                    result.recommended_action === 'ALLOWED' ? 'text-emerald-400' :
                    result.recommended_action === 'FLAG_SUSPICIOUS' ? 'text-amber-400' :
                    result.recommended_action === 'ACCOUNT_LOCKED' ? 'text-rose-400' :
                    'text-rose-400'
                  }`}>
                    {result.recommended_action}
                  </span>
                </div>
                <div className={`px-4 py-2 rounded-xl border flex items-center gap-2.5 ${getRiskColor(result.risk_score)}`}>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold block opacity-80">Risk Score</span>
                    <span className="text-xl font-black">{result.risk_score}/100</span>
                  </div>
                </div>
              </div>

              {/* ML Meta */}
              <div className="grid grid-cols-2 gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">ML Prediction</span>
                  <span className="font-bold text-white">{result.prediction}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Model Confidence</span>
                  <span className="font-bold text-white">{Math.round((result.confidence || 0.85) * 100)}%</span>
                </div>
              </div>

              {/* Explainable AI Reasons */}
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-400" />
                  XAI Decision Explanations:
                </h4>
                <ul className="space-y-1.5">
                  {result.reasons && result.reasons.map((r, i) => (
                    <li key={i} className="text-xs text-slate-300 bg-slate-900/50 px-3 py-1.5 rounded border border-slate-800 flex items-start gap-2">
                      <span className="text-blue-400 font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Direct Next Step */}
              <div className="pt-2 border-t border-slate-700/60 flex justify-between items-center text-xs">
                <span className="text-slate-400">Recorded to database in real-time.</span>
                <a href="/history" className="text-blue-400 hover:text-blue-300 font-semibold underline">
                  View in Login History &rarr;
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginSimulator;
