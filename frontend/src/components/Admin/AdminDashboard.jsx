import React, { useMemo, useState } from 'react';
// Kept lightweight / still-to-replace MUI pieces (Drawer, inputs, feedback & pagination)
import { Snackbar, Alert } from '@mui/material';
import HejriDatePicker from './HejriDatePicker';
import { Users, Wallet, ArrowUpRight, ArrowDownRight, MessageCircle, LifeBuoy, UserPlus, Percent, Video, FileText, X } from 'lucide-react';
import styles from './Admin.module.css';
import './adminBase.css';
import './AdminDashboard.css';
import { fetchAdminStats } from '../../api/adminApi';

const numberFa = (n) => new Intl.NumberFormat('fa-IR').format(n);

// Unified icon sizing for Lucide icons on dashboard cards
const ICON_SIZE = 24;

// Default mock totals used as an initial placeholder while loading
const DEFAULT_TOTALS = { users: 0, activeSubs: 0, monthlyRevenue: 0, openTickets: 0, recentUsers30: 0 };

const AdminDashboard = ({ onQuickNavigate }) => {
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState(DEFAULT_TOTALS);

  // Load KPI totals from API
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const t = await fetchAdminStats();
        if (!cancelled) {
          setTotals(t);
        }
      } catch (e) {
        if (!cancelled) {
          setToast({ open: true, severity: 'error', message: 'خطا در بارگذاری آمار داشبورد' });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Last 30 days signups (chart only): synthesize a simple trend seeded by recentUsers30
  const last30 = useMemo(() => {
    // Distribute recentUsers30 across 30 days to draw a simple line (no extra noise that changes the sum)
    const total = Math.max(0, totals.recentUsers30 || 0);
    const base = Math.floor(total / 30);
    const rem = total - base * 30;
    const arr = Array.from({ length: 30 }, () => base);
    for (let i = 0; i < rem; i++) arr[29 - i] += 1; // back-load remainder for a slight upward trend
    return arr.map((v, i) => ({ day: i + 1, value: v }));
  }, [totals.recentUsers30]);
  // Display count must equal backend-provided recentUsers30
  const newUsers30 = totals.recentUsers30 || 0;

  // Mock subscription plan popularity
  const subDist = useMemo(() => ({ golden: 4600, grade: 2500, chapter: 1800 }), []);

  // Recent activity examples (short feed)
  const activities = useMemo(() => [
    { id: 1, icon: <div className="avatar-sm" style={{ background: 'var(--accent-primary-solid)' }}><Users size={16} color="#fff" /></div>, text: 'کاربر جدید: سارا رضایی ثبت‌نام کرد.', meta: 'همین الان' },
    { id: 2, icon: <div className="avatar-sm" style={{ background: 'rgb(16 185 129)' }}><Wallet size={16} color="#fff" /></div>, text: 'اشتراک جدید: علی محمدی اشتراک طلایی را خریداری کرد.', meta: '۵ دقیقه پیش' },
    { id: 3, icon: <div className="avatar-sm" style={{ background: 'rgb(59 130 246)' }}><MessageCircle size={16} color="#fff" /></div>, text: 'تیکت جدید: "مشکل در ورود" ثبت شد.', meta: '۱ ساعت پیش' },
  ], []);
  // Expanded activity list for drawer (mock 120 items)
  const allActivities = useMemo(() => {
    const colors = ['var(--accent-primary-solid)', 'rgb(16 185 129)', 'rgb(59 130 246)'];
    const texts = [
      (i) => `کاربر جدید #${i}: ثبت‌نام انجام شد`,
      (i) => `خرید اشتراک توسط کاربر #${i}`,
      (i) => `تیکت پشتیبانی #${i}: درخواست بررسی شد`,
    ];
    return Array.from({ length: 120 }, (_, i) => {
      const t = i % 3;
      const color = colors[t];
      const text = texts[t](i + 1);
      const minutes = (i * 7) % 240; // spread across last 4 hours
      const meta = minutes === 0 ? 'همین الان' : `${numberFa(minutes)} دقیقه پیش`;
      const innerIcon = t === 0 ? <Users size={16} color="#fff" /> : t === 1 ? <Wallet size={16} color="#fff" /> : <MessageCircle size={16} color="#fff" />;
      const type = t === 0 ? 'signup' : t === 1 ? 'purchase' : 'ticket';
      const userType = i % 3 === 0 ? 'teacher' : 'student';
      const ts = Date.now() - minutes * 60 * 1000;
      return { id: i + 10, icon: <div className="avatar-sm" style={{ background: color }}>{innerIcon}</div>, text, meta, type, userType, ts };
    });
  }, []);
  const [activityOpen, setActivityOpen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false); // keep mounted for closing animation
  const [drawerOpenVisual, setDrawerOpenVisual] = useState(false); // apply 'open' class after mount for enter animation
  const [actPage, setActPage] = useState(0);
  const [actRows, setActRows] = useState(20);
  const [filterType, setFilterType] = useState('all');
  const [filterUserType, setFilterUserType] = useState('all');
  const [filterFrom, setFilterFrom] = useState(null); // Date | null
  const [filterTo, setFilterTo] = useState(null); // Date | null
  const [filterQuery, setFilterQuery] = useState('');

  // Manage drawer mount/unmount for smooth animations
  React.useEffect(() => {
    if (activityOpen) {
      setDrawerVisible(true);
      // Defer applying 'open' class to next frame for smooth enter animation
      const raf = requestAnimationFrame(() => setDrawerOpenVisual(true));
      return () => cancelAnimationFrame(raf);
    } else {
      // Start exit animation by removing 'open' class
      setDrawerOpenVisual(false);
      if (drawerVisible) {
        const t = setTimeout(() => setDrawerVisible(false), 300); // match CSS transition
        return () => clearTimeout(t);
      }
    }
  }, [activityOpen]);

  // Close drawer on Escape and lock body scroll when visible
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setActivityOpen(false);
    };
    if (drawerVisible) {
      document.addEventListener('keydown', onKey);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', onKey);
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [drawerVisible]);

  const filteredActivities = useMemo(() => {
    const fromTs = filterFrom ? (filterFrom instanceof Date ? filterFrom.getTime() : new Date(filterFrom).getTime()) : null;
    const toTs = filterTo ? (filterTo instanceof Date ? filterTo.getTime() : new Date(filterTo).getTime()) : null;
    return allActivities.filter(a => {
      if (filterType !== 'all' && a.type !== filterType) return false;
      if (filterUserType !== 'all' && a.userType !== filterUserType) return false;
      if (fromTs && a.ts < fromTs) return false;
      if (toTs && a.ts > toTs) return false;
      if (filterQuery && !a.text.includes(filterQuery)) return false;
      return true;
    });
  }, [allActivities, filterType, filterUserType, filterFrom, filterTo, filterQuery]);

  const pagedActivities = useMemo(() => {
    const start = actPage * actRows;
    return filteredActivities.slice(start, start + actRows);
  }, [filteredActivities, actPage, actRows]);
  return (
    <div dir="rtl" className="flex flex-col gap-lg dashRoot">
      {/* Welcome */}
      <div className="dashSection dashSection--welcome">
        <header className={styles.panelHeader}>
          <h1 className="title-md">داشبورد مدیریتی المینو</h1>
        </header>
      </div>

      {/* Quick Actions */}
      <div className="dashSection dashSection--quick">
        <h2 className="title-sm" style={{ marginBottom: '.75rem' }}>اقدامات سریع</h2>
        <div className="quickActionsGrid" style={{ marginBottom: '1rem' }}>
          <QuickActionCard
            title="افزودن کاربر جدید"
            subtitle="مدیریت کاربران"
            icon={<UserPlus size={ICON_SIZE} />}
            onClick={() => onQuickNavigate ? onQuickNavigate('users?action=add') : setToast({ open: true, severity: 'info', message: 'به تب کاربران بروید.' })}
          />
          <QuickActionCard
            title="ایجاد کد تخفیف"
            subtitle="مدیریت تخفیف‌ها"
            icon={<Percent size={ICON_SIZE} />}
            onClick={() => onQuickNavigate ? onQuickNavigate('discounts?action=add') : setToast({ open: true, severity: 'info', message: 'به تب تخفیف‌ها بروید.' })}
          />
          <QuickActionCard
            title="آپلود ویدیوی جدید"
            subtitle="مدیریت ویدیوها"
            icon={<Video size={ICON_SIZE} />}
            onClick={() => onQuickNavigate ? onQuickNavigate('videos?action=add') : setToast({ open: true, severity: 'info', message: 'به تب ویدیوها بروید.' })}
          />
          <QuickActionCard
            title="افزودن جزوه جدید"
            subtitle="مدیریت جزوه‌ها"
            icon={<FileText size={ICON_SIZE} />}
            onClick={() => onQuickNavigate ? onQuickNavigate('handouts?action=add') : setToast({ open: true, severity: 'info', message: 'به تب جزوه‌ها بروید.' })}
          />
          <QuickActionCard
            title="افزودن سوال جدید"
            subtitle="بانک سوالات"
            icon={<MessageCircle size={ICON_SIZE} />}
            onClick={() => onQuickNavigate ? onQuickNavigate('questions?action=add') : setToast({ open: true, severity: 'info', message: 'به تب سوالات بروید.' })}
          />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="dashSection dashSection--kpis">
        <div className="kpiGrid">
          <MetricCard title="کاربران کل" value={loading ? '—' : numberFa(totals.users)} delta={+5.2} icon={<Users size={ICON_SIZE} />} />
          <MetricCard title="کاربران جدید (۳۰ روز)" value={loading ? '—' : numberFa(newUsers30)} delta={+3.1} icon={<UserPlus size={ICON_SIZE} />} />
          <MetricCard title="اشتراک‌های فعال" value={loading ? '—' : numberFa(totals.activeSubs)} delta={+1.7} icon={<Percent size={ICON_SIZE} />} />
          <MetricCard title="درآمد ماه جاری (تومان)" value={loading ? '—' : numberFa(totals.monthlyRevenue)} delta={-2.4} icon={<Wallet size={ICON_SIZE} />} />
          <MetricCard title="تیکت‌های باز" value={loading ? '—' : numberFa(totals.openTickets)} delta={-0.6} icon={<LifeBuoy size={ICON_SIZE} />} />
        </div>
      </div>

      {/* Charts */}
      <div className="dashSection dashSection--charts">
        <div className="chartsWrapper">
        <ResponsiveChartCard
          title="روند ثبت‌نام ۳۰ روز اخیر"
          type="line"
          data={last30}
          primary
        />
        <ResponsiveChartCard
          title="محبوبیت طرح‌های اشتراک"
          type="bar"
          data={[
            { label: 'طلایی', value: subDist.golden },
            { label: 'پایه', value: subDist.grade },
            { label: 'فصل', value: subDist.chapter },
          ]}
          note="۳۰ روز اخیر"
        />
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="dashSection dashSection--activity">
        <section className="adminCard activityCard" style={{ padding: '0.75rem 0.75rem 1rem' }}>
        <div className="flex items-center justify-between" style={{ padding: '.25rem .5rem .5rem' }}>
          <h3 className="title-sm" style={{ margin: 0 }}>فعالیت‌های اخیر</h3>
          <button className="btn btn-outline" style={{ fontSize: '.6rem', padding: '.4rem .7rem' }} onClick={() => setActivityOpen(true)}>نمایش همه</button>
        </div>
        <div className="activity-list" style={{ paddingTop: '.2rem' }}>
          {activities.map(a => (
            <div key={a.id} className="activity-item">
              <div className="flex items-center gap-sm">
                {a.icon}
                <span className="text-sm" style={{ fontSize: '.65rem' }}>{a.text}</span>
              </div>
              <span className="activity-meta">{a.meta}</span>
            </div>
          ))}
        </div>
        </section>
      </div>

      {/* Activity Drawer (Large View) - Custom implementation */}
      {drawerVisible && (
        <div className={`drawerRoot ${drawerOpenVisual ? 'open' : ''}`} aria-hidden={!activityOpen}>
          <div className="drawerOverlay" onClick={() => setActivityOpen(false)} />
          <aside className={`drawerPanel ${drawerOpenVisual ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="فعالیت‌های اخیر">
            <div className="drawerInner">
              <div className="drawerSection flex items-center justify-between" style={{ paddingBottom: '.75rem' }}>
                <h3 className="title-sm" style={{ margin: 0, fontSize: '.85rem' }}>فعالیت‌های اخیر (نمای کامل)</h3>
                <button className="btn btn-icon" onClick={() => setActivityOpen(false)} aria-label="بستن">
                  <X size={18} />
                </button>
              </div>
              <hr className="divider" />
              <div className="drawerSection">
                <div className="filterGrid drawerFilters">
                  <div className="filterGroup">
                    <label>نوع رویداد</label>
                    <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setActPage(0); }}>
                      <option value="all">همه</option>
                      <option value="signup">ثبت‌نام</option>
                      <option value="purchase">خرید</option>
                      <option value="ticket">تیکت</option>
                    </select>
                  </div>
                  <div className="filterGroup">
                    <label>نوع کاربر</label>
                    <select value={filterUserType} onChange={(e) => { setFilterUserType(e.target.value); setActPage(0); }}>
                      <option value="all">همه</option>
                      <option value="student">دانش‌آموز</option>
                      <option value="teacher">معلم</option>
                    </select>
                  </div>
                  <div className="filterGroup">
                    <label>از تاریخ (هجری شمسی)</label>
                    <HejriDatePicker label="از تاریخ" value={filterFrom} onChange={(v) => { setFilterFrom(v); setActPage(0); }} />
                  </div>
                  <div className="filterGroup">
                    <label>تا تاریخ (هجری شمسی)</label>
                    <HejriDatePicker label="تا تاریخ" value={filterTo} onChange={(v) => { setFilterTo(v); setActPage(0); }} />
                  </div>
                  <div className="filterGroup" style={{ gridColumn: '1 / -1' }}>
                    <label>جستجو</label>
                    <input type="text" placeholder="متن رویداد..." value={filterQuery} onChange={(e) => { setFilterQuery(e.target.value); setActPage(0); }} />
                  </div>
                  <div className="full-span flex items-center gap-sm" style={{ marginTop: '.25rem' }}>
                    <span className="resultsBadge">نتایج: {numberFa(filteredActivities.length)}</span>
                    <button className="clearBtn" onClick={() => { setFilterType('all'); setFilterUserType('all'); setFilterFrom(null); setFilterTo(null); setFilterQuery(''); setActPage(0); }}>حذف فیلترها</button>
                  </div>
                </div>
              </div>
              <div className="drawerSection scroll-y" style={{ flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                  {pagedActivities.map(a => (
                    <div key={a.id} className="activity-item" style={{ padding: '.6rem .75rem' }}>
                      <div className="flex items-center gap-sm">
                        {a.icon}
                        <span className="text-sm" style={{ fontSize: '.65rem' }}>{a.text}</span>
                      </div>
                      <span className="activity-meta">{a.meta}</span>
                    </div>
                  ))}
                </div>
              </div>
              <hr className="divider" />
              <div className="drawerSection paginationRow">
                <div className="flex items-center" style={{ justifyContent: 'space-between', gap: '.75rem' }}>
                  <div className="flex items-center gap-sm">
                    <span className="text-sm" style={{ fontSize: '.65rem' }}>تعداد در صفحه</span>
                    <select className="rowsSelect" value={actRows} onChange={(e) => { setActRows(parseInt(e.target.value, 10)); setActPage(0); }}>
                      <option value={10}>{numberFa(10)}</option>
                      <option value={20}>{numberFa(20)}</option>
                      <option value={50}>{numberFa(50)}</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-sm">
                    <button className="btn btn-outline" onClick={() => setActPage(p => Math.max(0, p - 1))} disabled={actPage === 0}>قبلی</button>
                    {(() => { const total = filteredActivities.length; const from = total ? actPage * actRows + 1 : 0; const to = Math.min(total, (actPage + 1) * actRows); return (
                      <span className="text-sm" style={{ fontSize: '.65rem' }}>{`${numberFa(from)}–${numberFa(to)} از ${numberFa(total)}`}</span>
                    ); })()}
                    <button className="btn btn-outline" onClick={() => setActPage(p => Math.min(Math.ceil(filteredActivities.length / actRows) - 1, p + 1))} disabled={actPage >= Math.ceil(filteredActivities.length / actRows) - 1}>بعدی</button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      <Snackbar open={toast.open} autoHideDuration={2500} onClose={() => setToast({ ...toast, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.severity} variant="filled">{toast.message}</Alert>
      </Snackbar>
    </div>
  );
};

export default AdminDashboard;

// Small KPI card component (manual)
const MetricCard = ({ title, value, delta, icon }) => {
  const positive = delta >= 0;
  return (
    <div className="adminCard kpi" role="group" aria-label={title}>
      <div className="kpi-head">
        <span className="text-sm text-muted" style={{ fontSize: '.6rem' }}>{title}</span>
        <div className="kpi-icon" style={{ color: 'var(--accent-primary-solid)' }}>{icon}</div>
      </div>
      <div className="kpi-value" aria-label="مقدار">{value}</div>
      <div className={`kpi-delta ${positive ? 'positive' : 'negative'}`}>{positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}<span>{`${positive ? '+' : ''}${delta}% نسبت به ماه قبل`}</span></div>
    </div>
  );
};

// Quick Action Card (manual)
const QuickActionCard = ({ title, subtitle, icon, onClick }) => (
  <button className="adminCard quickActionCard" onClick={onClick} style={{ cursor: 'pointer' }}>
    <div className="kpi-icon" style={{ color: 'var(--accent-primary-solid)', background: 'var(--bg-main)' }}>{icon}</div>
    <div style={{ lineHeight: 1.2 }}>
      <div style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
      <div className="text-muted" style={{ fontSize: '.8rem', color: 'var(--text-secondary)' }}>{subtitle}</div>
    </div>
  </button>
);

// Responsive chart card wrapper determines intrinsic (content-based) height
const ResponsiveChartCard = ({ title, type, data, note }) => {
  const [vw, setVw] = React.useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const containerRef = React.useRef(null);
  const [cw, setCw] = React.useState(0); // container width
  const [padX, setPadX] = React.useState(0); // horizontal padding (px)

  // Track viewport width for height tuning
  React.useEffect(() => {
    const onR = () => setVw(window.innerWidth);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);

  // Track container width and react on resize
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const style = typeof window !== 'undefined' ? window.getComputedStyle(el) : null;
      const pl = style ? parseFloat(style.paddingLeft) || 0 : 0;
      const pr = style ? parseFloat(style.paddingRight) || 0 : 0;
      const newPadX = Math.round(pl + pr);
      const w = el.clientWidth || 0; // includes padding
      setPadX(prev => (prev === newPadX ? prev : newPadX));
      setCw(prev => (prev === w ? prev : w));
    };
    measure();
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => measure());
      ro.observe(el);
    }
    // Debounced window resize handler to catch breakpoint-driven layout changes
    let rafId = null;
    const onWin = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(measure);
    };
    window.addEventListener('resize', onWin);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', onWin);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Base heights tuned to smallest required space for readability (title + chart + optional note)
  let h = 180; // default compact
  if (vw < 900) h = 170;
  if (vw < 700) h = 160;
  if (vw < 560) h = 150;
  if (vw >= 1200) h = 190; // allow a little more vertical space on wide screens

  // Determine SVG width based on container width; never exceed container
  const minSvg = 220;
  const innerW = Math.max(0, cw - padX);
  // Prefer a centered chart that doesn't consume the entire card width on small/mid screens
  const maxPreferred = (
    vw < 360 ? 260 :
    vw < 480 ? 320 :
    vw < 640 ? 380 :
    vw < 768 ? 440 :
    vw < 900 ? 500 :
    vw < 1200 ? 640 :
    760
  );
  const svgWidth = Math.max(minSvg, Math.min(Math.round(innerW), maxPreferred));

  // Decide how many points to render based on available drawing width
  // Reserve chart padding on both sides (LineChart uses ~20-22px padding per side)
  const drawWidth = Math.max(0, svgWidth - 44);
  // Adaptive minimum spacing: smaller on very narrow charts, larger on wide
  const spacingFor = (w) => (w < 280 ? 14 : w < 360 ? 16 : w < 460 ? 18 : 20);
  // Below 900px, be slightly more conservative to improve readability
  const baseSpacing = spacingFor(drawWidth);
  const minSpacing = baseSpacing + (vw < 900 ? 2 : 0);
  let displayCount = data.length;
  if (type === 'line' && drawWidth > 0) {
    // points = segments + 1, segments = (points - 1)
    const segments = Math.max(1, Math.floor(drawWidth / minSpacing));
    displayCount = Math.max(2, Math.min(data.length, segments + 1));
  } else if (type !== 'line') {
    displayCount = data.length;
  }
  const displayData = type === 'line' ? data.slice(-displayCount) : data;

  // Title: reflect node count when fewer than full dataset
  const dynamicTitle = type === 'line' && displayCount < data.length
    ? `روند ثبت‌نام ${numberFa(displayCount)} روز اخیر`
    : title;
  const noteToShow = note || null; // prefer title to convey summary

  return (
    <div ref={containerRef} className="adminCard" style={{ display:'flex', flexDirection:'column', paddingBottom: note ? '.6rem' : '.75rem' }}>
      <div className="title-sm" style={{ margin: 0, marginBottom: '.4rem' }}>{dynamicTitle}</div>
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', width:'100%' }}>
        {type === 'line'
          ? <LineChart data={displayData} height={h} width={svgWidth} vw={vw} />
          : <BarChart data={data} height={h} width={svgWidth} />}
      </div>
      {noteToShow && <div className="noteText" style={{ marginTop: '.35rem' }}>{noteToShow}</div>}
    </div>
  );
};

// Simple inline SVG LineChart
const LineChart = ({ data, height = 180, width = 480, vw }) => {
  // Tighten horizontal padding to allow more data in smaller width
  const padding = vw && vw < 700 ? 20 : 22;
  // Compute safe max; handle empty arrays
  const max = (Array.isArray(data) && data.length > 0)
    ? data.reduce((m, d) => {
        const v = Number(d?.value) || 0;
        return v > m ? v : m;
      }, 0)
    : 0;
  const [hover, setHover] = React.useState(null); // { x, y, day, value }
  const denom = Math.max(1, data.length - 1);
  // Estimate average spacing between points to decide marker visibility
  const avgSpacing = (width - padding * 2) / Math.max(1, data.length - 1);
  const dense = avgSpacing < 14; // very tight
  const semiDense = avgSpacing < 18; // moderate tight
  const strokeW = dense ? 1.5 : semiDense ? 1.8 : (vw && vw < 560 ? 1.8 : 2);
  const radius = dense ? 0 : (vw && vw < 560 ? 2.5 : semiDense ? 3 : 3.5);
  const points = (data && data.length > 0 ? data : [{ value: 0, day: 1 }, { value: 0, day: 2 }]).map((d, i) => {
    const x = padding + (i * (width - padding * 2)) / denom;
    const scaled = max > 0 ? (Number(d?.value) || 0) / max : 0;
    const y = height - padding - scaled * (height - padding * 2);
    const ySafe = Number.isFinite(y) ? y : (height - padding);
    return `${x},${ySafe}`;
  }).join(' ');
  return (
    <div style={{ width: '100%' }}>
      <svg width={width} height={height} style={{ display: 'block' }}>
        <polyline fill="none" stroke="var(--accent-primary-solid)" strokeWidth={strokeW} points={points} />
        {!dense && (data || []).map((d, i) => {
          const x = padding + (i * (width - padding * 2)) / denom;
          const scaled = max > 0 ? (Number(d?.value) || 0) / max : 0;
          const y = height - padding - scaled * (height - padding * 2);
          const ySafe = Number.isFinite(y) ? y : (height - padding);
          return (
            <g key={i} onMouseEnter={() => setHover({ x, y: ySafe, day: d.day, value: d.value })} onMouseLeave={() => setHover(null)}>
              <circle cx={x} cy={ySafe} r={radius} fill="var(--accent-primary-solid)" />
            </g>
          );
        })}
        {hover && (() => {
          const label = `روز ${hover.day} — ${numberFa(hover.value)}`;
          const charW = 7.2; // approximate char width for 12px
          const padX = 10;
          const rectW = Math.max(120, Math.ceil(label.length * charW + padX * 2));
          const rectH = 26;
          // Clamp tooltip within chart width
          const baseX = hover.x + 8;
          const rectX = Math.min(Math.max(padding, baseX), width - padding - rectW);
          const rectY = hover.y - (rectH + 6);
          const textX = rectX + rectW / 2;
          const textY = rectY + rectH / 2;
          return (
            <g>
              <line x1={hover.x} x2={hover.x} y1={padding} y2={height - padding} stroke="#9ca3af" strokeDasharray="4 4" />
              <rect x={rectX} y={rectY} width={rectW} height={rectH} rx="4" fill="var(--bg-content)" stroke="var(--border-color)" />
              <text x={textX} y={textY} fontSize="12" fill="var(--text-primary)" textAnchor="middle" dominantBaseline="middle">
                {label}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
};

// Simple inline SVG BarChart
const BarChart = ({ data, height = 180, width = 260 }) => {
  const padding = 24;
  // Compute responsive bar width and gap based on chart width
  const maxBars = Math.max(1, data.length);
  const drawWidth = Math.max(0, width - padding * 2);
  // Start with comfortable sizes then shrink if needed
  let barW = 36;
  let gap = 24;
  // Reduce sizes for small widths
  if (drawWidth < 360) { barW = 28; gap = 18; }
  if (drawWidth < 280) { barW = 22; gap = 14; }
  if (drawWidth < 220) { barW = 18; gap = 12; }
  const max = Math.max(...data.map(d => d.value));
  const groupWidth = data.length * barW + (data.length - 1) * gap;
  const offsetX = padding + Math.max(0, (drawWidth - groupWidth) / 2);
  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <svg width={width} height={height}>
        {data.map((d, i) => {
          const x = offsetX + i * (barW + gap);
          const h = ((d.value / max) * (height - padding * 2));
          const y = height - padding - h;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={h} fill="var(--accent-primary-solid)" rx="4" />
              <text x={x + barW / 2} y={height - padding + 16} textAnchor="middle" fontSize={drawWidth < 280 ? 10 : 12} fill="var(--text-primary)">{d.label}</text>
              <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize={drawWidth < 280 ? 10 : 11} fill="var(--text-secondary)">{numberFa(d.value)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
