import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header/Header';
import FilterSidebar from '../components/Handouts/FilterSidebar';
import HandoutCard from '../components/Handouts/HandoutCard';
import HandoutPreviewModal from '../components/Handouts/HandoutPreviewModal';
import { Filter } from 'lucide-react';
import styles from '../components/Handouts/Handouts.module.css';
import { fetchHandouts, downloadHandout, trackHandoutView } from '../api/handoutService';

// Mock Data
const MOCK_HANDOUTS = [
    { id: 1, title: 'جزوه کامل فصل ۱ علوم هفتم', chapter: 'فصل ۱', grade: 'هفتم', teacher: 'استاد رضایی', pages: 25, isFree: true, subscriptionId: 'g7c1' },
    { id: 2, title: 'خلاصه نکات فصل ۲ علوم هفتم', chapter: 'فصل ۲', grade: 'هفتم', teacher: 'استاد محمدی', pages: 15, isFree: false, subscriptionId: 'g7c2' },
    { id: 3, title: 'جزوه فصل ۳ علوم هشتم', chapter: 'فصل ۳', grade: 'هشتم', teacher: 'استاد رضایی', pages: 30, isFree: false, subscriptionId: 'g8c3' },
    { id: 4, title: 'نکات کلیدی فصل ۱ علوم نهم', chapter: 'فصل ۱', grade: 'نهم', teacher: 'استاد احمدی', pages: 18, isFree: true, subscriptionId: 'g9c1' },
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
    subscribedItems: ['g7c2'] // User has bought access to the handout for grade 7, chapter 2
};

const parseChaptersFromParams = (sp) => {
    // chapter=7|فصل ۱ (repeatable)
    const entries = sp.getAll('chapter');
    const res = [];
    for (const val of entries) {
        const [g, ch] = String(val).split('|');
        if (g && ch) res.push({ grade: g, chapter: ch });
    }
    return res;
};

const HandoutsPage = () => {
    // Dark mode handled by global ThemeContext
    const [isFilterSidebarOpen, setFilterSidebarOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    // Multi-grade: grade param now can be comma separated (grade=7,8) for sharing
    const initialGradeRaw = searchParams.get('grade') || '';
    const initialGrades = initialGradeRaw.split(',').map(g => g.trim()).filter(g => ['7','8','9'].includes(g));
    const [gradeFilters, setGradeFilters] = useState(initialGrades);
    const [selectedChapters, setSelectedChapters] = useState(() => parseChaptersFromParams(searchParams));
    const [access, setAccess] = useState(() => {
        const acc = (searchParams.get('access') || '').split(',').filter(Boolean);
        return { free: acc.includes('free'), sub: acc.includes('sub') };
    });
    const [q, setQ] = useState(() => searchParams.get('q') || '');
    const [debouncedQ, setDebouncedQ] = useState(q);
    const [sort, setSort] = useState(() => searchParams.get('sort') || 'newest');

    // Keep URL in sync when filters change (and avoid loops by checking current values first)
    useEffect(() => {
        const next = new URLSearchParams(searchParams);
        // grades (multi)
        if (gradeFilters.length) next.set('grade', gradeFilters.join(',')); else next.delete('grade');
        // chapters
        next.delete('chapter');
        for (const ch of selectedChapters) {
            if (!ch || !ch.grade || !ch.chapter) continue;
            if (!gradeFilters.length || gradeFilters.includes(ch.grade)) {
                next.append('chapter', `${ch.grade}|${ch.chapter}`);
            }
        }
        // access
        const accVals = [access.free ? 'free' : null, access.sub ? 'sub' : null].filter(Boolean);
        if (accVals.length) next.set('access', accVals.join(',')); else next.delete('access');
        // q, sort
        if (q) next.set('q', q); else next.delete('q');
        if (sort && sort !== 'newest') next.set('sort', sort); else next.delete('sort');
        const changed = next.toString() !== searchParams.toString();
        if (changed) setSearchParams(next, { replace: true });
    }, [gradeFilters, selectedChapters, access, q, sort]);

    // Service-backed filtering + pagination
    const [page, setPage] = useState(() => parseInt(searchParams.get('page') || '1', 10));
    const [pageSize, setPageSize] = useState(() => parseInt(searchParams.get('pageSize') || '12', 10));
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    // Debounce q for 300ms to limit network calls
    useEffect(() => {
        const id = setTimeout(() => setDebouncedQ(q), 300);
        return () => clearTimeout(id);
    }, [q]);

    // Favorites state
    const [favorites, setFavorites] = useState(() => {
        try { return JSON.parse(localStorage.getItem('handout-favorites')||'[]'); } catch { return []; }
    });
    useEffect(() => { try { localStorage.setItem('handout-favorites', JSON.stringify(favorites)); } catch(_){} }, [favorites]);
    const toggleFavorite = useCallback(id => {
        setFavorites(list => list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
    }, []);

    // Study list
    const [studyList, setStudyList] = useState(() => {
        try { return JSON.parse(localStorage.getItem('handout-study-list')||'[]'); } catch { return []; }
    });
    useEffect(() => { try { localStorage.setItem('handout-study-list', JSON.stringify(studyList)); } catch(_){} }, [studyList]);
    const toggleInStudyList = useCallback(id => {
        setStudyList(list => list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
    }, []);

    // Preview modal
    const [previewHandout, setPreviewHandout] = useState(null);
    const previewModalRef = useRef(null);
    const previouslyFocusedElRef = useRef(null);
    const openPreview = useCallback(handout => {
        previouslyFocusedElRef.current = document.activeElement;
        trackHandoutView(handout.id);
        setPreviewHandout(handout);
    }, []);
    const closePreview = useCallback(() => {
        setPreviewHandout(null);
        setTimeout(() => {
            if (previouslyFocusedElRef.current && previouslyFocusedElRef.current.focus) {
                try { previouslyFocusedElRef.current.focus(); } catch(_){}
            }
        }, 0);
    }, []);


    useEffect(() => {
        const controller = new AbortController();
        (async () => {
            try {
                // تبدیل پارامترهای فیلتر به فرمت API جدید
                const params = {
                    page,
                    per_page: pageSize,
                    q: debouncedQ,
                    // TODO: grade و subject را از فیلترها استخراج کنید
                };
                
                const res = await fetchHandouts(params);
                
                // نرمال‌سازی داده‌ها
                const toFa = { '7': 'هفتم', '8': 'هشتم', '9': 'نهم' };
                const adapted = (res.data?.items || []).map(h => ({
                    ...h,
                    grade: toFa[String(h.grade)] || h.grade,
                    isFree: h.is_free === true || h.accessType === 'free',
                }));
                
                setItems(adapted);
                setTotal(res.data?.pagination?.total || 0);
            } catch (e) {
                if (e.name === 'CanceledError' || e.name === 'AbortError') return; // silenced
                console.error('Error fetching handouts:', e);
            }
        })();
        return () => controller.abort();
    }, [page, pageSize, gradeFilters, selectedChapters, access, debouncedQ, sort]);

    // Sync pagination to URL
    useEffect(() => {
        const next = new URLSearchParams(searchParams);
        if (page > 1) next.set('page', String(page)); else next.delete('page');
        if (![12,24,36].includes(pageSize)) next.set('pageSize', String(pageSize)); else next.delete('pageSize');
        const changed = next.toString() !== searchParams.toString();
        if (changed) setSearchParams(next, { replace: true });
    }, [page, pageSize]);
    // Reset page when filters change
    useEffect(() => { setPage(1); }, [gradeFilters.join(','), JSON.stringify(selectedChapters), access.free, access.sub, q, sort]);

    // Download handler for handout cards
    const handleDownloadHandout = async (id, title) => {
        try {
            await downloadHandout(id, title);
        } catch (error) {
            alert(error.message || 'خطا در دانلود جزوه');
        }
    };

    const filterTriggerRef = useRef(null);

    return (
        <>
            <Header />
            <div className="dashboard-container">
                <div className={styles.pageHeader}>
                    <h1>جزوه های درسی</h1>
                    <p>خلاصه دروس و نکات کلیدی را در قالب جزوات طبقه‌بندی شده دریافت کنید.</p>
                </div>
                <div className={styles.pageContainer}>
                    <FilterSidebar
                        isOpen={isFilterSidebarOpen}
                        onClose={() => setFilterSidebarOpen(false)}
                        grades={gradeFilters}
                        onGradesChange={(nextGrades) => {
                            setGradeFilters(nextGrades);
                            // prune chapters not in selected grades
                            setSelectedChapters(prev => prev.filter(c => nextGrades.includes(c.grade)));
                        }}
                        chapters={selectedChapters}
                        access={access}
                        returnFocusRef={filterTriggerRef}
                        onChaptersChange={setSelectedChapters}
                        onAccessChange={setAccess}
                    />
                    <main className={styles.mainContent}>
                        {/* Toolbar: search + sort */}
                        <div className={styles.toolbarRow}>
                            <input
                                className={styles.toolbarInput}
                                placeholder="جستجو در جزوه‌ها (عنوان، مدرس، فصل)"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                aria-label="جستجو"
                            />
                            <select
                                className={styles.toolbarSelect}
                                value={sort}
                                onChange={(e) => setSort(e.target.value)}
                                aria-label="مرتب‌سازی"
                            >
                                <option value="newest">جدیدترین</option>
                                <option value="pages-asc">کم‌حجم‌ترین</option>
                                <option value="pages-desc">پر‌حجم‌ترین</option>
                            </select>
                            <button
                                ref={filterTriggerRef}
                                type="button"
                                className={styles.toolbarBtn}
                                onClick={() => setFilterSidebarOpen(true)}
                                aria-expanded={isFilterSidebarOpen}
                                aria-controls="handouts-filters"
                            >
                                <Filter size={16} /> فیلترها
                            </button>
                        </div>
                        {/* Active filter chips */}
                        {(gradeFilters.length || selectedChapters.length || access.free || access.sub) && (
                            <div className={styles.activeFiltersChipsRow}>
                                <div className={styles.appliedFiltersHeader}>فیلترهای اعمال شده</div>
                                <div className={styles.chipsRow}>
                                    {gradeFilters.map(g => (
                                        <span key={g} className={`${styles.chipBtn} ${styles.removableChip}`}>
                                            {g === '7' ? 'هفتم' : g === '8' ? 'هشتم' : g === '9' ? 'نهم' : g}
                                            <button aria-label="حذف فیلتر پایه" onClick={() => {
                                                setGradeFilters(prev => prev.filter(x => x !== g));
                                            }}>×</button>
                                        </span>
                                    ))}
                                    {selectedChapters.map((c, idx) => (
                                        <span key={`${c.grade}|${c.chapter}|${idx}`} className={`${styles.chipBtn} ${styles.removableChip}`}>
                                            {`پایه ${c.grade} • ${c.chapter}`}
                                            <button aria-label="حذف فیلتر فصل" onClick={() => {
                                                setSelectedChapters(prev => prev.filter(x => !(x.grade === c.grade && x.chapter === c.chapter)));
                                            }}>×</button>
                                        </span>
                                    ))}
                                    {(access.free || access.sub) && (
                                        <span className={`${styles.chipBtn} ${styles.removableChip}`}>
                                            {access.free && access.sub ? 'رایگان + اشتراکی' : access.free ? 'فقط رایگان' : 'نیاز به اشتراک'}
                                            <button aria-label="حذف فیلتر دسترسی" onClick={() => setAccess({ free: false, sub: false })}>×</button>
                                        </span>
                                    )}
                                    <button className={styles.clearBtn} onClick={() => {
                                        setGradeFilters([]);
                                        setSelectedChapters([]);
                                        setAccess({ free: false, sub: false });
                                        setQ('');
                                        setSort('newest');
                                        const next = new URLSearchParams(searchParams);
                                        ['grade', 'chapter', 'access', 'q', 'sort', 'page', 'pageSize'].forEach(k => next.delete(k));
                                        setSearchParams(next, { replace: true });
                                    }}>حذف همه</button>
                                </div>
                            </div>
                        )}
                        <div className={styles.handoutsGrid}>
                            {items.map(handout => (
                                <HandoutCard 
                                    key={handout.id} 
                                    handout={handout} 
                                    user={MOCK_USER}
                                    onDownload={handleDownloadHandout}
                                    onPreview={openPreview}
                                    onToggleFavorite={toggleFavorite}
                                    isFavorite={favorites.includes(handout.id)}
                                    inStudyList={studyList.includes(handout.id)}
                                    onToggleStudy={toggleInStudyList}
                                />
                            ))}
                        </div>
                        <div className={styles.toolbarRow} style={{ justifyContent: 'space-between', marginTop: '1rem' }}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>
                                {total.toLocaleString()} نتیجه
                            </div>
                            <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                                <button className={styles.chipBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} aria-label="صفحه قبل">قبلی</button>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>{page} / {totalPages}</span>
                                <button className={styles.chipBtn} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} aria-label="صفحه بعد">بعدی</button>
                                <select className={styles.toolbarSelect} value={pageSize} onChange={e => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }} aria-label="تعداد در هر صفحه">
                                    {[12, 24, 36].map(n => <option key={n} value={n}>{n} در صفحه</option>)}
                                </select>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
            
            <HandoutPreviewModal
                handout={previewHandout}
                close={closePreview}
                currentUser={MOCK_USER}
                onDownload={handleDownloadHandout}
                previewModalRef={previewModalRef}
            />
        </>
    );
};

export default HandoutsPage;
