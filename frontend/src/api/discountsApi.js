// Admin Discounts (Coupons) API
// Provides CRUD for coupons in the Laravel backend under /v1/admin/coupons
import { http, USE_MOCK } from './httpClient';
import { debug } from './logger';

debug('[api] loaded', 'discountsApi');
import { mockDiscounts } from '../data/mockDiscounts';

// Normalize server resource to UI row shape used by AdminDiscounts.jsx
function rowFromServer(item = {}) {
  const starts = item.starts_at ? Date.parse(item.starts_at) : Date.now();
  const ends = item.ends_at ? Date.parse(item.ends_at) : null;
  return {
    id: item.id,
    code: item.code || '',
    type: item.type === 'percent' ? 'percentage' : (item.type || 'percentage'),
    value: Number(item.value ?? 0),
    startDateTs: Number.isFinite(starts) ? starts : Date.now(),
    endDateTs: Number.isFinite(ends) ? ends : null,
    noExpiry: !item.ends_at,
    totalUses: item.max_uses ?? 0,
    used: item.used ?? 0,
    perUserOnce: (item.per_user_limit ?? null) === 1,
    disabled: item.is_active === false,
    appliesTo: Array.isArray(item.target_rule?.appliesTo) ? item.target_rule.appliesTo : [],
    minPurchase: Number(item.target_rule?.minPurchase ?? 0),
    targetUsers: item.target_rule?.targetUsers || 'all',
    roles: Array.isArray(item.target_rule?.roles) ? item.target_rule.roles : [],
    usersPhones: Array.isArray(item.target_rule?.usersPhones) ? item.target_rule.usersPhones.join('\n') : '',
  };
}

// Transform UI form to server payload
function payloadFromForm(form = {}) {
  const startsAt = new Date(form.startDateTs || Date.now()).toISOString();
  // Backend DB column ends_at is NOT NULL (migration), so avoid sending null on create.
  // For "no expiry", send a far-future timestamp to satisfy DB while behaving as non-expiring.
  const endsAt = form.noExpiry
    ? new Date('2099-12-31T23:59:59Z').toISOString()
    : (form.endDateTs ? new Date(form.endDateTs).toISOString() : new Date('2099-12-31T23:59:59Z').toISOString());
  const phones = (form.usersPhones || '')
    .split(/[\n,،]+/)
    .map(s => s.trim())
    .filter(Boolean);
  return {
    code: String(form.code || '').toUpperCase(),
    type: form.type === 'percentage' ? 'percent' : 'fixed',
    value: Number(form.value || 0),
    starts_at: startsAt,
    ends_at: endsAt,
    is_active: !form.disabled,
    max_uses: Number.isFinite(form.totalUses) ? form.totalUses : 0,
    per_user_limit: form.perUserOnce ? 1 : null,
    target_rule: {
      appliesTo: Array.isArray(form.appliesTo) ? form.appliesTo : [],
      minPurchase: Number(form.minPurchase || 0),
      targetUsers: form.targetUsers || 'all',
      roles: Array.isArray(form.roles) ? form.roles : [],
      usersPhones: phones,
    },
  };
}

export async function fetchAdminCoupons({ page = 1, per_page = 100, q = '' } = {}) {
  if (USE_MOCK) {
    return { items: mockDiscounts.slice(), meta: { total: mockDiscounts.length, page, per_page } };
  }
  const params = new URLSearchParams({ page, per_page, q });
  const { data } = await http.get(`/v1/admin/coupons?${params.toString()}`);
  const raw = Array.isArray(data?.data) ? data.data : (data?.data?.data ?? []);
  const items = raw.map(rowFromServer);
  return { items, meta: data?.meta ?? {} };
}

export async function upsertAdminCoupon(form) {
  if (USE_MOCK) {
    // mimic creating/updating and echo back
    return { item: { ...form } };
  }
  const payload = payloadFromForm(form);
  // If id is a persisted server id (numeric), use PUT; otherwise create
  const isServerId = form && form.id != null && /^\d+$/.test(String(form.id));
  if (isServerId) {
    const { data } = await http.put(`/v1/admin/coupons/${form.id}`, payload);
    return { item: rowFromServer(data?.data ?? data) };
  }
  const { data } = await http.post(`/v1/admin/coupons`, payload);
  return { item: rowFromServer(data?.data ?? data) };
}

export async function deleteAdminCoupon(id) {
  if (USE_MOCK) return { ok: true };
  await http.delete(`/v1/admin/coupons/${id}`);
  return { ok: true };
}

export async function setCouponActive(id, active) {
  if (USE_MOCK) return { ok: true };
  const path = active ? 'activate' : 'deactivate';
  const { data } = await http.patch(`/v1/admin/coupons/${id}/${path}`);
  return { item: rowFromServer(data?.data ?? data) };
}

export default {
  fetchAdminCoupons,
  upsertAdminCoupon,
  deleteAdminCoupon,
  setCouponActive,
};
