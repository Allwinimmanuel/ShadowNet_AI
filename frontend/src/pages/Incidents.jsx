import React, { useEffect, useState, useCallback } from 'react';
import { historyAPI } from '../services/api';
import api from '../services/api';
import {
  AlertOctagon, CheckCircle, RefreshCw, Shield, XCircle,
  Filter, ChevronDown, Clock, AlertTriangle, Eye, Lock,
  Unlock, ShieldOff, User, ExternalLink, X, FileText, Check
} from 'lucide-react';

const SEVERITY_CONFIG = {
  CRITICAL: { bg: 'bg-red-900/40', border: 'border-l-red-500', badge: 'bg-red-900/60 text-red-300 border border-red-700', dot: 'bg-red-500' },
  HIGH:     { bg: 'bg-orange-900/30', border: 'border-l-orange-500', badge: 'bg-orange-900/60 text-orange-300 border border-orange-700', dot: 'bg-orange-500' },
  MEDIUM:   { bg: 'bg-yellow-900/20', border: 'border-l-yellow-500', badge: 'bg-yellow-900/60 text-yellow-300 border border-yellow-700', dot: 'bg-yellow-500' },
  LOW:      { bg: 'bg-blue-900/20', border: 'border-l-blue-500', badge: 'bg-blue-900/60 text-blue-300 border border-blue-700', dot: 'bg-blue-500' },
};

const ACTION_LABEL = {
  ACCOUNT_LOCKED: 'Account Locked',
  BLOCK_IP: 'Block IP',
  BLOCKED_AND_DENIED: 'Blocked & Denied',
  DENIED: 'Denied',
  ALLOWED: 'Allowed',
  FLAG_SUSPICIOUS: 'Flagged Suspicious'
};

const Incidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(null);
  const [resolvingAll, setResolvingAll] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [lastRefresh, setLastRefresh] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [modalFeedback, setModalFeedback] = useState(null);
  const [unlockedUsers, setUnlockedUsers] = useState(new Set());
  const [unblockedIPs, setUnblockedIPs] = useState(new Set());

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
    const interval = setInterval(fetchIncidents, 6000);
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  const handleResolve = async (id, e) => {
    if (e) e.stopPropagation();
    setResolving(id);
    try {
      await api.patch(`/incidents/${id}/resolve`);
      setIncidents(prev =>
        prev.map(inc => inc.id === id ? { ...inc, status: 'RESOLVED' } : inc)
      );
      if (selectedIncident?.id === id) {
        setSelectedIncident(prev => prev ? { ...prev, status: 'RESOLVED' } : null);
      }
      const msg = `Incident #${id} marked as RESOLVED.`;
      setActionMessage({ type: 'success', text: msg });
      setModalFeedback({ type: 'success', text: msg });
    } catch (err) {
      console.error('Resolve error:', err);
      const msg = `Failed to resolve incident #${id}.`;
      setActionMessage({ type: 'error', text: msg });
      setModalFeedback({ type: 'error', text: msg });
    } finally {
      setResolving(null);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/incidents/${id}/status`, { status: newStatus });
      setIncidents(prev =>
        prev.map(inc => inc.id === id ? { ...inc, status: newStatus } : inc)
      );
      if (selectedIncident?.id === id) {
        setSelectedIncident(prev => prev ? { ...prev, status: newStatus } : null);
      }
      const msg = `Incident #${id} status updated to ${newStatus}.`;
      setActionMessage({ type: 'success', text: msg });
      setModalFeedback({ type: 'success', text: msg });
    } catch (err) {
      console.error('Status change error:', err);
      const msg = 'Failed to update status.';
      setActionMessage({ type: 'error', text: msg });
      setModalFeedback({ type: 'error', text: msg });
    }
  };

  const handleUnlockAccount = async (userId) => {
    try {
      const res = await api.post('/prevention/unlock-account', { user_id: userId });
      setUnlockedUsers(prev => new Set(prev).add(userId));
      const msg = res.data?.message || `Account '${userId}' unlocked successfully. Failed attempt counters reset.`;
      setActionMessage({ type: 'success', text: msg });
      setModalFeedback({ type: 'success', text: msg });
    } catch (err) {
      const msg = err.response?.data?.detail || `Account '${userId}' is already unlocked or clean.`;
      setUnlockedUsers(prev => new Set(prev).add(userId));
      setActionMessage({ type: 'success', text: msg });
      setModalFeedback({ type: 'success', text: msg });
    }
  };

  const handleUnblockIP = async (ipAddress) => {
    try {
      const res = await api.post('/prevention/unblock-ip', { ip_address: ipAddress });
      setUnblockedIPs(prev => new Set(prev).add(ipAddress));
      const msg = res.data?.message || `IP '${ipAddress}' unblocked successfully and removed from blacklist.`;
      setActionMessage({ type: 'success', text: msg });
      setModalFeedback({ type: 'success', text: msg });
    } catch (err) {
      const msg = err.response?.data?.detail || `IP '${ipAddress}' unblocked.`;
      setUnblockedIPs(prev => new Set(prev).add(ipAddress));
      setActionMessage({ type: 'success', text: msg });
      setModalFeedback({ type: 'success', text: msg });
    }
  };

  const handleResolveAll = async () => {
    setResolvingAll(true);
    try {
      await api.post('/incidents/resolve-all');
      setIncidents(prev => prev.map(inc => ({ ...inc, status: 'RESOLVED' })));
      setActionMessage({ type: 'success', text: 'All open incidents have been marked resolved.' });
    } catch (err) {
      console.error('Resolve-all error:', err);
    } finally {
      setResolvingAll(false);
    }
  };

  const totalOpen     = incidents.filter(i => i.status === 'OPEN' || i.status === 'INVESTIGATING').length;
  const totalResolved = incidents.filter(i => i.status === 'RESOLVED').length;
  const criticalCount = incidents.filter(i => i.severity === 'CRITICAL' && (i.status === 'OPEN' || i.status === 'INVESTIGATING')).length;
  const highCount     = incidents.filter(i => i.severity === 'HIGH' && (i.status === 'OPEN' || i.status === 'INVESTIGATING')).length;

  const filtered = incidents.filter(inc => {
    const statusOk   = filterStatus === 'ALL' || inc.status === filterStatus;
    const severityOk = filterSeverity === 'ALL' || inc.severity === filterSeverity;
    return statusOk && severityOk;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <AlertOctagon className="text-red-500 w-6 h-6" />
              Security Incidents & Response Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Live SOC Feed
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Real-time incident response workflow for active threats, automated lockouts, and behavioral anomalies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Auto-sync: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchIncidents}
            className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          {totalOpen > 0 && (
            <button
              onClick={handleResolveAll}
              disabled={resolvingAll}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-700/60 px-3.5 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {resolvingAll ? 'Resolving...' : `Resolve All (${totalOpen})`}
            </button>
          )}
        </div>
      </div>

      {actionMessage && (
        <div className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between animate-fadeIn ${
          actionMessage.type === 'success'
            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
            : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
        }`}>
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active / Open', value: totalOpen,     icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-950/20 border-orange-800/40' },
          { label: 'Resolved',      value: totalResolved, icon: CheckCircle,  color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-800/40'  },
          { label: 'Critical',      value: criticalCount, icon: XCircle,      color: 'text-rose-400',    bg: 'bg-rose-950/20 border-rose-800/40'      },
          { label: 'High Severity', value: highCount,     icon: Shield,       color: 'text-amber-400',   bg: 'bg-amber-950/20 border-amber-800/40'},
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} border rounded-xl p-4 flex items-center gap-3.5 shadow-md`}>
            <Icon className={`${color} w-6 h-6 flex-shrink-0`} />
            <div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center text-xs">
        <Filter className="w-4 h-4 text-slate-400" />
        <div className="flex items-center gap-2">
          <label className="text-slate-400">Status:</label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-slate-400">Severity:</label>
          <select
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
        <span className="text-slate-500 ml-auto">
          Showing {filtered.length} of {incidents.length} recorded incidents
        </span>
      </div>

      {/* Incident List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center text-slate-400 py-16">
            <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-blue-500" />
            Loading live incidents feed...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-slate-400 py-16 bg-slate-800/40 rounded-xl border border-slate-700/60">
            <Shield className="w-12 h-12 mx-auto mb-3 text-emerald-500 opacity-70" />
            <p className="font-bold text-white text-sm">No Security Incidents Found</p>
            <p className="text-xs mt-1 text-slate-400">All authentication requests are within normal parameters.</p>
          </div>
        ) : (
          filtered.map((inc) => {
            const cfg = SEVERITY_CONFIG[inc.severity] || SEVERITY_CONFIG.LOW;
            const isOpen = inc.status === 'OPEN' || inc.status === 'INVESTIGATING';
            return (
              <div
                key={inc.id}
                onClick={() => {
                  setSelectedIncident(inc);
                  setModalFeedback(null);
                }}
                className={`${cfg.bg} ${cfg.border} border border-slate-700/80 border-l-4 rounded-xl p-5 transition-all hover:border-slate-500 hover:shadow-lg cursor-pointer`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot} ${isOpen ? 'animate-pulse' : ''}`} />
                      <h3 className="text-sm font-bold text-white">#{inc.id} — {inc.threat_type}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${cfg.badge}`}>
                        {inc.severity}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        inc.status === 'RESOLVED' 
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/60' 
                          : inc.status === 'INVESTIGATING'
                          ? 'bg-amber-950/60 text-amber-300 border border-amber-700/60'
                          : 'bg-rose-950/60 text-rose-300 border border-rose-700/60'
                      }`}>
                        {inc.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mt-1">{inc.description}</p>

                    <div className="flex flex-wrap gap-2 mt-3 text-xs">
                      <span className="bg-slate-900/80 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                        Action: <strong>{ACTION_LABEL[inc.prevention_action] || inc.prevention_action}</strong>
                      </span>
                      {inc.username && (
                        <span className="bg-slate-900/80 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                          User: <strong>{inc.username}</strong>
                        </span>
                      )}
                      {inc.ip_address && (
                        <span className="bg-slate-900/80 text-slate-300 px-2 py-0.5 rounded border border-slate-800 font-mono">
                          IP: <strong>{inc.ip_address}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2.5 flex-shrink-0">
                    <span className="text-[11px] text-slate-400">
                      {new Date(inc.created_at).toLocaleString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIncident(inc);
                          setModalFeedback(null);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 rounded flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Inspect
                      </button>
                      {isOpen && (
                        <button
                          onClick={(e) => handleResolve(inc.id, e)}
                          disabled={resolving === inc.id}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-300 bg-emerald-900/40 hover:bg-emerald-900/70 border border-emerald-700/60 rounded flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Incident Response Drawer Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5 animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <AlertOctagon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Incident #{selectedIncident.id} — {selectedIncident.threat_type}
                  </h3>
                  <span className="text-xs text-slate-400">
                    Logged on {new Date(selectedIncident.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedIncident(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Inline Feedback Alert */}
            {modalFeedback && (
              <div className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between ${
                modalFeedback.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-700 text-rose-300'
              }`}>
                <span>{modalFeedback.text}</span>
                <button onClick={() => setModalFeedback(null)} className="text-slate-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Incident Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-800/60 p-4 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Severity</span>
                <span className="font-bold text-rose-400">{selectedIncident.severity}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Status</span>
                <span className={`font-bold ${
                  selectedIncident.status === 'RESOLVED' ? 'text-emerald-400' :
                  selectedIncident.status === 'INVESTIGATING' ? 'text-amber-400' : 'text-rose-400'
                }`}>{selectedIncident.status}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Target User</span>
                <span className="font-bold text-blue-400">{selectedIncident.username || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Source IP</span>
                <span className="font-mono text-white font-bold">{selectedIncident.ip_address || 'N/A'}</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5 text-xs">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">Description & Evidence</h4>
              <p className="bg-slate-800/40 p-3 rounded-lg border border-slate-800 text-slate-300 leading-relaxed">
                {selectedIncident.description}
              </p>
            </div>

            {/* Recommended SOC Playbook Response */}
            <div className="bg-blue-950/20 border border-blue-800/40 rounded-xl p-4 text-xs space-y-1">
              <h4 className="font-bold text-blue-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Recommended SOC Remediation:
              </h4>
              <p className="text-slate-300">
                {selectedIncident.threat_type === 'BRUTE_FORCE'
                  ? 'Verify if legitimate user was locked out. Unlock account after password reset confirmation.'
                  : selectedIncident.threat_type === 'HIGH_FREQUENCY_IP'
                  ? 'Inspect IP subnet. Keep blocked if distributed scanner, or unblock if internal proxy.'
                  : 'Review user behavioral baseline profile and confirm recent location validity.'}
              </p>
            </div>

            {/* Analyst Action Controls */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">SOC Response Actions:</h4>
              <div className="flex flex-wrap gap-2 text-xs">
                {selectedIncident.status !== 'INVESTIGATING' && selectedIncident.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleStatusChange(selectedIncident.id, 'INVESTIGATING')}
                    className="px-3.5 py-2 rounded-lg bg-amber-600/80 hover:bg-amber-600 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-md"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Mark Investigating
                  </button>
                )}

                {selectedIncident.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleResolve(selectedIncident.id)}
                    className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-md"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Mark Resolved
                  </button>
                )}

                {selectedIncident.username && (
                  <button
                    onClick={() => handleUnlockAccount(selectedIncident.username)}
                    className={`px-3.5 py-2 rounded-lg border font-semibold flex items-center gap-1.5 transition-colors shadow-md ${
                      unlockedUsers.has(selectedIncident.username)
                        ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    {unlockedUsers.has(selectedIncident.username) ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Account Unlocked ({selectedIncident.username})
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-blue-400" />
                        Unlock Account ({selectedIncident.username})
                      </>
                    )}
                  </button>
                )}

                {selectedIncident.ip_address && (
                  <button
                    onClick={() => handleUnblockIP(selectedIncident.ip_address)}
                    className={`px-3.5 py-2 rounded-lg border font-semibold flex items-center gap-1.5 transition-colors shadow-md ${
                      unblockedIPs.has(selectedIncident.ip_address)
                        ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    {unblockedIPs.has(selectedIncident.ip_address) ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        IP Unblocked ({selectedIncident.ip_address})
                      </>
                    ) : (
                      <>
                        <ShieldOff className="w-3.5 h-3.5 text-orange-400" />
                        Unblock IP ({selectedIncident.ip_address})
                      </>
                    )}
                  </button>
                )}

                {selectedIncident.username && (
                  <a
                    href="/user-risk"
                    className="px-3.5 py-2 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 font-semibold flex items-center gap-1.5 transition-colors ml-auto"
                  >
                    <User className="w-3.5 h-3.5" />
                    User Baseline Profile &rarr;
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Incidents;
