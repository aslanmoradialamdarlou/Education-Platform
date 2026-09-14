// src/data/mockDiscounts.js
const fmtFa = (d) => new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

const mk = (id, code, type, value, opts = {}) => {
  const start = opts.start || new Date();
  const end = opts.noExpiry ? null : (opts.end || null);
  return {
    id,
    code,
    type, // 'percentage' | 'fixed'
    value, // number
    appliesTo: opts.appliesTo || ['all_subscriptions'],
    minPurchase: opts.minPurchase ?? 0,
    totalUses: opts.totalUses ?? 100,
    used: opts.used ?? Math.floor(Math.random() * 50),
    perUserOnce: !!opts.perUserOnce,
    targetUsers: opts.targetUsers || 'all', // 'all' | 'roles' | 'users'
    roles: opts.roles || [], // ['student','teacher'] if roles
    usersPhones: opts.usersPhones || '', // newline or comma separated
    startDateTs: start.getTime(),
    endDateTs: end ? end.getTime() : null,
    noExpiry: !!opts.noExpiry,
    disabled: !!opts.disabled,
    createdAtLabel: fmtFa(start),
  };
};

export const APPLY_OPTIONS = [
  { value: 'all_subscriptions', label: 'همه اشتراک‌ها' },
  { value: 'golden', label: 'طرح طلایی' },
  { value: 'grade', label: 'طرح پایه' },
  { value: 'chapter', label: 'طرح فصل' },
  { value: 'token_packages', label: 'بسته‌های توکن (آتی)' },
];

export const mockDiscounts = [
  mk('d-101', 'ELMINO-FIRST', 'percentage', 20, { appliesTo: ['all_subscriptions'], totalUses: 100, used: 75, start: new Date(2024, 5, 1) }),
  mk('d-102', 'BAHAR1404', 'fixed', 50000, { appliesTo: ['golden'], totalUses: 50, used: 10, start: new Date(2024, 11, 1), end: new Date(2025, 0, 15) }),
  mk('d-103', 'TEACHER-DAY', 'percentage', 30, { appliesTo: ['grade','chapter'], totalUses: 0, used: 0, start: new Date(2025, 4, 2), noExpiry: true }),
  mk('d-104', 'NEWYEAR', 'percentage', 15, { appliesTo: ['all_subscriptions'], totalUses: 200, used: 0, start: new Date(2025, 11, 30), end: new Date(2026, 0, 3), disabled: true }),
];
