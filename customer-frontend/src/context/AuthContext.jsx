import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    const storedUser = localStorage.getItem('customerInfo');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const loginWithOtp = (token, userInfo) => {
    localStorage.setItem('customerToken', token);
    localStorage.setItem('customerInfo', JSON.stringify(userInfo));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userInfo);
  };

  const logout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerInfo');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
