import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  ShieldAlert, 
  LayoutDashboard, 
  Activity, 
  Search, 
  Cpu, 
  BarChart3, 
  Settings,
  Bell,
  User,
  ShieldCheck,
  Wifi,
  AlertTriangle
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useState, useEffect } from 'react';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

import { Dashboard } from './pages/Dashboard';
import { SecurityLogs } from './pages/SecurityLogs';
import { AISimulator } from './pages/AISimulator';
import { Investigation } from './pages/Investigation';
import { Analytics } from './pages/Analytics';
import { ModelInsights } from './pages/ModelInsights';

const SidebarItem = ({ icon: Icon, label, to, badge }: { icon: any, label: string, to: string, badge?: number }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative",
        isActive 
          ? "bg-primary/15 text-primary border border-primary/25 shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
          : "text-gray-500 hover:text-gray-200 hover:bg-surface-2 border border-transparent"
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
      )}
      <Icon className={cn("w-4 h-4 transition-all duration-200", isActive ? "glow-primary text-primary" : "group-hover:text-gray-300")} />
      <span className="font-medium text-sm">{label}</span>
      {badge && badge > 0 && (
        <span className="ml-auto w-5 h-5 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
          {badge}
        </span>
      )}
    </Link>
  );
};

function AppLayout() {
  const [alerts, setAlerts] = useState(3);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 border-r border-gray-800/50 bg-surface/40 backdrop-blur-xl flex flex-col z-20 shrink-0">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-gray-800/50 gap-3">
          <div className="relative">
            <ShieldAlert className="w-8 h-8 text-danger glow-danger" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border-2 border-surface animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-white tracking-widest text-sm leading-tight">SHADOWNET</span>
            <span className="text-[9px] text-gray-500 uppercase tracking-[0.2em] font-semibold">AI Command Center</span>
          </div>
        </div>
        
        {/* Live clock */}
        <div className="px-5 py-3 border-b border-gray-800/30">
          <div className="flex items-center gap-2">
            <Wifi className="w-3 h-3 text-success" />
            <span className="text-[10px] font-mono text-success/80 tracking-wider">
              {currentTime.toLocaleTimeString()}
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          <p className="text-[9px] text-gray-600 uppercase tracking-[0.2em] font-semibold px-4 mb-2">Operations</p>
          <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" />
          <SidebarItem icon={Activity} label="Security Logs" to="/logs" badge={alerts} />
          <SidebarItem icon={Search} label="Investigation" to="/investigation" />
          
          <p className="text-[9px] text-gray-600 uppercase tracking-[0.2em] font-semibold px-4 mb-2 mt-4">Intelligence</p>
          <SidebarItem icon={Cpu} label="AI Simulator" to="/simulator" />
          <SidebarItem icon={BarChart3} label="Analytics" to="/analytics" />
          <SidebarItem icon={ShieldCheck} label="Model Insights" to="/insights" />
        </nav>
        
        {/* Threat Level Indicator */}
        <div className="p-3 mx-3 mb-3 rounded-lg bg-danger/8 border border-danger/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-danger" />
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Threat Level</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => (
                <div key={i} className={`w-5 h-1.5 rounded-full ${i <= 4 ? 'bg-danger shadow-[0_0_4px_rgba(239,68,68,0.8)]' : 'bg-gray-700'}`} />
              ))}
            </div>
            <span className="text-xs text-danger font-bold">CRITICAL</span>
          </div>
        </div>
        
        <div className="p-3 border-t border-gray-800/50">
          <Link to="/settings" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-500 hover:text-white hover:bg-surface-2 transition-colors text-sm">
            <Settings className="w-4 h-4" />
            <span className="font-medium">Settings</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 border-b border-gray-800/50 bg-surface/20 backdrop-blur-xl flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              <span className="text-xs font-semibold text-success/90 uppercase tracking-widest">Live Monitoring</span>
            </div>
            <div className="w-px h-4 bg-gray-800" />
            <span className="text-xs text-gray-600 font-mono">1,000 events indexed</span>
          </div>
          
          <div className="flex items-center gap-3 text-gray-400">
            <button 
              onClick={() => setAlerts(0)}
              className="p-2 hover:bg-surface-2 hover:text-white rounded-lg transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              {alerts > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full border border-surface animate-pulse" />
              )}
            </button>
            <div className="w-px h-5 bg-gray-800" />
            <button className="flex items-center gap-2 hover:text-white transition-colors">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/40 to-purple/40 border border-gray-700 flex items-center justify-center">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-medium hidden md:block text-gray-300">SOC Analyst</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto cyber-grid">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/logs" element={<SecurityLogs />} />
            <Route path="/investigation" element={<Investigation />} />
            <Route path="/simulator" element={<AISimulator />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/insights" element={<ModelInsights />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
