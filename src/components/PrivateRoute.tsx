import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = () => {
  const { user, loading } = useAuth();

  // 1. If context is actively loading initial state, show the spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 2. CIRCUIT BREAKER: Cross-reference localStorage signatures directly.
  // This bridges the microsecond gap before the asynchronous React state finishes updating.
  const hasToken = localStorage.getItem('token');
  const hasUser = localStorage.getItem('user');
  const isAuthenticated = user || (hasToken && hasUser);

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
