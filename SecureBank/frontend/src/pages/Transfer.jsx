import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = "http://localhost:8001/api";

const Transfer = () => {
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({
    senderAccount: '',
    receiverAccount: '',
    amount: '',
    description: 'Fund Transfer'
  });
  const [loading, setLoading] = useState(false);
  const [securityStatus, setSecurityStatus] = useState(null);
  const navigate = useNavigate();
  const username = localStorage.getItem("securebank_username");

  useEffect(() => {
    if (!username) {
      navigate('/login');
      return;
    }
    const fetchAccounts = async () => {
      try {
        const response = await axios.get(`${API_URL}/accounts/dashboard/${username}`);
        setAccounts(response.data.accounts);
        if (response.data.accounts.length > 0) {
          setFormData(prev => ({ ...prev, senderAccount: response.data.accounts[0].number }));
        }
      } catch (err) {
        console.error("Failed to fetch accounts", err);
      }
    };
    fetchAccounts();
  }, [navigate, username]);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSecurityStatus({ status: 'analyzing' });

    try {
      const response = await axios.post(`${API_URL}/transactions/transfer`, {
        username: username,
        sender_account_number: formData.senderAccount,
        receiver_account_number: formData.receiverAccount,
        amount: parseFloat(formData.amount),
        transaction_type: "INTERNAL_TRANSFER",
        description: formData.description
      });
      
      if (response.data.action === "ALLOWED") {
        setSecurityStatus({ 
          status: 'allowed', 
          message: 'Transfer successful.',
          riskScore: response.data.risk_score
        });
        setFormData(prev => ({ ...prev, amount: '', receiverAccount: '' }));
      } else {
        setSecurityStatus({ 
          status: 'held', 
          message: response.data.message,
          riskScore: response.data.risk_score
        });
      }
    } catch (err) {
      if (err.response && err.response.status === 403) {
        setSecurityStatus({ 
          status: 'blocked', 
          message: err.response.data.detail.message || "Transaction blocked.",
          riskScore: err.response.data.detail.risk_score || 100
        });
      } else {
        setSecurityStatus({ status: 'error', message: "An unexpected error occurred." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="border-b border-slate-700 pb-4">
        <h2 className="text-3xl font-bold text-white mb-1">Transfer Money</h2>
        <p className="text-slate-400 text-sm">Send funds securely to another account.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Form Column */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-lg">
          <form onSubmit={handleTransfer} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">From Account</label>
              <select 
                value={formData.senderAccount}
                onChange={(e) => setFormData({...formData, senderAccount: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                required
              >
                {accounts.map(acc => (
                  <option key={acc.number} value={acc.number}>
                    {acc.type} - {acc.number} (Bal: ${acc.balance.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">To Account (Beneficiary)</label>
              <input 
                type="text" 
                value={formData.receiverAccount}
                onChange={(e) => setFormData({...formData, receiverAccount: e.target.value})}
                placeholder="Enter account number"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Amount ($)</label>
              <input 
                type="number" 
                min="0.01" 
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="0.00"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-mono text-xl"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
              <input 
                type="text" 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                maxLength={50}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-3 rounded-lg font-medium text-white transition-all shadow-lg mt-4 ${
                loading ? 'bg-blue-800 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-900/50'
              }`}
            >
              {loading ? 'Processing Transfer...' : 'Confirm Transfer'}
            </button>
          </form>
        </div>

        {/* Security Column */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-blue-900/50 p-6 rounded-xl shadow-lg relative overflow-hidden h-full flex flex-col">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-48 w-48 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2 flex items-center z-10">
              <span className={`w-3 h-3 rounded-full mr-3 ${securityStatus?.status === 'analyzing' ? 'bg-blue-500 animate-ping' : 'bg-blue-500'}`}></span>
              ShadowNet AI Monitor
            </h3>
            <p className="text-sm text-slate-400 mb-6 z-10">Real-time fraud prevention engine.</p>
            
            <div className="flex-1 flex flex-col justify-center items-center z-10">
              {!securityStatus && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center text-slate-500 border border-slate-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <p className="text-slate-400 text-sm">Awaiting transaction details...</p>
                </div>
              )}
              
              {securityStatus?.status === 'analyzing' && (
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-blue-400 text-sm animate-pulse font-medium">Analyzing transaction risk...</p>
                </div>
              )}

              {securityStatus?.status === 'allowed' && (
                <div className="w-full">
                  <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-5 text-center">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full mx-auto mb-3 flex items-center justify-center text-emerald-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h4 className="text-emerald-400 font-bold mb-1">Transaction Allowed</h4>
                    <p className="text-sm text-emerald-400/80 mb-4">{securityStatus.message}</p>
                    
                    <div className="bg-slate-900 rounded p-3 flex justify-between items-center border border-slate-700/50">
                      <span className="text-xs text-slate-400">Calculated Risk</span>
                      <span className="text-sm font-mono text-emerald-400">{securityStatus.riskScore}%</span>
                    </div>
                  </div>
                </div>
              )}
              
              {securityStatus?.status === 'blocked' && (
                <div className="w-full">
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-5 text-center">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full mx-auto mb-3 flex items-center justify-center text-red-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h4 className="text-red-400 font-bold mb-1">Transaction BLOCKED</h4>
                    <p className="text-sm text-red-400/80 mb-4">{securityStatus.message}</p>
                    
                    <div className="bg-slate-900 rounded p-3 flex justify-between items-center border border-red-500/30">
                      <span className="text-xs text-slate-400">Calculated Risk</span>
                      <span className="text-sm font-mono text-red-500 font-bold">{securityStatus.riskScore}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transfer;
