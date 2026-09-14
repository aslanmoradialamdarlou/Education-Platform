import React, { useEffect, useMemo, useState } from 'react';
import { LogIn, LogOut, ShoppingCart, HelpCircle, Search, X, Video, FileText, BookOpenText, MessageCircle, User as UserIcon, Download, Filter, ChevronDown } from 'lucide-react';
import styles from './Admin.module.css';
import { fetchUserActivityLogs } from '../../api/adminApi';

const includesQ = (text, q) => String(text ?? '').toLowerCase().includes(String(q ?? '').toLowerCase().trim());

const mapLogToUi = (row) => {
  // Backend returns: { id, ip, user_agent, method, created_at }
  return {
    id: row.id,
    icon: row.method === 'otp' || row.method === 'password' ? <LogIn size={16} /> : <UserIcon size={16} />,
    title: row.method ? `ورود (${row.method})` : 'فعالیت کاربر',
    time: new Date(row.created_at).toLocaleString('fa-IR'),
    type: 'login',
    page: row.ip || '—',
    contentType: null,
  };
};

const UserActivityLog = ({ user }) => {
  const [query, setQuery] = useState('');
  const [activityType, setActivityType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerOpenVisual, setDrawerOpenVisual] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true); setError(null);
    (async () => {
      try {
        const { items: rows, meta } = await fetchUserActivityLogs(user.id, { page, per_page: perPage });
        if (cancelled) return;
        setItems(Array.isArray(rows) ? rows.map(mapLogToUi) : []);
        setTotal(meta?.total || rows?.length || 0);
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.message || e?.message || 'خطا در دریافت لاگ‌ها');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, page, perPage]);

  const filteredLogs = useMemo(() => {
    let list = Array.isArray(items) ? items : [];
    if (activityType !== 'all') list = list.filter(a => a.type === activityType);
    if (!query) return list;
    return list.filter(a => [a.title, a.time, a.type].some(f => includesQ(f, query)));
  }, [items, query, activityType]);

  const clearQuery = () => setQuery('');

  // Drawer animations and body lock
  useEffect(() => {
    if (drawerOpen) {
      setDrawerVisible(true);
      const raf = requestAnimationFrame(() => setDrawerOpenVisual(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setDrawerOpenVisual(false);
      if (drawerVisible) {
        const t = setTimeout(() => setDrawerVisible(false), 300);
        return () => clearTimeout(t);
      }
    }
  }, [drawerOpen, drawerVisible]);

  useEffect(() => {
    if (!drawerVisible) return;
    const onKey = (e) => { if (e.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [drawerVisible]);

  const openDetails = (item) => { setSelected(item); setDrawerOpen(true); };

  return (
    <div dir="rtl">
      <div className={styles.detailTabHeader}>
        <h3 className="title-md" style={{ margin: 0 }}>لاگ فعالیت‌های کاربر</h3>
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
          <div className={`${styles.detailFilterContainer} detailFilterContainer`}>
            <div className="filterGrid filterGrid--2col" style={{ width: '100%' }}>
              <div className="filterGroup filterSearch">
                <label>جستجو</label>
                <div className="inputWrap">
                  <span className="searchIcon"><Search size={16} /></span>
                  <input
                    type="text"
                    placeholder="جستجو در فعالیت‌ها..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                {query && (
                  <button className="btn btn-icon" onClick={clearQuery} aria-label="پاک کردن" style={{ position: 'absolute', insetInlineEnd: 6, top: '50%', transform: 'translateY(-50%)' }}>
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="filterGroup">
                <label>نوع فعالیت</label>
                <select value={activityType} onChange={(e) => setActivityType(e.target.value)}>
                  <option value="all">همه</option>
                  <option value="login">ورود</option>
                  <option value="logout">خروج</option>
                  <option value="view">مشاهده</option>
                  <option value="purchase">خرید</option>
                  <option value="comment">نظر</option>
                  <option value="download">دانلود</option>
                  <option value="profile">پروفایل</option>
                </select>
              </div>
              <div className="filterGroup"><label>از تاریخ</label><input type="date" /></div>
              <div className="filterGroup"><label>تا تاریخ</label><input type="date" /></div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.detailCard}>
        {loading && <div className="text-sm" style={{ padding: '.75rem' }}>در حال بارگذاری...</div>}
        {error && <div className="text-sm" style={{ padding: '.75rem', color: 'var(--danger)' }}>{error}</div>}
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          {filteredLogs.map((activity) => (
            <li key={activity.id} className={styles.clickableRow} onClick={() => openDetails(activity)} style={{ display: 'grid', gridTemplateColumns: 'minmax(100px, 120px) 1fr', gap: '1rem', alignItems: 'start', width: '100%', maxWidth: '600px' }}>
              <div style={{ color: 'var(--text-secondary)' }}>{activity.time}</div>
              <div style={{ display: 'flex', gap: '.75rem' }}>
                <span className={`badge badge-outline`} aria-hidden style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 999, borderColor: 'var(--border-color)' }}>
                  {activity.icon}
                </span>
                <div>
                  <div style={{ fontWeight: 600 }}>{activity.title}</div>
                  {activity.page && (
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>صفحه: {activity.page}</div>
                  )}
                  {activity.contentType && (
                    <div className="text-sm" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {activity.contentType === 'video' && <Video size={14} />}
                      {activity.contentType === 'handout' && <FileText size={14} />}
                      {activity.contentType === 'blog' && <BookOpenText size={14} />}
                      <span>
                        {activity.contentType === 'video' ? 'ویدیو' : activity.contentType === 'handout' ? 'جزوه' : 'بلاگ'}
                        {activity.contentTitle ? `: ${activity.contentTitle}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Simple pager */}
      <div className="drawerSection paginationRow" style={{ marginTop: '.5rem' }}>
        <div className="flex items-center" style={{ justifyContent: 'space-between', gap: '.75rem' }}>
          <div />
          <div className="flex items-center gap-sm">
            <button className="btn btn-outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>قبلی</button>
            <span className="text-sm" style={{ fontSize: '.65rem' }}>{`${page} / ${Math.max(1, Math.ceil(total / perPage))}`}</span>
            <button className="btn btn-outline" onClick={() => setPage(p => p + 1)} disabled={page * perPage >= total}>بعدی</button>
          </div>
        </div>
      </div>

      {/* Details Drawer */}
      {drawerVisible && (
        <div className={`drawerRoot ${drawerOpenVisual ? 'open' : ''}`} aria-hidden={!drawerOpen}>
          <div className="drawerOverlay" onClick={() => setDrawerOpen(false)} />
          <aside className={`drawerPanel ${drawerOpenVisual ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="جزئیات فعالیت کاربر">
            <div className="drawerInner">
              <div className="drawerSection flex items-center justify-between" style={{ paddingBottom: '.75rem' }}>
                <h3 className="title-sm" style={{ margin: 0, fontSize: '.85rem' }}>{selected?.title || 'جزئیات فعالیت'}</h3>
                <button className="btn btn-icon" onClick={() => setDrawerOpen(false)} aria-label="بستن">
                  <X size={18} />
                </button>
              </div>
              <hr className="divider" />
              {selected && (
                <div className="drawerSection">
                  <div className="filterGrid drawerFilters">
                    <div className="filterGroup">
                      <label>زمان</label>
                      <div className="readOnlyField" style={{ padding: '.5rem .75rem' }}>{selected.time}</div>
                    </div>
                    <div className="filterGroup">
                      <label>نوع فعالیت</label>
                      <div className="readOnlyField" style={{ padding: '.5rem .75rem' }}>{selected.type}</div>
                    </div>
                    <div className="filterGroup">
                      <label>صفحه</label>
                      <div className="readOnlyField" style={{ padding: '.5rem .75rem' }}>{selected.page || '—'}</div>
                    </div>
                    {selected.contentType && (
                      <div className="filterGroup full-span">
                        <label>محتوا</label>
                        <div className="readOnlyField" style={{ padding: '.5rem .75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {selected.contentType === 'video' && <Video size={14} />}
                          {selected.contentType === 'handout' && <FileText size={14} />}
                          {selected.contentType === 'blog' && <BookOpenText size={14} />}
                          <span>
                            {selected.contentType === 'video' ? 'ویدیو' : selected.contentType === 'handout' ? 'جزوه' : 'بلاگ'}
                            {selected.contentTitle ? `: ${selected.contentTitle}` : ''}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="drawerFooter">
                <button className="btn" onClick={() => setDrawerOpen(false)}>بستن</button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default UserActivityLog;