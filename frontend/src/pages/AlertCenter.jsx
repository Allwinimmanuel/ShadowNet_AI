import React, { useEffect, useState } from 'react';
import { historyAPI } from '../services/api';
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';

const AlertCenter = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await historyAPI.getAlerts();
        setAlerts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  if (loading) return <div className="p-6 text-slate-300">Loading alerts...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Security Alert Center</h2>
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="text-slate-500">No active alerts.</div>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} className={`p-4 rounded-xl border flex items-start gap-4 ${
              alert.type === 'HIGH' ? 'bg-red-900/20 border-red-800' :
              alert.type === 'MEDIUM' ? 'bg-orange-900/20 border-orange-800' :
              'bg-blue-900/20 border-blue-800'
            }`}>
              <div className="mt-1">
                {alert.type === 'HIGH' ? <ShieldAlert className="text-red-400 w-6 h-6" /> :
                 alert.type === 'MEDIUM' ? <AlertTriangle className="text-orange-400 w-6 h-6" /> :
                 <Info className="text-blue-400 w-6 h-6" />}
              </div>
              <div>
                <h3 className={`font-semibold ${
                  alert.type === 'HIGH' ? 'text-red-300' :
                  alert.type === 'MEDIUM' ? 'text-orange-300' : 'text-blue-300'
                }`}>
                  {alert.message}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{new Date(alert.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertCenter;
