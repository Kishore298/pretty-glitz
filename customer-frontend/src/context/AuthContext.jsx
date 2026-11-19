import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { LS_CUSTOMER_TOKEN, LS_CUSTOMER_INFO } from '../config/constants';

export const AuthContext = createContext();

/**
 * AuthProvider
 *
 * Manages customer mobile OTP authentication (MSG91 / 1234 bypass).
 * Admin authentication is completely separate (/api/admin/auth) and unaffected.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(LS_CUSTOMER_TOKEN);
    const storedUser = localStorage.getItem(LS_CUSTOMER_INFO);
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } catch {
        localStorage.removeItem(LS_CUSTOMER_TOKEN);
        localStorage.removeItem(LS_CUSTOMER_INFO);
      }
    }
    setLoading(false);
  }, []);

  const _persistSession = useCallback((newToken, newUser) => {
    localStorage.setItem(LS_CUSTOMER_TOKEN, newToken);
    localStorage.setItem(LS_CUSTOMER_INFO, JSON.stringify(newUser));
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(newUser);
  }, []);

  /**
   * Send OTP to customer mobile via MSG91
   */
  const sendOtp = useCallback(async (mobile) => {
    try {
      const { data } = await api.post('/customer/auth/send-otp', { mobile });
      return { success: true, message: data.message, simulated: data.simulated };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to dispatch OTP. Please check your number.';
      return { success: false, message };
    }
  }, []);

  /**
   * Verify OTP and log in / auto-register customer
   */
  const verifyOtp = useCallback(async (mobile, otp, name = '') => {
    try {
      const { data } = await api.post('/customer/auth/verify-otp', { mobile, otp, name });
      if (data.token && data.user) {
        _persistSession(data.token, data.user);
        return { success: true, token: data.token, user: data.user };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (err) {
      const message = err.response?.data?.message || 'Verification failed. Use 1234 or verify your OTP.';
      return { success: false, message };
    }
  }, [_persistSession]);

  /**
   * Logout
   */
  const logout = useCallback(() => {
    localStorage.removeItem(LS_CUSTOMER_TOKEN);
    localStorage.removeItem(LS_CUSTOMER_INFO);
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  }, []);

  const getToken = useCallback(() => {
    return token || localStorage.getItem(LS_CUSTOMER_TOKEN);
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        sendOtp,
        verifyOtp,
        login: verifyOtp, // Backward compatible alias
        logout,
        getToken,
        isAuthenticated: Boolean(user && token),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
