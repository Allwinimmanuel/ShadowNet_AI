import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  analyze: async (data) => {
    try {
      const response = await api.post('/auth/analyze', data);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },
};

export const dashboardAPI = {
  getSummary: async (start_date, end_date) => {
    try {
      const params = {};
      if (start_date) params.start_date = start_date;
      if (end_date) params.end_date = end_date;
      const response = await api.get('/dashboard/summary', { params });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },
};

export const historyAPI = {
  getAttempts: async () => {
    try {
      const response = await api.get('/login-attempts');
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },
  getIncidents: async (start_date, end_date) => {
    try {
      const params = {};
      if (start_date) params.start_date = start_date;
      if (end_date) params.end_date = end_date;
      const response = await api.get('/incidents', { params });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },
  getAlerts: async () => {
    try {
      const response = await api.get('/alerts');
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },
};

export const preventionAPI = {
  getStatus: async () => {
    try {
      const response = await api.get('/prevention/status');
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },
  unlockAccount: async (userId) => {
    try {
      const response = await api.post('/prevention/unlock-account', { user_id: userId });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },
  unblockIp: async (ipAddress) => {
    try {
      const response = await api.post('/prevention/unblock-ip', { ip_address: ipAddress });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },
  lockAccount: async (userId, reason) => {
    try {
      const response = await api.post('/prevention/lock-account', { user_id: userId, reason });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },
  blockIp: async (ipAddress, reason) => {
    try {
      const response = await api.post('/prevention/block-ip', { ip_address: ipAddress, reason });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },
};

export const systemAPI = {
  getHealth: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },
  getMetrics: async () => {
    try {
      const response = await api.get('/model/metrics');
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  }
};

export const threatAPI = {
  getPrediction: async () => {
    try { return (await api.get('/threat/prediction')).data; }
    catch (e) { throw handleError(e); }
  },
  getRiskScores: async () => {
    try { return (await api.get('/threat/risk-scores')).data; }
    catch (e) { throw handleError(e); }
  },
  getAttackPaths: async () => {
    try { return (await api.get('/threat/attack-paths')).data; }
    catch (e) { throw handleError(e); }
  },
  explain: async (data) => {
    try { return (await api.post('/threat/explain', data)).data; }
    catch (e) { throw handleError(e); }
  },
};

export const uebaAPI = {
  getAnomalies: async () => {
    try { return (await api.get('/ueba/anomalies')).data; }
    catch (e) { throw handleError(e); }
  },
  getBaseline: async (userId) => {
    try { return (await api.get(`/ueba/baseline/${userId}`)).data; }
    catch (e) { throw handleError(e); }
  },
  getUserReport: async (userId) => {
    try { return (await api.get(`/ueba/user/${userId}`)).data; }
    catch (e) { throw handleError(e); }
  },
};

export const phishingAPI = {
  analyze: async (emailText) => {
    try { return (await api.post('/phishing/analyze', { email_text: emailText })).data; }
    catch (e) { throw handleError(e); }
  },
};



export const auditAPI = {
  getLogs: async () => {
    try { return (await api.get('/audit-logs')).data; }
    catch (e) { throw handleError(e); }
  }
};

export const demoAPI = {
  triggerScenario: async (scenario) => {
    try { return (await api.post('/demo/scenario', { scenario })).data; }
    catch (e) { throw handleError(e); }
  },
  resetData: async () => {
    try { return (await api.post('/demo/reset')).data; }
    catch (e) { throw handleError(e); }
  }
};

export const exportAPI = {
  getLoginsUrl: () => `${API_URL}/export/logins`,
  getIncidentsUrl: () => `${API_URL}/export/incidents`,
  getAuditLogsUrl: () => `${API_URL}/export/audit-logs`
};

const handleError = (error) => {
  if (error.response) {
    return new Error(error.response.data.detail || 'Server error occurred');
  } else if (error.request) {
    return new Error('No response from server. Is the backend running?');
  } else {
    return new Error('Error creating request: ' + error.message);
  }
};

export default api;
