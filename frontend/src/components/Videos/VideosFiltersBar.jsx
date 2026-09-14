import React from 'react';
import styles from './VideosFiltersBar.module.css';

// Props: gradeFilter, setGradeFilter, chapterFilter, setChapterFilter, accessFilter, setAccessFilter,
// searchTerm, setSearchTerm, favoritesOnly, setFavoritesOnly, sortOption, setSortOption, onClear,
// derived lists: grades, chapters
export default function VideosFiltersBar(props) {
  const {
    gradeFilter, setGradeFilter,
    chapterFilter, setChapterFilter,
    accessFilter, setAccessFilter,
    searchTerm, setSearchTerm,
    favoritesOnly, setFavoritesOnly,
    sortOption, setSortOption,
    onClear,
    grades, chapters,
  } = props;

  return (
    <div className={styles.bar}>
      {/* row is display:contents for simplified layout */}
      <div className={styles.row}>
        <div className={`${styles.group} ${styles.groupWide}`}>
          <label>جستجو</label>
          <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="عنوان..." type="text" />
        </div>
        <div className={styles.group}>
          <label>پایه</label>
          <select value={gradeFilter} onChange={e=>setGradeFilter(e.target.value)}>
            <option value="همه">همه</option>
            {grades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div className={styles.group}>
          <label>فصل</label>
          <select value={chapterFilter} onChange={e=>setChapterFilter(e.target.value)}>
            <option value="همه">همه</option>
            {chapters.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className={styles.group}>
          <label>مرتب‌سازی</label>
          <select value={sortOption} onChange={e=>setSortOption(e.target.value)}>
            <option value="newest">جدیدترین</option>
            <option value="popular">محبوب‌ترین</option>
            <option value="duration">کوتاه‌ترین زمان</option>
            <option value="longest">طولانی‌ترین زمان</option>
          </select>
        </div>
        <div className={`${styles.group} ${styles.chipsGroup}`} style={{alignSelf:'flex-end'}}>
          <label style={{fontSize:'.7rem', color:'var(--text-secondary)'}}>دسترسی</label>
          <div className={styles.chipsRow}>
            <button type="button" className={`${styles.chipBtn} ${accessFilter === 'free' ? styles.chipBtnActive : ''}`} onClick={() => setAccessFilter(f => f === 'free' ? 'all' : 'free')} aria-pressed={accessFilter === 'free'}>رایگان</button>
            <button type="button" className={`${styles.chipBtn} ${accessFilter === 'premium' ? styles.chipBtnActive : ''}`} onClick={() => setAccessFilter(f => f === 'premium' ? 'all' : 'premium')} aria-pressed={accessFilter === 'premium'}>اشتراکی</button>
            <button type="button" className={`${styles.chipBtn} ${favoritesOnly ? styles.chipBtnActive : ''}`} onClick={() => setFavoritesOnly(v => !v)} aria-pressed={favoritesOnly}>لیست من</button>
          </div>
        </div>
        {(gradeFilter !== 'همه' || chapterFilter !== 'همه' || accessFilter !== 'all' || favoritesOnly || searchTerm || sortOption !== 'newest') && (
          <>
            <div style={{flexBasis:'100%', height:0}} />
            <button type="button" className={styles.clearBtn} onClick={onClear}>حذف فیلترها</button>
          </>
        )}
      </div>
    </div>
  );
}
