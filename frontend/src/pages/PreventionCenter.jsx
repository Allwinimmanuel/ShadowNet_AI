import React, { useEffect, useState, useCallback } from 'react';
import { preventionAPI } from '../services/api';
import {
  Lock, Ban, Unlock, ShieldOff, RefreshCw, PlusCircle,
  Clock, CheckCircle, AlertTriangle, X, UserCheck, Wifi
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────
const fmt = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
  return d.toLocaleString(undefined, {
    month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
};

// ── Confirm Modal ─────────────────────────────────────────────────────────
const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
      <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
      <p className="text-center text-slate-200 text-sm font-medium mb-6">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-semibold transition-colors"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
);

// ── Add-Block Modal ──────────────────────────────────────────────────────
const AddModal = ({ type, onSave, onCancel }) => {
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');

  const label  = type === 'account' ? 'User ID' : 'IP Address';
  const ph     = type === 'account' ? 'e.g. USR001' : 'e.g. 192.168.1.100';
  const title  = type === 'account' ? 'Lock Account' : 'Block IP Address';
  const icon   = type === 'account' ? <Lock className="w-5 h-5 text-orange-400" /> : <Ban className="w-5 h-5 text-red-400" />;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-2 mb-5">
          {icon}
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onCancel} className="ml-auto text-slate-500 hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-medium">{label}</label>
            <input
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={ph}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-medium">Reason (optional)</label>
            <input
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Suspected brute-force activity"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm transition-colors">
            Cancel
          </button>
          <button
            onClick={() => value.trim() && onSave(value.trim(), reason.trim() || undefined)}
            disabled={!value.trim()}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              type === 'account'
                ? 'bg-orange-600 hover:bg-orange-500 disabled:bg-orange-900/40'
                : 'bg-red-600 hover:bg-red-500 disabled:bg-red-900/40'
            } disabled:cursor-not-allowed`}
          >
            {type === 'account' ? 'Lock Account' : 'Block IP'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Toast ─────────────────────────────────────────────────────────────────
const Toast = ({ msg, ok }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium border ${
    ok
      ? 'bg-green-900/90 border-green-700 text-green-200'
      : 'bg-red-900/90 border-red-700 text-red-200'
  }`}>
    {ok ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
    {msg}
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────
const PreventionCenter = () => {
  const [status, setStatus]   = useState({ locked_accounts: [], blocked_ips: [] });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // id of item being acted on
  const [confirm, setConfirm] = useState(null);   // { action, label }
  const [addModal, setAddModal] = useState(null);  // 'account' | 'ip'
  const [toast, setToast]     = useState(null);   // { msg, ok }
  const [lastRefresh, setLastRefresh] = useState(null);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchStatus = useCallback(async () => {
    try {
      const data = await preventionAPI.getStatus();
      setStatus(data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const t = setInterval(fetchStatus, 15000);
    return () => clearInterval(t);
  }, [fetchStatus]);

  // ── Actions ──────────────────────────────────────────────────────────
  const handleUnlock = (userId) => {
    setConfirm({
      message: `Unlock account "${userId}"? The user will be able to log in again.`,
      onConfirm: async () => {
        setConfirm(null);
        setActionLoading(userId);
        try {
          await preventionAPI.unlockAccount(userId);
          showToast(`Account ${userId} unlocked successfully.`);
          fetchStatus();
        } catch (err) {
          showToast(err.message, false);
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleUnblockIp = (ip) => {
    setConfirm({
      message: `Unblock IP "${ip}"? Traffic from this address will be allowed again.`,
      onConfirm: async () => {
        setConfirm(null);
        setActionLoading(ip);
        try {
          await preventionAPI.unblockIp(ip);
          showToast(`IP ${ip} unblocked successfully.`);
          fetchStatus();
        } catch (err) {
          showToast(err.message, false);
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleAddAccount = async (userId, reason) => {
    setAddModal(null);
    try {
      await preventionAPI.lockAccount(userId, reason);
      showToast(`Account ${userId} locked.`);
      fetchStatus();
    } catch (err) {
      showToast(err.message, false);
    }
  };

  const handleAddIp = async (ip, reason) => {
    setAddModal(null);
    try {
      await preventionAPI.blockIp(ip, reason);
      showToast(`IP ${ip} blocked.`);
      fetchStatus();
    } catch (err) {
      showToast(err.message, false);
    }
  };

  const totalLocked  = status.locked_accounts.length;
  const totalBlocked = status.blocked_ips.length;

  return (
    <div className="space-y-6">

      {/* ── Modals ── */}
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
      {addModal && (
        <AddModal
          type={addModal}
          onSave={addModal === 'account' ? handleAddAccount : handleAddIp}
          onCancel={() => setAddModal(null)}
        />
      )}
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Lock className="text-blue-400 w-6 h-6" />
            Prevention Center
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage locked accounts and blocked IPs · auto-refreshes every 15 s
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchStatus}
            className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-orange-900/20 border border-orange-800 rounded-xl p-4 flex items-center gap-3">
          <Lock className="w-6 h-6 text-orange-400 flex-shrink-0" />
          <div>
            <p className="text-2xl font-bold tabular-nums text-orange-300">{totalLocked}</p>
            <p className="text-xs text-slate-400">Locked Accounts</p>
          </div>
        </div>
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 flex items-center gap-3">
          <Ban className="w-6 h-6 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-2xl font-bold tabular-nums text-red-300">{totalBlocked}</p>
            <p className="text-xs text-slate-400">Blocked IPs</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-12">
          <RefreshCw className="w-6 h-6 animate-spin inline mr-2" /> Loading…
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Locked Accounts ── */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="text-orange-400 w-5 h-5" />
                <h3 className="font-semibold">Locked Accounts</h3>
                {totalLocked > 0 && (
                  <span className="text-xs bg-orange-900/60 text-orange-300 border border-orange-700 px-2 py-0.5 rounded-full">
                    {totalLocked}
                  </span>
                )}
              </div>
              <button
                onClick={() => setAddModal('account')}
                className="flex items-center gap-1.5 text-xs text-orange-300 bg-orange-900/30 hover:bg-orange-900/50 border border-orange-700 px-3 py-1.5 rounded-lg transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Lock Account
              </button>
            </div>

            <div className="flex-1 divide-y divide-slate-700/50">
              {status.locked_accounts.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <UserCheck className="w-10 h-10 mx-auto mb-2 text-green-500 opacity-60" />
                  <p className="text-sm">No accounts are currently locked.</p>
                </div>
              ) : (
                status.locked_accounts.map(acc => (
                  <div
                    key={acc.id}
                    className="flex items-start justify-between gap-4 p-4 hover:bg-slate-700/20 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                        <p className="font-semibold text-orange-200">{acc.user_id}</p>
                        <span className="text-xs bg-orange-900/40 text-orange-400 border border-orange-800 px-2 py-0.5 rounded">LOCKED</span>
                      </div>
                      {acc.reason && (
                        <p className="text-xs text-slate-400 mt-1 ml-4 truncate">{acc.reason}</p>
                      )}
                      <p className="text-xs text-slate-600 mt-0.5 ml-4 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {fmt(acc.locked_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnlock(acc.user_id)}
                      disabled={actionLoading === acc.user_id}
                      className="flex items-center gap-1.5 text-xs text-green-300 bg-green-900/30 hover:bg-green-900/50 border border-green-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap flex-shrink-0"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      {actionLoading === acc.user_id ? 'Unlocking…' : 'Unlock'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Blocked IPs ── */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ban className="text-red-400 w-5 h-5" />
                <h3 className="font-semibold">Blocked IPs</h3>
                {totalBlocked > 0 && (
                  <span className="text-xs bg-red-900/60 text-red-300 border border-red-700 px-2 py-0.5 rounded-full">
                    {totalBlocked}
                  </span>
                )}
              </div>
              <button
                onClick={() => setAddModal('ip')}
                className="flex items-center gap-1.5 text-xs text-red-300 bg-red-900/30 hover:bg-red-900/50 border border-red-700 px-3 py-1.5 rounded-lg transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Block IP
              </button>
            </div>

            <div className="flex-1 divide-y divide-slate-700/50">
              {status.blocked_ips.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Wifi className="w-10 h-10 mx-auto mb-2 text-green-500 opacity-60" />
                  <p className="text-sm">No IP addresses are currently blocked.</p>
                </div>
              ) : (
                status.blocked_ips.map(ip => (
                  <div
                    key={ip.id}
                    className="flex items-start justify-between gap-4 p-4 hover:bg-slate-700/20 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                        <p className="font-mono font-semibold text-red-200">{ip.ip_address}</p>
                        <span className="text-xs bg-red-900/40 text-red-400 border border-red-800 px-2 py-0.5 rounded">BLOCKED</span>
                      </div>
                      {ip.reason && (
                        <p className="text-xs text-slate-400 mt-1 ml-4 truncate">{ip.reason}</p>
                      )}
                      <p className="text-xs text-slate-600 mt-0.5 ml-4 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {fmt(ip.blocked_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnblockIp(ip.ip_address)}
                      disabled={actionLoading === ip.ip_address}
                      className="flex items-center gap-1.5 text-xs text-green-300 bg-green-900/30 hover:bg-green-900/50 border border-green-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap flex-shrink-0"
                    >
                      <ShieldOff className="w-3.5 h-3.5" />
                      {actionLoading === ip.ip_address ? 'Unblocking…' : 'Unblock'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* ── Privilege note ── */}
      <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-xs text-slate-500">
        <p className="font-medium text-slate-400 mb-1">Administrator Privileges</p>
        <ul className="space-y-0.5 list-disc list-inside">
          <li>You can <strong className="text-orange-400">manually lock</strong> any user account regardless of login attempts.</li>
          <li>You can <strong className="text-red-400">manually block</strong> any IP address immediately.</li>
          <li>Locking/blocking creates a Security Incident record automatically.</li>
          <li>All actions take effect immediately — the next login attempt will be denied.</li>
        </ul>
      </div>

    </div>
  );
};

export default PreventionCenter;
