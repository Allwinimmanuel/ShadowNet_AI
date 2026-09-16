import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<SecurityOverview />} />
          <Route path="simulator" element={<LoginSimulator />} />
          <Route path="login" element={<Login />} />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
