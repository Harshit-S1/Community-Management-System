import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  // Verifying the user's authentication status
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500 text-lg">Verifying access...</p>
      </div>
    );
  }

  // Redirecting unauthenticated users to the login page
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Validating the user's access permissions
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'resident':
        return <Navigate to="/resident/feed" replace />;
      case 'guard':
        return <Navigate to="/guard/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }
  // Rendering the protected routes
  return <Outlet />;
};

export default ProtectedRoute;