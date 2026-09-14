// Authentication service: login, logout, fetch current user
import { http, setToken, getToken, clearToken, USE_MOCK } from './httpClient';
import { log, warn, error, debug } from './logger';

function sanitizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

// Normalize Persian/Arabic-Indic digits to ASCII and strip non-digits for phone fields
const toLatinDigits = (str) => {
  if (str == null) return '';
  let s = String(str);
  const fa = '۰۱۲۳۴۵۶۷۸۹';
  const ar = '٠١٢٣٤٥٦٧٨٩';
  s = s.replace(/[۰-۹]/g, (d) => String(fa.indexOf(d))).replace(/[٠-٩]/g, (d) => String(ar.indexOf(d)));
  return s;
};
const normalizePhone = (val) => toLatinDigits(val).replace(/[^0-9]/g, '');

export async function login({ email, phone, password, otp }) {
  // Unified login wrapper: supports password or OTP per API docs
  // Use phone if provided, otherwise fall back to email (for backward compatibility)
  const identifier = String(phone || email || '').trim();
  if (!identifier) throw new Error('MISSING_IDENTIFIER');

  // Mock path for local dev
  if (USE_MOCK && import.meta.env.DEV) {
    const user = {
      id: `mock_${Date.now()}`,
      name: identifier.split('@')[0] || identifier.substring(0, 5) || 'کاربر',
      role: identifier.includes('admin') ? 'admin' : 'student',
      avatar: `https://i.pravatar.cc/40?u=${Date.now()}`,
      tokenCount: 100,
      hasSubscription: false,
    };
    const token = `mock-token-${Date.now()}`;
    try { setToken(token); } catch (e) { void e; }
    return { accessToken: token, user };
  }

  try {
    let data;
    if (password && !otp) {
      // Phone + password flow (default login method)
      const phoneToSend = normalizePhone(identifier);
      const res = await http.post('/v1/auth/login-password', { phone: phoneToSend, password });
      data = res.data;
    } else if (otp) {
      // OTP flow using phone
      const phoneToSend = normalizePhone(identifier);
      const res = await http.post('/v1/auth/login-otp', { phone: phoneToSend, otp });
      data = res.data;
    } else {
      throw new Error('MISSING_CREDENTIALS');
    }

    const token = data?.token || data?.accessToken || data?.data?.token;
    if (token) setToken(token);

    // Fetch current user profile to return a stable shape
    const me = await fetchMe();
    return { accessToken: token || null, user: me };
  } catch (err) {
    try { error('auth.login unexpected error', { message: err?.message, status: err?.response?.status, data: err?.response?.data }); } catch (e) { /* ignore logging errors */ }
    const status = err?.response?.status;
    // Preserve client-side validation/auth errors so callers (UI) can inspect
    // server-sent messages (e.g. 422 INVALID_OTP) and show them to the user.
    if (status && status >= 400 && status < 500) {
      // rethrow original axios error (preserves response.data)
      throw err;
    }
    // For network/server errors, throw a generic failure so callers can fallback
    throw new Error('AUTH_FAILED');
  }
}

export async function logout() {
  try { await http.post('/v1/auth/logout'); } catch { /* swallow network/logout mismatch */ }
  clearToken();
}

export async function fetchMe() {
  // If token mechanism is purely cookie-based, this still works.
  if (!getToken() && (import.meta.env.VITE_USE_MOCK === 'false')) {
    // We still attempt call in case of cookie session; do not throw prematurely.
  }
  if (USE_MOCK && import.meta.env.DEV) {
    // Return a persisted mock current user if any
    try {
      const raw = localStorage.getItem('mock_current_user');
      if (raw) return JSON.parse(raw);
      return null;
    } catch { return null; }
  }
  try {
  const { data } = await http.get('/v1/me');
  // API returns { code, message, data: { ...user } }
  const user = data?.data ?? data;
    // Normalize roles array to a convenience `role` string used across the frontend
    try {
      if (user) {
        // Normalize roles into a clean array of trimmed strings (lowercase helper created below)
        const normalizeNames = arr => (Array.isArray(arr) ? arr.map(r => (typeof r === 'string' ? r : r?.name)).filter(Boolean).map(n => String(n).trim()) : []);
        const rolesRaw = user.roles || [];
        const names = normalizeNames(rolesRaw);
        // If user.role is present but not canonical, map common variants to canonical 'admin'
        if (user.role) {
          const r = String(user.role).trim();
          if (r.toLowerCase().includes('admin')) {
            user.role = 'admin';
            // ensure roles includes an 'admin' entry for downstream checks
            if (!names.map(n => n.toLowerCase()).includes('admin')) names.unshift('admin');
          }
        }
        // If role is missing, derive from roles array
        if (!user.role) {
          const lower = names.map(n => n.toLowerCase());
          const adminIndex = lower.findIndex(n => n.includes('admin'));
          if (adminIndex !== -1) user.role = 'admin';
          else if (names.length) user.role = names[0];
        }
        // Normalize user.roles to the cleaned list (preserve original case in array if desired, but keep a lowercased helper)
        user.roles = names;
        user.rolesLower = names.map(n => n.toLowerCase());
      }
    } catch (e) { void e; }
    return user;
  } catch (err) {
    const status = err?.response?.status;
    if (status === 401) throw new Error('UNAUTHORIZED');
    throw new Error('FETCH_ME_FAILED');
  }
}

export async function register(payload) {
  // For compatibility, keep a placeholder: real register is a two-step process per API docs
  // Use registerStart and registerComplete below.
  void payload; // unused by design
  throw new Error('USE_REGISTER_FLOW');
}

// Send OTP for phone (or identifier) to start verification/login.
export async function sendOtp({ identifier }) {
  const id = String(identifier || '').trim();
  if (!id) throw new Error('MISSING_IDENTIFIER');
  if (USE_MOCK && import.meta.env.DEV) {
    // Simulate an OTP being sent
    return { ok: true };
  }
  try {
    // The backend exposes register-start for sending OTPs (phone OR email).
    if (/@/.test(id)) {
      const { data } = await http.post('/v1/auth/register-start', { email: id });
      return data ?? { ok: true };
    }
    const { data } = await http.post('/v1/auth/register-start', { phone: normalizePhone(id) });
    return data ?? { ok: true };
  } catch (err) {
    const status = err?.response?.status;
    const server = err?.response?.data;
    try { error('auth.sendOtp failed', { status, server, msg: err?.message }); } catch (e) { /* ignore */ }
    // Surface rate-limit ttl like registerStartPhone
    if (status === 429) {
      const e = new Error(server?.message || 'TOO_MANY_REQUESTS');
      e.status = 429;
      e.code = server?.code;
      e.ttl = server?.data?.ttl ?? server?.ttl ?? null;
      const retryAfter = err?.response?.headers?.['retry-after'];
      if (!e.ttl && retryAfter) {
        const sec = Number(retryAfter);
        if (!Number.isNaN(sec)) e.ttl = sec;
      }
      throw e;
    }
    if (status && status >= 400 && status < 500) {
      const e = new Error(server?.message || 'OTP_SEND_FAILED');
      e.status = status;
      e.code = server?.code;
      throw e;
    }
    throw new Error('OTP_SEND_FAILED');
  }
}

// Login-start: request OTP only for existing users (server returns 404 if not found)
export async function loginStart({ phone }) {
  const p = String(phone || '').trim();
  if (!p) throw new Error('MISSING_IDENTIFIER');
  if (USE_MOCK && import.meta.env.DEV) {
    return { ok: true, data: { ttl: 120 } };
  }
  try {
    const { data } = await http.post('/v1/auth/login-start', { phone: normalizePhone(p) });
    return data ?? { ok: true };
  } catch (err) {
    const status = err?.response?.status;
    const server = err?.response?.data;
    try { error('auth.loginStart failed', { status, server, msg: err?.message }); } catch (e) { /* ignore */ }
    if (status === 404) {
      const e = new Error(server?.message || 'USER_NOT_FOUND');
      e.status = 404;
      e.code = server?.code || 'USER_NOT_FOUND';
      throw e;
    }
    if (status === 429) {
      const e = new Error(server?.message || 'TOO_MANY_REQUESTS');
      e.status = 429;
      e.code = server?.code;
      e.ttl = server?.data?.ttl ?? server?.ttl ?? null;
      const retryAfter = err?.response?.headers?.['retry-after'];
      if (!e.ttl && retryAfter) {
        const sec = Number(retryAfter);
        if (!Number.isNaN(sec)) e.ttl = sec;
      }
      throw e;
    }
    if (status && status >= 400 && status < 500) {
      const e = new Error(server?.message || 'LOGIN_START_FAILED');
      e.status = status;
      try { error('auth.loginStart client error', { status, code: server?.code, message: server?.message }); } catch (e2) { /* ignore */ }
      e.code = server?.code;
      throw e;
    }
    throw new Error('LOGIN_START_FAILED');
  }
}

export async function checkIdentifier({ phone, email }) {
  if (!phone && !email) throw new Error('MISSING_IDENTIFIER');
  if (USE_MOCK && import.meta.env.DEV) return { data: { exists: !!phone } };
  try {
    const { data } = await http.post('/v1/auth/check-identifier', phone ? { phone } : { email });
    return data;
  } catch {
    throw new Error('CHECK_FAILED');
  }
}

// Register-start specifically for signup: request verification code for phone/identifier
export async function registerStartPhone({ identifier }) {
  const id = String(identifier || '').trim();
  if (!id) throw new Error('MISSING_IDENTIFIER');
  if (USE_MOCK && import.meta.env.DEV) {
    return { ok: true };
  }
  try {
  // Backend expects `phone` for register-start in this project; send phone first
  const { data } = await http.post('/v1/auth/register-start', { phone: normalizePhone(id) });
  return data ?? { ok: true };
  } catch (err1) {
    const status = err1?.response?.status;
    const server = err1?.response?.data;
    try { error('auth.fetchMe failed', { status, data: err?.response?.data ?? err?.message }); } catch (e) { /* ignore */ }
    if (status === 429) {
      const e = new Error(server?.message || 'TOO_MANY_REQUESTS');
      e.status = 429;
      e.code = server?.code;
      // server might return ttl in body under data.ttl
      e.ttl = server?.data?.ttl ?? server?.ttl ?? server?.data?.data?.ttl ?? null;
      // also check Retry-After header in response
      const retryAfter = err1?.response?.headers?.['retry-after'];
      if (!e.ttl && retryAfter) {
        const sec = Number(retryAfter);
        if (!Number.isNaN(sec)) e.ttl = sec;
      }
      throw e;
    }
    // Only attempt an email fallback when server returned validation (422) and input looks like an email
    if (status === 422 && /@/.test(id)) {
      try {
        const { data } = await http.post('/v1/auth/register-start', { email: id });
        return data ?? { ok: true };
      } catch (err2) {
        const server2 = err2?.response?.data;
        const e2 = new Error(server2?.message || 'REGISTER_START_FAILED');
        e2.status = err2?.response?.status;
        e2.code = server2?.code;
        throw e2;
      }
    }

    // For other client errors, surface server message
    if (status && status >= 400 && status < 500) {
      const e = new Error(server?.message || 'REGISTER_START_FAILED');
      e.status = status;
      e.code = server?.code;
      throw e;
    }

    throw new Error('REGISTER_START_FAILED');
  }
}

// Verify OTP without consuming it. Used by frontend code-entry step.
export async function verifyOtp({ phone, otp }) {
  const p = normalizePhone(String(phone || '').trim());
  if (!p || !otp) throw new Error('MISSING_FIELDS');
  if (USE_MOCK && import.meta.env.DEV) {
    if (import.meta.env.VITE_DEV_SMS_BYPASS === 'true') return { data: { valid: true } };
    // accept 123456 as dev override
    if (otp === '123456') return { data: { valid: true } };
  }
  const { data } = await http.post('/v1/auth/verify-otp', { phone: p, otp });
  return data;
}

export async function registerStart({ email }) {
  const e = sanitizeEmail(email);
  if (!e) throw new Error('MISSING_EMAIL');
  if (USE_MOCK && import.meta.env.DEV) {
    // Simulate OTP sent
    return { ok: true };
  }
  try {
    const { data } = await http.post('/v1/auth/register-start', { email: e });
    return data;
  } catch {
    throw new Error('REGISTER_START_FAILED');
  }
}

export async function registerComplete(payload) {
  const { email, identifier, phone, otp, password, ...rest } = payload || {};
  const id = String(identifier || phone || email || '').trim();
  const e = email ? sanitizeEmail(email) : (/@/.test(id) ? sanitizeEmail(id) : null);
  if (!id || !otp) throw new Error('MISSING_FIELDS');
  if (USE_MOCK && import.meta.env.DEV) {
    const token = `mock-token-${Date.now()}`;
    try { setToken(token); } catch (e) { void e; }
    const me = await fetchMe();
    return { accessToken: token, user: me };
  }
  // Build payloads; password is optional. Merge extra profile fields from `rest`.
  const attempts = [];
  if (e) attempts.push({ email: e, otp, ...(password ? { password } : {}), ...rest });
  if (!/@/.test(id)) {
    attempts.push({ phone: id, otp, ...(password ? { password } : {}), ...rest });
    attempts.push({ identifier: id, otp, ...(password ? { password } : {}), ...rest });
  } else {
    attempts.push({ identifier: id, otp, ...(password ? { password } : {}), ...rest });
  }
  let lastErr;
  for (const body of attempts) {
    try {
      const { data } = await http.post('/v1/auth/register-complete', body);
      const token = data?.token || data?.accessToken || data?.data?.token;
      if (token) setToken(token);
      const me = await fetchMe();
      return { accessToken: token || null, user: me };
    } catch (err) {
      lastErr = err;
      const status = err?.response?.status;
      if (!(status && status >= 400 && status < 500)) break; // don't keep trying on server errors
    }
  }
  if (lastErr) {
    // preserve Axios error so callers can inspect response.data (validation messages)
    throw lastErr;
  }
  throw new Error('REGISTER_COMPLETE_FAILED');
}

// Force real backend call for register-complete (bypass mock shortcut)
export async function registerCompleteReal(payload) {
  const id = String(payload?.identifier || payload?.phone || payload?.email || '').trim();
  const otp = payload?.otp;
  if (!id || !otp) throw new Error('MISSING_FIELDS');
  const { data } = await http.post('/v1/auth/register-complete', payload);
  const token = data?.token || data?.accessToken || data?.data?.token;
  if (token) setToken(token);
  const me = await fetchMe();
  return { accessToken: token || null, user: me };
}

// Explicit login with OTP (phone + otp) - used for verifying code without completing profile
export async function loginWithOtp({ phone, otp }) {
  const p = normalizePhone(String(phone || '').trim());
  if (!p || !otp) throw new Error('MISSING_FIELDS');
  if (USE_MOCK && import.meta.env.DEV) {
    const token = `mock-token-${Date.now()}`;
    try { setToken(token); } catch (e) { void e; }
    const me = await fetchMe();
    return { accessToken: token, user: me };
  }
  try {
    const { data } = await http.post('/v1/auth/login-otp', { phone: p, otp });
    const token = data?.token || data?.accessToken || data?.data?.token;
    if (token) setToken(token);
    const me = await fetchMe();
    return { accessToken: token || null, user: me };
  } catch (err) {
    const status = err?.response?.status;
    // Preserve client validation errors so callers can read server response
    if (status && status >= 400 && status < 500) {
      throw err;
    }
    try { error('auth.loginWithOtp failed', { message: err?.message, status: err?.response?.status, data: err?.response?.data }); } catch (e) { /* ignore */ }
    throw new Error('OTP_LOGIN_FAILED');
  }
}
