import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { X, ChevronDown } from 'lucide-react';
import styles from './Handouts.module.css';
import CustomSelect from '../Shared/CustomSelect';

const GRADES = { '7': 'هفتم', '8': 'هشتم', '9': 'نهم' };
const CHAPTERS = Array.from({ length: 15 }, (_, i) => `فصل ${i + 1}`);

const FilterSidebar = forwardRef(({ isOpen, onClose, grades = [], onGradesChange, onChaptersChange, onAccessChange, chapters, access: accessIn, returnFocusRef }, ref) => {
    // Internal mirror of selected grades (authoritative state lives in parent)
    const [selectedGrades, setSelectedGrades] = useState(() => Array.isArray(grades) ? grades : []);
    // (obsolete) single-grade chapter selector replaced by per-grade selectors
    const [selectedChapters, setSelectedChapters] = useState([]);
    const [access, setAccess] = useState({ free: false, sub: false });
    const sidebarRef = useRef(null);

    // Sync incoming grades prop to internal state
    useEffect(() => {
        if (Array.isArray(grades)) setSelectedGrades(grades.filter(g => ['7','8','9'].includes(String(g))));
    }, [grades]);

    // Close on ESC and outside click when open
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
        const onDown = (e) => {
            if (sidebarRef.current && !sidebarRef.current.contains(e.target)) onClose?.();
        };
        document.addEventListener('keydown', onKey);
        document.addEventListener('mousedown', onDown);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('mousedown', onDown);
        };
    }, [isOpen, onClose]);

    // Focus return: if focus remains inside when closed, move back to trigger
    useEffect(() => {
        if (isOpen) return;
        const el = sidebarRef.current;
        if (!el) return;
        const active = document.activeElement;
        if (active && el.contains(active) && returnFocusRef?.current) {
            returnFocusRef.current.focus();
        }
    }, [isOpen, returnFocusRef]);

    // Imperative API for parent if needed
    useImperativeHandle(ref, () => ({
        setGrades: (arr=[]) => {
            const norm = arr.map(String).filter(g => ['7','8','9'].includes(g));
            setSelectedGrades(Array.from(new Set(norm)));
            onGradesChange?.(Array.from(new Set(norm)));
        },
        clearAll: () => {
            setSelectedChapters([]);
            setAccess({ free: false, sub: false });
            setSelectedGrades([]);
            onGradesChange?.([]);
        }
    }), [onGradesChange]);

    const handleChapterSelect = useCallback((gradeKey) => (e) => {
        const chapter = e.target.value;
        if (!chapter) return;
        const exists = selectedChapters.some(c => c.grade === gradeKey && c.chapter === chapter);
        if (exists) { e.target.value = ''; return; }
        const next = [...selectedChapters, { grade: gradeKey, chapter }];
        setSelectedChapters(next);
        onChaptersChange?.(next);
        e.target.value = '';
    }, [selectedChapters, onChaptersChange]);

    const handleChapterDelete = useCallback((toDel) => {
        setSelectedChapters(prev => {
            const next = prev.filter(c => !(c.grade === toDel.grade && c.chapter === toDel.chapter));
            onChaptersChange?.(next);
            return next;
        });
    }, [onChaptersChange]);

    // Sync internal UI with parent-provided state
    useEffect(() => {
        if (Array.isArray(chapters)) setSelectedChapters(chapters);
    }, [chapters]);
    useEffect(() => {
        if (accessIn && typeof accessIn.free === 'boolean' && typeof accessIn.sub === 'boolean') setAccess(accessIn);
    }, [accessIn]);

    const [openGrades, setOpenGrades] = useState(true);
    const [openChapters, setOpenChapters] = useState(true);
    const [openAccess, setOpenAccess] = useState(true);

    return (
        <>
            {isOpen && <div className={styles.filterBackdrop} onClick={onClose} />}
            <aside id="handouts-filters" ref={sidebarRef} className={`${styles.filterSidebar} ${isOpen ? styles.isOpen : ''}`} aria-hidden={!isOpen}>
                <div className={styles.sidebarHeader}>
                    <h3>فیلتر جزوه‌ها</h3>
                    <button className={styles.closeSidebarBtn} onClick={() => {
                        onClose?.();
                        if (returnFocusRef?.current) setTimeout(() => returnFocusRef.current.focus(), 50);
                    }}><X /></button>
                </div>
                <div className={styles.sidebarContent}>
                    <section className={`${styles.collapsible} ${openGrades ? styles.collapsibleOpen : ''}`}>
                        <button type="button" className={styles.collapsibleHeader} aria-expanded={openGrades} onClick={() => setOpenGrades(v=>!v)}>
                            <span>پایه تحصیلی</span>
                            <ChevronDown className={styles.collapsibleIcon} size={18} />
                        </button>
                        <div className={styles.collapsibleBody} style={{ maxHeight: openGrades ? 'none' : 0 }}>
                            <div className={styles.collapsibleInner}>
                                <div role="group" aria-label="پایه" className={styles.radioGroup}>
                                    {Object.entries(GRADES).map(([value, label]) => {
                                        const checked = selectedGrades.includes(value);
                                        const gradeClass = styles[`grade${value}`] || '';
                                        return (
                                            <label key={value} className={`${styles.radioItem} ${gradeClass} ${checked ? styles.radioChecked : ''}`}>
                                                <input
                                                    type="checkbox"
                                                    name="grades"
                                                    value={value}
                                                    checked={checked}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setSelectedGrades(prev => {
                                                            const next = e.target.checked ? [...prev, val] : prev.filter(g => g !== val);
                                                            onGradesChange?.(next);
                                                            // Remove chapters belonging to removed grade
                                                            if (!e.target.checked) {
                                                                setSelectedChapters(chs => {
                                                                    const filtered = chs.filter(c => c.grade !== val);
                                                                    if (filtered.length !== chs.length) onChaptersChange?.(filtered);
                                                                    return filtered;
                                                                });
                                                            }
                                                            return next;
                                                        });
                                                    }}
                                                />
                                                <span className={styles.radioVisual} aria-hidden />
                                                <span className="label">{label}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className={`${styles.collapsible} ${openChapters ? styles.collapsibleOpen : ''}`}>
                        <button type="button" className={styles.collapsibleHeader} aria-expanded={openChapters} onClick={() => setOpenChapters(v=>!v)}>
                            <span>فصل کتاب</span>
                            <ChevronDown className={styles.collapsibleIcon} size={18} />
                        </button>
                        <div className={styles.collapsibleBody} style={{ maxHeight: openChapters ? 'none' : 0 }}>
                            <div className={`${styles.collapsibleInner} ${styles.chapterFilterContainer}`}>
                                <div style={{display:'flex', flexDirection:'column', gap:'1rem', width:'100%'}}>
                                    {selectedGrades.length === 0 && (
                                        <div style={{fontSize:'.75rem', color:'var(--text-secondary)'}}>ابتدا پایه(های) مورد نظر را انتخاب کنید.</div>
                                    )}
                                    {selectedGrades.map(g => {
                                        const chipsForGrade = selectedChapters.filter(c => c.grade === g);
                                        return (
                                            <div key={g} style={{display:'flex', flexDirection:'column', gap:'.5rem'}}>
                                                <CustomSelect
                                                    options={CHAPTERS}
                                                    value={null}
                                                    placeholder={`افزودن فصل برای ${GRADES[g]}`}
                                                    maxHeight={120}
                                                    onChange={(val) => {
                                                        const exists = selectedChapters.some(c => c.grade === g && c.chapter === val);
                                                        if (exists) return;
                                                        const next = [...selectedChapters, { grade: g, chapter: val }];
                                                        setSelectedChapters(next);
                                                        onChaptersChange?.(next);
                                                    }}
                                                />
                                                {chipsForGrade.length > 0 && (
                                                    <div className={styles.chipsRow} style={{marginTop:'.1rem'}}>
                                                        {chipsForGrade.map(chip => (
                                                            <span key={`${chip.grade}-${chip.chapter}`} className={`${styles.chipBtn} ${styles.removableChip}`}>
                                                                {GRADES[chip.grade]} • {chip.chapter}
                                                                <button aria-label="حذف فصل" onClick={() => handleChapterDelete(chip)}>×</button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className={`${styles.collapsible} ${openAccess ? styles.collapsibleOpen : ''}`}>
                        <button type="button" className={styles.collapsibleHeader} aria-expanded={openAccess} onClick={() => setOpenAccess(v=>!v)}>
                            <span>وضعیت دسترسی</span>
                            <ChevronDown className={styles.collapsibleIcon} size={18} />
                        </button>
                        <div className={styles.collapsibleBody} style={{ maxHeight: openAccess ? 'none' : 0 }}>
                            <div className={styles.collapsibleInner}>
                                <label className={styles.inlineCheckbox}>
                                    <input type="checkbox" checked={access.free} onChange={(e) => { const v = e.target.checked; setAccess(prev => ({ ...prev, free: v })); onAccessChange?.(p => ({ ...p, free: v })); }} /> رایگان
                                </label>
                                <label className={styles.inlineCheckbox} >
                                    <input type="checkbox" checked={access.sub} onChange={(e) => { const v = e.target.checked; setAccess(prev => ({ ...prev, sub: v })); onAccessChange?.(p => ({ ...p, sub: v })); }} /> نیاز به اشتراک
                                </label>
                            </div>
                        </div>
                    </section>
                </div>
            </aside>
        </>
    );
});

export default FilterSidebar;
