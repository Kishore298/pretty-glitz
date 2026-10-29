import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { LS_CUSTOMER_TOKEN, LS_CUSTOMER_INFO } from '../config/constants';

export const AuthContext = createContext();

/**
 * AuthProvider
 *
 * Manages customer phone + password authentication.
 * Admin authentication is completely separate (/api/admin/auth) and unaffected.
 *
 * Exposes:
 *   login(mobile, password)  → returns { token, user } or { status: 'NEEDS_PASSWORD_SETUP', ... }
 *   register(name, mobile, password) → returns { token, user }
 *   setPassword(mobile, newPassword, confirmPassword) → returns { token, user }
 *   logout()
 *   user, loading, token
 */
export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(LS_CUSTOMER_TOKEN);
    const storedUser  = localStorage.getItem(LS_CUSTOMER_INFO);
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } catch {
        // Corrupt storage — clear it silently.
        localStorage.removeItem(LS_CUSTOMER_TOKEN);
        localStorage.removeItem(LS_CUSTOMER_INFO);
      }
    }
    setLoading(false);
  }, []);

  // ── Internal helper to persist a new session ─────────────────────────────────

  const _persistSession = useCallback((newToken, newUser) => {
    localStorage.setItem(LS_CUSTOMER_TOKEN, newToken);
    localStorage.setItem(LS_CUSTOMER_INFO, JSON.stringify(newUser));
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(newUser);
  }, []);

  // ── Login ────────────────────────────────────────────────────────────────────

  /**
   * Attempt to log in with mobile + password.
   *
   * Returns:
   *   { success: true, token, user }           → authenticated
   *   { success: false, needsPasswordSetup: true, mobile, name } → legacy account
   *   { success: false, message }              → validation / auth error
   */
  const login = useCallback(async (mobile, password) => {
    try {
      const { data } = await api.post('/customer/auth/login', { mobile, password });

      if (data.status === 'NEEDS_PASSWORD_SETUP') {
        return { success: false, needsPasswordSetup: true, mobile: data.mobile, name: data.name };
      }

      _persistSession(data.token, data.user);
      return { success: true, token: data.token, user: data.user };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      return { success: false, message };
    }
  }, [_persistSession]);

  // ── Register ─────────────────────────────────────────────────────────────────

  const register = useCallback(async (name, mobile, password) => {
    try {
      const { data } = await api.post('/customer/auth/register', { name, mobile, password });
      _persistSession(data.token, data.user);
      return { success: true, token: data.token, user: data.user };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      return { success: false, message };
    }
  }, [_persistSession]);

  // ── Set Password (legacy migration) ──────────────────────────────────────────

  const setPassword = useCallback(async (mobile, newPassword, confirmPassword) => {
    try {
      const { data } = await api.post('/customer/auth/set-password', {
        mobile, newPassword, confirmPassword,
      });
      _persistSession(data.token, data.user);
      return { success: true, token: data.token, user: data.user };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to set password. Please try again.';
      return { success: false, message };
    }
  }, [_persistSession]);

  // ── Logout ───────────────────────────────────────────────────────────────────

  const logout = useCallback(() => {
    localStorage.removeItem(LS_CUSTOMER_TOKEN);
    localStorage.removeItem(LS_CUSTOMER_INFO);
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  }, []);

  // Keep a stable reference to the current token for downstream consumers.
  const getToken = useCallback(() => localStorage.getItem(LS_CUSTOMER_TOKEN), []);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, setPassword, logout, getToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
