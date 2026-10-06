import { ShieldAlert, Crosshair, Globe, Network, Cpu } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const mockNetworkData = [
  { time: '13:00', packets: 120 },
  { time: '13:15', packets: 450 },
  { time: '13:30', packets: 2100 }, // Anomaly peak
  { time: '13:45', packets: 3400 },
  { time: '14:00', packets: 150 },
];

export const Investigation = () => {
  return (
    <div className="p-8 h-full flex flex-col gap-6 overflow-y-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold glow-text mb-2">Threat Investigation</h1>
          <p className="text-gray-400">Deep-dive analysis of isolated anomalous events.</p>
        </div>
        <div className="px-4 py-2 bg-danger/10 border border-danger/30 rounded-lg text-danger font-medium flex items-center gap-2">
          <Crosshair className="w-5 h-5 animate-pulse" />
          ACTIVE INCIDENT: #INC-8942
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident Details Card */}
        <div className="glass-card p-6 lg:col-span-1 border border-danger/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-danger/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-danger" />
            Incident Context
          </h2>
          
          <div className="flex flex-col gap-4">
            <div className="bg-surface/50 p-3 rounded-lg border border-gray-800">
              <p className="text-xs text-gray-500 mb-1 uppercase">Predicted Threat Vector</p>
              <p className="text-danger font-bold">Mass Data Exfiltration</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface/50 p-3 rounded-lg border border-gray-800">
                <p className="text-xs text-gray-500 mb-1 uppercase">AI Confidence</p>
                <p className="text-white font-mono">94.2%</p>
              </div>
              <div className="bg-surface/50 p-3 rounded-lg border border-gray-800">
                <p className="text-xs text-gray-500 mb-1 uppercase">Risk Score</p>
                <p className="text-danger font-bold">98.5/100</p>
              </div>
            </div>

            <div className="bg-surface/50 p-3 rounded-lg border border-gray-800">
              <p className="text-xs text-gray-500 mb-1 uppercase">Compromised Asset</p>
              <div className="flex items-center gap-2 mt-1">
                <Globe className="w-4 h-4 text-gray-400" />
                <p className="text-white font-mono text-sm">185.22.44.11 (Moscow, RU)</p>
              </div>
            </div>

            <div className="bg-surface/50 p-3 rounded-lg border border-gray-800">
              <p className="text-xs text-gray-500 mb-1 uppercase">User Account</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-5 h-5 rounded-full bg-danger/20 flex items-center justify-center text-[10px] text-danger border border-danger/30">
                  U7
                </div>
                <p className="text-white text-sm">user_7_account (Suspended)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Telemetry and Explanation */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* AI Explanation Node */}
          <div className="glass-card p-6 border border-primary/20">
            <h2 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" />
              AI Explainability (SHAP Values)
            </h2>
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-400 mb-2">Top features contributing to the anomaly classification:</p>
              
              <div className="flex items-center gap-3">
                <div className="w-32 text-xs text-gray-400 text-right">Data Download (MB)</div>
                <div className="flex-1 bg-gray-800 rounded-full h-2">
                  <div className="bg-danger h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <div className="w-12 text-xs text-danger font-mono">+4.2</div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-32 text-xs text-gray-400 text-right">Files Accessed</div>
                <div className="flex-1 bg-gray-800 rounded-full h-2">
                  <div className="bg-warning h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
                <div className="w-12 text-xs text-warning font-mono">+2.1</div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-32 text-xs text-gray-400 text-right">Failed Attempts</div>
                <div className="flex-1 bg-gray-800 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '15%' }}></div>
                </div>
                <div className="w-12 text-xs text-primary font-mono">-0.4</div>
              </div>
            </div>
          </div>

          {/* Network Spike Chart */}
          <div className="glass-card p-6 flex-1">
             <h2 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
              <Network className="w-5 h-5 text-gray-400" />
              Network Outbound Telemetry
            </h2>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockNetworkData}>
                  <defs>
                    <linearGradient id="colorPackets" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#374151" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#374151" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#171717', borderColor: '#374151', borderRadius: '8px' }}
                    itemStyle={{ color: '#ef4444' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="packets" 
                    stroke="#ef4444" 
                    fillOpacity={1} 
                    fill="url(#colorPackets)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
