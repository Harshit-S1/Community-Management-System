import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode'; 
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem('token') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initializing the authentication state
  useEffect(() => {
    const initializeAuth = () => {
      if (token) {
        try {
          const decodedUser = jwtDecode(token);    
          if (decodedUser.exp * 1000 < Date.now()) {
            handleLogout();
          } else {
            setUser(decodedUser);
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error("Invalid token format:", error);
          handleLogout();
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, [token]);

  // Handling the user login
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: newToken } = response.data;
      
      sessionStorage.setItem('token', newToken);
      setToken(newToken);
      
      const decodedUser = jwtDecode(newToken);
      setUser(decodedUser);
      setIsAuthenticated(true);
      
      return { success: true, role: decodedUser.role };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed. Please check your credentials.' 
      };
    }
  };
  const logout = () => {
    handleLogout();
  };

  // Clearing the authentication state
  const handleLogout = () => {
    sessionStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };
  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};