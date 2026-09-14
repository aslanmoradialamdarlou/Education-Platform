import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Typography, Snackbar, Alert } from '@mui/material';
import { Search, PlusCircle, Edit, Trash2, PauseCircle, PlayCircle, X, Filter, ChevronDown } from 'lucide-react';
import ConfirmationDialog from './ConfirmationDialog';
import styles from './Admin.module.css';
import './adminBase.css';
import './UserManagement.css';
import HejriDatePicker from './HejriDatePicker';
import {
  fetchAdminUsers,
  suspendAdminUser,
  activateAdminUser,
  deleteAdminUser,
  createAdminUser,
  updateAdminUser,
} from '../../api/adminApi';
import { fetchGrades } from '../../api/adminApi';
import { provinces as IR_PROVINCES, getCitiesOfProvince } from '../../data/iranLocations';

// Simple in-session cache to avoid refetching on each tab switch
const USERS_CACHE_KEY = 'admin_users_cache_v2'; // Incremented to invalidate old cache
const USERS_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
const GRADES_CACHE_KEY = 'admin_grades_cache_v1';
const GRADES_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Lightweight memoized row to minimize re-renders per row (native table)
const UserRow = React.memo(function UserRow({ user, grades, onSelect, onEdit, onToggleStatus, onDelete }) {
  return (
    <tr onClick={() => onSelect?.(user)} className={styles.clickableRow}>
      <td data-label="نام">
        <div className="cellValue flex items-center gap-sm">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name || 'User'} className="avatar-md" style={{ objectFit: 'cover' }} />
          ) : (
            <span className="avatar-md" aria-hidden>{user.name?.[0] || 'U'}</span>
          )}
          <div className="flex flex-col">
            <span className="text-sm">{user.name || '—'}</span>
            <span className="text-xs text-muted">{user.status === 'active' ? 'فعال' : 'معلق'}</span>
          </div>
        </div>
      </td>
      <td data-label="ایمیل" className={`${styles.hideOnMobile} showInCard`}>
        <div className="cellValue">{user.email || '—'}</div>
      </td>
      <td data-label="نقش">
        <div className="cellValue"><span className={`badge ${user.role === 'teacher' ? 'role-teacher' : 'role-student'}`}>{user.role === 'teacher' ? 'معلم' : 'دانش‌آموز'}</span></div>
      </td>
      <td data-label="پایه" className={`${styles.hideOnMobile} showInCard`}>
        <div className="cellValue">{
          user.role === 'teacher' ? '—' : (() => {
            const gradeStr = typeof user.grade === 'string' ? user.grade : '';
            const isNumeric = gradeStr && /^\d+$/.test(gradeStr);
            if (gradeStr && !isNumeric) return gradeStr; // server-provided name
            const byId = user.grade_id ? (grades?.find(g => String(g.id) === String(user.grade_id))?.name) : undefined;
            if (byId) return byId;
            return '—';
          })()
        }</div>
      </td>
      <td data-label="اشتراک">
        <div className="cellValue"><span className={`badge ${user.subscriptionPlan !== 'none' ? 'sub-active' : 'sub-none'}`}>{user.subscriptionPlan !== 'none' ? 'طلایی' : 'عادی'}</span></div>
      </td>
      <td data-label="تاریخ عضویت" className={`${styles.hideOnMobile} showInCard`}>
        <div className="cellValue">{user.joinDate || '—'}</div>
      </td>
  <td data-label="عملیات" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'right' }}>
        <div className="cellValue" style={{ display: 'inline-flex', gap: '.25rem' }}>
          <button className="btn btn-icon actionBtn edit" title="ویرایش" aria-label="ویرایش" onClick={() => onEdit(user)}><Edit size={18} /></button>
          {user.status === 'active' ? (
            <button className="btn btn-icon actionBtn suspend" title="معلق کردن" aria-label="معلق کردن" onClick={() => onToggleStatus(user, 'suspended')}><PauseCircle size={18} /></button>
          ) : (
            <button className="btn btn-icon actionBtn activate" title="فعال‌سازی" aria-label="فعال‌سازی" onClick={() => onToggleStatus(user, 'active')}><PlayCircle size={18} /></button>
          )}
          <button className="btn btn-icon actionBtn delete" title="حذف" aria-label="حذف" onClick={() => onDelete(user)}><Trash2 size={18} /></button>
        </div>
      </td>
    </tr>
  );
});

const enrichUser = (u) => {
  // Normalize server resource to UI shape
  const joinedAt = u.joined_at || u.joinAt || u.joinDateIso || u.created_at;
  const joinAtIso = joinedAt && !isNaN(Date.parse(joinedAt)) ? new Date(joinedAt).toISOString() : new Date().toISOString();
  const joinDateFa = u.joinDate || new Date(joinAtIso).toLocaleDateString('fa-IR');
  const roles = Array.isArray(u.roles) ? u.roles : (Array.isArray(u.role) ? u.role : []);
  const primaryRole = roles?.includes?.('teacher') ? 'teacher' : (roles?.includes?.('student') ? 'student' : (u.role || 'student'));
  const subActive = !!(u.subscription && (u.subscription.status === 'active')) || (u.hasSubscription === true);
  const gradeVal = typeof u.grade === 'object' && u.grade !== null ? (u.grade.name || u.grade.title || u.grade.id || '') : (u.grade || '');
  const isActive = typeof u.is_active === 'boolean' ? u.is_active : (u.status ? u.status === 'active' : true);
  return {
    id: u.id,
    name: u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim(),
    first_name: u.first_name || '',
    last_name: u.last_name || '',
    email: u.email || '',
    phone: u.phone || '',
    province: u.province || '',
    city: u.city || '',
    role: primaryRole,
    roles,
    grade: primaryRole === 'teacher' ? '' : String(gradeVal || ''),
    grade_id: typeof u.grade === 'object' && u.grade ? u.grade.id : (u.grade_id || null),
    avatarUrl: u.avatar || u.avatarUrl || `https://i.pravatar.cc/150?u=${u.id || 'default'}`,
    subscriptionPlan: subActive ? 'golden' : (u.subscriptionPlan || 'none'),
    joinAt: joinAtIso,
    joinDate: joinDateFa,
    tokens: u.tokens ?? 0,
    walletBalance: u.walletBalance ?? 0,
    status: isActive ? 'active' : 'suspended',
  };
};

const UserManagement = ({ users = [], onUserSelect }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [data, setData] = useState(users.map(enrichUser));
  const [loading, setLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [skipNextFetch, setSkipNextFetch] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [validationErrors, setValidationErrors] = useState({});
  const [suspendTarget, setSuspendTarget] = useState(null);

  // Editor drawer state
  const [editing, setEditing] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editorOpenVisual, setEditorOpenVisual] = useState(false);

  // Filters
  const [query, setQuery] = useState('');
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [subFilter, setSubFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [grades, setGrades] = useState([]);
  const [gradesHydrated, setGradesHydrated] = useState(false);
  const [skipGradesFetch, setSkipGradesFetch] = useState(false);
  // Join date range (Jalali pickers returning JS Date objects)
  const [joinFrom, setJoinFrom] = useState(null);
  const [joinTo, setJoinTo] = useState(null);

  // Debounce search input to reduce filter churn
  useEffect(() => {
    const t = setTimeout(() => setQuery(searchText), 180);
    return () => clearTimeout(t);
  }, [searchText]);

  // Deep-link open add
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    if (action === 'add' && !editorOpen) {
      handleAddNewUser();
      params.delete('action');
      const base = location.pathname;
      const qs = params.toString();
      navigate(qs ? `${base}?${qs}` : base, { replace: true });
    }
  }, [location.search, editorOpen, navigate, location.pathname]);

  // Drawer animations and body lock
  useEffect(() => {
    if (editorOpen) {
      setEditorVisible(true);
      const raf = requestAnimationFrame(() => setEditorOpenVisual(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setEditorOpenVisual(false);
      if (editorVisible) {
        const t = setTimeout(() => setEditorVisible(false), 300);
        return () => clearTimeout(t);
      }
    }
  }, [editorOpen, editorVisible]);

  useEffect(() => {
    if (!editorVisible) return;
    const onKey = (e) => { if (e.key === 'Escape') setEditorOpen(false); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [editorVisible]);

  // Hydrate grades from cache immediately to avoid late pop-in
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(GRADES_CACHE_KEY);
      if (raw) {
        const cache = JSON.parse(raw);
        if (cache && Array.isArray(cache.data) && (Date.now() - (cache.ts || 0)) < GRADES_CACHE_TTL_MS) {
          setGrades(cache.data);
          setSkipGradesFetch(true);
        }
      }
    } catch { /* ignore */ }
    setGradesHydrated(true);
  }, []);

  // Fetch grades if not satisfied by cache
  useEffect(() => {
    if (!gradesHydrated) return;
    if (skipGradesFetch) { setSkipGradesFetch(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const g = await fetchGrades();
        if (!cancelled) {
          const list = Array.isArray(g) ? g : [];
          setGrades(list);
          try { sessionStorage.setItem(GRADES_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: list })); } catch {}
        }
      } catch (e) { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, [gradesHydrated, skipGradesFetch]);

  // Hydrate state from session cache to prevent refetch/flicker when returning to this tab
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(USERS_CACHE_KEY);
      if (raw) {
        const cache = JSON.parse(raw);
        if (cache && typeof cache === 'object' && (Date.now() - (cache.ts || 0)) < USERS_CACHE_TTL_MS) {
          setData(Array.isArray(cache.data) ? cache.data : []);
          setTotal(Number(cache.total) || 0);
          setPage(Number(cache.page) || 0);
          setRowsPerPage(Number(cache.rowsPerPage) || 10);
          setSearchText(cache.searchText || '');
          setRoleFilter(cache.roleFilter || '');
          setGradeFilter(cache.gradeFilter || '');
          setSubFilter(cache.subFilter || '');
          setStatusFilter(cache.statusFilter || '');
          setJoinFrom(cache.joinFrom ? new Date(cache.joinFrom) : null);
          setJoinTo(cache.joinTo ? new Date(cache.joinTo) : null);
          setHasLoadedOnce(true);
          setSkipNextFetch(true);
        }
      }
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  // Fetch users from server when filters or pagination change
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!hydrated) return; // wait until we hydrate from cache (if any)
      if (skipNextFetch) { setSkipNextFetch(false); return; }
      setLoading(true);
      try {
        const params = {
          q: query || undefined,
          role: roleFilter || undefined,
          subscription: subFilter || undefined, // all|active|none
          status: statusFilter || undefined,     // all|active|suspended
          page: page + 1,
          per_page: rowsPerPage,
        };
        const { items, meta } = await fetchAdminUsers(params);
        if (cancelled) return;
        setData(Array.isArray(items) ? items.map(enrichUser) : []);
        setTotal(meta?.total ?? (Array.isArray(items) ? items.length : 0));
      } catch (e) {
        if (!cancelled) {
          setToast({ open: true, severity: 'error', message: e?.response?.data?.message || 'خطا در دریافت کاربران' });
          setData([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setHasLoadedOnce(true);
        }
      }
    }
    run();
    return () => { cancelled = true; };
  }, [query, roleFilter, subFilter, statusFilter, page, rowsPerPage, hydrated, skipNextFetch]);

  // Persist current state in session cache for fast restore
  useEffect(() => {
    try {
      const payload = {
        ts: Date.now(),
        data,
        total,
        page,
        rowsPerPage,
        searchText,
        roleFilter,
        gradeFilter,
        subFilter,
        statusFilter,
        joinFrom: joinFrom ? joinFrom.toISOString() : null,
        joinTo: joinTo ? joinTo.toISOString() : null,
      };
      sessionStorage.setItem(USERS_CACHE_KEY, JSON.stringify(payload));
    } catch { /* ignore */ }
  }, [data, total, page, rowsPerPage, searchText, roleFilter, gradeFilter, subFilter, statusFilter, joinFrom, joinTo]);

  const filtered = useMemo(() => {
    return data.filter(u => {
      if (query) {
        const q = query.toLowerCase();
        const phone = u.phone || '';
        if (!(u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || phone.includes(q))) return false;
      }
  if (roleFilter && u.role !== roleFilter) return false;
  if (gradeFilter && String(u.grade_id || '') !== gradeFilter) return false;
      if (subFilter) {
        const active = u.subscriptionPlan !== 'none';
        if (subFilter === 'active' && !active) return false;
        if (subFilter === 'none' && active) return false;
      }
      if (statusFilter && u.status !== statusFilter) return false;
      // Join date range filter (inclusive days)
      const join = u.joinAt ? new Date(u.joinAt) : null;
      if (joinFrom) {
        const start = new Date(joinFrom.getFullYear(), joinFrom.getMonth(), joinFrom.getDate(), 0, 0, 0, 0);
        if (!join || join < start) return false;
      }
      if (joinTo) {
        const end = new Date(joinTo.getFullYear(), joinTo.getMonth(), joinTo.getDate(), 23, 59, 59, 999);
        if (!join || join > end) return false;
      }
      return true;
    });
  }, [data, query, roleFilter, gradeFilter, subFilter, statusFilter, joinFrom, joinTo]);

  const paginatedUsers = useMemo(() => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage), [filtered, page, rowsPerPage]);

  const handleEditUser = (user) => {
    // Map backend user fields to editor fields
  setValidationErrors({});
  setEditing({
      id: user.id,
      firstName: user.first_name ?? user.firstName ?? '',
      lastName: user.last_name ?? user.lastName ?? '',
      name: user.name ?? '',
      email: user.email ?? '',
      phone: user.phone ?? '',
      province: user.province ?? '',
      city: user.city ?? '',
      password: '',
      role: user.role ?? (Array.isArray(user.roles) ? user.roles[0] : 'student'),
      grade: user.grade_id ?? (typeof user.grade === 'object' && user.grade ? user.grade.id : user.grade) ?? '',
      grade_id: user.grade_id ?? (typeof user.grade === 'object' && user.grade ? user.grade.id : undefined),
      avatarUrl: user.avatarUrl ?? '',
      subscriptionPlan: user.subscriptionPlan ?? (user.subscription && user.subscription.status === 'active' ? 'golden' : 'none'),
      tokens: user.tokens ?? 0,
      walletBalance: user.walletBalance ?? 0,
      status: user.status ?? (user.is_active ? 'active' : 'suspended'),
      joinAt: user.joinAt ?? '',
      joinDate: user.joinDate ?? '',
    });
    setEditorOpen(true);
  };
  const handleAddNewUser = () => {
    const nowIso = new Date().toISOString();
    setValidationErrors({});
    setEditing({ id: Math.random().toString(36).slice(2, 8), firstName: '', lastName: '', name: '', email: '', phone: '', province: '', city: '', password: '', role: 'student', grade: '', avatarUrl: '', subscriptionPlan: 'none', tokens: 0, walletBalance: 0, status: 'active', joinAt: nowIso, joinDate: new Date(nowIso).toLocaleDateString('fa-IR') });
    setEditorOpen(true);
  };
  const handleDeleteClick = (user) => setDeleteUserId(user.id);
  const handleConfirmDelete = () => { if (deleteUserId == null) return; setData(prev => prev.filter(u => u.id !== deleteUserId)); setDeleteUserId(null); };
  const handleCancelDelete = () => setDeleteUserId(null);

  return (
    <div className="userMgmt">
      <div className={styles.panelHeader}>
        <Typography variant="h5" component="h2">مدیریت کاربران</Typography>
        <button className="btn btn-primary" onClick={handleAddNewUser} aria-label="افزودن کاربر جدید">
          <PlusCircle size={18} style={{ marginInlineEnd: 6 }} />
          افزودن کاربر جدید
        </button>
      </div>

      <div className="adminCard" style={{ marginBottom: '1rem' }}>
        <div className="filterToggleRow">
          <button className="btn btn-outline" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(v => !v)}>
            <Filter size={16} />
            فیلترها
            <ChevronDown size={16} style={{ transition: 'transform .2s ease', transform: filtersOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </button>
        </div>
        <div className={`collapsible ${filtersOpen ? 'open' : ''}`}>
          <div className="filterGrid drawerFilters">
          <div className="filterGroup" style={{ gridColumn: '1 / -1' }}>
            <label>جستجو</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', insetInlineStart: 10, top: '50%', transform: 'translateY(-50%)', opacity: .7 }} />
              <input style={{ paddingInlineStart: 30 }} type="text" placeholder="نام، ایمیل یا شماره تلفن" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
            </div>
          </div>
          <div className="filterGroup">
            <label>نقش</label>
            <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}>
              <option value="">همه</option>
              <option value="student">دانش‌آموز</option>
              <option value="teacher">معلم</option>
            </select>
          </div>
          <div className="filterGroup">
            <label>پایه</label>
            <select value={gradeFilter} onChange={(e) => { setGradeFilter(e.target.value); setPage(0); }}>
              <option value="">همه</option>
              {grades.map(g => <option key={g.id} value={String(g.id)}>{g.name}</option>)}
            </select>
          </div>
          <div className="filterGroup">
            <label>اشتراک</label>
            <select value={subFilter} onChange={(e) => { setSubFilter(e.target.value); setPage(0); }}>
              <option value="">همه</option>
              <option value="active">اشتراک فعال</option>
              <option value="none">بدون اشتراک</option>
            </select>
          </div>
          <div className="filterGroup">
            <label>وضعیت حساب</label>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
              <option value="">همه</option>
              <option value="active">فعال</option>
              <option value="suspended">معلق</option>
            </select>
          </div>
          <div className="filterGroup">
            <label>از تاریخ عضویت</label>
            <HejriDatePicker label="از" value={joinFrom} onChange={(v) => { setJoinFrom(v); setPage(0); }} maxDate={joinTo || undefined} />
          </div>
          <div className="filterGroup">
            <label>تا تاریخ عضویت</label>
            <HejriDatePicker label="تا" value={joinTo} onChange={(v) => { setJoinTo(v); setPage(0); }} minDate={joinFrom || undefined} />
          </div>
          <div className="full-span flex items-center gap-sm" style={{ marginTop: '.25rem' }}>
            <span className="resultsBadge">نتایج: {total.toLocaleString('fa-IR')}</span>
            <button className="clearBtn" onClick={() => { setSearchText(''); setRoleFilter(''); setGradeFilter(''); setSubFilter(''); setStatusFilter(''); setJoinFrom(null); setJoinTo(null); setPage(0); }}>حذف فیلترها</button>
          </div>
          </div>
        </div>
      </div>

      <div className={`${styles.tableContainer} userTableContainer`}>
        <table>
          <thead>
            <tr>
              <th scope="col">نام</th>
              <th scope="col" className={styles.hideOnMobile}>ایمیل</th>
              <th scope="col">نقش</th>
              <th scope="col" className={styles.hideOnMobile}>پایه</th>
              <th scope="col">اشتراک</th>
              <th scope="col" className={styles.hideOnMobile}>تاریخ عضویت</th>
              <th scope="col" style={{ textAlign: 'right' }}>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {loading && paginatedUsers.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center' }}>در حال بارگذاری...</td>
              </tr>
            )}
            {paginatedUsers.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                grades={grades}
                onSelect={onUserSelect}
                onEdit={(u) => handleEditUser(u)}
                onToggleStatus={(u, next) => {
                  // If attempting to suspend an active user, ask for confirmation first
                  if (next === 'suspended' && u.status !== 'suspended') {
                    setSuspendTarget(u);
                    return;
                  }
                  // Otherwise, toggle immediately via API (activate)
                  (async () => {
                    try {
                      const updated = next === 'suspended' ? await suspendAdminUser(u.id) : await activateAdminUser(u.id);
                      const eu = enrichUser(updated || u);
                      setData(prev => prev.map(x => x.id === u.id ? eu : x));
                      setToast({ open: true, severity: 'success', message: 'وضعیت کاربر بروزرسانی شد.' });
                    } catch (e) {
                      setToast({ open: true, severity: 'error', message: e?.response?.data?.message || 'خطا در بروزرسانی وضعیت' });
                    }
                  })();
                }}
                onDelete={(u) => handleDeleteClick(u)}
              />
            ))}
            {!loading && hasLoadedOnce && paginatedUsers.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center' }}>موردی یافت نشد.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Custom Pagination */}
      <div className="drawerSection paginationRow" style={{ marginTop: '.5rem' }}>
        <div className="flex items-center" style={{ justifyContent: 'space-between', gap: '.75rem' }}>
          <div className="flex items-center gap-sm">
            <span className="text-sm" style={{ fontSize: '.65rem' }}>تعداد در صفحه</span>
            <select className="rowsSelect" value={rowsPerPage} onChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}>
              <option value={5}>۵</option>
              <option value={10}>۱۰</option>
              <option value={20}>۲۰</option>
              <option value={50}>۵۰</option>
            </select>
          </div>
          <div className="flex items-center gap-sm">
            <button className="btn btn-outline" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>قبلی</button>
            {(() => { const t = total; const from = t ? page * rowsPerPage + 1 : 0; const to = Math.min(t, (page + 1) * rowsPerPage); return (
              <span className="text-sm" style={{ fontSize: '.65rem' }}>{`${from.toLocaleString('fa-IR')}–${to.toLocaleString('fa-IR')} از ${t.toLocaleString('fa-IR')}`}</span>
            ); })()}
            <button className="btn btn-outline" onClick={() => setPage(p => p + 1)} disabled={(page + 1) * rowsPerPage >= total}>بعدی</button>
          </div>
        </div>
      </div>

      {/* Editor Drawer - Custom */}
      {editorVisible && (
        <div className={`drawerRoot ${editorOpenVisual ? 'open' : ''}`} aria-hidden={!editorOpen}>
          <div className="drawerOverlay" onClick={() => setEditorOpen(false)} />
          <aside className={`drawerPanel ${editorOpenVisual ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="ویرایش/افزودن کاربر">
            <div className="drawerInner">
              <div className="drawerSection flex items-center justify-between" style={{ paddingBottom: '.75rem' }}>
                <h3 className="title-sm" style={{ margin: 0, fontSize: '.85rem' }}>{data.some(u => u.id === editing?.id) ? 'ویرایش کاربر' : 'افزودن کاربر جدید'}</h3>
                {/* <button className="btn btn-icon" onClick={() => setEditorOpen(false)} aria-label="بستن">
                  <X size={18} />
                </button> */}
              </div>
              {/* <hr className="divider" /> */}
              {editing && (
                <div className="drawerSection">
                  <div className="filterGrid drawerFilters">
                    <div className="filterGroup">
                      <label>نام</label>
                      <input type="text" value={editing.firstName ?? ''} onChange={(e) => { setEditing({ ...editing, firstName: e.target.value }); setValidationErrors(prev => ({ ...prev, first_name: undefined })); }} />
                      {validationErrors?.first_name && <div className="fieldError">{validationErrors.first_name.join(' — ')}</div>}
                    </div>
                    <div className="filterGroup">
                      <label>نام خانوادگی</label>
                      <input type="text" value={editing.lastName ?? ''} onChange={(e) => { setEditing({ ...editing, lastName: e.target.value }); setValidationErrors(prev => ({ ...prev, last_name: undefined })); }} />
                      {validationErrors?.last_name && <div className="fieldError">{validationErrors.last_name.join(' — ')}</div>}
                    </div>
                    <div className="filterGroup">
                      <label>ایمیل</label>
                      <input type="email" value={editing.email} onChange={(e) => { setEditing({ ...editing, email: e.target.value }); setValidationErrors(prev => ({ ...prev, email: undefined })); }} />
                      {validationErrors?.email && <div className="fieldError">{validationErrors.email.join(' — ')}</div>}
                    </div>
                    <div className="filterGroup">
                      <label>شماره موبایل</label>
                      <input type="tel" value={editing.phone || ''} onChange={(e) => { setEditing({ ...editing, phone: e.target.value }); setValidationErrors(prev => ({ ...prev, phone: undefined })); }} />
                      {validationErrors?.phone && <div className="fieldError">{validationErrors.phone.join(' — ')}</div>}
                    </div>
                    <div className="filterGroup">
                      <label>استان</label>
                      <select
                        value={editing.province || ''}
                        onChange={(e) => {
                          const prov = e.target.value;
                          const cities = getCitiesOfProvince(prov);
                          const nextCity = cities.includes(editing.city) ? editing.city : '';
                          setEditing({ ...editing, province: prov, city: nextCity });
                          setValidationErrors(prev => ({ ...prev, province: undefined }));
                        }}
                      >
                        <option value="">—</option>
                        {IR_PROVINCES.map(p => (
                          <option key={p.name} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                      {validationErrors?.province && <div className="fieldError">{validationErrors.province.join(' — ')}</div>}
                    </div>
                    <div className="filterGroup">
                      <label>شهر</label>
                      <select
                        disabled={!editing.province}
                        value={editing.city || ''}
                        onChange={(e) => { setEditing({ ...editing, city: e.target.value }); setValidationErrors(prev => ({ ...prev, city: undefined })); }}
                      >
                        <option value="">—</option>
                        {getCitiesOfProvince(editing.province).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      {validationErrors?.city && <div className="fieldError">{validationErrors.city.join(' — ')}</div>}
                    </div>
                    <div className="filterGroup" style={{ gridColumn: '1 / -1' }}>
                      <label>رمز عبور (برای تنظیم/تغییر)</label>
                      <input type="password" value={editing.password || ''} onChange={(e) => setEditing({ ...editing, password: e.target.value })} />
                    </div>
                    <div className="filterGroup">
                      <label>نقش</label>
                      <select value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value, grade: e.target.value === 'teacher' ? '' : editing.grade })}>
                        <option value="student">دانش‌آموز</option>
                        <option value="teacher">معلم</option>
                      </select>
                    </div>
                    <div className="filterGroup">
                      <label>پایه</label>
                      <select 
                        disabled={editing.role === 'teacher'} 
                        value={editing.grade_id || editing.grade || ''} 
                        onChange={(e) => setEditing({ ...editing, grade: e.target.value, grade_id: e.target.value ? Number(e.target.value) : null })}
                      >
                        <option value="">—</option>
                        {grades.map(g => <option key={g.id} value={String(g.id)}>{g.name}</option>)}
                      </select>
                    </div>
                    <div className="filterGroup">
                      <label>طرح اشتراک</label>
                      <select value={editing.subscriptionPlan || 'none'} onChange={(e) => setEditing({ ...editing, subscriptionPlan: e.target.value })}>
                        <option value="none">بدون اشتراک</option>
                        <option value="golden">طلایی</option>
                      </select>
                    </div>
                    <div className="filterGroup">
                      <label>وضعیت حساب</label>
                      <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                        <option value="active">فعال</option>
                        <option value="suspended">معلق</option>
                      </select>
                    </div>
                    <div className="filterGroup">
                      <label>توکن</label>
                      <input type="number" value={editing.tokens ?? 0} onChange={(e) => setEditing({ ...editing, tokens: Number(e.target.value) })} />
                    </div>
                    <div className="filterGroup">
                      <label>موجودی کیف پول (تومان)</label>
                      <input type="number" value={editing.walletBalance ?? 0} onChange={(e) => setEditing({ ...editing, walletBalance: Number(e.target.value) })} />
                    </div>
                    <div className="full-span flex items-center" style={{ justifyContent: 'flex-end', gap: '.5rem', marginTop: '.25rem' }}>
                      <button className="btn" onClick={() => setEditorOpen(false)}>بستن</button>
                      <button className="btn btn-primary" onClick={async () => {
                        if (!editing) return;
                        if (!editing.firstName && !editing.first_name) { setToast({ open: true, severity: 'error', message: 'نام الزامی است.' }); return; }
                        if (!editing.lastName && !editing.last_name) { setToast({ open: true, severity: 'error', message: 'نام خانوادگی الزامی است.' }); return; }
                        if (!editing.phone) { setToast({ open: true, severity: 'error', message: 'شماره موبایل الزامی است.' }); return; }
                        
                        const payload = {
                          first_name: editing.firstName || editing.first_name || '',
                          last_name: editing.lastName || editing.last_name || '',
                          phone: editing.phone || '',
                          email: editing.email || null,
                          is_active: editing.status ? editing.status === 'active' : undefined,
                          roles: editing.role ? [editing.role] : undefined,
                          province: editing.province || null,
                          city: editing.city || null,
                        };
                        
                        // Only send password if it's not empty
                        if (editing.password && editing.password.trim()) {
                          payload.password = editing.password.trim();
                        }
                        
                        // Send grade_id as number if it exists
                        if (editing.grade_id != null) {
                          payload.grade_id = Number(editing.grade_id);
                        } else if (editing.grade && /^\d+$/.test(String(editing.grade))) {
                          payload.grade_id = Number(editing.grade);
                        }
                        
                        try {
                          const exists = data.some(u => u.id === editing.id);
                          const saved = exists ? await updateAdminUser(editing.id, payload) : await createAdminUser(payload);
                          setEditorOpen(false);
                          setToast({ open: true, severity: 'success', message: 'ذخیره شد.' });
                          // Refetch list for consistency
                          const { items, meta } = await fetchAdminUsers({ q: query || undefined, role: roleFilter || undefined, subscription: subFilter || undefined, status: statusFilter || undefined, page: page + 1, per_page: rowsPerPage });
                          setData(Array.isArray(items) ? items.map(enrichUser) : []);
                          setTotal(meta?.total ?? (Array.isArray(items) ? items.length : 0));
                        } catch (e) {
                          // If validation errors from backend, show detailed messages and field errors
                          const resp = e?.response?.data;
                          if (e?.response?.status === 422 && resp?.errors) {
                            setValidationErrors(resp.errors || {});
                            const msgs = Object.values(resp.errors).flat().slice(0,3).join(' — ');
                            setToast({ open: true, severity: 'error', message: msgs || (resp.message || 'خطا در اعتبارسنجی') });
                          } else {
                            setToast({ open: true, severity: 'error', message: resp?.message || e?.message || 'خطا در ذخیره کاربر' });
                          }
                        }
                      }}>ذخیره</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast({ ...toast, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.severity} variant="filled">{toast.message}</Alert>
      </Snackbar>
      {/* Suspend Confirmation */}
      <ConfirmationDialog
        open={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        onConfirm={() => {
          if (!suspendTarget) return;
          (async () => {
            try {
              const updated = await suspendAdminUser(suspendTarget.id);
              const eu = enrichUser(updated || suspendTarget);
              setData(prev => prev.map(u => u.id === eu.id ? eu : u));
              setToast({ open: true, severity: 'success', message: 'کاربر معلق شد.' });
            } catch (e) {
              setToast({ open: true, severity: 'error', message: e?.response?.data?.message || 'خطا در معلق‌کردن کاربر' });
            } finally {
              setSuspendTarget(null);
            }
          })();
        }}
        title="تایید معلق‌کردن"
        message={`آیا مطمئن هستید که می‌خواهید کاربر ${suspendTarget?.name || suspendTarget?.email || suspendTarget?.id || ''} را معلق کنید؟`}
        confirmLabel="تعلیق"
        confirmColor="error"
      />
      <ConfirmationDialog
        open={deleteUserId != null}
        onClose={handleCancelDelete}
        onConfirm={async () => {
          if (deleteUserId == null) return;
          try {
            await deleteAdminUser(deleteUserId);
            setToast({ open: true, severity: 'success', message: 'کاربر حذف شد.' });
            // If last item on page removed, go back a page, else refetch current page
            const remainingOnPage = paginatedUsers.length - 1;
            if (remainingOnPage <= 0 && page > 0) {
              setPage(prev => Math.max(0, prev - 1));
            } else {
              const { items, meta } = await fetchAdminUsers({ q: query || undefined, role: roleFilter || undefined, subscription: subFilter || undefined, status: statusFilter || undefined, page: page + 1, per_page: rowsPerPage });
              setData(Array.isArray(items) ? items.map(enrichUser) : []);
              setTotal(meta?.total ?? (Array.isArray(items) ? items.length : 0));
            }
          } catch (e) {
            setToast({ open: true, severity: 'error', message: e?.response?.data?.message || 'خطا در حذف کاربر' });
          } finally {
            setDeleteUserId(null);
          }
        }}
        title="حذف کاربر"
        message="آیا از حذف این کاربر مطمئن هستید؟ این عملیات قابل بازگشت نیست."
        confirmLabel="حذف کاربر"
        confirmColor="error"
      />
    </div>
  );
};

export default UserManagement;
