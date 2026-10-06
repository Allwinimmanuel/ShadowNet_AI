import { Activity, MapPin } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const timelineData = [
  { name: 'Mon', attacks: 4000, blocked: 2400 },
  { name: 'Tue', attacks: 3000, blocked: 1398 },
  { name: 'Wed', attacks: 2000, blocked: 9800 },
  { name: 'Thu', attacks: 2780, blocked: 3908 },
  { name: 'Fri', attacks: 1890, blocked: 4800 },
  { name: 'Sat', attacks: 2390, blocked: 3800 },
  { name: 'Sun', attacks: 3490, blocked: 4300 },
];

const geoData = [
  { region: 'North America', threats: 45 },
  { region: 'Europe', threats: 25 },
  { region: 'Asia Pacific', threats: 15 },
  { region: 'South America', threats: 10 },
  { region: 'Africa', threats: 5 },
];

const PIE_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

export const Analytics = () => {
  return (
    <div className="p-8 h-full flex flex-col gap-6 overflow-y-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold glow-text mb-2">Global Analytics</h1>
          <p className="text-gray-400">Macro-level threat trends and system-wide security posture.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Threat Timeline */}
        <div className="glass-card p-6 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-gray-200 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            7-Day Threat Volume vs Blocked
          </h2>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorAttacks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#374151" fontSize={12} tickLine={false} />
                <YAxis stroke="#374151" fontSize={12} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#374151' }} />
                <Area type="monotone" dataKey="attacks" stroke="#ef4444" fillOpacity={1} fill="url(#colorAttacks)" />
                <Area type="monotone" dataKey="blocked" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBlocked)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Geo Distribution */}
        <div className="glass-card p-6 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-gray-200 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-warning" />
            Geographical Threat Distribution
          </h2>
          <div className="flex items-center justify-center h-[250px] w-full">
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie
                  data={geoData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="threats"
                  stroke="none"
                >
                  {geoData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#374151' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 flex flex-col justify-center gap-3">
              {geoData.map((item, index) => (
                <div key={item.region} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index] }}></div>
                    <span className="text-sm text-gray-300">{item.region}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-400">{item.threats}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
