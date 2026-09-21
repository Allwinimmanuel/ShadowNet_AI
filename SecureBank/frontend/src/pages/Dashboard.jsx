import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = "http://localhost:8001/api";

const Dashboard = () => {
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // In a real app, we'd fetch actual data using the stored JWT token.
    // For this simulation, we'll hit the /accounts endpoint if it exists,
    // or just mock the data to show the UI structure immediately.
    
    const token = localStorage.getItem("securebank_token");
    const username = localStorage.getItem("securebank_username");
    
    if (!token || !username) {
      navigate('/login');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const response = await axios.get(`${API_URL}/accounts/dashboard/${username}`);
        setCustomerData(response.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
        // Fallback to login if fetch fails (e.g. user not found)
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-blue-400 text-xl flex items-center">
          <div className="w-6 h-6 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mr-3"></div>
          Loading SecureBank Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      
      {/* Header Section */}
      <div className="flex justify-between items-end border-b border-slate-700 pb-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">Welcome back, {customerData.name}</h2>
          <p className="text-slate-400 text-sm">Customer ID: {customerData.customerId} | Last Login: {customerData.lastLogin}</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => navigate('/transfer')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium shadow-lg shadow-blue-900/20"
          >
            Transfer Money
          </button>
          <button 
            onClick={() => {
              localStorage.removeItem("securebank_token");
              localStorage.removeItem("securebank_username");
              navigate('/login');
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition text-sm font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Accounts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-lg">
            <h3 className="text-xl font-semibold text-slate-200 mb-4">Your Accounts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customerData.accounts.map((acc, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-700 p-5 rounded-lg flex flex-col justify-between hover:border-blue-500 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors">{acc.type} Account</div>
                      <div className="text-slate-500 text-xs mt-1 font-mono">{acc.number}</div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      $
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">${acc.balance.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                    <div className="text-slate-400 text-xs mt-1">Available Balance</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-slate-200">Recent Activity</h3>
              <button onClick={() => navigate('/transactions')} className="text-sm text-blue-400 hover:text-blue-300 transition">View All</button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-xs uppercase tracking-wider text-slate-500">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Description</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {customerData.recentTransactions.map((trx, idx) => (
                    <tr key={idx} className="hover:bg-slate-750/30 transition-colors">
                      <td className="py-4 text-sm text-slate-300">{trx.date}</td>
                      <td className="py-4">
                        <div className="text-sm text-slate-200">{trx.description}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{trx.id}</div>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          trx.status === 'COMPLETED' ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' :
                          trx.status === 'BLOCKED' ? 'bg-red-400/10 text-red-400 border border-red-400/20' :
                          'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                        }`}>
                          {trx.status}
                        </span>
                      </td>
                      <td className={`py-4 text-right font-medium ${trx.amount > 0 ? 'text-emerald-400' : 'text-slate-200'}`}>
                        {trx.amount > 0 ? '+' : ''}${Math.abs(trx.amount).toLocaleString('en-US', {minimumFractionDigits: 2})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Security Status */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-blue-900/50 p-6 rounded-xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-bold text-slate-200 mb-2 flex items-center">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
              ShadowNet AI Active
            </h3>
            <p className="text-sm text-slate-400 mb-6">Your account is currently being monitored by real-time cyberattack prevention.</p>
            
            <div className="space-y-3">
              <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 flex justify-between items-center">
                <span className="text-sm text-slate-400">Account Status</span>
                <span className="text-sm font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">SECURE</span>
              </div>
              <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 flex justify-between items-center">
                <span className="text-sm text-slate-400">Active Threats</span>
                <span className="text-sm font-semibold text-slate-300">0 Detected</span>
              </div>
              <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 flex justify-between items-center">
                <span className="text-sm text-slate-400">Last Scan</span>
                <span className="text-sm font-mono text-slate-300">Just now</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
