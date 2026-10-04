import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Shield, Activity, List, AlertOctagon, Lock, Server,
  LogIn, Monitor, Brain, UserCheck, Network, Mail, AlertTriangle,
  ChevronDown, ChevronRight
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    label: 'Monitoring',
    items: [
      { to: '/',           icon: Activity,     label: 'Security Overview', exact: true },
      { to: '/monitor',    icon: Monitor,      label: 'Live Monitor' },
      { to: '/history',    icon: List,         label: 'Login History' },
    ],
  },
  {
    label: 'AI Intelligence',
    items: [
      { to: '/threat',       icon: Brain,       label: 'Threat Intelligence' },
      { to: '/ueba',         icon: UserCheck,   label: 'Behavior Analytics' },
      { to: '/user-risk',    icon: UserCheck,   label: 'User Risk Profile' },
      { to: '/attack-paths', icon: Network,     label: 'Attack Paths' },
    ],
  },
  {
    label: 'Future Extensions',
    items: [
      { to: '/phishing',    icon: Mail,        label: 'Phishing Analyzer' },
      { to: '/ransomware',  icon: AlertTriangle, label: 'Ransomware Monitor' },
    ],
  },
  {
    label: 'Response',
    items: [
      { to: '/incidents',   icon: AlertOctagon, label: 'Incidents' },
      { to: '/alerts',      icon: Shield,       label: 'Alert Center' },
      { to: '/prevention',  icon: Lock,         label: 'Prevention Center' },
      { to: '/simulator',   icon: Shield,       label: 'Security Simulator' },
      { to: '/status',      icon: Server,       label: 'API Status' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/audit',             icon: List,        label: 'Audit Logs' },
      { to: '/model-evaluation',  icon: Activity,    label: 'Model Evaluation' },
      { to: '/reports',           icon: Mail,        label: 'Reports & Exports' },
      { to: '/demo',              icon: Shield,      label: 'Demo Manager' },
    ],
  },
];

const Layout = () => {
  const [collapsed, setCollapsed] = useState({});

  const toggleSection = (label) => {
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-50 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 shadow-xl flex flex-col overflow-y-auto">
        {/* Brand */}
        <div className="p-5 flex items-center gap-3 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
          <div className="relative">
            <Shield className="text-blue-500 w-8 h-8" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-slate-800" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-tight">ShadowNet AI</h1>
            <p className="text-xs text-slate-500">Predict · Explain · Respond</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV_SECTIONS.map(section => (
            <div key={section.label} className="mb-1">
              <button
                onClick={() => toggleSection(section.label)}
                className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-400 transition-colors"
              >
                <span>{section.label}</span>
                {collapsed[section.label]
                  ? <ChevronRight className="w-3 h-3" />
                  : <ChevronDown className="w-3 h-3" />
                }
              </button>
              {!collapsed[section.label] && (
                <div className="space-y-0.5 mt-0.5">
                  {section.items.map(item => (
                    <NavItem key={item.to} {...item} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 text-xs text-slate-500 sticky bottom-0 bg-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium text-slate-400">ShadowNet AI v2.0</p>
              <p>Predict → Explain → Respond</p>
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/login';
              }}
              title="Logout"
              className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors"
            >
              <LogIn className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const NavItem = ({ to, icon: Icon, label, exact }) => (
  <NavLink
    to={to}
    end={exact}
    className={({ isActive }) =>
      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
        isActive
          ? 'bg-blue-600/20 text-blue-400 font-medium'
          : 'text-slate-400 hover:bg-slate-700 hover:text-white'
      }`
    }
  >
    {Icon ? <Icon className="w-4 h-4 flex-shrink-0" /> : <div className="w-4 h-4 flex-shrink-0 bg-slate-700 rounded-sm" />}
    <span>{label}</span>
  </NavLink>
);

export default Layout;
