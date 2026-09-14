import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header/Header';
import FilterSidebar from '../components/QuestionBank/FilterSidebar';
import QuestionCard from '../components/QuestionBank/QuestionCard';
import ReportDrawer from '../components/QuestionBank/ReportDrawer';
import { Filter } from 'lucide-react';
import styles from '../components/QuestionBank/QuestionBank.module.css';
import { fetchQuestionsAdvanced } from '../api/questionService';

// Data now fetched from questionService (mock-backed for now)
const MOCK_USER = { role: 'student', name: 'دانش‌آموز', avatar: 'https://i.pravatar.cc/40?u=student', hasSubscription: false, tokenCount: 120 };

const QuestionBankPage = () => {
    // Dark mode controlled globally
    const [isReportDrawerOpen, setReportDrawerOpen] = useState(false);
    const [isFilterSidebarOpen, setFilterSidebarOpen] = useState(false);
    const filterTriggerRef = useRef(null);
    const [questions, setQuestions] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const filterSidebarRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeFilters, setActiveFilters] = useState({ grades: [], chapters: [], difficulties: [], types: [] });
    const lastFiltersRef = useRef(activeFilters);
    // const [visibleCount, setVisibleCount] = useState(20);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('newest'); // newest | oldest | popular | easy-first | hard-first

    const handleFiltersChange = useCallback((next) => {
        if (!next) return;
        const prev = lastFiltersRef.current;
        const same = prev && JSON.stringify(prev) === JSON.stringify(next);
        if (!same) {
            lastFiltersRef.current = next;
            setActiveFilters(next);
        }
    }, []);

    // Initialize page & pageSize from URL
    const [searchParams, setSearchParams] = useSearchParams();
    useEffect(() => {
        const p = parseInt(searchParams.get('page') || '1', 10);
        const ps = parseInt(searchParams.get('pageSize') || '20', 10);
        if (!isNaN(p) && p > 0) setPage(p);
        if (!isNaN(ps) && ps > 0 && ps <= 100) setPageSize(ps);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // URL query params prefill: grade, subject (subject -> difficulty or chapter not directly used; keeping for future)
    // const [searchParams, setSearchParams] = useSearchParams();
    // Prefill from URL: multiple grades, difficulties, chapters with ranges
    useEffect(() => {
        const gradesMulti = searchParams.getAll('grade');
        const gradesSingle = searchParams.get('grade');
        let grades = gradesMulti.length ? gradesMulti : (gradesSingle ? gradesSingle.split(',') : []);
        grades = grades.map(String).filter(g => ['7','8','9'].includes(g));

        const diffsMulti = searchParams.getAll('difficulty');
        const diffsSingle = searchParams.get('difficulty');
        let diffs = diffsMulti.length ? diffsMulti : (diffsSingle ? diffsSingle.split(',') : []);
        const allowedDiffs = ['ساده','متوسط','سخت'];
        diffs = diffs.filter(d => allowedDiffs.includes(d));

        const chapterParams = searchParams.getAll('chapter');
        const chapterSingle = searchParams.get('chapter');
        const chaptersRaw = chapterParams.length ? chapterParams : (chapterSingle ? chapterSingle.split(',') : []);
        const chapters = [];
        chaptersRaw.forEach(raw => {
            // format: gradeKey|chapterName|min-max
            const part = String(raw);
            const segs = part.split('|');
            if (segs.length >= 2) {
                const g = segs[0];
                const nameAndRange = segs.slice(1).join('|');
                // name can contain '|', so split last '-' only for range if present at end
                let name = nameAndRange;
                let range = null;
                const dashIdx = nameAndRange.lastIndexOf('|');
                // If there are extra pipes, above join retains them; we'll try another approach:
                const parts2 = nameAndRange.split('|');
                if (parts2.length >= 2) {
                    // Expect last part like "min-max"
                    const maybeRange = parts2[parts2.length - 1];
                    const mm = maybeRange.split('-');
                    if (mm.length === 2 && !isNaN(parseInt(mm[0],10)) && !isNaN(parseInt(mm[1],10))) {
                        name = parts2.slice(0, -1).join('|');
                        range = [parseInt(mm[0],10), parseInt(mm[1],10)];
                    }
                }
                if (!range) {
                    // try split by '-' from end
                    const idx = name.lastIndexOf('-');
                    if (idx > -1) {
                        const a = name.substring(idx+1).trim();
                        const b = name.substring(0, idx).trim();
                        const mm = b.split('-');
                        if (mm.length === 2 && !isNaN(parseInt(mm[0],10)) && !isNaN(parseInt(mm[1],10))) {
                            range = [parseInt(mm[0],10), parseInt(mm[1],10)];
                            name = a;
                        }
                    }
                }
                chapters.push({ gradeKey: g, chapter: decodeURIComponent(name), range: range || undefined });
            }
        });

    if (grades.length) filterSidebarRef.current?.setGrades(grades);
    if (diffs.length) filterSidebarRef.current?.setDifficulties(diffs);
    if (chapters.length) filterSidebarRef.current?.setChapters(chapters);
    // Types from URL
    const typesMulti = searchParams.getAll('type');
    const typesSingle = searchParams.get('type');
    let types = typesMulti.length ? typesMulti : (typesSingle ? typesSingle.split(',') : []);
    const allowedTypes = ['test','truefalse','fillblank','short','long','matching'];
    types = types.filter(t => allowedTypes.includes(t));
    if (types.length) filterSidebarRef.current?.setTypes(types);

        // Search and sort
        const q = searchParams.get('q') || '';
        const sort = searchParams.get('sort') || 'newest';
    if (q) setSearchTerm(q);
    if (sort) setSortOption(sort);
    // Do not auto-open the sidebar when filters are prefilled from URL; keep it closed by default
        // Do not clear params here; chips/URL sync will manage
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Real-time filtering: no debounce

    const toLatinDigits = (str='') => str.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
    // With server-like fetch, questions are already filtered/sorted/paginated
    const filteredQuestions = useMemo(() => questions, [questions]);

    // Fetch questions on dependency changes
    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError(null);
        fetchQuestionsAdvanced({
            page,
            pageSize,
            grades: activeFilters.grades,
            difficulties: activeFilters.difficulties,
            types: activeFilters.types,
            chapters: activeFilters.chapters,
            q: searchTerm,
            sort: sortOption,
        }).then(res => {
            if (!alive) return;
            setQuestions(res.items);
            setTotal(res.total);
            setLoading(false);
        }).catch(err => {
            if (!alive) return;
            setError(err.message || 'خطا در بارگذاری');
            setLoading(false);
        });
        return () => { alive = false; };
    }, [page, pageSize, activeFilters, searchTerm, sortOption]);
    // Build removable chips for active grade filters and sync to URL when clearing prefilled grade
    const appliedChips = useMemo(() => {
        const chips = [];
        const gradeTitles = { '7': 'هفتم', '8': 'هشتم', '9': 'نهم' };
        if (activeFilters?.grades?.length) {
            activeFilters.grades.forEach(g => {
                chips.push({
                    id: `grade-${g}`,
                    label: `پایه: ${gradeTitles[g] || g}`,
                    onRemove: () => {
                        filterSidebarRef.current?.removeGrade(g);
                    }
                });
            });
        }
        if (activeFilters?.difficulties?.length) {
            activeFilters.difficulties.forEach(d => {
                chips.push({
                    id: `diff-${d}`,
                    label: `سختی: ${d}`,
                    onRemove: () => {
                        const remain = activeFilters.difficulties.filter(x => x !== d);
                        filterSidebarRef.current?.setDifficulties(remain);
                    }
                });
            });
        }
        if (activeFilters?.chapters?.length) {
            activeFilters.chapters.forEach(ch => {
                const [min,max] = Array.isArray(ch.range) ? ch.range : [undefined, undefined];
                const title = `پایه: ${gradeTitles[ch.gradeKey] || ch.gradeKey} | ${ch.chapter}${(min&&max)?` | صفحات: ${min}–${max}`:''}`;
                chips.push({
                    id: `ch-${ch.id}`,
                    label: title,
                    onRemove: () => filterSidebarRef.current?.removeChapter(ch.id)
                });
            });
        }
        if (activeFilters?.types?.length) {
            const map = { test:'چهارگزینه‌ای', truefalse:'درست/نادرست', fillblank:'جاهای خالی', short:'پاسخ کوتاه', long:'پاسخ بلند', matching:'وصل‌کردنی' };
            activeFilters.types.forEach(t => {
                chips.push({
                    id: `type-${t}`,
                    label: `نوع: ${map[t] || t}`,
                    onRemove: () => {
                        const remain = activeFilters.types.filter(x => x !== t);
                        filterSidebarRef.current?.setTypes(remain);
                    }
                });
            });
        }
        return chips;
    }, [activeFilters]);

    // NOTE: URL sync disabled to prevent unnecessary URL changes when filters are selected
    // Filters are now only stored in component state, not in URL
    // If you want shareable filter URLs, uncomment this useEffect
    /*
    useEffect(() => {
        const next = new URLSearchParams(searchParams);
        // grades
        next.delete('grade');
        (activeFilters.grades || []).forEach(g => next.append('grade', String(g)));
        if ((activeFilters.grades || []).length === 0) next.delete('grade');
        // difficulties
        next.delete('difficulty');
        (activeFilters.difficulties || []).forEach(d => next.append('difficulty', d));
        if ((activeFilters.difficulties || []).length === 0) next.delete('difficulty');
        // chapters
        next.delete('chapter');
        (activeFilters.chapters || []).forEach(ch => {
            const [min,max] = Array.isArray(ch.range) ? ch.range : [];
            const v = `${ch.gradeKey}|${ch.chapter}${(min!=null&&max!=null)?`|${min}-${max}`:''}`;
            next.append('chapter', v);
        });
        if ((activeFilters.chapters || []).length === 0) next.delete('chapter');
    // search & sort
        if (searchTerm) next.set('q', searchTerm); else next.delete('q');
        if (sortOption && sortOption !== 'newest') next.set('sort', sortOption); else next.delete('sort');
    // types
    next.delete('type');
    (activeFilters.types || []).forEach(t => next.append('type', t));
    if ((activeFilters.types || []).length === 0) next.delete('type');
        // page & pageSize
        next.set('page', String(page));
        next.set('pageSize', String(pageSize));
        setSearchParams(next, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeFilters, searchTerm, sortOption, page, pageSize]);
    */

    // Reset to first page when filters/search/sort change
    useEffect(() => { setPage(1); }, [activeFilters, searchTerm, sortOption]);

    return (
        <>
            <Header />
            <div className="dashboard-container">
                <div className={styles.pageHeader}>
                    <h1>بانک سوالات علوم تجربی</h1>
                    <p>سوالات مورد نظر خود را پیدا کرده و دانش خود را بسنجید.</p>
                </div>
                <div className={styles.pageContainer}>
                    <FilterSidebar
                        ref={filterSidebarRef}
                        isOpen={isFilterSidebarOpen}
                        onClose={() => setFilterSidebarOpen(false)}
                        onFiltersChange={handleFiltersChange}
                        returnFocusRef={filterTriggerRef}
                        id="questions-filters"
                    />
                    <main className={styles.mainContent}>
                        {/* Applied filter chips (grade at minimum) */}
                       
                        {/* Search + Sort controls */}
                        <div className={styles.toolbarRow}>
                            <input
                                type="search"
                                className={styles.toolbarInput}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="جستجو در متن سوال/منبع..."
                                aria-label="جستجو"
                            />
                            <select
                                className={styles.toolbarSelect}
                                value={sortOption}
                                onChange={e => setSortOption(e.target.value)}
                                aria-label="مرتب‌سازی"
                            >
                                <option value="newest">جدیدترین</option>
                                <option value="oldest">قدیمی‌ترین</option>
                                <option value="popular">محبوب‌ترین</option>
                                <option value="easy-first">ساده‌تر اول</option>
                                <option value="hard-first">سخت‌تر اول</option>
                            </select>
                            <button
                                ref={filterTriggerRef}
                                type="button"
                                className={styles.toolbarBtn}
                                onClick={() => setFilterSidebarOpen(true)}
                                aria-expanded={isFilterSidebarOpen}
                                aria-controls="questions-filters"
                            >
                                <Filter size={16} /> فیلترها
                            </button>
                        </div>
                         {(appliedChips.length > 0 || searchTerm || (sortOption && sortOption !== 'newest')) && (
                            <div className={styles.activeFiltersChipsRow} style={{marginTop: '-.25rem'}}>
                                <div className={styles.appliedFiltersHeader}>فیلترهای اعمال شده</div>
                                <div className={styles.chipsRow}>
                                    {appliedChips.map(ch => (
                                        <span key={ch.id} className={`${styles.chipBtn} ${styles.removableChip}`}>
                                            {ch.label}
                                            <button aria-label="حذف فیلتر" onClick={ch.onRemove}>×</button>
                                        </span>
                                    ))}
                                    {searchTerm && (
                                        <span className={`${styles.chipBtn} ${styles.removableChip}`}>
                                            جستجو: {searchTerm}
                                            <button aria-label="حذف جستجو" onClick={() => setSearchTerm('')}>×</button>
                                        </span>
                                    )}
                                    {sortOption && sortOption !== 'newest' && (
                                        <span className={`${styles.chipBtn} ${styles.removableChip}`}>
                                            مرتب‌سازی: {({
                                                'newest':'جدیدترین', 'oldest':'قدیمی‌ترین', 'popular':'محبوب‌ترین', 'easy-first':'ساده‌تر اول', 'hard-first':'سخت‌تر اول'
                                            })[sortOption]}
                                            <button aria-label="بازنشانی مرتب‌سازی" onClick={() => setSortOption('newest')}>×</button>
                                        </span>
                                    )}
                                    <button
                                        className={styles.clearBtn}
                                        onClick={() => {
                                            filterSidebarRef.current?.clearAll();
                                            const next = new URLSearchParams(searchParams);
                                            next.delete('grade');
                                            next.delete('difficulty');
                                            next.delete('chapter');
                                            next.delete('subject');
                                            next.delete('q');
                                            next.delete('sort');
                                            next.delete('type');
                                            setSearchParams(next, { replace: true });
                                            setSearchTerm('');
                                            setSortOption('newest');
                                        }}
                                    >حذف همه</button>
                                </div>
                            </div>
                        )}
                        <div className={styles.questionList}>
                            {loading && <div style={{padding:'1rem', textAlign:'center'}}>در حال بارگذاری...</div>}
                            {error && !loading && <div style={{padding:'1rem', color:'var(--danger-color)'}}>خطا: {error}</div>}
                            {!loading && !error && filteredQuestions.map(q => (
                                <QuestionCard
                                    key={q.id}
                                    question={q}
                                    onReferenceClick={(tag) => {
                                        if (tag.grade) {
                                            // Normalize ASCII digits if needed
                                            const asciiGrade = tag.grade.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
                                            filterSidebarRef.current?.setGrade(asciiGrade);
                                        }
                                        if (tag.chapter) {
                                            // Ensure sidebar open for visual feedback
                                            setFilterSidebarOpen(true);
                                            // Add chapter after a microtask so grade state applies
                                            setTimeout(()=>{
                                                const currentGrade = (tag.grade || '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
                                                filterSidebarRef.current?.addChapter(currentGrade, tag.chapter);
                                            },0);
                                        } else {
                                            setFilterSidebarOpen(true);
                                        }
                                    }}
                                    onReportClick={() => setReportDrawerOpen(true)}
                                />
                            ))}
                            {!loading && !error && filteredQuestions.length === 0 && (
                                <div style={{padding:'1rem', textAlign:'center', opacity:.7}}>موردی یافت نشد.</div>
                            )}
                            {/* Pagination controls */}
                            {!loading && !error && (
                                <div style={{display:'flex', gap:'.5rem', justifyContent:'center', alignItems:'center', padding:'1rem', flexWrap:'wrap'}}>
                                    <button className={styles.chipBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>قبلی</button>
                                    <span style={{fontSize:'.8rem', color:'var(--text-secondary)'}}>صفحه {page} از {Math.max(1, Math.ceil(total / pageSize))}</span>
                                    <button className={styles.chipBtn} onClick={() => setPage(p => Math.min(Math.max(1, Math.ceil(total / pageSize)), p + 1))} disabled={page >= Math.ceil(total / pageSize)}>بعدی</button>
                                    <select className={styles.toolbarSelect} value={pageSize} onChange={e => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }} aria-label="تعداد در هر صفحه">
                                        {[10,20,30,50].map(n => <option key={n} value={n}>{n} در هر صفحه</option>)}
                                    </select>
                                    <span style={{fontSize:'.8rem', color:'var(--text-secondary)'}}>نمایش {questions.length} از {total} نتیجه</span>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
            
            <ReportDrawer open={isReportDrawerOpen} onClose={() => setReportDrawerOpen(false)} />
        </>
    );
};

export default QuestionBankPage;
