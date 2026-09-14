import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header/Header';
import VideoCard from '../components/Videos/VideoCard';
import { Filter as FilterIcon } from 'lucide-react';
import styles from '../components/Videos/Videos.module.css';
import FilterSidebar from '../components/Videos/FilterSidebar';
import { useVideosData } from '../components/Videos/useVideosData';

// Mock Data
const MOCK_VIDEOS = [
    { id: 1, title: 'مقدمه‌ای بر اتم‌ها', chapter: 'فصل ۱', teacher: 'استاد رضایی', duration: '۱۲:۳۴', thumbnail: 'https://placehold.co/600x400/8A2BE2/fefefe?text=Video+1', isFree: true, subscriptionId: 'g7c1' },
    { id: 2, title: 'ساختار سلول', chapter: 'فصل ۲', teacher: 'استاد محمدی', duration: '۱۵:۰۲', thumbnail: 'https://placehold.co/600x400/0d6efd/fefefe?text=Video+2', isFree: false, subscriptionId: 'g7c2' },
];

const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 25);
const MOCK_USER = { 
    role: 'student', 
    name: 'دانش‌آموز', 
    avatar: 'https://i.pravatar.cc/40?u=student', 
    hasSubscription: true,
    subscriptionExpiry: futureDate.toISOString(),
    tokenCount: 120,
    subscribedItems: ['g7c2']
};

const VideosPage = () => {
    const [isFilterSidebarOpen, setFilterSidebarOpen] = useState(false);
    const filterTriggerRef = useRef(null);
    const [dismissedUpsell, setDismissedUpsell] = useState(false);
    const [dismissedOffline, setDismissedOffline] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    // Prefill from URL: grades (repeatable), chapters (repeatable grade|chapter)
    useEffect(() => {
        const gVals = searchParams.getAll('grade'); // may repeat
        const g = gVals.map(v => v === '7' ? 'هفتم' : v === '8' ? 'هشتم' : v === '9' ? 'نهم' : v).filter(Boolean);
        if (g.length) setGradesFilter(g);
        const chapterParams = searchParams.getAll('chapter'); // gradeKey|فصل ۱
        if (chapterParams.length) {
            const parsed = chapterParams.map(cp => {
                const [gradeKey, ...rest] = cp.split('|');
                const chapter = rest.join('|');
                if (!gradeKey || !chapter) return null;
                if (!['7','8','9'].includes(gradeKey)) return null;
                return { grade: gradeKey, chapter };
            }).filter(Boolean);
            if (parsed.length) setChaptersFilter(parsed);
        }
        // Do not remove params here; allow chips to clear
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-close mobile filter overlay when resizing to desktop width
    useEffect(() => {
        const handleResize = () => { if (window.innerWidth >= 1040 && isFilterSidebarOpen) setFilterSidebarOpen(false); };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isFilterSidebarOpen]);

    const hook = useVideosData(MOCK_VIDEOS);
    const {
        loading, error, retryLoad, isOffline,
    gradesFilter, setGradesFilter,
    chaptersFilter, setChaptersFilter,
        accessFilter, setAccessFilter,
        searchTerm, setSearchTerm,
        favoritesOnly, setFavoritesOnly,
        sortOption, setSortOption,
        favorites, toggleFavorite,
        watchlist, toggleWatchlist,
        visible,
        allVideos, // Get all videos to derive available chapters
    } = hook;

    // Derive unique chapters from all loaded videos (not just filtered)
    const availableChapters = React.useMemo(() => {
        return Array.from(new Set((allVideos || []).map(v => v.chapter).filter(Boolean)));
    }, [allVideos]);

    // Sync URL when filters change
    useEffect(() => {
        const next = new URLSearchParams(searchParams);
        next.delete('grade');
        gradesFilter.forEach(g => {
            const code = g === 'هفتم' ? '7' : g === 'هشتم' ? '8' : g === 'نهم' ? '9' : g;
            next.append('grade', code);
        });
        next.delete('chapter');
        chaptersFilter.forEach(c => next.append('chapter', `${c.grade}|${c.chapter}`));
        const changed = next.toString() !== searchParams.toString();
        if (changed) setSearchParams(next, { replace: true });
    }, [gradesFilter, chaptersFilter, setSearchParams]);

    // Upsell conditions: user lacks subscription OR expires within 7 days
    const expiry = new Date(MOCK_USER.subscriptionExpiry);
    const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / (1000*60*60*24));
    const showUpsell = (!MOCK_USER.hasSubscription || daysLeft <= 7) && !dismissedUpsell;
    const showOffline = isOffline && !dismissedOffline;

    return (
        <>
            <Header />
            <main className={(showUpsell || showOffline) ? 'hasPreBanner' : undefined}>
                <nav aria-label="breadcrumb" className={styles.breadcrumb}>
                    <a href="/home" aria-label="صفحه اصلی">خانه</a>
                    <span>/</span>
                    <span aria-current="page">ویدیوها</span>
                </nav>
                {showUpsell && (
                    <div className={styles.upsellBanner} role="region" aria-label="ارتقای اشتراک">
                        <div className={styles.upsellContent}>
                            <h3 className={styles.upsellTitle}>{MOCK_USER.hasSubscription ? 'اشتراک شما رو به پایان است' : 'برای دسترسی کامل، اشتراک فعال کن'}</h3>
                            <p className={styles.upsellText}>
                                {MOCK_USER.hasSubscription ? `فقط ${daysLeft} روز تا پایان اشتراک باقی مانده. با تمدید، دسترسی ویدیوهای اشتراکی قطع نمی‌شود.` : 'با تهیه اشتراک به همه ویدیوهای اختصاصی و امکانات پیشرفته دسترسی خواهید داشت.'}
                            </p>
                        </div>
                        <div className={styles.upsellActions}>
                            <button className={styles.upsellBtn} onClick={() => alert('redirect to subscription flow')}> {MOCK_USER.hasSubscription ? 'تمدید اشتراک' : 'خرید اشتراک'} </button>
                            <button className={styles.dismissBtn} aria-label="بستن" onClick={()=>setDismissedUpsell(true)}>×</button>
                        </div>
                    </div>
                )}
                {showOffline && (
                    <div className={styles.offlineBanner} role="status" aria-live="polite">
                        <span><strong>آفلاین هستید.</strong> بعضی داده‌ها ممکن است به‌روزرسانی نشوند.</span>
                        <button onClick={()=>setDismissedOffline(true)} aria-label="بستن هشدار">×</button>
                    </div>
                )}
                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>ویدیوهای آموزشی</h1>
                    <p className={styles.pageSubtitle}>مفاهیم درسی را با تدریس بهترین اساتید به صورت ویدیویی بیاموزید.</p>
                </div>
                                <div className={styles.layoutShell}>
                                    <div className={styles.pageContainer}>
                                        <FilterSidebar
                                            isOpen={isFilterSidebarOpen}
                                            onClose={() => setFilterSidebarOpen(false)}
                                            gradesFilter={gradesFilter} setGradesFilter={setGradesFilter}
                                            chaptersFilter={chaptersFilter} setChaptersFilter={setChaptersFilter}
                                            accessFilter={accessFilter} setAccessFilter={setAccessFilter}
                                            favoritesOnly={favoritesOnly} setFavoritesOnly={setFavoritesOnly}
                                            returnFocusRef={filterTriggerRef}
                                            availableChapters={availableChapters}
                                        />
                                        <main className={styles.mainContent}>
                                            {/* Toolbar for small screens: trigger + search + sort */}
                                            <div className={styles.toolbarRow}>
                                                <input
                                                    className={styles.toolbarInput}
                                                    placeholder="جستجو در ویدیوها"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    aria-label="جستجو"
                                                />
                                                <select
                                                    className={styles.toolbarSelect}
                                                    value={sortOption}
                                                    onChange={(e) => setSortOption(e.target.value)}
                                                    aria-label="مرتب‌سازی"
                                                >
                                                    <option value="newest">جدیدترین</option>
                                                    <option value="popular">محبوب‌ترین</option>
                                                    <option value="duration">کوتاه‌ترین زمان</option>
                                                    <option value="longest">طولانی‌ترین زمان</option>
                                                </select>
                                                <button
                                                    ref={filterTriggerRef}
                                                    type="button"
                                                    className={styles.toolbarBtn}
                                                    onClick={() => setFilterSidebarOpen(true)}
                                                    aria-expanded={isFilterSidebarOpen}
                                                    aria-controls="videos-filters"
                                                >
                                                    <FilterIcon size={16} /> فیلترها
                                                </button>
                                            </div>
                                            {/* Active filter chips */}
                                            <div className={styles.activeFiltersChipsRow}>
                                                {(gradesFilter.length > 0 || chaptersFilter.length>0 || accessFilter !== 'all' || favoritesOnly || searchTerm || sortOption !== 'newest') && (
                                                    <>
                                                        <div className={styles.appliedFiltersHeader}>فیلترهای اعمال شده</div>
                                                        <div className={styles.chipsRow}>
                                                            {gradesFilter.map((g, idx) => (
                                                                <span key={`${g}-${idx}`} className={`${styles.chipBtn} ${styles.removableChip}`}>
                                                                    {g}
                                                                    <button aria-label="حذف فیلتر پایه" onClick={() => {
                                                                        setGradesFilter(prev => prev.filter((x,i)=> !(x===g && i===idx)));
                                                                        const next = new URLSearchParams(searchParams);
                                                                        const code = g === 'هفتم' ? '7' : g === 'هشتم' ? '8' : g === 'نهم' ? '9' : g;
                                                                        const all = next.getAll('grade');
                                                                        const remIdx = all.indexOf(code);
                                                                        next.delete('grade');
                                                                        all.filter((_,i)=>i!==remIdx).forEach(v=> next.append('grade', v));
                                                                        setSearchParams(next, { replace: true });
                                                                    }}>×</button>
                                                                </span>
                                                            ))}
                                                            {chaptersFilter.map(c => {
                                                                const mapKeyToFa = { '7':'هفتم','8':'هشتم','9':'نهم' };
                                                                const label = mapKeyToFa[c.grade] || c.grade;
                                                                return (
                                                                    <span key={`${c.grade}-${c.chapter}`} className={`${styles.chipBtn} ${styles.removableChip}`}>{label} • {c.chapter}
                                                                        <button aria-label="حذف فصل" onClick={() => setChaptersFilter(prev => prev.filter(x => !(x.grade===c.grade && x.chapter===c.chapter)))}>×</button>
                                                                    </span>
                                                                );
                                                            })}
                                                            {accessFilter !== 'all' && (
                                                                <span className={`${styles.chipBtn} ${styles.removableChip}`}>{accessFilter === 'free' ? 'رایگان' : 'اشتراکی'}<button aria-label="حذف فیلتر دسترسی" onClick={() => setAccessFilter('all')}>×</button></span>
                                                            )}
                                                            {favoritesOnly && (
                                                                <span className={`${styles.chipBtn} ${styles.removableChip}`}>لیست من<button aria-label="حذف فیلتر لیست من" onClick={() => setFavoritesOnly(false)}>×</button></span>
                                                            )}
                                                            {searchTerm && (
                                                                <span className={`${styles.chipBtn} ${styles.removableChip}`}>{searchTerm}<button aria-label="حذف جستجو" onClick={() => setSearchTerm('')}>×</button></span>
                                                            )}
                                                            {sortOption !== 'newest' && (
                                                                <span className={`${styles.chipBtn} ${styles.removableChip}`}>مرتب‌سازی: {sortOption}<button aria-label="بازنشانی مرتب‌سازی" onClick={() => setSortOption('newest')}>×</button></span>
                                                            )}
                                                            <button className={styles.clearBtn} onClick={() => { setGradesFilter([]); setChaptersFilter([]); setAccessFilter('all'); setFavoritesOnly(false); setSearchTerm(''); setSortOption('newest'); const next = new URLSearchParams(searchParams); ['grade','chapter'].forEach(k=>next.delete(k)); setSearchParams(next, { replace: true }); }}>حذف همه</button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                            <div className={styles.videoGrid}>
                        {loading && Array.from({length:8}).map((_,i)=>(<div key={i} className={styles.videoSkeleton} />))}
                        {!loading && error && (
                            <div style={{padding:'1.5rem', textAlign:'center'}}>
                                <div style={{marginBottom:'.75rem'}}>خطا در بارگذاری ویدیوها</div>
                                <button onClick={retryLoad} className={styles.retryBtn}>تلاش مجدد</button>
                            </div>
                        )}
                        {!loading && !error && visible.map(video => (
                            <VideoCard
                                key={video.id}
                                video={video}
                                user={MOCK_USER}
                                isFavorite={favorites.includes(video.id)}
                                onToggleFavorite={toggleFavorite}
                            />
                        ))}
                        {!loading && !error && visible.length === 0 && (
                            <div style={{padding:'1rem', textAlign:'center', opacity:.7}}>موردی یافت نشد.</div>
                        )}
                                            </div>
                                        </main>
                                    </div>
                                </div>
            </main>
        </>
    );
};

export default VideosPage;
