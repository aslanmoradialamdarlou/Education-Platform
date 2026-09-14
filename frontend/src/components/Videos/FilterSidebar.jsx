import React, { useEffect, useRef, useCallback, useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import styles from './Videos.module.css';
import CustomSelect from '../Shared/CustomSelect';

// Helper to normalize chapter strings for comparison (remove all non-alphanumeric except Persian/Arabic digits)
const normalizeChapter = (str) => {
    if (!str) return '';
    // Convert Persian/Arabic digits to English for comparison
    return str.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
              .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
              .toLowerCase()
              .trim();
};

const CHAPTERS = Array.from({ length: 15 }, (_, i) => `فصل ${i + 1}`);
const GRADES = { '7': 'هفتم', '8': 'هشتم', '9': 'نهم' };

export default function FilterSidebar({
    isOpen,
    onClose,
    gradesFilter, setGradesFilter, // array of labels
    chaptersFilter, setChaptersFilter, // array of {grade:'7'|'8'|'9', chapter:'فصل ۱'}
    accessFilter, setAccessFilter, // 'all' | 'free' | 'premium'
    favoritesOnly, setFavoritesOnly,
    returnFocusRef,
    availableChapters = [], // Array of unique chapter strings from loaded videos
}) {
    const sidebarRef = useRef(null);

    // Close on ESC and outside click when open
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
        const onDown = (e) => { if (sidebarRef.current && !sidebarRef.current.contains(e.target)) onClose?.(); };
        document.addEventListener('keydown', onKey);
        document.addEventListener('mousedown', onDown);
        return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown); };
    }, [isOpen, onClose]);

    // Focus return when closing
    useEffect(() => {
        if (isOpen) return;
        const el = sidebarRef.current; if (!el) return;
        const active = document.activeElement;
        if (active && el.contains(active) && returnFocusRef?.current) {
            returnFocusRef.current.focus();
        }
    }, [isOpen, returnFocusRef]);

    // Collapsible section open/close state
    const [openGrades, setOpenGrades] = useState(true);
    const [openChapters, setOpenChapters] = useState(true);
    const [openAccess, setOpenAccess] = useState(true);

    // Helpers for access pills (exclusive)
    const freeChecked = accessFilter === 'free';
    const premiumChecked = accessFilter === 'premium';

    const gradeKeyMap = { 'هفتم':'7','هشتم':'8','نهم':'9' };
    // Use availableChapters if provided, otherwise fallback to hardcoded list
    const chapterOptions = availableChapters.length > 0 
        ? availableChapters 
        : Array.from({ length: 15 }, (_, i) => `فصل ${i + 1}`);

    const handleAddChapter = useCallback((gradeKey) => (e) => {
        const val = e.target.value;
        if (!val) return;
        setChaptersFilter(prev => prev.some(c => c.grade === gradeKey && c.chapter === val) ? prev : [...prev, { grade: gradeKey, chapter: val }]);
        e.target.value = '';
    }, [setChaptersFilter]);
    const removeChapter = (gKey, ch) => setChaptersFilter(prev => prev.filter(c => !(c.grade===gKey && c.chapter===ch)));

    return (
        <>
            {isOpen && <div className={styles.filterBackdrop} onClick={onClose} />}
            <aside id="videos-filters" ref={sidebarRef} className={`${styles.filterSidebar} ${isOpen ? styles.isOpen : ''}`} aria-hidden={!isOpen}>
                <div className={styles.sidebarHeader}>
                    <h3>فیلتر ویدیوها</h3>
                    <button className={styles.closeSidebarBtn} onClick={() => {
                        onClose?.();
                        if (returnFocusRef?.current) setTimeout(() => returnFocusRef.current.focus(), 50);
                    }}><X /></button>
                </div>
                <div className={styles.sidebarContent}>
                    <section className={`${styles.collapsible} ${openGrades ? styles.collapsibleOpen : ''}`}>
                        <button type="button" className={styles.collapsibleHeader} aria-expanded={openGrades} onClick={() => setOpenGrades(v => !v)}>
                            <span>پایه تحصیلی</span>
                            <ChevronDown className={styles.collapsibleIcon} size={18} />
                        </button>
                        <div className={styles.collapsibleBody} style={{ maxHeight: openGrades ? 'none' : 0 }}>
                            <div className={styles.collapsibleInner}>
                                <div role="group" aria-label="پایه" className={styles.radioGroup}>
                                    {Object.entries(GRADES).map(([value, label]) => {
                                        const checked = Array.isArray(gradesFilter) && gradesFilter.includes(label);
                                        const gradeClass = styles[`grade${value}`] || '';
                                        return (
                                            <label key={value} className={`${styles.radioItem} ${gradeClass} ${checked ? styles.radioChecked : ''}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={(e) => {
                                                        const isOn = e.target.checked;
                                                        setGradesFilter?.(prev => {
                                                            const arr = Array.isArray(prev) ? prev : [];
                                                            if (isOn) return arr.includes(label) ? arr : [...arr, label];
                                                            return arr.filter(g => g !== label);
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
                        <button type="button" className={styles.collapsibleHeader} aria-expanded={openChapters} onClick={() => setOpenChapters(v => !v)}>
                            <span>فصل‌ها</span>
                            <ChevronDown className={styles.collapsibleIcon} size={18} />
                        </button>
                        <div className={styles.collapsibleBody} style={{ maxHeight: openChapters ? 'none' : 0 }}>
                            <div className={`${styles.collapsibleInner} ${styles.chapterFilterContainer}`} style={{flexDirection:'column', alignItems:'stretch', gap:'.75rem'}}>
                                {(!gradesFilter || gradesFilter.length===0) && (
                                    <div style={{fontSize:'.75rem', color:'var(--text-secondary)'}}>ابتدا پایه(های) مورد نظر را انتخاب کنید.</div>
                                )}
                                {gradesFilter.map(label => {
                                    const gKey = gradeKeyMap[label];
                                    return (
                                        <div key={gKey} style={{display:'flex', flexDirection:'column', gap:'.45rem'}}>
                                            <CustomSelect
                                                options={chapterOptions}
                                                value={null}
                                                placeholder={`افزودن فصل برای ${label}`}
                                                maxHeight={120}
                                                onChange={(val) => {
                                                    setChaptersFilter(prev => prev.some(c => c.grade === gKey && c.chapter === val) ? prev : [...prev, { grade: gKey, chapter: val }]);
                                                }}
                                            />
                                            <div className={styles.chipsRow} style={{marginTop:'.25rem'}}>
                                                {chaptersFilter.filter(c => c.grade === gKey).map(c => (
                                                    <span key={`${c.grade}-${c.chapter}`} className={`${styles.chipBtn} ${styles.removableChip}`}> {label} • {c.chapter}
                                                        <button aria-label="حذف فصل" onClick={() => removeChapter(c.grade, c.chapter)}>×</button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    <section className={`${styles.collapsible} ${openAccess ? styles.collapsibleOpen : ''}`}>
                        <button type="button" className={styles.collapsibleHeader} aria-expanded={openAccess} onClick={() => setOpenAccess(v => !v)}>
                            <span>وضعیت دسترسی</span>
                            <ChevronDown className={styles.collapsibleIcon} size={18} />
                        </button>
                        <div className={styles.collapsibleBody} style={{ maxHeight: openAccess ? 'none' : 0 }}>
                            <div className={styles.collapsibleInner}>
                                <label className={styles.inlineCheckbox}>
                                    <input type="checkbox" checked={freeChecked} onChange={() => setAccessFilter?.(freeChecked ? 'all' : 'free')} /> رایگان
                                </label>
                                <label className={styles.inlineCheckbox}>
                                    <input type="checkbox" checked={premiumChecked} onChange={() => setAccessFilter?.(premiumChecked ? 'all' : 'premium')} /> اشتراکی
                                </label>
                                <label className={styles.inlineCheckbox}>
                                    <input type="checkbox" checked={!!favoritesOnly} onChange={(e) => setFavoritesOnly?.(e.target.checked)} /> لیست من
                                </label>
                            </div>
                        </div>
                    </section>
                </div>
            </aside>
        </>
    );
}
