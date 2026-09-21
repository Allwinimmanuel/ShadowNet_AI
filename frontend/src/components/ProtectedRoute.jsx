import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// Utility to parse JWT safely
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

const ProtectedRoute = ({ requireAdmin = false }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Not logged in
    return <Navigate to="/login" replace />;
  }

  const decoded = parseJwt(token);
  if (!decoded) {
    // Invalid token
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }

  // Check role
  if (requireAdmin && decoded.role !== 'ADMIN') {
    return <Navigate to="/unauthorized" replace />;
  }

  // Authorized
  return <Outlet />;
};

export default ProtectedRoute;
