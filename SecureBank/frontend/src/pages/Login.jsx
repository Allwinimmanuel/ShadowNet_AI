import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = "http://localhost:8001/api";

const Login = () => {
  const [username, setUsername] = useState('demo_user');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [securityStatus, setSecurityStatus] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e, forceScenario = null) => {
    e.preventDefault();
    setLoading(true);
    setSecurityStatus({
      status: "Analyzing...",
      prediction: "PENDING",
      riskScore: "-",
      decision: "PENDING",
      reason: "Evaluating login context..."
    });

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        username: forceScenario === "brute_force" ? "demo_user" : username,
        password: forceScenario === "brute_force" ? "wrongpass" : password
      });

      const { action, prediction, risk_score, reasons } = response.data;
      const reasonStr = (reasons && reasons.length > 0) ? reasons.join(', ') : "Normal login activity";

      setSecurityStatus({
        status: response.data.message,
        prediction: prediction || "NORMAL",
        riskScore: risk_score !== undefined ? risk_score : "-",
        decision: action || "ALLOW",
        reason: reasonStr
      });

      if (response.data.success) {
        localStorage.setItem("securebank_token", response.data.token);
        localStorage.setItem("securebank_username", forceScenario === "brute_force" ? "demo_user" : username);
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        const detail = err.response.data.detail;
        
        let msg = "Login Failed";
        if (err.response.status === 403) msg = "Login prevented";
        
        const action = detail.action || "DENIED";
        const prediction = detail.prediction || "SUSPICIOUS";
        const risk_score = detail.risk_score !== undefined ? detail.risk_score : "-";
        const reasons = detail.reasons || [];
        const reasonStr = (reasons.length > 0) ? reasons.join(', ') : detail.message || "Access denied";

        setSecurityStatus({
          status: msg,
          prediction: prediction,
          riskScore: risk_score,
          decision: action,
          reason: reasonStr
        });
      } else {
         setSecurityStatus({
          status: "Error",
          prediction: "UNKNOWN",
          riskScore: "-",
          decision: "ERROR",
          reason: "Network or server error"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8">
        
        {/* Login Form */}
        <div className="bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">SecureBank</h2>
            <p className="text-slate-400">Sign in to your account</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all ${
                loading ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Developer Testing Scenarios */}
          <div className="mt-8 pt-6 border-t border-slate-700">
            <p className="text-xs text-slate-500 mb-4 uppercase tracking-wider font-semibold">Security Testing Scenarios</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={(e) => handleLogin(e, 'normal')} className="text-xs py-2 px-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded">Normal Login</button>
              <button onClick={(e) => handleLogin(e, 'brute_force')} className="text-xs py-2 px-3 bg-red-900/30 border border-red-800 hover:bg-red-900/50 text-red-400 rounded">Brute Force Attack</button>
            </div>
          </div>
        </div>

        {/* Security Status Panel */}
        <div className="bg-slate-950 p-8 rounded-xl border border-slate-800 flex flex-col justify-center">
          <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center">
            <span className="w-2 h-2 rounded-full bg-blue-500 mr-3 animate-pulse"></span>
            ShadowNet AI Analysis
          </h3>
          
          {!securityStatus ? (
            <div className="text-slate-500 text-center py-12 border border-dashed border-slate-800 rounded-lg">
              Waiting for login attempt...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Status</div>
                <div className={`font-semibold ${
                  securityStatus.decision === 'ALLOW' ? 'text-emerald-400' : 
                  securityStatus.decision === 'BLOCKED' ? 'text-red-400' : 'text-amber-400'
                }`}>
                  {securityStatus.status}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Prediction</div>
                  <div className="text-slate-200 font-mono">{securityStatus.prediction}</div>
                </div>
                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Risk Score</div>
                  <div className="text-slate-200 font-mono">{securityStatus.riskScore} / 100</div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Decision</div>
                <div className={`font-bold tracking-wider ${
                  securityStatus.decision === 'ALLOW' ? 'text-emerald-500' : 
                  securityStatus.decision === 'BLOCKED' ? 'text-red-500' : 'text-amber-500'
                }`}>
                  {securityStatus.decision}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Reason</div>
                <div className="text-slate-300 text-sm">{securityStatus.reason}</div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Login;
