import React, { useEffect, useState, useCallback } from 'react';
import { historyAPI } from '../services/api';
import api from '../services/api';
import {
  AlertOctagon, CheckCircle, RefreshCw, Shield, XCircle,
  Filter, ChevronDown, Clock, AlertTriangle
} from 'lucide-react';

const SEVERITY_CONFIG = {
  CRITICAL: { bg: 'bg-red-900/40', border: 'border-l-red-500', badge: 'bg-red-900/60 text-red-300 border border-red-700', dot: 'bg-red-500' },
  HIGH:     { bg: 'bg-orange-900/30', border: 'border-l-orange-500', badge: 'bg-orange-900/60 text-orange-300 border border-orange-700', dot: 'bg-orange-500' },
  MEDIUM:   { bg: 'bg-yellow-900/20', border: 'border-l-yellow-500', badge: 'bg-yellow-900/60 text-yellow-300 border border-yellow-700', dot: 'bg-yellow-500' },
  LOW:      { bg: 'bg-blue-900/20', border: 'border-l-blue-500', badge: 'bg-blue-900/60 text-blue-300 border border-blue-700', dot: 'bg-blue-500' },
};

const ACTION_LABEL = {
  ACCOUNT_LOCKED: 'Account Locked',
  BLOCK_IP:     'Block IP',
  BLOCKED_AND_DENIED: 'Blocked & Denied',
  DENIED: 'Denied',
  ALLOWED:  'Allowed',
  FLAG_SUSPICIOUS: 'Flagged Suspicious'
};

const Incidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(null);  // id being resolved
  const [resolvingAll, setResolvingAll] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchIncidents = useCallback(async () => {
    try {
      const data = await historyAPI.getIncidents();
      setIncidents(data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Incidents fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 10000);
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  const handleResolve = async (id) => {
    setResolving(id);
    try {
      await api.patch(`/incidents/${id}/resolve`);
      setIncidents(prev =>
        prev.map(inc => inc.id === id ? { ...inc, status: 'RESOLVED' } : inc)
      );
    } catch (err) {
      console.error('Resolve error:', err);
    } finally {
      setResolving(null);
    }
  };

  const handleResolveAll = async () => {
    setResolvingAll(true);
    try {
      await api.post('/incidents/resolve-all');
      setIncidents(prev => prev.map(inc => ({ ...inc, status: 'RESOLVED' })));
    } catch (err) {
      console.error('Resolve-all error:', err);
    } finally {
      setResolvingAll(false);
    }
  };

  // Stats
  const totalOpen     = incidents.filter(i => i.status === 'OPEN').length;
  const totalResolved = incidents.filter(i => i.status === 'RESOLVED').length;
  const criticalCount = incidents.filter(i => i.severity === 'CRITICAL' && i.status === 'OPEN').length;
  const highCount     = incidents.filter(i => i.severity === 'HIGH' && i.status === 'OPEN').length;

  // Filtered list
  const filtered = incidents.filter(inc => {
    const statusOk   = filterStatus === 'ALL' || inc.status === filterStatus;
    const severityOk = filterSeverity === 'ALL' || inc.severity === filterSeverity;
    return statusOk && severityOk;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <AlertOctagon className="text-red-500 w-6 h-6" />
          Security Incidents
        </h2>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchIncidents}
            className="flex items-center gap-1 text-xs text-slate-300 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          {totalOpen > 0 && (
            <button
              onClick={handleResolveAll}
              disabled={resolvingAll}
              className="flex items-center gap-1 text-xs text-green-300 bg-green-900/40 hover:bg-green-900/60 border border-green-700 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {resolvingAll ? 'Resolving...' : `Resolve All (${totalOpen})`}
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Open',     value: totalOpen,     icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-900/20 border-orange-800' },
          { label: 'Resolved', value: totalResolved, icon: CheckCircle,  color: 'text-green-400',  bg: 'bg-green-900/20 border-green-800'  },
          { label: 'Critical', value: criticalCount, icon: XCircle,      color: 'text-red-400',    bg: 'bg-red-900/20 border-red-800'      },
          { label: 'High',     value: highCount,     icon: Shield,       color: 'text-orange-300', bg: 'bg-orange-900/20 border-orange-800'},
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} border rounded-xl p-4 flex items-center gap-3`}>
            <Icon className={`${color} w-5 h-5 flex-shrink-0`} />
            <div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-slate-400" />
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Status:</label>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="appearance-none bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 pr-7 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All</option>
              <option value="OPEN">Open</option>
              <option value="RESOLVED">Resolved</option>
            </select>
            <ChevronDown className="absolute right-2 top-2.5 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Severity:</label>
          <div className="relative">
            <select
              value={filterSeverity}
              onChange={e => setFilterSeverity(e.target.value)}
              className="appearance-none bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 pr-7 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <ChevronDown className="absolute right-2 top-2.5 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <span className="text-xs text-slate-500 ml-auto">
          Showing {filtered.length} of {incidents.length} incidents
        </span>
      </div>

      {/* Incident Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center text-slate-400 py-16">
            <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-blue-500" />
            Loading incidents...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-slate-400 py-16 bg-slate-800/50 rounded-xl border border-slate-700">
            <Shield className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-70" />
            <p className="font-medium">No incidents match the current filter.</p>
            <p className="text-sm mt-1 text-slate-500">The system is monitoring all activity.</p>
          </div>
        ) : (
          filtered.map((inc) => {
            const cfg = SEVERITY_CONFIG[inc.severity] || SEVERITY_CONFIG.LOW;
            const isOpen = inc.status === 'OPEN';
            return (
              <div
                key={inc.id}
                className={`${cfg.bg} ${cfg.border} border border-slate-700 border-l-4 rounded-xl p-5 transition-all hover:border-slate-600`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Left content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot} ${isOpen ? 'animate-pulse' : ''}`} />
                      <h3 className="text-base font-bold text-white">{inc.threat_type}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.badge}`}>
                        {inc.severity}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        isOpen
                          ? 'bg-red-900/50 text-red-300 border border-red-700'
                          : 'bg-green-900/50 text-green-300 border border-green-700'
                      }`}>
                        {inc.status}
                      </span>
                    </div>

                    <p className="text-sm text-slate-300 mt-1">{inc.description}</p>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="text-xs bg-slate-900/70 text-slate-400 px-2 py-1 rounded-md border border-slate-700">
                        Action: {ACTION_LABEL[inc.prevention_action] || inc.prevention_action}
                      </span>
                      {inc.username && (
                        <span className="text-xs bg-slate-900/70 text-slate-400 px-2 py-1 rounded-md border border-slate-700">
                          User: {inc.username}
                        </span>
                      )}
                      {inc.ip_address && (
                        <span className="text-xs bg-slate-900/70 text-slate-400 px-2 py-1 rounded-md border border-slate-700">
                          IP: {inc.ip_address}
                        </span>
                      )}
                      {inc.login_attempt_id && (
                        <span className="text-xs bg-slate-900/70 text-slate-400 px-2 py-1 rounded-md border border-slate-700">
                          Attempt ID: #{inc.login_attempt_id}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: time + resolve */}
                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(inc.created_at).toLocaleString()}
                    </span>
                    {isOpen && (
                      <button
                        onClick={() => handleResolve(inc.id)}
                        disabled={resolving === inc.id}
                        className="flex items-center gap-1.5 text-xs text-green-300 bg-green-900/30 hover:bg-green-900/60 border border-green-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {resolving === inc.id ? 'Resolving...' : 'Mark Resolved'}
                      </button>
                    )}
                    {!isOpen && (
                      <span className="flex items-center gap-1 text-xs text-green-400">
                        <CheckCircle className="w-3.5 h-3.5" /> Resolved
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Incidents;
