import React from 'react';
import { exportAPI } from '../services/api';
import { Download, FileText, ShieldAlert, Activity } from 'lucide-react';

const ReportCard = ({ title, description, icon, url }) => (
  <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col justify-between">
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-900/30 text-blue-400 rounded-lg">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
      </div>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
    <a 
      href={url}
      download
      className="mt-6 flex items-center justify-center gap-2 w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-lg transition-colors"
    >
      <Download className="w-4 h-4" /> Download CSV
    </a>
  </div>
);

const Reports = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Security Reports & Exports</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ReportCard 
          title="Login Attempts" 
          description="Export all historical login attempts, including ML predictions and risk scores."
          icon={<Activity />}
          url={exportAPI.getLoginsUrl()}
        />
        <ReportCard 
          title="Security Incidents" 
          description="Export all security incidents, their severities, and resolution statuses."
          icon={<ShieldAlert />}
          url={exportAPI.getIncidentsUrl()}
        />
        <ReportCard 
          title="Audit Logs" 
          description="Export system audit logs tracking administrator actions and system changes."
          icon={<FileText />}
          url={exportAPI.getAuditLogsUrl()}
        />
      </div>
    </div>
  );
};

export default Reports;
