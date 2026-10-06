import { ShieldCheck, Cpu, TrendingUp, Target, Zap } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const radarData = [
  { subject: 'Precision', A: 94 },
  { subject: 'Recall', A: 88 },
  { subject: 'F1 Score', A: 91 },
  { subject: 'Specificity', A: 96 },
  { subject: 'AUC-ROC', A: 97 },
];

const confusionData = [
  { label: 'True Negative', value: 940 },
  { label: 'False Positive', value: 12 },
  { label: 'False Negative', value: 8 },
  { label: 'True Positive', value: 40 },
];

const BAR_COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

const MetricCard = ({ icon: Icon, title, value, sub, color }: any) => (
  <div className="glass-card p-5 flex items-start gap-4">
    <div className={`p-3 rounded-lg bg-${color}/10 border border-${color}/20 text-${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-gray-400 text-sm">{title}</p>
      <p className={`text-2xl font-bold text-${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  </div>
);

export const ModelInsights = () => {
  return (
    <div className="p-8 h-full flex flex-col gap-6 overflow-y-auto pb-20">
      <div>
        <h1 className="text-3xl font-bold glow-text mb-2">Model Insights</h1>
        <p className="text-gray-400">Real-time performance metrics of the Isolation Forest anomaly detector.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Target} title="Precision" value="94.2%" sub="Low false positive rate" color="primary" />
        <MetricCard icon={TrendingUp} title="Recall" value="88.0%" sub="Threats correctly detected" color="success" />
        <MetricCard icon={Zap} title="F1 Score" value="91.0%" sub="Harmonic mean P/R" color="warning" />
        <MetricCard icon={ShieldCheck} title="AUC-ROC" value="97.3%" sub="Model discrimination" color="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Radar Chart */}
        <div className="glass-card p-6 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-gray-200 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            Performance Radar
          </h2>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 13 }} />
                <Radar
                  name="Model"
                  dataKey="A"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confusion Matrix */}
        <div className="glass-card p-6 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-gray-200 flex items-center gap-2">
            <Target className="w-5 h-5 text-success" />
            Confusion Matrix Breakdown
          </h2>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={confusionData} layout="vertical" barSize={28}>
                <XAxis type="number" stroke="#374151" fontSize={12} tickLine={false} />
                <YAxis type="category" dataKey="label" stroke="#374151" fontSize={12} tickLine={false} width={110} />
                <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#374151' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {confusionData.map((_entry, index) => (
                    <rect key={index} fill={BAR_COLORS[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Model Info Card */}
      <div className="glass-card p-6 border border-primary/20">
        <h2 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-warning" />
          Model Architecture
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-surface/50 p-4 rounded-lg border border-gray-800">
            <p className="text-gray-500 text-xs mb-1">Algorithm</p>
            <p className="text-white font-semibold">Isolation Forest</p>
          </div>
          <div className="bg-surface/50 p-4 rounded-lg border border-gray-800">
            <p className="text-gray-500 text-xs mb-1">Estimators</p>
            <p className="text-white font-semibold">100 Trees</p>
          </div>
          <div className="bg-surface/50 p-4 rounded-lg border border-gray-800">
            <p className="text-gray-500 text-xs mb-1">Contamination</p>
            <p className="text-white font-semibold">5% (Auto)</p>
          </div>
          <div className="bg-surface/50 p-4 rounded-lg border border-gray-800">
            <p className="text-gray-500 text-xs mb-1">Training Data</p>
            <p className="text-white font-semibold">1,000 Events</p>
          </div>
        </div>
      </div>
    </div>
  );
};
