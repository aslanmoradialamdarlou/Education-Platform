import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Trash2, Edit, PlusCircle, ChevronDown } from 'lucide-react';
import styles from './Admin.module.css';
import discountStyles from './AdminDiscounts.module.css';
import './adminBase.css';
import { APPLY_OPTIONS, mockDiscounts } from '../../data/mockDiscounts';
import discountsApi from '../../api/discountsApi';
import { USE_MOCK } from '../../api/httpClient';
import ConfirmationDialog from './ConfirmationDialog';
import { useToast } from '../Toast/ToastProvider.jsx';
import HejriDatePicker from './HejriDatePicker';

const statusOf = (d, nowTs) => {
  if (d.disabled) return 'disabled';
  if (d.startDateTs > nowTs) return 'scheduled';
  if (d.noExpiry || !d.endDateTs) return 'active';
  return d.endDateTs >= nowTs ? 'active' : 'expired';
};

const STATUS_MAP = {
  active: { label: 'فعال', color: '#198754' },
  scheduled: { label: 'زمان‌بندی شده', color: '#0d6efd' },
  expired: { label: 'منقضی', color: '#842029' },
  disabled: { label: 'غیرفعال', color: '#6c757d' },
};

const AdminDiscounts = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState(() => USE_MOCK ? mockDiscounts : []);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  // Advanced filters
  const [advOpen, setAdvOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState(''); // '' | 'percentage' | 'fixed'
  const [expiryFilter, setExpiryFilter] = useState(''); // '' | 'noExpiry' | 'hasExpiry'
  const [startFrom, setStartFrom] = useState(''); // YYYY-MM-DD
  const [endTo, setEndTo] = useState(''); // YYYY-MM-DD
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, action: null, payload: null });
  const nowTs = Date.now();
  const { push } = useToast();

  const filtered = useMemo(() => {
    const parseDate = (s) => {
      if (!s) return null;
      const t = new Date(s).getTime();
      return Number.isNaN(t) ? null : t;
    };
  const sf = parseDate(startFrom);
  const et = parseDate(endTo);

    return items.filter(x => {
      if (query && !x.code.toLowerCase().includes(query.toLowerCase())) return false;
      const st = statusOf(x, nowTs);
      if (status && st !== status) return false;

      // Advanced: type
      if (typeFilter && x.type !== typeFilter) return false;
      // Advanced: expiry presence
      if (expiryFilter === 'noExpiry' && !x.noExpiry) return false;
      if (expiryFilter === 'hasExpiry' && x.noExpiry) return false;
  // Advanced: start date (from)
  if (sf !== null && x.startDateTs < sf) return false;
  // Advanced: end date (to) - treat null endDateTs (no expiry) as after any date
  const endTs = x.endDateTs ?? null;
  if (et !== null && (endTs === null || endTs > et)) return false;

      return true;
    });
  }, [items, query, status, typeFilter, expiryFilter, startFrom, endTo, nowTs]);

  // Helper to format Date -> 'YYYY-MM-DD' for filter state compatibility
  const toYMD = (d) => {
    if (!d || !(d instanceof Date) || isNaN(d)) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const clearAdvanced = () => {
    setTypeFilter('');
    setExpiryFilter('');
    setStartFrom('');
    setEndTo('');
  };

  const openCreate = () => { setEditing(null); setDrawerOpen(true); };
  const openEdit = (row) => { setEditing(row); setDrawerOpen(true); };
  const doDelete = async (id) => {
    if (!USE_MOCK) {
      try {
        await discountsApi.deleteAdminCoupon(id);
        push({ type: 'success', message: 'کد تخفیف حذف شد.' });
      } catch (e) {
        console.error('Delete coupon failed', e);
        const msg = e?.response?.data?.message || 'حذف کد تخفیف با خطا مواجه شد.';
        push({ type: 'error', message: msg });
        return;
      }
    }
    setItems(arr => arr.filter(d => d.id !== id));
  };
  const toggleDisable = async (row) => {
    if (!USE_MOCK) {
      try {
        const { item } = await discountsApi.setCouponActive(row.id, row.disabled);
        setItems(arr => arr.map(d => d.id === row.id ? item : d));
        push({ type: 'success', message: row.disabled ? 'کد فعال شد.' : 'کد غیرفعال شد.' });
        return;
      } catch (e) {
        console.error('Toggle active failed', e);
        const msg = e?.response?.data?.message || 'تغییر وضعیت کد با خطا مواجه شد.';
        push({ type: 'error', message: msg });
        return;
      }
    }
    setItems(arr => arr.map(d => d.id === row.id ? { ...d, disabled: !d.disabled } : d));
  };

  // Deep-link: auto open create discount when ?action=add
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    if (action === 'add' && !drawerOpen) {
      openCreate();
      params.delete('action');
      const base = location.pathname;
      const qs = params.toString();
      navigate(qs ? `${base}?${qs}` : base, { replace: true });
    }
  }, [location.search, drawerOpen, navigate, location.pathname]);

  // Load coupons from backend when not in mock mode
  useEffect(() => {
    if (USE_MOCK) return;
    let mounted = true;
    (async () => {
      try {
        const res = await discountsApi.fetchAdminCoupons({ page: 1, per_page: 200 });
        if (mounted) setItems(res.items || []);
      } catch (e) { console.error('Failed to load coupons', e); }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div dir="rtl">
      <div className={styles.panelHeader}>
        <h2 className="title-md" style={{ margin: 0 }}>مدیریت کدهای تخفیف</h2>
        <button onClick={openCreate} className="btn btn-primary" type="button" aria-label="ایجاد کد جدید">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <PlusCircle size={18} />
            ایجاد کد جدید
          </span>
        </button>
      </div>

      <div className={`${styles.detailFilterContainer} detailFilterContainer adminCard adminCard--tight`}>
        <div className={`${styles.filtersRow} fullWidthRow`}>
          <div className="filterGroup" style={{ flex: '1 1 320px' }}>
            <label htmlFor="search-code">جستجو</label>
            <div className="inputWrap">
              <input
                id="search-code"
                type="text"
                placeholder="جستجو بر اساس کد"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="جستجو بر اساس کد"
              />
              <Search className="searchIcon" size={18} aria-hidden="true" />
            </div>
          </div>
          <div className="filterGroup" style={{ flex: '0 1 220px' }}>
            <label htmlFor="status-filter">وضعیت</label>
            <select id="status-filter" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">همه</option>
              <option value="active">فعال</option>
              <option value="scheduled">زمان‌بندی شده</option>
              <option value="expired">منقضی</option>
              <option value="disabled">غیرفعال</option>
            </select>
          </div>
        </div>

        <button type="button" className="btn btn-outline" onClick={() => setAdvOpen(v => !v)} aria-expanded={advOpen} aria-controls="adv-filters">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            فیلترهای پیشرفته
            <ChevronDown size={16} aria-hidden="true" style={{ transition: 'transform .2s ease', transform: advOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </span>
        </button>
        {/* Advanced filters toggle and content within the same section */}
        <div className="filterToggleRow" style={{ marginTop: '.5rem' }}>
          {(typeFilter || expiryFilter || startFrom || endTo) && (
            <span className="resultsBadge">فیلتر فعال</span>
          )}
          {(typeFilter || expiryFilter || startFrom || endTo) && (
            <button type="button" className="clearBtn" onClick={clearAdvanced} aria-label="حذف فیلترهای پیشرفته">حذف همه</button>
          )}
        </div>

        <div id="adv-filters" className={`collapsible ${advOpen ? 'open' : ''}`}>
          <div className="filterGrid filterGrid--2col">
            <div className="filterGroup">
              <label htmlFor="type-filter">نوع تخفیف</label>
              <select id="type-filter" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="">همه</option>
                <option value="percentage">درصدی</option>
                <option value="fixed">مبلغ ثابت</option>
              </select>
            </div>

            <div className="filterGroup">
              <label htmlFor="expiry-filter">نوع انقضا</label>
              <select id="expiry-filter" value={expiryFilter} onChange={(e) => setExpiryFilter(e.target.value)}>
                <option value="">همه</option>
                <option value="noExpiry">بدون تاریخ انقضا</option>
                <option value="hasExpiry">دارای تاریخ پایان</option>
              </select>
            </div>

            <div className="filterGroup">
              <label>تاریخ شروع از</label>
              <HejriDatePicker
                label={null}
                value={startFrom ? new Date(startFrom) : null}
                onChange={(d) => setStartFrom(d ? toYMD(d) : '')}
              />
            </div>
            {/* Single start and end filters (from/to) — removed duplicate fields */}
            <div className="filterGroup">
              <label>تاریخ پایان تا</label>
              <HejriDatePicker
                label={null}
                value={endTo ? new Date(endTo) : null}
                onChange={(d) => setEndTo(d ? toYMD(d) : '')}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={`${styles.tableContainer} ${styles.tableFullRight}`}>
        <table>
          <thead>
            <tr>
              <th>کد</th>
              <th>تخفیف</th>
              <th>وضعیت</th>
              <th>مصرف</th>
              <th>دسترسی</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(row => {
              const st = statusOf(row, nowTs);
              const stMeta = STATUS_MAP[st];
              const pct = row.totalUses > 0 ? Math.min(100, Math.round((row.used / row.totalUses) * 100)) : 0;
              return (
                <tr key={row.id} className={styles.listItemHover}>
                  <td data-label="کد">{row.code}</td>
                  <td data-label="تخفیف">{row.type === 'percentage' ? `${row.value}%` : `${row.value.toLocaleString('fa-IR')} تومان`}</td>
                  <td data-label="وضعیت">
                    <span
                      className={styles.statusBadge}
                      style={{ backgroundColor: `${stMeta.color}22`, color: stMeta.color }}
                    >
                      {stMeta.label}
                    </span>
                  </td>
                  <td data-label="مصرف" className={discountStyles.usageCell} style={{ minWidth: 180 }}>
                    <div className={discountStyles.usageProgressWrapper}>
                      <div className={discountStyles.usageProgressBar}>
                        <div className={discountStyles.usageProgressFill} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={discountStyles.usageProgressText}>{row.used} / {row.totalUses || '∞'}</span>
                    </div>
                  </td>
                  <td data-label="دسترسی">
                      <label className="switch" title={row.disabled ? 'فعال‌سازی' : 'غیرفعال‌سازی'}>
                      <input
                        type="checkbox"
                        aria-label={row.disabled ? 'فعال‌سازی' : 'غیرفعال‌سازی'}
                        checked={!row.disabled}
                          onChange={() => {
                            if (!row.disabled) {
                              // Will turn OFF -> confirm
                              setConfirm({ open: true, action: 'disable', payload: row });
                            } else {
                              // Turning ON -> no confirm
                              toggleDisable(row);
                            }
                          }}
                      />
                      <span className="slider" />
                    </label>
                  </td>
                  <td data-label="عملیات">
                    <div className={`${styles.actionBtns} ${discountStyles.actionsRow}`}>
                      <button
                        type="button"
                        title="ویرایش"
                        aria-label="ویرایش"
                        onClick={() => openEdit(row)}
                        className={styles.actionEdit}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: 32, height: 32, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        type="button"
                        title="حذف"
                        aria-label="حذف"
                        onClick={() => setConfirm({ open: true, action: 'delete', payload: row })}
                        className={styles.actionDelete}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: 32, height: 32, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center' }}>موردی یافت نشد.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmationDialog
        open={confirm.open}
        title={confirm.action === 'delete' ? 'حذف کد تخفیف' : confirm.action === 'disable' ? 'غیرفعال‌سازی کد' : ''}
        message={confirm.action === 'delete' ? 'آیا از حذف این کد مطمئن هستید؟' : confirm.action === 'disable' ? 'آیا از غیرفعال‌سازی این کد مطمئن هستید؟' : ''}
        confirmLabel={confirm.action === 'delete' ? 'حذف' : confirm.action === 'disable' ? 'غیرفعال‌سازی' : 'تأیید'}
        confirmColor={'error'}
        onClose={() => setConfirm({ open: false, action: null, payload: null })}
        onConfirm={() => {
            if (confirm.action === 'delete') {
              doDelete(confirm.payload.id);
            } else if (confirm.action === 'disable') {
              toggleDisable(confirm.payload);
            }
            setConfirm({ open: false, action: null, payload: null });
          }}
        />

      <DiscountDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={async (payload) => {
          if (!USE_MOCK) {
            try {
              const { item } = await discountsApi.upsertAdminCoupon(payload);
              setItems(arr => {
                const exists = arr.some(x => String(x.id) === String(item.id));
                if (exists) return arr.map(x => String(x.id) === String(item.id) ? item : x);
                return [item, ...arr];
              });
              setDrawerOpen(false);
              push({ type: 'success', message: 'کد تخفیف ذخیره شد.' });
              return;
            } catch (e) {
              console.error('Save coupon failed', e);
              const msg = e?.response?.data?.message || 'ذخیره کد تخفیف با خطا مواجه شد.';
              push({ type: 'error', message: msg });
              return;
            }
          }
          // mock path
          setItems(arr => {
            const exists = arr.some(x => x.id === payload.id);
            if (exists) return arr.map(x => x.id === payload.id ? payload : x);
            return [payload, ...arr];
          });
          setDrawerOpen(false);
          push({ type: 'success', message: 'کد تخفیف ذخیره شد.' });
        }}
        initial={editing}
      />
    </div>
  );
};

const DiscountDrawer = ({ open, onClose, onSave, initial }) => {
  const [form, setForm] = useState(() => initial || {
    id: 'd-' + Math.random().toString(36).slice(2, 8),
    code: '', type: 'percentage', value: 0,
    appliesTo: ['all_subscriptions'], minPurchase: 0,
    totalUses: 100, used: 0, perUserOnce: false,
    targetUsers: 'all', roles: [], usersPhones: '',
    startDateTs: Date.now(), endDateTs: null, noExpiry: true,
    disabled: false,
  });

  React.useEffect(() => {
    setForm(initial ? { ...initial } : {
      id: 'd-' + Math.random().toString(36).slice(2, 8),
      code: '', type: 'percentage', value: 0,
      appliesTo: ['all_subscriptions'], minPurchase: 0,
      totalUses: 100, used: 0, perUserOnce: false,
      targetUsers: 'all', roles: [], usersPhones: '',
      startDateTs: Date.now(), endDateTs: null, noExpiry: true,
      disabled: false,
    });
  }, [initial]);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const updateArrayToggle = (key, val) => setForm(prev => ({ ...prev, [key]: prev[key].includes(val) ? prev[key].filter(x => x !== val) : [...prev[key], val] }));

  const formatDateInput = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const parseDateInput = (val) => {
    if (!val) return null;
    const t = new Date(val).getTime();
    return Number.isNaN(t) ? null : t;
  };

  const [mounted, setMounted] = React.useState(open);
  const [isOpenClass, setIsOpenClass] = React.useState(open);
  const closeTimerRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
      setMounted(true);
      // ensure class change happens after mount for transition
      requestAnimationFrame(() => setIsOpenClass(true));
    } else {
      setIsOpenClass(false);
      closeTimerRef.current = setTimeout(() => {
        setMounted(false);
        closeTimerRef.current = null;
      }, 320); // match CSS transition duration (~300ms)
    }
  }, [open]);

  React.useEffect(() => () => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); }, []);

  if (!mounted) return null;

  return (
    <div className={`drawerRoot ${isOpenClass ? 'open' : ''}`} role="dialog" aria-modal="true">
      <div className="drawerOverlay" onClick={onClose} />
      <aside className={`drawerPanel ${isOpenClass ? 'open' : ''}`}>
        <div className="drawerInner" dir="rtl">
          {/* Header */}
          <div className="drawerSection" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 className="title-md" style={{ margin: 0 }}>{initial ? 'ویرایش کد تخفیف' : 'ایجاد کد جدید'}</h3>
            {/* <button className="btn btn-icon" onClick={onClose} aria-label="بستن">
              ×
            </button> */}
          </div>

          {/* Basic */}
          <div className="drawerSection drawerFilters">
            <h4 className="title-sm">اطلاعات پایه</h4>
            <div className="filterGrid">
              <div className={`filterGroup ${styles.actionInputGroup}`}>
                <label>کد تخفیف</label>
                <div className={styles.actionInputGroup}>
                  <input type="text" value={form.code} onChange={(e) => update('code', e.target.value.toUpperCase())} placeholder="مثلاً SAVE20" />
                  <button type="button" className="btn btn-outline" onClick={() => update('code', Math.random().toString(36).slice(2, 8).toUpperCase())}>تولید کد</button>
                </div>
              </div>
              <div className="filterGroup">
                <label>نوع تخفیف</label>
                <div className="flex gap-sm items-center" role="radiogroup" aria-label="نوع تخفیف">
                  <label className="flex items-center gap-xs">
                    <input type="radio" name="discount-type" value="percentage" checked={form.type === 'percentage'} onChange={(e) => update('type', e.target.value)} />
                    درصد
                  </label>
                  <label className="flex items-center gap-xs">
                    <input type="radio" name="discount-type" value="fixed" checked={form.type === 'fixed'} onChange={(e) => update('type', e.target.value)} />
                    مبلغ ثابت
                  </label>
                </div>
              </div>
              <div className="filterGroup">
                <label>{form.type === 'percentage' ? 'درصد (%)' : 'مبلغ (تومان)'}</label>
                <input type="number" min="0" value={form.value} onChange={(e) => update('value', Number(e.target.value))} placeholder={form.type === 'percentage' ? 'مثلاً 20' : 'مثلاً 50000'} />
              </div>
            </div>
          </div>

          {/* Conditions & Limits */}
          <div className="drawerSection drawerFilters">
            <h4 className="title-sm">شرایط و محدودیت‌ها</h4>
            <div className="filterGroup">
              <label>اعمال بر</label>
              <div className="flex wrap gap-sm" role="group" aria-label="اعمال بر">
                {APPLY_OPTIONS.map(opt => (
                  <label key={opt.value} className="flex items-center gap-xs">
                    <input type="checkbox" checked={form.appliesTo.includes(opt.value)} onChange={() => updateArrayToggle('appliesTo', opt.value)} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="filterGrid filterGrid--2col">
              <div className="filterGroup">
                <label>حداقل مبلغ خرید (اختیاری)</label>
                <input type="number" min="0" value={form.minPurchase} onChange={(e) => update('minPurchase', Number(e.target.value))} placeholder="مثلاً 100000" />
              </div>
              <div className="filterGroup">
                <label>حداکثر تعداد استفاده</label>
                <input type="number" min="0" value={form.totalUses} onChange={(e) => update('totalUses', Number(e.target.value))} />
                <label className="flex items-center gap-xs" style={{ marginTop: '.35rem' }}>
                  <input type="checkbox" checked={form.perUserOnce} onChange={(e) => update('perUserOnce', e.target.checked)} />
                  محدود به یک‌بار برای هر کاربر
                </label>
              </div>
            </div>
          </div>

          {/* User Eligibility */}
          <div className="drawerSection drawerFilters">
            <h4 className="title-sm">واجدین شرایط</h4>
            <div className="filterGroup">
              <div className="flex gap-sm items-center" role="radiogroup" aria-label="واجدین شرایط">
                <label className="flex items-center gap-xs">
                  <input type="radio" name="target-users" value="all" checked={form.targetUsers === 'all'} onChange={(e) => update('targetUsers', e.target.value)} />
                  همه کاربران
                </label>
                <label className="flex items-center gap-xs">
                  <input type="radio" name="target-users" value="roles" checked={form.targetUsers === 'roles'} onChange={(e) => update('targetUsers', e.target.value)} />
                  نقش‌های خاص
                </label>
                <label className="flex items-center gap-xs">
                  <input type="radio" name="target-users" value="users" checked={form.targetUsers === 'users'} onChange={(e) => update('targetUsers', e.target.value)} />
                  کاربران خاص (شماره‌ها)
                </label>
              </div>
            </div>
            {form.targetUsers === 'roles' && (
              <div className="filterGroup">
                <div className="flex gap-sm items-center">
                  <label className="flex items-center gap-xs">
                    <input type="checkbox" checked={form.roles.includes('student')} onChange={() => updateArrayToggle('roles', 'student')} />
                    دانش‌آموز
                  </label>
                  <label className="flex items-center gap-xs">
                    <input type="checkbox" checked={form.roles.includes('teacher')} onChange={() => updateArrayToggle('roles', 'teacher')} />
                    معلم
                  </label>
                </div>
              </div>
            )}
            {form.targetUsers === 'users' && (
              <div className="filterGroup">
                <label>شماره تلفن‌ها (هر خط یک مورد یا با ویرگول جدا کنید)</label>
                <textarea value={form.usersPhones} onChange={(e) => update('usersPhones', e.target.value)} rows={4} />
              </div>
            )}
          </div>

          {/* Active Dates */}
          <div className="drawerSection drawerFilters">
            <h4 className="title-sm">تاریخ‌های فعال‌سازی</h4>
            <div className="filterGrid filterGrid--2col">
              <div className="filterGroup">
                <label>تاریخ شروع</label>
                <HejriDatePicker
                  label={null}
                  value={form.startDateTs ? new Date(form.startDateTs) : null}
                  onChange={(d) => update('startDateTs', d instanceof Date && !isNaN(d) ? d.getTime() : Date.now())}
                />
              </div>
              <div className="filterGroup">
                <label className="flex items-center gap-xs">
                  <input type="checkbox" checked={form.noExpiry} onChange={(e) => update('noExpiry', e.target.checked)} />
                  بدون تاریخ انقضا
                </label>
              </div>
              <div className="filterGroup">
                <label>تاریخ پایان</label>
                <HejriDatePicker
                  label={null}
                  value={form.endDateTs ? new Date(form.endDateTs) : null}
                  onChange={(d) => update('endDateTs', d instanceof Date && !isNaN(d) ? d.getTime() : null)}
                  disabled={form.noExpiry}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="drawerFooter">
                    <button className="btn btn-outline" onClick={onClose} disabled={false}>انصراف</button>
                    {/* Save button: show loading state and await onSave to prevent duplicate clicks */}
                    <SaveButton form={form} onSave={onSave} disabledCondition={!form.code || form.value <= 0} onClose={onClose} />
          </div>
        </div>
      </aside>
    </div>
  );
};

        const SaveButton = ({ form, onSave, disabledCondition, onClose }) => {
          const [isSaving, setIsSaving] = React.useState(false);
          const { push } = useToast();

          const handleSave = async () => {
            if (isSaving) return;
            if (disabledCondition) {
              try { console.warn('Save blocked: invalid form', { form }); } catch (e) {}
              try { push({ type: 'warning', message: 'کد و مقدار تخفیف را به درستی وارد کنید.' }); } catch (e) {}
              // still log the click even if invalid
              return;
            }
            // Debug: log when save button is clicked along with payload
            try { console.log('AdminDiscounts: Save button clicked', { form }); } catch (e) {}
            setIsSaving(true);
            try {
              // onSave may be async or sync; await to support both
              await onSave(form);
            } catch (e) {
              console.error('Save failed (drawer)', e);
              const msg = e?.response?.data?.message || 'ذخیره‌سازی با خطا مواجه شد.';
              try { push({ type: 'error', message: msg }); } catch (err) {}
              throw e; // rethrow so callers/tests can catch if needed
            } finally {
              setIsSaving(false);
            }
          };

          return (
            <button
              type="button"
              className={`btn btn-primary ${isSaving ? 'loading' : ''}`}
              onClick={handleSave}
              disabled={isSaving}
              aria-busy={isSaving}
              aria-disabled={disabledCondition || undefined}
              title={disabledCondition ? 'کد و مقدار تخفیف را وارد کنید' : undefined}
            >
              {isSaving ? 'در حال ذخیره...' : 'ذخیره'}
            </button>
          );
        };

export default AdminDiscounts;
