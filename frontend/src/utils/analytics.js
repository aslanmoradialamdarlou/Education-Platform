// Very lightweight analytics shim; replace with real provider when ready
export function track(event, payload = {}) {
  try {
    // eslint-disable-next-line no-console
    console.debug('[analytics]', event, payload);
    window.dispatchEvent(new CustomEvent('analytics', { detail: { event, payload, ts: Date.now() } }));
  } catch {}
}
