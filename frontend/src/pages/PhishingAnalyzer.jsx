import React, { useState } from 'react';
import api from '../services/api';
import {
  Mail, AlertTriangle, CheckCircle, Search,
  ExternalLink, Info, ShieldAlert, Loader, ChevronRight
} from 'lucide-react';

// ── Sample emails ─────────────────────────────────────────────────────────
const SAMPLES = {
  phishing: `Subject: URGENT: Your Account Has Been Suspended!

Dear Customer,

We have detected unauthorized access to your account. Your account has been temporarily suspended for security reasons.

Please verify your account immediately by clicking the link below to avoid permanent suspension:
http://192.168.99.12/secure-login/paypal/verify?token=abcdef123

Enter your username and password and confirm your date of birth to restore access.

Failure to respond within 24 hours will result in permanent account closure and legal action.

Best regards,
PayPal Security Team`,

  safe: `Hi Team,

Please find attached the Q3 budget report for your review. The document has been shared via our internal SharePoint portal — please access it using your company credentials at https://company.sharepoint.com/sites/finance/Q3-Budget.xlsx.

The meeting is scheduled for Thursday at 2 PM in Conference Room B.

Let me know if you have any questions.

Thanks,
Sarah Johnson
Finance Department`,

  suspicious: `Hi,

Your Netflix subscription could not be renewed due to a billing issue.

Please update your payment information within 48 hours to avoid interruption:
http://bit.ly/netflix-renew-acct

Thank you for being a valued Netflix customer.`,
};

// ── Severity colors ───────────────────────────────────────────────────────
const VERDICT_STYLE = {
  'HIGH RISK':    { cls: 'bg-red-900/20 border-red-700',    text: 'text-red-300',    icon: <ShieldAlert className="w-6 h-6 text-red-400" /> },
  'SUSPICIOUS':   { cls: 'bg-orange-900/20 border-orange-700', text: 'text-orange-300', icon: <AlertTriangle className="w-6 h-6 text-orange-400" /> },
  'LIKELY SAFE':  { cls: 'bg-green-900/20 border-green-800', text: 'text-green-300',  icon: <CheckCircle className="w-6 h-6 text-green-400" /> },
};

const FINDING_SEV = {
  CRITICAL: 'border-l-red-500 bg-red-900/10',
  HIGH:     'border-l-orange-500 bg-orange-900/10',
  MEDIUM:   'border-l-yellow-500 bg-yellow-900/10',
  LOW:      'border-l-blue-500 bg-blue-900/10',
  INFO:     'border-l-slate-500 bg-slate-800/40',
};

// ── Main ──────────────────────────────────────────────────────────────────
const PhishingAnalyzer = () => {
  const [emailText, setEmailText]     = useState('');
  const [result, setResult]           = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  const analyze = async () => {
    if (!emailText.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await api.post('/phishing/analyze', { email_text: emailText }).then(r => r.data);
      setResult(res);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSample = (key) => setEmailText(SAMPLES[key]);

  const verdict = result ? VERDICT_STYLE[result.verdict] || VERDICT_STYLE['LIKELY SAFE'] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="text-yellow-400 w-6 h-6" /> Phishing Analyzer
        </h2>
        <p className="text-slate-500 text-sm mt-0.5">Paste email content to detect phishing indicators — fully offline, no external APIs</p>
      </div>

      {/* Disclaimer */}
      <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-3 text-xs text-blue-300 flex items-start gap-2">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        This tool uses heuristic analysis (keyword detection, URL pattern matching) and is not a replacement for professional email security gateways. Results are indicative only.
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ── Input panel ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Email Content</h3>
            <div className="flex gap-2">
              {[
                { key: 'phishing',   label: 'Phishing Sample',   cls: 'text-red-300 bg-red-900/20 border-red-800' },
                { key: 'suspicious', label: 'Suspicious Sample',  cls: 'text-orange-300 bg-orange-900/20 border-orange-800' },
                { key: 'safe',       label: 'Safe Sample',        cls: 'text-green-300 bg-green-900/20 border-green-800' },
              ].map(({ key, label, cls }) => (
                <button key={key} onClick={() => loadSample(key)}
                  className={`text-xs px-2 py-1 rounded border transition-colors hover:opacity-80 ${cls}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={emailText}
            onChange={e => setEmailText(e.target.value)}
            placeholder="Paste the full email text here (subject, body, URLs)…"
            className="w-full h-72 bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-xl p-4 resize-none focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
          />

          <div className="flex gap-3">
            <button
              onClick={analyze}
              disabled={!emailText.trim() || loading}
              className="flex-1 flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 disabled:bg-yellow-900/40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? <><Loader className="w-4 h-4 animate-spin" /> Analysing…</> : <><Search className="w-4 h-4" /> Analyse Email</>}
            </button>
            {emailText && (
              <button onClick={() => { setEmailText(''); setResult(null); }}
                className="px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm transition-colors">
                Clear
              </button>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800 text-red-300 text-sm rounded-xl">{error}</div>
          )}
        </div>

        {/* ── Result panel ── */}
        <div>
          {!result && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-16">
              <Mail className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-sm">Analysis results will appear here.</p>
              <p className="text-xs mt-1">Try loading one of the sample emails →</p>
            </div>
          )}

          {result && verdict && (
            <div className="space-y-4">
              {/* Verdict banner */}
              <div className={`rounded-2xl border p-5 ${verdict.cls}`}>
                <div className="flex items-center gap-3 mb-3">
                  {verdict.icon}
                  <div>
                    <h3 className={`text-2xl font-bold ${verdict.text}`}>{result.verdict}</h3>
                    <p className="text-xs text-slate-400">
                      Risk Score: <strong className="text-white">{result.risk_score}/100</strong> ·
                      {result.total_findings} finding(s) · {result.urls_detected} URL(s) detected
                      {result.suspicious_urls > 0 && <span className="text-red-400 ml-1">· {result.suspicious_urls} suspicious URL(s)</span>}
                    </p>
                  </div>
                </div>

                {/* Risk bar */}
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${result.risk_score}%`,
                      backgroundColor: result.risk_score >= 70 ? '#ef4444' : result.risk_score >= 35 ? '#f97316' : '#22c55e'
                    }} />
                </div>
              </div>

              {/* Findings */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Findings</h4>
                <div className="space-y-2">
                  {result.findings.map((f, i) => (
                    <div key={i} className={`border-l-4 rounded-r-xl p-3 ${FINDING_SEV[f.severity] || FINDING_SEV.INFO}`}>
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-slate-200">{f.category}</p>
                        <div className="flex items-center gap-2">
                          {f.score_contribution > 0 && (
                            <span className="text-xs text-red-400">+{f.score_contribution} pts</span>
                          )}
                          <span className="text-xs text-slate-500 border border-slate-600 px-1.5 py-0.5 rounded">{f.severity}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">{f.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendation */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <ChevronRight className="w-3 h-3" /> Recommended Action
                </h4>
                <p className="text-sm text-slate-300">{result.recommended_action}</p>
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-slate-600">{result.disclaimer}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhishingAnalyzer;
