import React, { useEffect, useMemo, useState } from 'react';
import { Search, X, Filter, ChevronDown } from 'lucide-react';
import styles from './Admin.module.css';
import { fetchAdminSubscriptionsByUser, fetchUserWallet } from '../../api/adminApi';

const includesQ = (text, q) => String(text ?? '').toLowerCase().includes(String(q ?? '').toLowerCase().trim());

const combineFinancial = (subs = [], wallet = { transactions: [] }) => {
  const a = (Array.isArray(subs) ? subs : []).map((s) => ({
    id: `SUB-${s.id}`,
    title: s.plan?.name || s.plan?.slug || 'اشتراک',
    type: 'اشتراک',
    amount: s.price ? Number(s.price) : 0,
    currency: 'تومان',
    status: s.status === 'active' ? 'موفق' : s.status,
    date: s.start_date ? new Date(s.start_date).toLocaleDateString('fa-IR') : '—',
    gateway: '—',
    referenceId: s.id,
  }));
  const b = (Array.isArray(wallet.transactions) ? wallet.transactions : []).map((t) => ({
    id: `WAL-${t.id}`,
    title: t.reason || (t.type === 'deposit' ? 'افزایش موجودی کیف پول' : 'کاهش موجودی کیف پول'),
    type: 'کیف پول',
    amount: t.type === 'withdraw' ? -Number(t.amount) : Number(t.amount),
    currency: 'تومان',
    status: 'موفق',
    date: t.created_at ? new Date(t.created_at).toLocaleDateString('fa-IR') : '—',
    gateway: 'کیف پول',
    referenceId: t.order_id || '—',
  }));
  return [...a, ...b].sort((x, y) => String(y.id).localeCompare(String(x.id)));
};

const formatAmount = (n) => new Intl.NumberFormat('fa-IR').format(n) + ' ';

const UserFinancialHistory = ({ user }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subs, setSubs] = useState([]);
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerOpenVisual, setDrawerOpenVisual] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page] = useState(1);
  const [perPage] = useState(50);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true); setError(null);
    (async () => {
      try {
        const [s, w] = await Promise.all([
          fetchAdminSubscriptionsByUser(user.id, { page, per_page: perPage }),
          fetchUserWallet(user.id),
        ]);
        if (cancelled) return;
        setSubs(Array.isArray(s.items) ? s.items : []);
        setWallet(w || { balance: 0, transactions: [] });
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.message || e?.message || 'خطا در دریافت تاریخچه مالی');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, page, perPage]);

  const data = useMemo(() => combineFinancial(subs, wallet), [subs, wallet]);

  const filteredTx = useMemo(() => {
    if (!query) return data;
    return data.filter((t) => [t.title, t.type, t.amount, t.currency, t.status, t.date, t.gateway, t.referenceId, t.id].some((f) => includesQ(f, query)));
  }, [query, data]);

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

  const openDetails = (tx) => { setSelected(tx); setDrawerOpen(true); };

  return (
    <div>
      <div className={styles.detailTabHeader}>
        <h3 className="title-md" style={{ margin: 0 }}>تاریخچه مالی</h3>
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
          <div className={`${styles.detailFilterContainer} detailFilterContainer financialFilters`}>
            <div className="filterGrid filterGrid--2col" style={{ width: '100%' }}>
              <div className="filterGroup filterSearch full-span">
                <label>جستجو</label>
                <div className="inputWrap">
                  <span className="searchIcon"><Search size={16} /></span>
                  <input
                    type="text"
                    placeholder="جستجو در تراکنش‌ها..."
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
              <div className="filterGroup"><label>از تاریخ</label><input type="date" /></div>
              <div className="filterGroup"><label>تا تاریخ</label><input type="date" /></div>
            </div>
          </div>
        </div>
      </div>

      <div className={`${styles.detailCard} ${styles.tableContainer}`}>
        {loading && <div className="text-sm" style={{ padding: '.75rem' }}>در حال بارگذاری...</div>}
        {error && <div className="text-sm" style={{ padding: '.75rem', color: 'var(--danger)' }}>{error}</div>}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'right', padding: '.5rem' }}>شناسه</th>
              <th style={{ textAlign: 'right', padding: '.5rem' }}>عنوان</th>
              <th style={{ textAlign: 'right', padding: '.5rem' }}>نوع</th>
              <th style={{ textAlign: 'right', padding: '.5rem' }}>مبلغ</th>
              <th style={{ textAlign: 'right', padding: '.5rem' }}>وضعیت</th>
              <th style={{ textAlign: 'right', padding: '.5rem' }}>درگاه</th>
              <th style={{ textAlign: 'right', padding: '.5rem' }}>تاریخ</th>
              <th style={{ textAlign: 'right', padding: '.5rem' }}>کد پیگیری</th>
            </tr>
          </thead>
          <tbody>
            {filteredTx.map((t) => (
              <tr key={t.id} className={styles.clickableRow} onClick={() => openDetails(t)}>
                <td data-label="شناسه" style={{ padding: '.5rem' }}>{t.id}</td>
                <td data-label="عنوان" style={{ padding: '.5rem' }}>{t.title}</td>
                <td data-label="نوع" style={{ padding: '.5rem' }}>{t.type}</td>
                <td data-label="مبلغ" style={{ padding: '.5rem' }}>{formatAmount(t.amount)}{t.currency}</td>
                <td data-label="وضعیت" style={{ padding: '.5rem' }}>
                  <span className={`badge ${t.status === 'موفق' ? 'badge-accent' : 'badge-outline'}`}>{t.status}</span>
                </td>
                <td data-label="درگاه" style={{ padding: '.5rem' }}>{t.gateway}</td>
                <td data-label="تاریخ" style={{ padding: '.5rem' }}>{t.date}</td>
                <td data-label="کد پیگیری" style={{ padding: '.5rem' }}>{t.referenceId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Details Drawer */}
      {drawerVisible && (
        <div className={`drawerRoot ${drawerOpenVisual ? 'open' : ''}`} aria-hidden={!drawerOpen}>
          <div className="drawerOverlay" onClick={() => setDrawerOpen(false)} />
          <aside className={`drawerPanel ${drawerOpenVisual ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="جزئیات تراکنش">
            <div className="drawerInner">
              <div className="drawerSection flex items-center justify-between" style={{ paddingBottom: '.75rem' }}>
                <h3 className="title-sm" style={{ margin: 0, fontSize: '.85rem' }}>{selected?.id || 'جزئیات تراکنش'}</h3>
                <button className="btn btn-icon" onClick={() => setDrawerOpen(false)} aria-label="بستن">
                  <X size={18} />
                </button>
              </div>
              <hr className="divider" />
              {selected && (
                <div className="drawerSection">
                  <div className="filterGrid drawerFilters">
                    <div className="filterGroup"><label>شناسه</label><div className="readOnlyField" style={{ padding: '.5rem .75rem' }}>{selected.id}</div></div>
                    <div className="filterGroup"><label>عنوان</label><div className="readOnlyField" style={{ padding: '.5rem .75rem' }}>{selected.title}</div></div>
                    <div className="filterGroup"><label>نوع</label><div className="readOnlyField" style={{ padding: '.5rem .75rem' }}>{selected.type}</div></div>
                    <div className="filterGroup"><label>مبلغ</label><div className="readOnlyField" style={{ padding: '.5rem .75rem' }}>{formatAmount(selected.amount)}{selected.currency}</div></div>
                    <div className="filterGroup"><label>وضعیت</label><div className="readOnlyField" style={{ padding: '.5rem .75rem' }}>{selected.status}</div></div>
                    <div className="filterGroup"><label>درگاه</label><div className="readOnlyField" style={{ padding: '.5rem .75rem' }}>{selected.gateway}</div></div>
                    <div className="filterGroup"><label>تاریخ</label><div className="readOnlyField" style={{ padding: '.5rem .75rem' }}>{selected.date}</div></div>
                    <div className="filterGroup"><label>کد پیگیری</label><div className="readOnlyField" style={{ padding: '.5rem .75rem' }}>{selected.referenceId}</div></div>
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

export default UserFinancialHistory;