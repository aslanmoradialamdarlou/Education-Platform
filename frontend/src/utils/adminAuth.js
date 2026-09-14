// Utility to detect admin credentials based on environment variables.
// This is a client-side convenience for local/dev setups only.
export function normalizePhone(p) {
  try { return String(p || '').replace(/\D+/g, ''); } catch { return String(p || ''); }
}

export function isAdminCredentials(phone, password) {
  const adminPhone = import.meta.env.VITE_ADMIN_PHONE || '';
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || '';
  if (!adminPhone || !adminPassword) return false;
  const a = normalizePhone(adminPhone);
  const b = normalizePhone(phone);
  return a && b && a === b && String(password || '') === String(adminPassword);
}

export default { normalizePhone, isAdminCredentials };
