import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import SecurityOverview from './pages/SecurityOverview';
import LoginSimulator from './pages/LoginSimulator';
import LoginHistory from './pages/LoginHistory';
import Incidents from './pages/Incidents';
import PreventionCenter from './pages/PreventionCenter';
import ApiStatus from './pages/ApiStatus';
import Login from './pages/Login';
import LiveMonitor from './pages/LiveMonitor';
// New modules
import ThreatIntelligence from './pages/ThreatIntelligence';
import UEBADashboard from './pages/UEBADashboard';
import AttackPathVisualization from './pages/AttackPathVisualization';
import PhishingAnalyzer from './pages/PhishingAnalyzer';
import RansomwareMonitor from './pages/RansomwareMonitor';
// Placement Features
import AuditLogs from './pages/AuditLogs';
import AlertCenter from './pages/AlertCenter';
import ModelEvaluation from './pages/ModelEvaluation';
import DemoManager from './pages/DemoManager';
import Reports from './pages/Reports';
import Unauthorized from './pages/Unauthorized';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        <Route path="/" element={<ProtectedRoute requireAdmin={true} />}>
          <Route element={<Layout />}>
            <Route index element={<SecurityOverview />} />
            <Route path="simulator" element={<LoginSimulator />} />
            <Route path="monitor" element={<LiveMonitor />} />
            <Route path="history" element={<LoginHistory />} />
            <Route path="incidents" element={<Incidents />} />
            <Route path="prevention" element={<PreventionCenter />} />
            <Route path="status" element={<ApiStatus />} />
            {/* New routes */}
            <Route path="threat" element={<ThreatIntelligence />} />
            <Route path="ueba" element={<UEBADashboard />} />
            <Route path="attack-paths" element={<AttackPathVisualization />} />
            <Route path="phishing" element={<PhishingAnalyzer />} />
            <Route path="ransomware" element={<RansomwareMonitor />} />
            {/* Placement Features */}
            <Route path="audit" element={<AuditLogs />} />
            <Route path="alerts" element={<AlertCenter />} />
            <Route path="model-evaluation" element={<ModelEvaluation />} />
            <Route path="demo" element={<DemoManager />} />
            <Route path="reports" element={<Reports />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
