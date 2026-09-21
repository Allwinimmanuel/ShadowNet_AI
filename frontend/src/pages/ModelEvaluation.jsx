import React, { useEffect, useState } from 'react';
import { systemAPI } from '../services/api';
import { Activity, CheckCircle, Target, TrendingUp } from 'lucide-react';

const StatCard = ({ title, value, icon, subtitle }) => (
  <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-blue-900/30 text-blue-400 rounded-lg">
        {icon}
      </div>
      <div>
        <p className="text-slate-400 text-sm">{title}</p>
        <h3 className="text-2xl font-bold text-white">{value}</h3>
      </div>
    </div>
    {subtitle && <p className="text-xs text-slate-500 mt-4">{subtitle}</p>}
  </div>
);

const ModelEvaluation = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await systemAPI.getMetrics();
        setMetrics(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) return <div className="p-6 text-slate-300">Loading model metrics...</div>;
  if (!metrics || !metrics.metrics || !metrics.metrics.accuracy) return <div className="p-6 text-slate-300">Model metrics not available. Ensure the ML model is trained.</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Model Evaluation Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Accuracy" 
          value={`${(metrics.metrics.accuracy * 100).toFixed(2)}%`}
          icon={<Target />}
          subtitle="Overall correct predictions"
        />
        <StatCard 
          title="Precision" 
          value={`${(metrics.metrics.precision * 100).toFixed(2)}%`}
          icon={<CheckCircle />}
          subtitle="True positive rate"
        />
        <StatCard 
          title="Recall" 
          value={`${(metrics.metrics.recall * 100).toFixed(2)}%`}
          icon={<Activity />}
          subtitle="Actual positives identified"
        />
        <StatCard 
          title="F1 Score" 
          value={`${(metrics.metrics.f1_score * 100).toFixed(2)}%`}
          icon={<TrendingUp />}
          subtitle="Harmonic mean of P & R"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Feature Importance</h3>
          <div className="space-y-4">
            {metrics.feature_importance && Object.entries(metrics.feature_importance)
              .sort(([,a], [,b]) => b - a)
              .map(([feature, importance]) => (
              <div key={feature}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{feature.replace('_', ' ').toUpperCase()}</span>
                  <span className="text-slate-400">{(importance * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${importance * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Confusion Matrix</h3>
          <div className="bg-slate-900 p-4 rounded-lg flex items-center justify-center">
            {metrics.confusion_matrix ? (
              <table className="text-center text-sm border-collapse">
                <tbody>
                  <tr>
                    <td className="p-2"></td>
                    <td className="p-2 text-slate-400 font-semibold border-b border-slate-700">Predicted NORMAL</td>
                    <td className="p-2 text-slate-400 font-semibold border-b border-slate-700">Predicted ANOMALY</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-slate-400 font-semibold border-r border-slate-700">Actual NORMAL</td>
                    <td className="p-4 bg-blue-900/20 text-blue-400 font-bold">{metrics.confusion_matrix[0][0]}</td>
                    <td className="p-4 bg-slate-800 text-slate-300">{metrics.confusion_matrix[0][1]}</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-slate-400 font-semibold border-r border-slate-700">Actual ANOMALY</td>
                    <td className="p-4 bg-slate-800 text-slate-300">{metrics.confusion_matrix[1][0]}</td>
                    <td className="p-4 bg-red-900/20 text-red-400 font-bold">{metrics.confusion_matrix[1][1]}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div className="text-slate-500">Not available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelEvaluation;
