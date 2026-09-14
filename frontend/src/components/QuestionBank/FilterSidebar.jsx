import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { X } from 'lucide-react';
import ChapterSlider from './ChapterSlider';
import CustomSelect from '../Shared/CustomSelect';
import CollapsibleSection from './CollapsibleSection';
import styles from './QuestionBank.module.css';

// Mock data for chapters, now including page ranges
const CHAPTERS_DATA = {
    '7': Array.from({ length: 15 }, (_, i) => ({ name: `فصل ${i + 1}`, pages: [10, 50] })),
    '8': Array.from({ length: 15 }, (_, i) => ({ name: `فصل ${i + 1}`, pages: [15, 60] })),
    '9': Array.from({ length: 15 }, (_, i) => ({ name: `فصل ${i + 1}`, pages: [20, 70] })),
};
const GRADES = { '7': 'هفتم', '8': 'هشتم', '9': 'نهم' };

const FilterSidebar = forwardRef(({ isOpen, onClose, onFiltersChange, returnFocusRef }, ref) => {
    // chapters: [{ id, gradeKey:'7'|'8'|'9', chapter:'فصل 1', pageStart, pageEnd, range:[min,max] }]
    const [selectedChapters, setSelectedChapters] = useState([]);
    const [selectedGrades, setSelectedGrades] = useState(['7']);
    const [selectedDifficulties, setSelectedDifficulties] = useState([]); // ['ساده','متوسط','سخت']
    const [selectedTypes, setSelectedTypes] = useState([]); // ['test','truefalse','fillblank','short','long']
    const sidebarRef = useRef(null);

    const handleAddChapter = useCallback((gradeKey) => (e) => {
        const chapterName = e.target.value;
        if (!chapterName) return;
        const chapterData = CHAPTERS_DATA[gradeKey]?.find(c => c.name === chapterName);
        if (!chapterData) return;
        setSelectedChapters(prev => {
            if (prev.some(c => c.gradeKey === gradeKey && c.chapter === chapterName)) return prev;
            return [...prev, {
                id: `${gradeKey}-${chapterName}`,
                grade: GRADES[gradeKey],
                gradeKey,
                chapter: chapterName,
                pageStart: chapterData.pages[0],
                pageEnd: chapterData.pages[1],
                range: [chapterData.pages[0], chapterData.pages[1]],
            }];
        });
        e.target.value = '';
    }, []);

    const handleChapterDelete = useCallback((idToDelete) => {
        setSelectedChapters(prev => prev.filter(chapter => chapter.id !== idToDelete));
    }, []);

    // notify parent on change (only when actual diff)
    const lastEmittedRef = useRef(null);
    useEffect(() => {
        if (!onFiltersChange) return;
        const chaptersSafe = Array.isArray(selectedChapters) ? selectedChapters : [];
        const payload = {
            grades: selectedGrades.slice().sort(),
            difficulties: selectedDifficulties.slice().sort(),
            types: selectedTypes.slice().sort(),
            chapters: chaptersSafe.map(c => ({
                id: c.id || '',
                gradeKey: c.gradeKey || '',
                chapter: c.chapter || '',
                range: Array.isArray(c.range) && c.range.length === 2 ? c.range : [0,0]
            }))
        };
        lastEmittedRef.current = payload; // always update
        onFiltersChange(payload);
    }, [selectedChapters, selectedGrades, selectedDifficulties, selectedTypes, onFiltersChange]);

    // Close on ESC and outside click when open (mobile focus mostly)
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        const handleClickOutside = (e) => {
            if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKey);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // When closing, if focus is still inside sidebar move it back to trigger for accessibility
    useEffect(() => {
        if (isOpen) return;
        const el = sidebarRef.current;
        if (!el) return;
        const active = document.activeElement;
        if (active && el.contains(active) && returnFocusRef?.current) {
            returnFocusRef.current.focus();
        }
    }, [isOpen, returnFocusRef]);
    
    const muiControlStyles = { color: 'var(--text-secondary)', '&.Mui-checked': { color: 'var(--accent-primary-solid)' } };
    const muiLabelStyles = { color: 'var(--text-primary)' };
    const TYPE_OPTIONS = [
        { value: 'test', label: 'چهارگزینه‌ای' },
        { value: 'truefalse', label: 'درست/نادرست' },
        { value: 'fillblank', label: 'جاهای خالی' },
        { value: 'short', label: 'پاسخ کوتاه' },
        { value: 'long', label: 'پاسخ بلند' },
        { value: 'matching', label: 'وصل‌کردنی' },
    ];

    // Expose minimal imperative API for quick filtering from question cards
    useImperativeHandle(ref, () => ({
        // Ensure a grade appears in selectedGrades
        setGrade: (gradeKey) => {
            const g = String(gradeKey);
            if (!['7','8','9'].includes(g)) return;
            setSelectedGrades(prev => prev.includes(g) ? prev : [...prev, g]);
        },
        setGrades: (gradesArr = []) => {
            const normalized = gradesArr.map(String).filter(g => ['7','8','9'].includes(g));
            setSelectedGrades(Array.from(new Set(normalized)));
        },
        // Remove a grade and any chapter chips for that grade
        removeGrade: (gradeKey) => {
            const g = String(gradeKey);
            setSelectedGrades(prev => prev.filter(x => x !== g));
            setSelectedChapters(prev => prev.filter(c => c.gradeKey !== g));
        },
        // Difficulties setter
        setDifficulties: (levels = []) => {
            const allowed = ['ساده','متوسط','سخت'];
            const norm = levels.filter(l => allowed.includes(l));
            setSelectedDifficulties(Array.from(new Set(norm)));
        },
            // Types setter
            setTypes: (typesArr = []) => {
                const allowed = TYPE_OPTIONS.map(t => t.value);
                const norm = typesArr.filter(t => allowed.includes(t));
                setSelectedTypes(Array.from(new Set(norm)));
            },
        // Chapters setter (replace all)
        setChapters: (chaptersArr = []) => {
            // chaptersArr: [{ gradeKey:'7'|'8'|'9', chapter:'فصل ۱', range:[min,max] }]
            const cleaned = [];
            const gradeSet = new Set(selectedGrades);
            chaptersArr.forEach(c => {
                const g = String(c.gradeKey);
                if (!['7','8','9'].includes(g)) return;
                const name = c.chapter;
                if (!name) return;
                const chapterData = CHAPTERS_DATA[g]?.find(ch => ch.name === name);
                if (!chapterData) return;
                const [min, max] = Array.isArray(c.range) && c.range.length === 2 ? c.range : [chapterData.pages[0], chapterData.pages[1]];
                cleaned.push({
                    id: `${g}-${name}`,
                    grade: GRADES[g],
                    gradeKey: g,
                    chapter: name,
                    pageStart: chapterData.pages[0],
                    pageEnd: chapterData.pages[1],
                    range: [min, max],
                });
                gradeSet.add(g);
            });
            setSelectedChapters(cleaned);
            setSelectedGrades(Array.from(gradeSet));
        },
        // Add a chapter chip (grade inferred if missing -> first selected grade or '7')
        addChapter: (gradeKey, chapterName) => {
            const g = ['7','8','9'].includes(String(gradeKey)) ? String(gradeKey) : (selectedGrades[0] || '7');
            if (!chapterName) return;
            setSelectedChapters(prev => {
                const exists = prev.some(c => c.chapter === chapterName && c.gradeKey === g);
                if (exists) return prev;
                const chapterData = CHAPTERS_DATA[g]?.find(c => c.name === chapterName);
                if (!chapterData) return prev;
                const newSelection = {
                    id: `${g}-${chapterName}`,
                    grade: GRADES[g],
                    gradeKey: g,
                    chapter: chapterName,
                    pageStart: chapterData.pages[0],
                    pageEnd: chapterData.pages[1],
                    range: [chapterData.pages[0], chapterData.pages[1]],
                };
                return [...prev, newSelection];
            });
            // Ensure grade is also marked as selected
            if (!selectedGrades.includes(g)) {
                setSelectedGrades(prev => prev.includes(g) ? prev : [...prev, g]);
            }
        },
        removeChapter: (id) => {
            setSelectedChapters(prev => prev.filter(c => c.id !== id));
        },
        clearAll: () => {
            setSelectedGrades([]);
            setSelectedDifficulties([]);
            setSelectedTypes([]);
            setSelectedChapters([]);
        },
        getFilters: () => ({
            grades: selectedGrades.slice(),
            difficulties: selectedDifficulties.slice(),
            types: selectedTypes.slice(),
            chapters: selectedChapters.slice(),
        }),
    }), [selectedGrades, selectedChapters, selectedDifficulties, selectedTypes]);

    return (
        <>
            {isOpen && <div className={styles.filterBackdrop} onClick={onClose} />}
            <aside
                ref={sidebarRef}
                className={`${styles.filterSidebar} ${isOpen ? styles.isOpen : ''}`}
                aria-hidden={!isOpen}
            >
                <div className={styles.sidebarHeader}>
                    <h3>فیلتر سوالات</h3>
                    <button className={styles.closeSidebarBtn} onClick={() => {
                        onClose();
                        if (returnFocusRef?.current) {
                            setTimeout(()=>returnFocusRef.current.focus(),50);
                        }
                    }}><X /></button>
                </div>
                <div className={styles.sidebarContent}>
                    <CollapsibleSection title="پایه تحصیلی" defaultOpen>
                        <div role="group" aria-label="پایه" className={styles.radioGroup}>
                            {Object.entries(GRADES).map(([value,label]) => {
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
                                                setSelectedGrades(prev => e.target.checked ? [...prev, val] : prev.filter(g => g !== val));
                                            }}
                                        />
                                        <span className={styles.radioVisual} aria-hidden />
                                        <span className="label">{label}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </CollapsibleSection>
                    <CollapsibleSection title="فصل و صفحه" defaultOpen>
                        <div className={styles.chapterFilterContainer} style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
                            {selectedGrades.length === 0 && (
                                <div style={{fontSize:'.75rem', color:'var(--text-secondary)'}}>ابتدا پایه(های) مورد نظر را انتخاب کنید.</div>
                            )}
                            {selectedGrades.map(gk => {
                                const chaptersForGrade = selectedChapters.filter(c => c.gradeKey === gk);
                                return (
                                    <div key={gk} style={{display:'flex', flexDirection:'column', gap:'.55rem'}}>
                                        <CustomSelect
                                            options={CHAPTERS_DATA[gk].map(c => ({ value: c.name, label: c.name }))}
                                            value={null}
                                            placeholder={`افزودن فصل برای ${GRADES[gk]}`}
                                            maxHeight={120}
                                            usePortal
                                            onChange={(val) => {
                                                const chapterData = CHAPTERS_DATA[gk]?.find(c => c.name === val);
                                                if (!chapterData) return;
                                                setSelectedChapters(prev => {
                                                    if (prev.some(c => c.gradeKey === gk && c.chapter === val)) return prev;
                                                    return [...prev, {
                                                        id: `${gk}-${val}`,
                                                        grade: GRADES[gk],
                                                        gradeKey: gk,
                                                        chapter: val,
                                                        pageStart: chapterData.pages[0],
                                                        pageEnd: chapterData.pages[1],
                                                        range: [chapterData.pages[0], chapterData.pages[1]],
                                                    }];
                                                });
                                            }}
                                        />
                                        {chaptersForGrade.length > 0 && (
                                            <div style={{display:'flex', flexDirection:'column', gap:'.5rem'}}>
                                                {chaptersForGrade.map(chip => {
                                                    const gradeClass = styles[`grade${chip.gradeKey}`] || '';
                                                    return (
                                                        <ChapterSlider
                                                            key={chip.id}
                                                            grade={chip.grade}
                                                            chapter={chip.chapter}
                                                            pageStart={chip.pageStart}
                                                            pageEnd={chip.pageEnd}
                                                            onDelete={() => handleChapterDelete(chip.id)}
                                                            className={gradeClass}
                                                            onRangeChange={(min,max) => {
                                                                setSelectedChapters(prev => prev.map(c => c.id === chip.id ? { ...c, range: [min,max] } : c));
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CollapsibleSection>
                    <CollapsibleSection title="نوع سوال" defaultOpen>
                        <div role="group" aria-label="نوع" className={styles.radioGroup}>
                            {TYPE_OPTIONS.map(opt => {
                                const checked = selectedTypes.includes(opt.value);
                                return (
                                    <label key={opt.value} className={`${styles.radioItem} ${checked ? styles.radioChecked : ''}`}>
                                        <input
                                            type="checkbox"
                                            name="types"
                                            value={opt.value}
                                            checked={checked}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setSelectedTypes(prev => e.target.checked ? [...prev, val] : prev.filter(t => t !== val));
                                            }}
                                        />
                                        <span className={styles.radioVisual} aria-hidden />
                                        <span className="label">{opt.label}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </CollapsibleSection>
                    
                    <CollapsibleSection title="درجه سختی" defaultOpen>
                        <div role="group" aria-label="سختی" className={styles.radioGroup}>
                            {['ساده','متوسط','سخت'].map(level => {
                                const checked = selectedDifficulties.includes(level);
                                return (
                                    <label key={level} className={`${styles.radioItem} ${checked ? styles.radioChecked : ''}`}>
                                        <input
                                            type="checkbox"
                                            name="difficulties"
                                            value={level}
                                            checked={checked}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setSelectedDifficulties(prev => e.target.checked ? [...prev, val] : prev.filter(d => d !== val));
                                            }}
                                        />
                                        <span className={styles.radioVisual} aria-hidden />
                                        <span className="label">{level}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </CollapsibleSection>
                </div>
            </aside>
        </>
    );
});

export default FilterSidebar;
