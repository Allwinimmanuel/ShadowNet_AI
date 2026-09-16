import React, { useEffect, useState } from 'react';
import { systemAPI } from '../services/api';
import { Server, Activity, Database, CheckCircle, XCircle } from 'lucide-react';

const ApiStatus = () => {
  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const h = await systemAPI.getHealth();
      const m = await systemAPI.getMetrics();
      setHealth(h);
      setMetrics(m);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Server className="text-blue-500" /> API & System Status
        </h2>
        <button onClick={checkStatus} disabled={loading} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded text-sm disabled:opacity-50">
          Refresh Status
        </button>
      </div>
      
      {loading && <div className="text-slate-400">Checking system status...</div>}
      {error && <div className="bg-red-900/30 text-red-200 border border-red-800 p-4 rounded-lg flex items-center gap-2"><XCircle className="w-5 h-5" /> {error}</div>}
      
      {!loading && !error && health && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow flex items-center gap-4">
            <div className="p-4 bg-green-900/20 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold">FastAPI Backend</h3>
              <p className="text-green-400 font-medium">{health.status.toUpperCase()}</p>
              <p className="text-xs text-slate-500 mt-1">{health.message}</p>
            </div>
          </div>
          
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow flex items-center gap-4">
            <div className="p-4 bg-blue-900/20 rounded-full">
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Machine Learning Engine</h3>
              <p className="text-blue-400 font-medium">{metrics?.model_name || 'Online'}</p>
              <p className="text-xs text-slate-500 mt-1">Accuracy: {metrics?.metrics?.accuracy.toFixed(4) || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}
      
      {!loading && !error && metrics && (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow mt-8">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Database className="w-5 h-5 text-slate-400" /> Model Metadata</h3>
          <pre className="bg-slate-900 p-4 rounded text-xs text-slate-300 overflow-x-auto">
            {JSON.stringify(metrics, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ApiStatus;
