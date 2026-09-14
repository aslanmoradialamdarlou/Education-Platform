import React, { useEffect, useRef, useCallback, useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import styles from './SampleQuestions.module.css';
import CustomSelect from '../Shared/CustomSelect';

const GRADE_MAP = { '7': 'هفتم', '8': 'هشتم', '9': 'نهم' };

export default function FilterSidebar({
  isOpen,
  onClose,
  subjectFilter, setSubjectFilter,
  gradesFilter, setGradesFilter,
  chaptersFilter, setChaptersFilter,
  accessFilter, setAccessFilter, // 'all' | 'free' | 'paid'
  favoritesOnly, setFavoritesOnly,
  subjects,
  returnFocusRef,
}) {
  const sidebarRef = useRef(null);
  const [openGrades, setOpenGrades] = useState(true);
  const [openChapters, setOpenChapters] = useState(true);
  const [openSubject, setOpenSubject] = useState(true);
  const [openAccess, setOpenAccess] = useState(true);

  // Close on ESC and outside click when open (mobile)
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    const onDown = (e) => { if (sidebarRef.current && !sidebarRef.current.contains(e.target)) onClose?.(); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown); };
  }, [isOpen, onClose]);

  // Focus return when closing (mobile)
  useEffect(() => {
    if (isOpen) return;
    const el = sidebarRef.current; if (!el) return;
    const active = document.activeElement;
    if (active && el.contains(active) && returnFocusRef?.current) {
      try { returnFocusRef.current.focus(); } catch(_){}
    }
  }, [isOpen, returnFocusRef]);

  const freeChecked = accessFilter === 'free';
  const paidChecked = accessFilter === 'paid';

  // Grade mapping to numeric keys for chaptersFilter use
  const gradeKeyMap = { 'هفتم':'7','هشتم':'8','نهم':'9' };
  const reverseGradeKey = { '7':'هفتم','8':'هشتم','9':'نهم' };

  // Derived list of chapters per grade from existing chaptersFilter (OR could accept prop availableChapters)
  // Important: Use Persian digits to match dataset tags like 'فصل ۱'
  const toFaDigits = (n) => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  // We'll expose chapter selects only for selected grades; user enters manually via small per-grade select.
  const chapterOptions = Array.from({ length: 15 }, (_, i) => `فصل ${toFaDigits(i+1)}`);

  const handleAddChapter = useCallback((gradeKey) => (e) => {
    const val = e.target.value;
    if (!val) return;
    setChaptersFilter(prev => {
      if (prev.some(c => c.grade === gradeKey && c.chapter === val)) return prev;
      return [...prev, { grade: gradeKey, chapter: val }];
    });
    e.target.value = '';
  }, [setChaptersFilter]);

  const removeChapter = (g, ch) => {
    setChaptersFilter(prev => prev.filter(c => !(c.grade === g && c.chapter === ch)));
  };

  return (
    <>
      {isOpen && <div className={styles.filterBackdrop} onClick={onClose} />}
      <aside id="samplequestions-filters" ref={sidebarRef} className={`${styles.filterSidebar} ${isOpen ? styles.isOpen : ''}`} aria-hidden={!isOpen}>
        <div className={styles.sidebarHeader}>
          <h3>فیلترها</h3>
          <button className={styles.panelClose} onClick={() => {
            onClose?.();
            if (returnFocusRef?.current) setTimeout(() => returnFocusRef.current.focus(), 50);
          }} aria-label="بستن"><X /></button>
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
                  {Object.entries(GRADE_MAP).map(([value, label]) => {
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
                              let next = isOn ? (arr.includes(label) ? arr : [...arr, label]) : arr.filter(g => g !== label);
                              // prune chapters for removed grade
                              if (!isOn) setChaptersFilter(chs => chs.filter(c => c.grade !== value));
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
              <span>فصل‌ها</span>
              <ChevronDown className={styles.collapsibleIcon} size={18} />
            </button>
            <div className={styles.collapsibleBody} style={{ maxHeight: openChapters ? 'none' : 0 }}>
              <div className={styles.collapsibleInner} style={{flexDirection:'column', alignItems:'stretch', gap:'.75rem'}}>
                {(!gradesFilter || gradesFilter.length===0) && (
                  <div style={{fontSize:'.75rem', color:'var(--text-secondary)'}}>ابتدا پایه(های) مورد نظر را انتخاب کنید.</div>
                )}
                {gradesFilter.map((label, idx) => {
                  const gKey = gradeKeyMap[label];
                  return (
                    <div key={`${gKey}-${idx}`} style={{display:'flex', flexDirection:'column', gap:'.45rem'}}>
                      <CustomSelect
                        options={chapterOptions}
                        value={null}
                        placeholder={`افزودن فصل برای ${label}`}
                        maxHeight={120}
                        onChange={(val) => {
                          setChaptersFilter(prev => {
                            if (prev.some(c => c.grade === gKey && c.chapter === val)) return prev;
                            return [...prev, { grade: gKey, chapter: val }];
                          });
                        }}
                      />
                      <div className={styles.chipsRow} style={{marginTop:'.25rem'}}>
                        {chaptersFilter.filter(c => c.grade === gKey).map(c => (
                          <span key={`${c.grade}-${c.chapter}`} className={`${styles.chipBtn} ${styles.removableChip}`}>
                            {label} • {c.chapter}
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

          <section className={`${styles.collapsible} ${openSubject ? styles.collapsibleOpen : ''}`}>
            <button type="button" className={styles.collapsibleHeader} aria-expanded={openSubject} onClick={() => setOpenSubject(v=>!v)}>
              <span>درس</span>
              <ChevronDown className={styles.collapsibleIcon} size={18} />
            </button>
            <div className={styles.collapsibleBody} style={{ maxHeight: openSubject ? 'none' : 0 }}>
              <div className={`${styles.collapsibleInner} ${styles.subjectFilterContainer}`}>
                <select className={styles.selectSubject} value={subjectFilter} onChange={(e)=> setSubjectFilter?.(e.target.value)}>
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
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
                  <input type="checkbox" checked={freeChecked} onChange={() => setAccessFilter?.(freeChecked ? 'all' : 'free')} /> رایگان
                </label>
                <label className={styles.inlineCheckbox}>
                  <input type="checkbox" checked={paidChecked} onChange={() => setAccessFilter?.(paidChecked ? 'all' : 'paid')} /> اشتراکی
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
