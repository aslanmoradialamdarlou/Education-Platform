// Lazy toast push without direct import (avoid cyclical deps). Consumer may not exist early in SSR.
let _toastPush = null;
export function __setToastPush(fn) { _toastPush = fn; }

// Central axios instance with interceptors
import axios from 'axios';
import { log, warn, error, debug } from './logger';

// --- Base URL normalization & safety ---
function normalizeBase(url) {
  let u = (url || '').trim();
  if (!u) return 'http://localhost:8000/api';
  // Disallow javascript: and data: schemes for safety misconfigurations
  if (/^(javascript:|data:)/i.test(u)) {
    console.warn('[httpClient] Rejected unsafe VITE_API_BASE_URL, falling back to default.');
    return 'http://localhost:8000/api';
  }
  // Remove trailing slashes for consistent join
  u = u.replace(/\/+$/, '');
  return u;
}
const baseURL = normalizeBase(import.meta.env.VITE_API_BASE_URL);
// Mocks are opt-in: only true when explicitly set to 'true'
const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'false') === 'true';

// --- Token handling strategy ---
// Use localStorage for persistent sessions across browser restarts
const TOKEN_KEY = import.meta.env.VITE_AUTH_TOKEN_KEY || 'elmino_access_token';
// Persist tokens across browser sessions
const PERSIST_ACCESS_TOKEN = (import.meta.env.VITE_PERSIST_ACCESS_TOKEN ?? 'true') === 'true';
const USE_SESSION_STORAGE = (import.meta.env.VITE_USE_SESSION_STORAGE ?? 'false') === 'false';
let memoryToken = null; // never exposed directly

function _readPersisted() {
  if (!PERSIST_ACCESS_TOKEN) return null;
  try {
    // Use localStorage by default for persistent login, sessionStorage for tab-specific sessions if configured
    if (USE_SESSION_STORAGE) {
      return sessionStorage.getItem(TOKEN_KEY);
    }
    return localStorage.getItem(TOKEN_KEY);
  } catch { return null; }
}

export function getToken() { return memoryToken || _readPersisted(); }
export function setToken(token) {
  memoryToken = token || null;
  if (PERSIST_ACCESS_TOKEN) {
    try {
      if (USE_SESSION_STORAGE) {
        if (token) sessionStorage.setItem(TOKEN_KEY, token); else sessionStorage.removeItem(TOKEN_KEY);
      } else {
        if (token) localStorage.setItem(TOKEN_KEY, token); else localStorage.removeItem(TOKEN_KEY);
      }
    } catch { /* ignore quota */ }
  }
}
export function clearToken() { setToken(null); }

export const http = axios.create({
  baseURL,
  withCredentials: true, // allow cookies (refresh token / csrf cookie)
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' }
});

http.interceptors.request.use(cfg => {
  // Public requests (no auth/csrf/cookies) — opt-in per request via cfg._public
  const isPublic = Boolean(cfg._public);
  const token = getToken();
  try {
    // Log basic request metadata for debugging auth/network issues
    const method = (cfg.method || 'get').toUpperCase();
    debug('http.request', method, cfg.url, { public: isPublic, hasToken: !!token });
  } catch (e) { /* swallow logging failures */ }
  if (!isPublic && token) cfg.headers.Authorization = `Bearer ${token}`;
  // Attach CSRF token header if cookie exists (non-HttpOnly) and header not already set
  if (!isPublic && !cfg.headers['X-CSRF-Token']) {
    const m = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/);
    if (m) cfg.headers['X-CSRF-Token'] = decodeURIComponent(m[1]);
  }
  if (isPublic) {
    // Ensure we don't send cookies on public reads to avoid strict CORS credential requirements
    cfg.withCredentials = false;
  }
  return cfg;
}, err => Promise.reject(err));

// --- Refresh logic (bounded & queued) ---
let isRefreshing = false;
let queued = [];
let refreshAttempts = 0;
const MAX_REFRESH_ATTEMPTS = 2; // stop infinite loops

async function processQueue(error, token = null) {
  queued.forEach(p => token ? p.resolve(token) : p.reject(error));
  queued = [];
}

http.interceptors.response.use(r => r, async error => {
  try {
    // Log errors early for easier diagnosis in dev
    if (!error.response) {
      error('http.network_error', error.message || String(error), { config: error.config });
    } else {
      const st = error.response.status;
      error('http.response_error', st, error.response.data ?? error.response, { url: error.config?.url });
    }
  } catch (e) { /* swallow logging failures */ }
  // Retry once on transient network errors for idempotent GETs
  if (!error.response) {
    try {
      const original = error.config || {};
      const method = (original.method || 'get').toLowerCase();
      if (!original._networkRetry && method === 'get') {
        original._networkRetry = true;
        // small backoff
        await new Promise(res => setTimeout(res, 350));
        return http(original);
      }
    } catch { /* swallow */ }
    return Promise.reject(error);
  }
  const status = error.response.status;
  const original = error.config;
  // Disable auto-refresh for now since backend doesn't have /auth/refresh endpoint
  // TODO: Implement refresh token endpoint in Laravel backend
  const enableAutoRefresh = false; // (import.meta.env.VITE_ENABLE_AUTO_REFRESH ?? 'true') !== 'false';

  // If unauthorized and we have not exceeded attempts AND we have a token to refresh
  if (enableAutoRefresh && status === 401 && original && !original._retry && refreshAttempts < MAX_REFRESH_ATTEMPTS && getToken()) {
  debug('http.auto_refresh_attempt', { refreshAttempts, url: original?.url });
    original._retry = true;
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queued.push({ resolve: (token) => { if (token) original.headers.Authorization = `Bearer ${token}`; resolve(http(original)); }, reject });
      });
    }
    isRefreshing = true;
    refreshAttempts += 1;
    try {
      const res = await axios.post(baseURL + '/auth/refresh', {}, { withCredentials: true });
      const newToken = res.data?.accessToken;
      debug('http.refresh_response', { newTokenPresent: !!newToken });
      if (!newToken) throw new Error('NO_REFRESH_TOKEN');
      setToken(newToken);
      await processQueue(null, newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return http(original);
    } catch (rfErr) {
      clearToken();
      error('http.refresh_failed', rfErr?.message || rfErr);
      try { window.dispatchEvent(new CustomEvent('auth:expired', { detail: { reason: 'refresh_failed' } })); } catch (e) { /* ignore */ }
      await processQueue(rfErr, null);
      return Promise.reject(rfErr);
    } finally {
      isRefreshing = false;
      if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
        // Hard reset attempts after a short delay to allow manual re-login flows
        setTimeout(() => { refreshAttempts = 0; }, 5000);
      }
    }
  }

  // If we reach here and got a 401 (but refresh didn't apply / disabled), treat as expired
  // Don't auto-clear token - let UserContext handle logout decision
  if (status === 401) {
    // Only dispatch event, don't clear token automatically
    // This allows the UserContext to decide whether to keep user logged in
    try { window.dispatchEvent(new CustomEvent('auth:expired', { detail: { reason: 'unauthorized' } })); } catch (e) { /* ignore */ }
  }

  // Show toast for notable client/server errors (except those handled silently)
  try {
    if (_toastPush && status && ![401].includes(status)) {
      let type = 'error';
      if (status >= 500) type = 'error'; else if (status >= 400) type = 'warning';
      const msg = error.response?.data?.message || error.message || 'خطای ناشناخته';
      _toastPush({ type, message: msg });
    }
  } catch { /* swallow toast errors */ }
  return Promise.reject(error);
});

export { USE_MOCK };
