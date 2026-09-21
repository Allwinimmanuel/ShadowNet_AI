import React, { useState } from 'react';
import axios from 'axios';
import { Shield, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        username,
        password
      });
      
      if (res.data.success && res.data.token) {
        localStorage.setItem('token', res.data.token);
        setMessage(res.data.message || 'Login successful.');
        setMessageType('success');
        // Navigate to dashboard after successful login
        setTimeout(() => navigate('/'), 1500);
      } else if (res.data.success) {
        setMessage(res.data.message || 'Login successful, but further verification required.');
        setMessageType('error');
      } else {
        setMessage(res.data.message || 'Login failed.');
        setMessageType('error');
      }
    } catch (err) {
      if (err.response) {
        const detail = err.response.data?.detail || '';
        
        if (detail.includes('IP address is blocked') || detail.includes('network address')) {
          setMessage('This network address has been temporarily blocked.');
          setMessageType('error');
        } else if (detail.includes('locked')) {
          setMessage('Your account has been temporarily locked due to multiple failed login attempts.');
          setMessageType('error');
        } else if (err.response.status === 401 || detail.includes('Invalid')) {
          setMessage('Invalid username or password.');
          setMessageType('error');
        } else {
          setMessage('Login failed. Please try again.');
          setMessageType('error');
        }
      } else if (err.request) {
        setMessage('Unable to connect to the security server. Please try again.');
        setMessageType('error');
      } else {
        setMessage('Login failed. Please try again.');
        setMessageType('error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 w-full max-w-md shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-blue-900/30 rounded-full text-blue-400 mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">ShadowNet AI Login</h2>
          <p className="text-slate-400 mt-2 text-sm">Sign in to access the system</p>
        </div>
        
        {message && (
          <div className={`p-4 mb-6 rounded-lg border text-sm font-medium ${
            messageType === 'success' 
              ? 'bg-green-900/30 border-green-800 text-green-300' 
              : 'bg-red-900/30 border-red-800 text-red-300'
          }`}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" 
              placeholder="e.g. USR001"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" 
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg mt-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
          >
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
