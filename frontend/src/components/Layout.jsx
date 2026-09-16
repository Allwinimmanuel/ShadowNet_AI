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
      { to: '/login',      icon: LogIn,        label: 'Login Page' },
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
      { to: '/attack-paths', icon: Network,     label: 'Attack Paths' },
    ],
  },
  {
    label: 'Threat Modules',
    items: [
      { to: '/phishing',    icon: Mail,        label: 'Phishing Analyzer' },
      { to: '/ransomware',  icon: AlertTriangle, label: 'Ransomware Monitor' },
    ],
  },
  {
    label: 'Response',
    items: [
      { to: '/incidents',   icon: AlertOctagon, label: 'Incidents' },
      { to: '/prevention',  icon: Lock,         label: 'Prevention Center' },
      { to: '/simulator',   icon: Shield,       label: 'Security Simulator' },
      { to: '/status',      icon: Server,       label: 'API Status' },
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
          <p className="font-medium text-slate-400">ShadowNet AI v2.0</p>
          <p>Predict → Explain → Respond</p>
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
    <Icon className="w-4 h-4 flex-shrink-0" />
    <span>{label}</span>
  </NavLink>
);

export default Layout;
