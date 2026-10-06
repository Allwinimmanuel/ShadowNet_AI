import { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Users, Server, Activity, TrendingUp, Clock, Zap } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

const mockActivityData = [
  { time: '08:00', normal: 1200, suspicious: 12 },
  { time: '09:00', normal: 1800, suspicious: 45 },
  { time: '10:00', normal: 2400, suspicious: 15 },
  { time: '11:00', normal: 2100, suspicious: 8 },
  { time: '12:00', normal: 1900, suspicious: 50 },
  { time: '13:00', normal: 1700, suspicious: 110 },
  { time: '14:00', normal: 2000, suspicious: 143 },
];

const mockThreatData = [
  { name: 'Account\nTakeover', value: 45, color: '#ef4444' },
  { name: 'Insider\nThreat', value: 20, color: '#f59e0b' },
  { name: 'Ransomware', value: 5, color: '#8b5cf6' },
  { name: 'Brute\nForce', value: 30, color: '#3b82f6' },
];

const recentAlerts = [
  { id: 1, type: 'Brute Force', user: 'user_14', ip: '45.33.22.11', score: 94.2, time: '2 min ago' },
  { id: 2, type: 'Data Exfiltration', user: 'user_7', ip: '185.22.44.11', score: 98.5, time: '8 min ago' },
  { id: 3, type: 'Insider Threat', user: 'user_3', ip: '10.0.0.5', score: 78.1, time: '21 min ago' },
];

// Animated counter hook
function useCounter(target: number, duration: number = 1500) {
  const [count, setCount] = useState(0);
  const start = useRef<number>(0);
  useEffect(() => {
    start.current = 0;
    const step = (timestamp: number) => {
      if (!start.current) start.current = timestamp;
      const progress = Math.min((timestamp - start.current) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return count;
}

const StatCard = ({ title, value, icon: Icon, color, isCritical, suffix = '', prefix = '' }: any) => (
  <div className={`glass-card p-5 relative overflow-hidden group transition-all duration-300 hover:scale-[1.02]`}>
    {isCritical && (
      <>
        <div className="absolute top-0 right-0 w-40 h-40 bg-danger/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none animate-pulse" />
        <div className="absolute inset-0 rounded-xl border border-danger/20 pointer-events-none" />
      </>
    )}
    <div className="flex justify-between items-start mb-3">
      <div className={`p-2.5 rounded-lg bg-${color}/10 border border-${color}/20 text-${color} transition-transform duration-300 group-hover:scale-110`}>
        <Icon className={`w-5 h-5 ${isCritical ? 'glow-danger' : ''}`} />
      </div>
      {isCritical && (
        <span className="text-[9px] px-2 py-0.5 rounded-full bg-danger/15 text-danger border border-danger/25 font-bold tracking-widest animate-pulse">
          CRITICAL
        </span>
      )}
    </div>
    <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-1">{title}</p>
    <h3 className={`text-3xl font-black ${isCritical ? 'text-danger glow-danger' : 'text-white'}`}>
      {prefix}{value}{suffix}
    </h3>
  </div>
);

export const Dashboard = () => {
  const [stats, setStats] = useState({
    risk_score: 87,
    threat_level: "HIGH",
    events_analyzed: 12458,
    high_risk_users: 4,
    suspicious_ips: 17
  });

  const riskScore = useCounter(stats.risk_score);
  const eventsCount = useCounter(stats.events_analyzed);
  const usersCount = useCounter(stats.high_risk_users);
  const ipsCount = useCounter(stats.suspicious_ips);

  useEffect(() => {
    fetch('http://localhost:8000/api/dashboard/summary')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => {});
  }, []);

  return (
    <div className="p-6 h-full flex flex-col gap-5 overflow-y-auto pb-20">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black glow-text mb-1">SOC Dashboard</h1>
          <p className="text-gray-500 text-sm flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            Real-time predictive threat monitoring
          </p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-bold tracking-wider ${
          stats.risk_score > 80 
            ? 'bg-danger/10 border-danger/30 text-danger' 
            : 'bg-warning/10 border-warning/30 text-warning'
        }`}>
          <Zap className="w-4 h-4" />
          OVERALL THREAT LEVEL: {stats.threat_level}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Risk Score" value={riskScore} suffix="/100" icon={ShieldAlert} color="danger" isCritical={stats.risk_score > 80} />
        <StatCard title="Events Analyzed" value={eventsCount.toLocaleString()} icon={Activity} color="primary" />
        <StatCard title="High-Risk Users" value={usersCount} icon={Users} color="warning" />
        <StatCard title="Suspicious IPs" value={ipsCount} icon={Server} color="danger" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Timeline */}
        <div className="glass-card p-5 lg:col-span-2 flex flex-col gap-3 scan-line">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-200 flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-primary" />
              Security Events Timeline
            </h2>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary inline-block" />Normal</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-danger inline-block" />Suspicious</span>
            </div>
          </div>
          <div className="flex-1 min-h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockActivityData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradNormal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradSuspicious" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#374151" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#374151" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f0f14', borderColor: '#374151', borderRadius: '10px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="normal" stroke="#3b82f6" fill="url(#gradNormal)" strokeWidth={2} />
                <Area type="monotone" dataKey="suspicious" stroke="#ef4444" fill="url(#gradSuspicious)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Threat Signatures */}
        <div className="glass-card p-5 flex flex-col gap-3">
          <h2 className="font-bold text-gray-200 flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-warning" />
            Active Threat Signatures
          </h2>
          <div className="flex-1 min-h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockThreatData} layout="vertical" margin={{ top: 0, right: 5, left: 10, bottom: 0 }} barSize={10}>
                <XAxis type="number" stroke="#374151" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" stroke="#374151" fontSize={10} tickLine={false} axisLine={false} width={70} />
                <Tooltip contentStyle={{ backgroundColor: '#0f0f14', borderColor: '#374151', borderRadius: '10px', fontSize: '12px' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {mockThreatData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="glass-card p-5">
        <h2 className="font-bold text-gray-200 flex items-center gap-2 text-sm mb-4">
          <ShieldAlert className="w-4 h-4 text-danger" />
          Recent High-Risk Alerts
        </h2>
        <div className="flex flex-col gap-2">
          {recentAlerts.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between py-3 px-4 rounded-lg bg-surface/50 border border-gray-800/50 hover:border-danger/20 transition-colors group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                <span className="text-sm font-semibold text-gray-200">{alert.type}</span>
                <span className="text-xs text-gray-500 font-mono">{alert.user} @ {alert.ip}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-600">{alert.time}</span>
                <span className="text-danger font-bold text-sm">{alert.score}</span>
                <span className="threat-badge-critical text-[10px] py-0.5">THREAT</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
