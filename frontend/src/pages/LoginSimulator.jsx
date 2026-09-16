import React, { useState } from 'react';
import { authAPI } from '../services/api';
import { Shield, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';

const LoginSimulator = () => {
  const [formData, setFormData] = useState({
    user_id: 'USR001',
    email: 'user@example.com',
    ip_address: '192.168.1.10',
    device_type: 'Chrome Windows',
    location: 'Chennai, India',
    login_hour: 10,
    failed_attempts: 0,
    login_frequency: 2,
    time_since_last_login: 86400,
    is_new_ip: 0,
    is_new_device: 0,
    location_changed: 0
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const applyPreset = (preset) => {
    const base = { ...formData };
    if (preset === 'normal') {
      setFormData({ ...base, failed_attempts: 0, is_new_ip: 0, is_new_device: 0, location_changed: 0, login_hour: 10 });
    } else if (preset === 'brute') {
      setFormData({ ...base, failed_attempts: 6, login_frequency: 50, is_new_ip: 1, is_new_device: 1, location_changed: 1 });
    } else if (preset === 'new_ip') {
      setFormData({ ...base, is_new_ip: 1, location_changed: 1, ip_address: '45.33.22.11', location: 'Unknown' });
    }
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Login Simulator</h2>
          <div className="space-x-2">
            <button type="button" onClick={() => applyPreset('normal')} className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded">Normal</button>
            <button type="button" onClick={() => applyPreset('brute')} className="px-3 py-1 text-xs bg-red-900/50 hover:bg-red-800/50 text-red-200 border border-red-800 rounded">Brute Force</button>
            <button type="button" onClick={() => applyPreset('new_ip')} className="px-3 py-1 text-xs bg-orange-900/50 hover:bg-orange-800/50 text-orange-200 border border-orange-800 rounded">New IP</button>
          </div>
        </div>
        
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">User ID</label>
              <input type="text" name="user_id" value={formData.user_id} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">IP Address</label>
              <input type="text" name="ip_address" value={formData.ip_address} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Failed Attempts (1-4=Suspicious, 5+=Lock)</label>
              <input type="number" name="failed_attempts" value={formData.failed_attempts} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Login Hour (Unusual: &lt;5 or &gt;22)</label>
              <input type="number" name="login_hour" value={formData.login_hour} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Is New IP (1=Yes, 0=No)</label>
              <input type="number" name="is_new_ip" value={formData.is_new_ip} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Is New Device (1=Yes, 0=No)</label>
              <input type="number" name="is_new_device" value={formData.is_new_device} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm" />
            </div>
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg mt-6 transition-colors disabled:opacity-50">
            {loading ? 'Analyzing...' : 'Analyze Login'}
          </button>
        </form>
      </div>

      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <h2 className="text-xl font-bold mb-6">Analysis Results</h2>
        
        {error && <div className="p-4 bg-red-900/30 border border-red-800 text-red-200 rounded-lg">{error}</div>}
        
        {!result && !error && !loading && (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500">
            <Shield className="w-16 h-16 mb-4 opacity-50" />
            <p>Submit a login simulation to see AI analysis.</p>
          </div>
        )}
        
        {result && (
          <div className="space-y-6">
            <div className={`p-6 rounded-xl border flex items-start gap-4 ${
              result.prediction === 'NORMAL' 
                ? 'bg-green-900/20 border-green-800/50' 
                : 'bg-red-900/20 border-red-800/50'
            }`}>
              {result.prediction === 'NORMAL' ? (
                <CheckCircle className="w-10 h-10 text-green-500 shrink-0" />
              ) : (
                <ShieldAlert className="w-10 h-10 text-red-500 shrink-0" />
              )}
              
              <div className="flex-1">
                <h3 className={`text-2xl font-bold ${result.prediction === 'NORMAL' ? 'text-green-400' : 'text-red-400'}`}>
                  {result.prediction}
                </h3>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-slate-400">Risk Score</p>
                    <p className="text-lg font-medium">{result.risk_score.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Action Taken</p>
                    <p className="text-lg font-medium">{result.recommended_action}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {result.reasons && result.reasons.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">Detection Reasons</h4>
                <ul className="space-y-2">
                  {result.reasons.map((r, i) => (
                    <li key={i} className="bg-slate-900 p-3 rounded border border-slate-700 text-sm flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-orange-500" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginSimulator;
