import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = "http://localhost:8001/api";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const username = localStorage.getItem("securebank_username");

  useEffect(() => {
    if (!username) {
      navigate('/login');
      return;
    }

    const fetchHistory = async () => {
      try {
        const response = await axios.get(`${API_URL}/transactions/history/${username}`);
        setTransactions(response.data.transactions);
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [navigate, username]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="border-b border-slate-700 pb-4">
        <h2 className="text-3xl font-bold text-white mb-1">Transaction History</h2>
        <p className="text-slate-400 text-sm">View all your recent activity and ShadowNet AI security actions.</p>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-0 overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No transactions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400">
                  <th className="p-4 font-medium">Date & Time</th>
                  <th className="p-4 font-medium">Description</th>
                  <th className="p-4 font-medium">From Account</th>
                  <th className="p-4 font-medium">To Account</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {transactions.map((trx, idx) => (
                  <tr key={idx} className="hover:bg-slate-750/30 transition-colors group">
                    <td className="p-4 text-sm text-slate-300 font-mono">{trx.date}</td>
                    <td className="p-4">
                      <div className="text-sm text-slate-200">{trx.description}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{trx.id}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-400 font-mono">{trx.account}</td>
                    <td className="p-4 text-sm text-slate-400 font-mono">{trx.receiver}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                        trx.status === 'COMPLETED' ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' :
                        trx.status === 'BLOCKED' ? 'bg-red-400/10 text-red-400 border border-red-400/20' :
                        'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                      }`}>
                        {trx.status}
                      </span>
                    </td>
                    <td className={`p-4 text-right font-bold ${trx.amount > 0 ? 'text-emerald-400' : 'text-white'}`}>
                      {trx.amount > 0 ? '+' : ''}${Math.abs(trx.amount).toLocaleString('en-US', {minimumFractionDigits: 2})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
