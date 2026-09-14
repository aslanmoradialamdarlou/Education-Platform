import React, { useEffect, useMemo, useState } from 'react';
import { Search, X, Video, FileText, PlusCircle, Filter, ChevronDown } from 'lucide-react';
import HejriDatePicker from './HejriDatePicker';
import AddContentModal from './AddContentModal';
import ConfirmationDialog from './ConfirmationDialog';
import styles from './Admin.module.css';
import { fetchUserVideoLicenses } from '../../api/adminApi';

const includesQ = (text, q) =>
  String(text ?? '').toLowerCase().includes(String(q ?? '').toLowerCase().trim());

// Utilities: Persian digits -> ASCII and Jalali -> Gregorian conversion
const faToEnDigits = (s) => String(s ?? '').replace(/[\u06F0-\u06F9]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));

// Convert a Jalali date (jy,jm,jd) to Gregorian [gy,gm,gd]; algorithm adapted from well-known arithmetic conversion
const j2g = (jy, jm, jd) => {
  // Ensure numbers
  jy = Number(jy); jm = Number(jm); jd = Number(jd);
  let gy;
  jy += 1595;
  let days = -355668 + (365 * jy) + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4) + jd + (jm < 7 ? (jm - 1) * 31 : ((jm - 7) * 30 + 186));
  gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let gd = days + 1;
  const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm;
  for (gm = 1; gm <= 12; gm++) {
    const v = sal_a[gm];
    if (gd <= v) break;
    gd -= v;
  }
  return [gy, gm, gd];
};

const parseJalaliDateToGregorianDate = (faDateStr) => {
  const en = faToEnDigits(faDateStr).trim();
  const parts = en.split('/');
  if (parts.length !== 3) return null;
  const [jy, jm, jd] = parts.map((p) => Number(p));
  if (!jy || !jm || !jd) return null;
  const [gy, gm, gd] = j2g(jy, jm, jd);
  const iso = `${String(gy).padStart(4, '0')}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}T00:00:00.000Z`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

const mapLicenseToRow = (lic) => ({
  id: lic.id,
  title: lic.name || `لایسنس ${lic.id}`,
  type: 'ویدیو',
  grade: lic.grade || '—',
  chapter: lic.chapter || '—',
  datePurchased: lic.created_at ? new Date(lic.created_at).toLocaleDateString('fa-IR') : '—',
  access: lic.status !== 'revoked',
});

const TypeIcon = ({ type }) =>
  type === 'ویدیو' ? <Video size={16} /> : <FileText size={16} />;

const UserContent = ({ user }) => {
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [chapterFilter, setChapterFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingId, setPendingId] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  // Detail drawer state
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerOpenVisual, setDrawerOpenVisual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true); setError(null);
    (async () => {
      try {
        const { items, meta } = await fetchUserVideoLicenses(user.id, { page, per_page: perPage });
        if (cancelled) return;
        setRows(Array.isArray(items) ? items.map(mapLicenseToRow) : []);
        setTotal(meta?.total || 0);
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.message || e?.message || 'خطا در دریافت محتوا');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, page, perPage]);

  const filtered = useMemo(() => {
    let items = rows;
    if (typeFilter !== 'all') items = items.filter((it) => it.type === typeFilter);
    if (gradeFilter !== 'all') items = items.filter((it) => String(it.grade) === String(gradeFilter));
    if (chapterFilter !== 'all') items = items.filter((it) => String(it.chapter) === String(chapterFilter));
    // Date range filter (inclusive) using Hejri pickers' Date objects + Jalali->Gregorian conversion for item dates
    if (startDate || endDate) {
      const startTs = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
      const endTs = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;
      items = items.filter((it) => {
        const d = parseJalaliDateToGregorianDate(it.datePurchased);
        if (!d) return true; // if can't parse, do not exclude
        const t = d.getTime();
        const startOk = startTs != null ? t >= startTs : true;
        const endOk = endTs != null ? t <= endTs : true;
        return startOk && endOk;
      });
    }
    if (!query) return items;
    return items.filter((it) =>
      [it.title, it.type, it.datePurchased, it.grade, it.chapter].some((f) => includesQ(f, query))
    );
  }, [rows, query, typeFilter, gradeFilter, chapterFilter, startDate, endDate]);

  const clearQuery = () => setQuery('');

  const toggleAccess = (id, nextChecked) => {
    const item = rows.find((r) => r.id === id);
    if (!item) return;
    // No revoke API yet; keep read-only
    setPendingId(id);
    setConfirmOpen(true);
  };

  const handleConfirmRevoke = () => {
    if (pendingId == null) return;
    setRows((prev) => prev.map((r) => (r.id === pendingId ? { ...r, access: false } : r)));
    setConfirmOpen(false);
    setPendingId(null);
  };

  const handleCancelRevoke = () => {
    setConfirmOpen(false);
    setPendingId(null);
  };

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
    <div>
      <div className={styles.detailTabHeader}>
        <h3 className="title-md" style={{ margin: 0 }}>محتوای خریداری شده</h3>
        <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
          <PlusCircle size={18} style={{ marginInlineEnd: 6 }} />
          افزودن محتوا
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
          <div className={`${styles.detailFilterContainer} detailFilterContainer`}>
            <div className="filterGrid filterGrid--2col" style={{ width: '100%' }}>
              <div className="filterGroup filterSearch">
                <label>جستجو</label>
                <div className="inputWrap">
                  <span className="searchIcon"><Search size={16} /></span>
                  <input
                    type="text"
                    placeholder="جستجو در محتوای کاربر..."
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
                <label>نوع محتوا</label>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                  <option value="all">همه</option>
                  <option value="ویدیو">ویدیو</option>
                  <option value="جزوه">جزوه</option>
                </select>
              </div>
              <div className="filterGroup">
                <label>پایه</label>
                <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
                  <option value="all">همه</option>
                  <option value="7">هفتم</option>
                  <option value="8">هشتم</option>
                  <option value="9">نهم</option>
                </select>
              </div>
              <div className="filterGroup">
                <label>فصل</label>
                <select value={chapterFilter} onChange={(e) => setChapterFilter(e.target.value)}>
                  <option value="all">همه</option>
                  <option value="1">فصل ۱</option>
                  <option value="2">فصل ۲</option>
                  <option value="3">فصل ۳</option>
                  <option value="4">فصل ۴</option>
                  <option value="5">فصل ۵</option>
                </select>
              </div>
              <div className="filterGroup">
                <label>از تاریخ</label>
                <HejriDatePicker
                  value={startDate}
                  onChange={(d) => setStartDate(d)}
                  maxDate={endDate || undefined}
                />
              </div>
              <div className="filterGroup">
                <label>تا تاریخ</label>
                <HejriDatePicker
                  value={endDate}
                  onChange={(d) => setEndDate(d)}
                  minDate={startDate || undefined}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`${styles.detailCard} ${styles.tableContainer}`} dir="rtl">
        {loading && <div className="text-sm" style={{ padding: '.75rem' }}>در حال بارگذاری...</div>}
        {error && <div className="text-sm" style={{ padding: '.75rem', color: 'var(--danger)' }}>{error}</div>}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'right', padding: '.5rem' }}>نوع</th>
              <th style={{ textAlign: 'right', padding: '.5rem' }}>عنوان</th>
              <th style={{ textAlign: 'right', padding: '.5rem' }}>تاریخ خرید</th>
              <th style={{ textAlign: 'right', padding: '.5rem' }}>دسترسی</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className={styles.clickableRow} onClick={() => openDetails(item)}>
                <td data-label="نوع" style={{ padding: '.5rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <TypeIcon type={item.type} />
                    {item.type}
                  </span>
                </td>
                <td data-label="عنوان" style={{ padding: '.5rem' }}>{item.title}</td>
                <td data-label="تاریخ خرید" style={{ padding: '.5rem' }}>{item.datePurchased}</td>
                <td data-label="دسترسی" style={{ padding: '.5rem' }}>
                  <label className="switch" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={item.access} onChange={(e) => toggleAccess(item.id, e.target.checked)} disabled />
                    <span className="slider" />
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
          <aside className={`drawerPanel ${drawerOpenVisual ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="جزئیات محتوا">
            <div className="drawerInner">
              <div className="drawerSection flex items-center justify-between" style={{ paddingBottom: '.75rem' }}>
                <h3 className="title-sm" style={{ margin: 0, fontSize: '.85rem' }}>{selected?.title || 'جزئیات محتوا'}</h3>
                <button className="btn btn-icon" onClick={() => setDrawerOpen(false)} aria-label="بستن">
                  <X size={18} />
                </button>
              </div>
              <hr className="divider" />
              {selected && (
                <div className="drawerSection">
                  <div className="filterGrid drawerFilters">
                    <div className="filterGroup">
                      <label>نوع</label>
                      <div className="readOnlyField" style={{ padding: '.5rem .75rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <TypeIcon type={selected.type} /> {selected.type}
                        </span>
                      </div>
                    </div>
                    <div className="filterGroup">
                      <label>پایه</label>
                      <div className="readOnlyField" style={{ padding: '.5rem .75rem' }}>{selected.grade || '—'}</div>
                    </div>
                    <div className="filterGroup">
                      <label>فصل</label>
                      <div className="readOnlyField" style={{ padding: '.5rem .75rem' }}>{selected.chapter || '—'}</div>
                    </div>
                    <div className="filterGroup full-span">
                      <label>عنوان</label>
                      <div className="readOnlyField" style={{ padding: '.5rem .75rem' }}>{selected.title}</div>
                    </div>
                    <div className="filterGroup">
                      <label>تاریخ خرید</label>
                      <div className="readOnlyField" style={{ padding: '.5rem .75rem' }}>{selected.datePurchased || '—'}</div>
                    </div>
                    <div className="filterGroup">
                      <label>دسترسی</label>
                      <div className="readOnlyField" style={{ padding: '.3rem .75rem' }}>
                        <label className="switch" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={!!selected.access} onChange={(e) => {
                            setRows(prev => prev.map(r => r.id === selected.id ? { ...r, access: e.target.checked } : r));
                            setSelected(s => s ? { ...s, access: e.target.checked } : s);
                          }} />
                          <span className="slider" />
                        </label>
                      </div>
                    </div>
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

      <AddContentModal open={addOpen} onClose={() => setAddOpen(false)} />
      <ConfirmationDialog
        open={confirmOpen}
        onClose={handleCancelRevoke}
        onConfirm={handleConfirmRevoke}
        title="لغو دسترسی"
        message="API لغو دسترسی در سامانه موجود نیست. برای فعال‌سازی این قابلیت باید Endpoint اضافه شود."
      />
    </div>
  );
};

export default UserContent;