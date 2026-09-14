import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Funnel as FilterIcon } from 'lucide-react';

import Header from '../components/Header/Header';
import styles from '../components/SampleQuestions/SampleQuestions.module.css';
import { useSampleQuestionsData } from '../components/SampleQuestions/useSampleQuestionsData';
import FilterSidebar from '../components/SampleQuestions/FilterSidebar';
import PdfGrid from '../components/SampleQuestions/PdfGrid';
import ErrorBoundary from '../components/SampleQuestions/ErrorBoundary';
import PreviewModal from '../components/SampleQuestions/PreviewModal';
import Breadcrumb from '../components/SampleQuestions/Breadcrumb';

// Mock Data (local to page; could be fetched or moved to separate fixture)
const now = Date.now();
const day = 24*60*60*1000;
// Base mock list (will be simulated as async fetch)
const MOCK_PDFS = [
    { id: 1, title: 'آزمون نوبت اول ریاضی هفتم', subject: 'ریاضی', grade: 'هفتم', pages: 4,  isFree: true,  tokenCost: null, description: 'مناسب برای مرور نیمسال اول و آمادگی آزمون میان‌ترم.', samplePages: ['p1','p2'], tags:['آزمون','نیمسال'], updatedAt: now - day*2,  viewCount: 120 },
    { id: 2, title: 'نمونه سوالات فصل ۱ تا ۳ علوم', subject: 'علوم', grade: 'هفتم', pages: 8,  isFree: true,  tokenCost: null, description: 'پوشش مروری فصل‌های ۱ تا ۳ علوم تجربی همراه با پاسخ کلیدی.', samplePages: ['p1','p2','p3'], tags:['فصل ۱','فصل ۲','فصل ۳'], updatedAt: now - day*5,  viewCount: 310 },
    { id: 3, title: 'آزمون جامع تیزهوشان', subject: 'جامع', grade: 'هشتم', pages: 12, isFree: false, tokenCost: 15, description: 'آزمون ترکیبی سطح بالای تیزهوشان با سوالات چالشی.', samplePages: ['p1','p2','p3'], tags:['تیزهوشان','جامع'], updatedAt: now - day*1,  viewCount: 980 },
    { id: 4, title: 'سوالات المپیاد شیمی', subject: 'شیمی', grade: 'نهم', pages: 15, isFree: false, tokenCost: 20, description: 'گزیده‌ای از سوالات منتخب المپیاد مرحله اول شیمی.', samplePages: ['p1','p2'], tags:['المپیاد'], updatedAt: now - day*12, viewCount: 450 },
    { id: 5, title: 'نمونه سوالات امتحانی فارسی', subject: 'فارسی', grade: 'هفتم', pages: 5,  isFree: true,  tokenCost: null, description: 'سوالات پرتکرار امتحان فارسی با پاسخ کوتاه.', samplePages: ['p1'], tags:['امتحانی'], updatedAt: now - day*3,  viewCount: 220 },
    { id: 6, title: 'پکیج کامل سوالات نهایی', subject: 'جامع', grade: 'نهم', pages: 50, isFree: false, tokenCost: 30, description: 'مجموعه کامل سوالات نهایی سال‌های اخیر برای جمع‌بندی.', samplePages: ['p1','p2','p3','p4'], tags:['نهایی','جامع'], updatedAt: now - day*7,  viewCount: 720 },
];

const MOCK_USERS = {
    guest: { role: 'guest' },
    student_free: { role: 'student', name: 'دانش‌آموز', avatar: 'https://i.pravatar.cc/40?u=student', hasSubscription: false }, 
    student_paid: { role: 'student', name: 'دانش‌آموز ویژه', avatar: 'https://i.pravatar.cc/40?u=student', hasSubscription: true, subscriptionExpiry: Date.now() + 30 * 24 * 60 * 60 * 1000, tokenCount: 120 }, // 30 days from now
};

const SampleQuestionsPage = () => {
    // Dark mode handled globally by ThemeContext
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const filterBtnRef = React.useRef(null);
    const [currentUser] = useState(MOCK_USERS.student_paid); // static user (could be dynamic)

    const [searchParams, setSearchParams] = useSearchParams();
    
    // Pagination state
    const [page, setPage] = useState(() => parseInt(searchParams.get('page') || '1', 10));
    const [pageSize, setPageSize] = useState(() => parseInt(searchParams.get('pageSize') || '12', 10));

    const {
        loading, error, retryLoad,
        subjectFilter, setSubjectFilter,
    gradesFilter, setGradesFilter,
    chaptersFilter, setChaptersFilter,
        accessFilter, setAccessFilter,
        searchTerm, setSearchTerm,
        favoritesOnly, setFavoritesOnly,
        sortOption, setSortOption,
        subjects, grades,
        favorites, toggleFavorite,
        studyList, toggleInStudyList,
        ratings, ratePdf,
        registerDownload,
        visible, canLoadMore, loadMore,
        previewPdf, openPreview, closePreview, previewModalRef,
        total,
    } = useSampleQuestionsData(MOCK_PDFS, page, pageSize);
    
    // Prefill from URL (multi-grades & chapters) - only run ONCE on mount
    const initializedRef = useRef(false);
    useEffect(() => {
        if (initializedRef.current) return; // prevent re-running
        initializedRef.current = true;
        
        const gradeVals = searchParams.getAll('grade');
        const single = searchParams.get('grade');
        let rawGrades = gradeVals.length > 0 ? gradeVals : (single ? [single] : []);
        const mapNumToFa = { '7':'هفتم','8':'هشتم','9':'نهم' };
        const mapped = rawGrades.map(g => mapNumToFa[g] || g).filter(Boolean);
        if (mapped.length) setGradesFilter(mapped);
        const s = searchParams.get('subject');
        if (s) setSubjectFilter(s);
        const chapterParams = searchParams.getAll('chapter'); // format gradeKey|فصل X
        if (chapterParams.length) {
            const chs = chapterParams.map(cp => {
                const [gKey, ...rest] = cp.split('|');
                const chapter = rest.join('|');
                if (!gKey || !chapter) return null;
                if (!['7','8','9'].includes(gKey)) return null;
                return { grade: gKey, chapter };
            }).filter(Boolean);
            if (chs.length) setChaptersFilter(chs);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync URL when filters change
    useEffect(() => {
        const next = new URLSearchParams(searchParams);
        // wipe previous grade & chapter params
        ['grade','chapter'].forEach(k => {
            // URLSearchParams delete removes all instances
            next.delete(k);
        });
        const mapFaToNum = { 'هفتم':'7','هشتم':'8','نهم':'9' };
        if (gradesFilter.length) {
            gradesFilter.forEach(g => { const num = mapFaToNum[g] || g; next.append('grade', num); });
        }
        if (chaptersFilter.length) {
            chaptersFilter.forEach(c => { next.append('chapter', `${c.grade}|${c.chapter}`); });
        }
        if (subjectFilter && subjectFilter !== 'همه') next.set('subject', subjectFilter); else next.delete('subject');
        setSearchParams(next, { replace: true });
    }, [gradesFilter, chaptersFilter, subjectFilter, setSearchParams]);

    // Sync pagination to URL
    useEffect(() => {
        const next = new URLSearchParams(searchParams);
        if (page > 1) next.set('page', String(page)); else next.delete('page');
        if (![12,24,36].includes(pageSize)) next.set('pageSize', String(pageSize)); else next.delete('pageSize');
        const changed = next.toString() !== searchParams.toString();
        if (changed) setSearchParams(next, { replace: true });
    }, [page, pageSize, searchParams, setSearchParams]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [gradesFilter.join(','), JSON.stringify(chaptersFilter), subjectFilter, accessFilter, searchTerm, sortOption, favoritesOnly]);

    const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

    // Auto-close mobile filter overlay when resizing to desktop width (parity with VideosPage)
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1040 && mobileFiltersOpen) {
                setMobileFiltersOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [mobileFiltersOpen]);

    return (
        <>
            <Header />
            <Breadcrumb subjectFilter={subjectFilter} gradesFilter={gradesFilter} />
            <main>
                <ErrorBoundary>
                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>نمونه سوالات امتحانی</h1>
                    <p className={styles.pageSubtitle}>مجموعه‌ای از آزمون‌ها و نمونه سوالات طبقه‌بندی شده برای آمادگی هرچه بیشتر شما.</p>
                </div>
                {!currentUser.hasSubscription && (
                    <div className={styles.upsellBanner} role="note">
                        <div className={styles.upsellContent}>
                            <strong>دسترسی کامل به منابع پریمیوم</strong>
                            <span>با اشتراک ویژه، فایل‌های قفل شده را باز کنید و به محتوای بیشتر دسترسی داشته باشید.</span>
                        </div>
                        <button className={styles.upsellBtn}>ارتقا به اشتراک</button>
                    </div>
                )}

                <div className={styles.layoutShell}>
                    <div className={styles.pageContainer}>
                        <FilterSidebar
                            isOpen={mobileFiltersOpen}
                            onClose={() => setMobileFiltersOpen(false)}
                            subjectFilter={subjectFilter}
                            setSubjectFilter={setSubjectFilter}
                            gradesFilter={gradesFilter}
                            setGradesFilter={setGradesFilter}
                            chaptersFilter={chaptersFilter}
                            setChaptersFilter={setChaptersFilter}
                            accessFilter={accessFilter}
                            setAccessFilter={setAccessFilter}
                            favoritesOnly={favoritesOnly}
                            setFavoritesOnly={setFavoritesOnly}
                            subjects={subjects}
                            returnFocusRef={filterBtnRef}
                        />

                        <section className={styles.gridArea}>
                            {/* In-content toolbar: search, sort, small-screen filter trigger */}
                            <div className={styles.toolbarRowInContent}>
                                <input
                                    className={styles.toolbarInput}
                                    type="text"
                                    placeholder="جستجو: عنوان یا برچسب..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                <select
                                    className={styles.toolbarSelect}
                                    value={sortOption}
                                    onChange={e => setSortOption(e.target.value)}
                                    aria-label="مرتب‌سازی"
                                >
                                    <option value="newest">جدیدترین</option>
                                    <option value="mostViewed">پربازدید</option>
                                    <option value="pagesDesc">بیشترین صفحات</option>
                                    <option value="pagesAsc">کمترین صفحات</option>
                                    <option value="titleAz">مرتب‌سازی عنوان</option>
                                </select>
                                <button
                                    ref={filterBtnRef}
                                    className={styles.toolbarBtn}
                                    onClick={() => setMobileFiltersOpen(true)}
                                    aria-label="نمایش فیلترها"
                                    aria-controls="samplequestions-filters"
                                    aria-expanded={mobileFiltersOpen}
                                >
                                    <FilterIcon size={18} strokeWidth={2} />
                                    فیلترها
                                </button>
                            </div>

                            {/* Active filter chips within content column */}
                            <div className={styles.contentChipsWrap}>
                                {(subjectFilter !== 'همه' || gradesFilter.length > 0 || chaptersFilter.length>0 || accessFilter !== 'all' || favoritesOnly || searchTerm || sortOption !== 'newest') && (
                                    <>
                                        <div className={styles.appliedFiltersHeader}>فیلترهای اعمال شده</div>
                                        <div className={styles.chipsRow}>
                                            {subjectFilter !== 'همه' && (
                                                <span className={`${styles.chipBtn} ${styles.removableChip}`}>{subjectFilter}
                                                    <button aria-label="حذف فیلتر درس" onClick={() => { setSubjectFilter('همه'); const next = new URLSearchParams(searchParams); next.delete('subject'); setSearchParams(next, { replace: true }); }}>×</button>
                                                </span>
                                            )}
                                            {gradesFilter.map(g => (
                                                <span key={g} className={`${styles.chipBtn} ${styles.removableChip}`}>{g}
                                                    <button aria-label={`حذف پایه ${g}`} onClick={() => setGradesFilter(prev => prev.filter(x => x!==g))}>×</button>
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
                                                <span className={`${styles.chipBtn} ${styles.removableChip}`}>{accessFilter === 'free' ? 'رایگان' : 'اشتراکی'}
                                                    <button aria-label="حذف فیلتر دسترسی" onClick={() => setAccessFilter('all')}>×</button>
                                                </span>
                                            )}
                                            {favoritesOnly && (
                                                <span className={`${styles.chipBtn} ${styles.removableChip}`}>لیست من
                                                    <button aria-label="حذف فیلتر لیست من" onClick={() => setFavoritesOnly(false)}>×</button>
                                                </span>
                                            )}
                                            {searchTerm && (
                                                <span className={`${styles.chipBtn} ${styles.removableChip}`}>{searchTerm}
                                                    <button aria-label="حذف جستجو" onClick={() => setSearchTerm('')}>×</button>
                                                </span>
                                            )}
                                            {sortOption !== 'newest' && (
                                                <span className={`${styles.chipBtn} ${styles.removableChip}`}>مرتب‌سازی: {sortOption}
                                                    <button aria-label="بازنشانی مرتب‌سازی" onClick={() => setSortOption('newest')}>×</button>
                                                </span>
                                            )}
                                            <button className={styles.clearBtn} onClick={() => { setSubjectFilter('همه'); setGradesFilter([]); setChaptersFilter([]); setAccessFilter('all'); setFavoritesOnly(false); setSearchTerm(''); setSortOption('newest'); }}>حذف همه</button>
                                        </div>
                                    </>
                                )}
                            </div>

                            <PdfGrid
                                visible={visible}
                                loading={loading}
                                error={error}
                                retryLoad={retryLoad}
                                pageSize={pageSize}
                                canLoadMore={false}
                                loadMore={() => {}}
                                currentUser={currentUser}
                                toggleFavorite={toggleFavorite}
                                favorites={favorites}
                                studyList={studyList}
                                toggleInStudyList={toggleInStudyList}
                                registerDownload={registerDownload}
                                ratings={ratings}
                                ratePdf={ratePdf}
                                openPreview={openPreview}
                            />
                            
                            {/* Page-based pagination (like handouts) */}
                            <div className={styles.toolbarRow} style={{ justifyContent: 'space-between', marginTop: '1rem' }}>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>
                                    {(total || 0).toLocaleString('fa-IR')} نتیجه
                                </div>
                                <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                                    <button 
                                        className={styles.chipBtn} 
                                        onClick={() => setPage(p => Math.max(1, p - 1))} 
                                        disabled={page <= 1} 
                                        aria-label="صفحه قبل"
                                    >
                                        قبلی
                                    </button>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>
                                        {page.toLocaleString('fa-IR')} / {totalPages.toLocaleString('fa-IR')}
                                    </span>
                                    <button 
                                        className={styles.chipBtn} 
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                                        disabled={page >= totalPages} 
                                        aria-label="صفحه بعد"
                                    >
                                        بعدی
                                    </button>
                                    <select 
                                        className={styles.toolbarSelect} 
                                        value={pageSize} 
                                        onChange={e => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }} 
                                        aria-label="تعداد در هر صفحه"
                                    >
                                        {[12, 24, 36].map(n => <option key={n} value={n}>{n.toLocaleString('fa-IR')} در صفحه</option>)}
                                    </select>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
                </ErrorBoundary>
            </main>
            <PreviewModal
                pdf={previewPdf}
                close={closePreview}
                currentUser={currentUser}
                ratings={ratings}
                ratePdf={ratePdf}
                previewModalRef={previewModalRef}
                onDownload={registerDownload}
            />
        </>
    );
};

export default SampleQuestionsPage;
