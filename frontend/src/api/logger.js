// Minimal logger wrapper so we can control logging in one place.
// Only logs in DEV to avoid leaking info in production builds.
export function log(...args) {
  if (import.meta.env.DEV) console.log('[api]', ...args);
}
export function warn(...args) {
  if (import.meta.env.DEV) console.warn('[api]', ...args);
}
export function error(...args) {
  if (import.meta.env.DEV) console.error('[api]', ...args);
}
export function debug(...args) {
  if (import.meta.env.DEV) console.debug('[api]', ...args);
}
