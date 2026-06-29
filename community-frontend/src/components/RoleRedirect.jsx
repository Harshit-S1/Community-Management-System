import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleRedirect = () => {
    const { user, loading } = useAuth();
    if (loading) {
        return <div>Loading...</div>;
    }
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    // Redirecting users based on their assigned role
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
};

export default RoleRedirect;