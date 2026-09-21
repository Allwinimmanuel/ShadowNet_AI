import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const Unauthorized = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-slate-50">
      <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-2xl flex flex-col items-center max-w-md text-center">
        <div className="p-4 bg-red-900/30 rounded-full text-red-400 mb-6">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-slate-400 mb-8">
          You do not have the required administrator permissions to view this page.
        </p>
        <Link 
          to="/login"
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-colors"
          onClick={() => {
            localStorage.removeItem('token');
          }}
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
