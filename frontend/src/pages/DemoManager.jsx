import React, { useState } from 'react';
import { demoAPI } from '../services/api';
import { 
  Play, Trash2, ShieldCheck, ShieldAlert, Zap, Globe, 
  Smartphone, FastForward, Cpu, Award, CheckCircle2, 
  ArrowRight, AlertTriangle, UserX, RefreshCw
} from 'lucide-react';

const SCENARIOS = [
  { 
    id: 'NORMAL', 
    name: '1. Normal Trusted Login', 
    icon: ShieldCheck,
    badge: 'Baseline (Risk: 0)',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    desc: 'Simulates legitimate login from trusted IP (192.168.1.100) using recognized desktop profile during normal working hours.',
    expected: 'ALLOWED — Risk Score < 20, zero anomalies triggered.' 
  },
  { 
    id: 'BRUTE_FORCE', 
    name: '2. Brute-Force Password Spray', 
    icon: ShieldAlert,
    badge: 'High Severity (Risk: 95+)',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    desc: 'Sends 6 rapid failed attempts with pseudo-random password hashes against a single target user account.',
    expected: 'ACCOUNT_LOCKED — Triggering Rule 1: Automated Lockout after 5 failures.' 
  },
  { 
    id: 'CREDENTIAL_STUFFING', 
    name: '3. Credential Stuffing Attack', 
    icon: Zap,
    badge: 'Distributed (Risk: 85+)',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    desc: 'Automates credential probing against 5 different user accounts (admin, demo_user, finance_lead, etc.) from a single proxy IP.',
    expected: 'BLOCK_IP — Flags multi-target credential stuffing signature.' 
  },
  { 
    id: 'ACCOUNT_TAKEOVER', 
    name: '4. Account Takeover (Tor/Odd-Hours)', 
    icon: UserX,
    badge: 'Evasion (Risk: 75+)',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    desc: 'Valid credentials supplied, but originating from a flagged Tor Exit node at 3:00 AM using an unknown headless environment.',
    expected: 'FLAG_SUSPICIOUS / CHALLENGE — Fuses UEBA time-anomaly with Threat Intel.' 
  },
  { 
    id: 'IMPOSSIBLE_TRAVEL', 
    name: '5. Impossible Travel Anomaly', 
    icon: Globe,
    badge: 'Geo-Velocity (Risk: 80+)',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    desc: 'Generates a login in New York, USA immediately followed 1 second later by an attempt in Moscow, RU (7,500 km physical jump).',
    expected: 'FLAG_SUSPICIOUS / DENIED — Velocity exceeds physical human travel speed.' 
  },
  { 
    id: 'NEW_DEVICE', 
    name: '6. Unfamiliar Device Anomaly', 
    icon: Smartphone,
    badge: 'UEBA Device (Risk: 45+)',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    desc: 'Login attempt from an unverified Smart TV / Tizen OS user agent not present in the user behavioral baseline.',
    expected: 'FLAG_SUSPICIOUS — Step-up verification recommended.' 
  },
  { 
    id: 'HIGH_VELOCITY', 
    name: '7. High-Velocity Rate Flooding', 
    icon: FastForward,
    badge: 'Volumetric (Risk: 90+)',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    desc: 'Bursts 12 connection attempts in under 3 seconds to test application-layer rate limiting.',
    expected: 'BLOCK_IP — Automated firewall rate-limit defense triggered.' 
  },
  { 
    id: 'SUSPICIOUS_GEO', 
    name: '8. Flagged Botnet Geo-Location', 
    icon: AlertTriangle,
    badge: 'Threat Intel (Risk: 70+)',
    badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    desc: 'Connection originating from a known Russian botnet C2 proxy range (45.12.33.11).',
    expected: 'FLAG_SUSPICIOUS / DENIED — Threat intelligence reputation hit.' 
  },
  { 
    id: 'BOT_PATTERN', 
    name: '9. Non-Browser Bot Fingerprint', 
    icon: Cpu,
    badge: 'Automation (Risk: 80+)',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
    desc: 'Scripted Python-urllib HTTP client lacking standard headers, cookies, and DOM capability.',
    expected: 'DENIED — Flagged as automated bot scanning attempt.' 
  },
];

const STORY_STEPS = [
  {
    step: 1,
    title: 'Baseline Normal Login',
    desc: 'A legitimate banker logs in with correct password from their habitual workstation in New York during working hours.',
    scenario: 'NORMAL',
    actionText: 'Execute Normal Login',
    outcome: 'Allowed with 0 Risk Score. Sets established baseline.'
  },
  {
    step: 2,
    title: 'Attacker Launches Credential Attack',
    desc: 'An external adversary attempts brute-forcing credentials using password lists.',
    scenario: 'BRUTE_FORCE',
    actionText: 'Launch Brute-Force Attack',
    outcome: '5 failed attempts in seconds. Machine Learning detects velocity spike.'
  },
  {
    step: 3,
    title: 'Automated Lockout & Threat Defense',
    desc: 'ShadowNet triggers automated mitigation. The account is locked and the attacker IP is blacklisted.',
    scenario: 'HIGH_VELOCITY',
    actionText: 'Trigger Rate Flooding',
    outcome: 'Decision: BLOCK_IP & ACCOUNT_LOCKED. Security Incident generated in SOC.'
  },
  {
    step: 4,
    title: 'Impossible Travel & Evasion Probe',
    desc: 'Attacker switches to stolen valid credentials through a Tor exit node in a foreign country.',
    scenario: 'IMPOSSIBLE_TRAVEL',
    actionText: 'Simulate Impossible Travel',
    outcome: 'XAI explains why password alone is not enough: Geo-velocity anomaly + Tor reputation.'
  }
];

const DemoManager = () => {
  const [activeTab, setActiveTab] = useState('scenarios'); // 'scenarios' | 'story'
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [lastExecuted, setLastExecuted] = useState(null);

  const handleScenario = async (scenarioId) => {
    setLoading(true);
    setMessage(null);
    setLastExecuted(scenarioId);
    try {
      const res = await demoAPI.triggerScenario(scenarioId);
      setMessage({ type: 'success', text: res.message || `Scenario ${scenarioId} executed successfully.` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to trigger scenario.' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all demo data and start with a clean baseline?')) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await demoAPI.resetData();
      setMessage({ type: 'success', text: res.message || 'All demo records reset.' });
      setCurrentStep(0);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">Attack Simulator & Demo Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Judges Showcase
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Simulate 9 live cyber attack vectors against the local SecureBank application to demonstrate ShadowNet AI's adaptive detection in real-time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Reset Demo DB
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('scenarios')}
          className={`pb-3 px-2 text-sm font-semibold flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'scenarios'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-4 h-4" />
          9 Attack Vector Catalog
        </button>
        <button
          onClick={() => setActiveTab('story')}
          className={`pb-3 px-2 text-sm font-semibold flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'story'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          Judge 3-Minute Story Mode
        </button>
      </div>

      {/* Notification Banner */}
      {message && (
        <div className={`p-4 rounded-xl border text-sm font-medium flex items-center justify-between animate-fadeIn ${
          message.type === 'success' 
            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' 
            : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
        }`}>
          <div className="flex items-center gap-3">
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
            <span>{message.text}</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <a href="/monitor" className="text-blue-400 hover:text-blue-300 font-semibold underline">
              View Live Monitor &rarr;
            </a>
            <a href="/" className="text-blue-400 hover:text-blue-300 font-semibold underline">
              SOC Overview &rarr;
            </a>
          </div>
        </div>
      )}

      {/* TAB 1: 9 SCENARIO CARDS */}
      {activeTab === 'scenarios' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SCENARIOS.map((sc) => {
            const Icon = sc.icon;
            const isRunning = loading && lastExecuted === sc.id;
            return (
              <div 
                key={sc.id}
                className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 flex flex-col justify-between hover:border-slate-600 transition-all hover:shadow-lg hover:shadow-blue-950/20"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-slate-700/60 border border-slate-600/50 text-blue-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-white">{sc.name}</h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${sc.badgeColor}`}>
                      {sc.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">{sc.desc}</p>
                  <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 mb-4">
                    <span className="text-[10px] font-semibold uppercase text-slate-400 block mb-0.5">Expected AI Action:</span>
                    <span className="text-xs text-slate-200 font-mono">{sc.expected}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleScenario(sc.id)}
                  disabled={loading}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    isRunning 
                      ? 'bg-blue-600 text-white animate-pulse'
                      : 'bg-blue-600/90 hover:bg-blue-600 text-white shadow-md shadow-blue-900/30'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Executing Scenario...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Trigger Scenario
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: JUDGE STORY MODE */}
      {activeTab === 'story' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-800/40 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-6 h-6 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">Judge Walkthrough: 3-Minute Live Cyber Defense Demo</h2>
            </div>
            <p className="text-sm text-slate-300">
              Guide the judges through the real story of ShadowNet AI in 4 progressive steps. 
              Each step executes live HTTP traffic against SecureBank and illustrates how ShadowNet elevates from passive password checking to contextual behavioral security.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {STORY_STEPS.map((st, idx) => {
              const isCurrent = currentStep === idx;
              const isPassed = currentStep > idx;
              return (
                <div 
                  key={st.step}
                  className={`border rounded-xl p-5 flex flex-col justify-between transition-all ${
                    isCurrent 
                      ? 'bg-slate-800 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xl' 
                      : isPassed
                      ? 'bg-slate-800/40 border-emerald-500/40'
                      : 'bg-slate-900/40 border-slate-800 opacity-70'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isPassed 
                          ? 'bg-emerald-500 text-slate-900' 
                          : isCurrent 
                          ? 'bg-indigo-500 text-white' 
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {isPassed ? '✓' : st.step}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Step {st.step}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1.5">{st.title}</h4>
                    <p className="text-xs text-slate-300 mb-3">{st.desc}</p>
                    <div className="text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded border border-slate-800 mb-4">
                      <strong className="text-slate-200">Outcome: </strong>{st.outcome}
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      setCurrentStep(idx);
                      await handleScenario(st.scenario);
                      if (idx < STORY_STEPS.length - 1) setCurrentStep(idx + 1);
                    }}
                    disabled={loading}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      isCurrent
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    {st.actionText}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-white">Interactive Live SOC Dashboard</h4>
              <p className="text-xs text-slate-400">Open the Security Overview or Live Monitor in a second tab to see metrics and incidents updating live.</p>
            </div>
            <div className="flex gap-3">
              <a
                href="/monitor"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2"
              >
                Open Live Monitor
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <a
                href="http://localhost:5174"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg flex items-center gap-2"
              >
                Open SecureBank Portal
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoManager;
