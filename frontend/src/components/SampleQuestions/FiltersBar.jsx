import React from 'react';
import styles from './SampleQuestions.module.css';

export default function FiltersBar({
  subjects, grades,
  subjectFilter, setSubjectFilter,
  gradeFilter, setGradeFilter,
  accessFilter, setAccessFilter,
  searchTerm, setSearchTerm,
  favoritesOnly, setFavoritesOnly,
  sortOption, setSortOption,
  onClear
}) {
  return (
    <div className={styles.filtersBar}>
      <div className={styles.filterGroup}>
        <label>درس</label>
        <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}>
          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className={styles.filterGroup}>
        <label>پایه</label>
        <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}>
          {grades.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <div className={styles.filterGroup}>
        <label>جستجو</label>
        <input
          type="text"
          placeholder="عنوان یا برچسب..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      <div className={styles.filterGroup}>
        <label>مرتب‌سازی</label>
        <select value={sortOption} onChange={e => setSortOption(e.target.value)}>
          <option value="newest">جدیدترین</option>
          <option value="mostViewed">پربازدید</option>
          <option value="pagesDesc">بیشترین صفحات</option>
            <option value="pagesAsc">کمترین صفحات</option>
            <option value="titleAz">مرتب‌سازی عنوان</option>
        </select>
      </div>
      <div className={styles.filterGroup} style={{alignSelf:'flex-end'}}>
        <label style={{fontSize:'.7rem', color:'var(--text-secondary)'}}>دسترسی</label>
        <div className={styles.chipsRow}>
          <button type="button" className={`${styles.chipBtn} ${accessFilter === 'free' ? styles.chipBtnActive : ''}`} onClick={() => setAccessFilter(f => f === 'free' ? 'all' : 'free')} aria-pressed={accessFilter === 'free'}>رایگان</button>
          <button type="button" className={`${styles.chipBtn} ${accessFilter === 'paid' ? styles.chipBtnActive : ''}`} onClick={() => setAccessFilter(f => f === 'paid' ? 'all' : 'paid')} aria-pressed={accessFilter === 'paid'}>اشتراکی</button>
          <button type="button" className={`${styles.chipBtn} ${favoritesOnly ? styles.chipBtnActive : ''}`} onClick={() => setFavoritesOnly(v => !v)} aria-pressed={favoritesOnly}>لیست من</button>
        </div>
      </div>
      {(subjectFilter !== 'همه' || gradeFilter !== 'همه' || accessFilter !== 'all' || favoritesOnly || searchTerm || sortOption !== 'newest') && (
        <button className={styles.clearBtn} onClick={onClear}>حذف فیلترها</button>
      )}
    </div>
  );
}
