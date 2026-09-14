import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchMe, login as apiLogin, logout as apiLogout } from '../api/authService';
import { USE_MOCK, getToken, clearToken } from '../api/httpClient';

// Global user context: now supports real API bootstrap (with mock fallback).
// IMPORTANT: Use sessionStorage instead of localStorage to avoid cross-tab interference

const STORAGE_KEY = 'app_user';

const defaultUser = {
  id: null,
  name: 'مهمان',
  role: 'guest',
  tokenCount: 0,
  hasSubscription: false,
  subscriptionExpiry: null,
  avatar: null,
  preferredMode: 'light', // 'light' | 'dark'
};

const UserContext = createContext({
  user: defaultUser,
  setUser: () => {},
  updateTokens: () => {},
  setPreferredMode: () => {},
  logout: () => {},
  login: () => {},
  booting: true,
  authError: null,
});

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Use localStorage to persist login across browser sessions
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...defaultUser, ...JSON.parse(raw) } : defaultUser;
    } catch { return defaultUser; }
  });
  const [booting, setBooting] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Bootstrap from backend when mocks disabled; otherwise keep existing mock user.
  useEffect(() => {
    let active = true;
    (async () => {
      if (USE_MOCK) { setBooting(false); return; }
      
      // If no token exists, skip fetching user (user is not logged in)
      const token = getToken();
      if (!token) {
        if (active) {
          // Only set to guest if we don't have a persisted user
          setUser(u => {
            // If user already has an ID (from sessionStorage), keep their data
            // This prevents showing "مهمان" when token is temporarily missing
            if (u?.id) return u;
            return {
              id: null,
              name: 'مهمان',
              role: 'guest',
              tokenCount: 0,
              hasSubscription: false,
              subscriptionExpiry: null,
              avatar: null,
              preferredMode: u?.preferredMode ?? 'light',
            };
          });
          setBooting(false);
        }
        return;
      }
      
      try {
        const me = await fetchMe();
        if (!active) return;
        setUser(u => ({ ...u, ...me }));
        setAuthError(null);
      } catch (e) {
        if (!active) return;
        // Don't immediately log out on fetch failure - keep existing user data
        // Only log out if it's a definite auth error (401), not network errors
        const isAuthError = e?.message === 'UNAUTHORIZED';
        if (isAuthError) {
          // Clear token and set to guest
          clearToken();
          setUser(u => ({
            id: null,
            name: 'مهمان',
            role: 'guest',
            tokenCount: 0,
            hasSubscription: false,
            subscriptionExpiry: null,
            avatar: null,
            preferredMode: u?.preferredMode ?? 'light',
          }));
        } else {
          // For network errors, keep existing user data from sessionStorage
          // This prevents showing "مهمان" on temporary network issues
          setAuthError(e?.message || 'NETWORK_ERROR');
        }
      } finally {
        if (active) setBooting(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    // Persist to localStorage for cross-browser session persistence
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); } catch {}
  }, [user]);

  const updateTokens = useCallback((delta) => {
    setUser(u => ({ ...u, tokenCount: Math.max(0, (u.tokenCount ?? 0) + delta) }));
  }, []);

  const setPreferredMode = useCallback((mode) => {
    const newMode = mode === 'dark' ? 'dark' : 'light';
    setUser(u => {
      // Only update if actually changed to avoid unnecessary re-renders
      if (u.preferredMode === newMode) return u;
      return { ...u, preferredMode: newMode };
    });
  }, []);

  const logout = useCallback(async () => {
    try { await apiLogout(); } catch {}
    // Clear from localStorage
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setUser(u => ({
      id: null,
      name: 'مهمان',
      role: 'guest',
      tokenCount: 0,
      hasSubscription: false,
      subscriptionExpiry: null,
      avatar: null,
      preferredMode: u?.preferredMode ?? 'light',
    }));
  }, []);

  const login = useCallback(async (credentials) => {
    const res = await apiLogin(credentials);
    if (res?.user) setUser(u => ({ ...u, ...res.user }));
    setAuthError(null);
    return res?.user;
  }, []);

  const refreshUser = useCallback(async () => {
    if (USE_MOCK) return;
    
    const token = getToken();
    if (!token) return;
    
    try {
      const me = await fetchMe();
      setUser(u => ({ ...u, ...me }));
      setAuthError(null);
    } catch (e) {
      console.error('Failed to refresh user:', e);
      setAuthError(e?.message || 'REFRESH_FAILED');
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, updateTokens, setPreferredMode, logout, login, refreshUser, booting, authError }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
