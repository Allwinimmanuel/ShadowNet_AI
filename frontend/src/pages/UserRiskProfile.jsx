import React, { useState, useEffect } from 'react';
import { 
  User, Shield, ShieldAlert, ShieldCheck, Clock, Laptop, 
  MapPin, Activity, AlertTriangle, Search, CheckCircle2, XCircle
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Area, AreaChart 
} from 'recharts';
import api from '../services/api';

const UserRiskProfile = () => {
  const [searchTerm, setSearchTerm] = useState('USR001');
  const [selectedUser, setSelectedUser] = useState('USR001');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUserReport = async (userId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/ueba/user/${userId}`);
      setReport(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch user risk profile.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserReport(selectedUser);
  }, [selectedUser]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSelectedUser(searchTerm.trim());
    }
  };

  const baseline = report?.baseline || {};
  const events = report?.recent_events || [];

  // Prepare chart data from events (reversed chronologically)
  const chartData = events.slice().reverse().map((ev, idx) => ({
    time: ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `T-${idx}`,
    riskScore: ev.risk_score || 0,
    anomalyScore: ev.anomaly_score || 0,
    action: ev.action_taken,
  }));

  const getRiskBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'HIGH': return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'MEDIUM': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default: return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">User Risk Profile & UEBA Baseline</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Entity Analytics
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Deep forensic behavioral baseline of individual user identities. Compares continuous authentication events against established user habits.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Search User (e.g. USR001)" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-56"
            />
          </div>
          <button 
            type="submit" 
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors"
          >
            Lookup
          </button>
        </form>
      </div>

      {loading && (
        <div className="p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
          <Activity className="w-4 h-4 animate-spin text-blue-400" />
          Loading user risk profile...
        </div>
      )}

      {error && !loading && (
        <div className="p-6 rounded-xl bg-slate-800 border border-slate-700 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-white mb-1">User Not Found or No History</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">{error}</p>
        </div>
      )}

      {!loading && report && (
        <>
          {/* Top User Summary Card */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <User className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white">{report.user_id}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getRiskBadge(report.anomaly_severity)}`}>
                    Risk Level: {report.anomaly_severity}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">{report.summary}</p>
              </div>
            </div>

            <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-700 pt-4 md:pt-0 md:pl-6 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Max Anomaly</span>
                <span className="text-lg font-bold text-white">{report.max_anomaly_score}%</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Sample History</span>
                <span className="text-lg font-bold text-white">{baseline.sample_size || 0} events</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Success Rate</span>
                <span className="text-lg font-bold text-emerald-400">{baseline.success_rate || 100}%</span>
              </div>
            </div>
          </div>

          {/* 4 Behavioral Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Active Hours */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Normal Login Window</span>
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-lg font-bold text-white">
                {baseline.typical_hour_range 
                  ? `${String(baseline.typical_hour_range.start).padStart(2, '0')}:00 – ${String(baseline.typical_hour_range.end).padStart(2, '0')}:00` 
                  : '09:00 – 18:00'}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Peak: {baseline.avg_hour ? `${baseline.avg_hour}:00` : '14:00'}</span>
            </div>

            {/* Card 2: Known Devices */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Verified Devices</span>
                <Laptop className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-lg font-bold text-white">
                {baseline.common_devices?.length || 1} Device(s)
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {baseline.common_devices && baseline.common_devices.map((d, i) => (
                  <span key={i} className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-300 border border-slate-800">
                    {d}
                  </span>
                ))}
              </div>
            </div>

            {/* Card 3: Known IPs */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Trusted IP Pool</span>
                <MapPin className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-lg font-bold text-white">
                {baseline.common_ips?.length || 1} Known IP(s)
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {baseline.common_ips && baseline.common_ips.map((ip, i) => (
                  <span key={i} className="text-[10px] bg-slate-900 font-mono px-1.5 py-0.5 rounded text-slate-300 border border-slate-800">
                    {ip}
                  </span>
                ))}
              </div>
            </div>

            {/* Card 4: Historical Risk */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Baseline Risk Avg</span>
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-lg font-bold text-white">
                {baseline.avg_risk || 0.0} / 100
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Standard deviation: ±4.2</span>
            </div>
          </div>

          {/* Risk History Timeline Chart */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                Continuous Risk Score Timeline (Past 20 Logins)
              </h3>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-slate-300">Risk Score</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <span className="text-slate-300">UEBA Deviation</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="anomGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="riskScore" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#riskGrad)" name="Risk Score" />
                  <Area type="monotone" dataKey="anomalyScore" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#anomGrad)" name="UEBA Anomaly %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Event Stream Table */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 shadow-lg">
            <h3 className="text-sm font-bold text-white mb-3">Recent Authentication Activity</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 uppercase text-[10px] font-semibold">
                    <th className="pb-2.5">Time</th>
                    <th className="pb-2.5">IP Address</th>
                    <th className="pb-2.5">Device</th>
                    <th className="pb-2.5">Hour</th>
                    <th className="pb-2.5">Action</th>
                    <th className="pb-2.5">Risk</th>
                    <th className="pb-2.5">Anomaly Reasons</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {events.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 text-slate-400">{ev.timestamp ? new Date(ev.timestamp).toLocaleString() : '—'}</td>
                      <td className="py-2.5 font-mono">{ev.ip_address}</td>
                      <td className="py-2.5">{ev.device_type}</td>
                      <td className="py-2.5">{ev.login_hour}:00</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                          ev.action_taken === 'ALLOWED' ? 'bg-emerald-500/20 text-emerald-300' :
                          ev.action_taken === 'FLAG_SUSPICIOUS' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-rose-500/20 text-rose-300'
                        }`}>
                          {ev.action_taken}
                        </span>
                      </td>
                      <td className="py-2.5 font-bold">{ev.risk_score}</td>
                      <td className="py-2.5 text-slate-300">
                        {ev.anomaly_reasons && ev.anomaly_reasons.length > 0 
                          ? ev.anomaly_reasons.join(', ')
                          : <span className="text-slate-500">Normal pattern</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserRiskProfile;
