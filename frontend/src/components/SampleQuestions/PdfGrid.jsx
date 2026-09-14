import React, { useRef, useEffect } from 'react';
import useOfflineStatus from './useOfflineStatus';
import PdfCard from './PdfCard';
import styles from './SampleQuestions.module.css';

// NOTE: Converted to a named + default export to satisfy both import styles.
function PdfGrid({
  visible,
  loading,
  error,
  retryLoad,
  pageSize,
  canLoadMore,
  loadMore,
  currentUser,
  toggleFavorite,
  favorites,
  studyList,
  toggleInStudyList,
  registerDownload,
  ratings,
  ratePdf,
  openPreview
}) {
  const sentinelRef = useRef(null);
  const isOffline = useOfflineStatus();

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !canLoadMore) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) loadMore(); });
    }, { rootMargin: '120px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [canLoadMore, loadMore]);

  let errorMessage = null;
  if (error) {
    if (typeof error === 'string') errorMessage = error;
    else if (error.code === 'NETWORK_TEMP') errorMessage = error.message + ' - تلاش مجدد خودکار ممکن است کمک کند.';
    else errorMessage = error.message || 'خطای ناشناخته';
  }

  return (
    <div className={styles.pdfGrid}>
      {isOffline && (
        <div style={{gridColumn:'1 / -1', background:'var(--bg-content)', border:'1px solid var(--border-color)', padding:'.6rem .9rem', borderRadius:'12px', fontSize:'.7rem', display:'flex', alignItems:'center', gap:'.5rem'}}>
          <span style={{color:'var(--accent-primary-solid)'}}>●</span>
          <span>اتصال اینترنت قطع شده است. برخی عملکردها غیرفعال می‌شوند.</span>
        </div>
      )}
      {loading && Array.from({ length: pageSize }).map((_, i) => (
        <div key={i} className={styles.skelCard} aria-hidden="true">
          <div className={styles.skelIcon} />
          <div className={styles.skelLineShort} />
          <div className={styles.skelLine} />
          <div className={styles.skelBtn} />
        </div>
      ))}

      {!loading && !error && visible.map(pdf => (
        <PdfCard
          key={pdf.id}
          pdf={pdf}
          user={currentUser}
          onPreview={openPreview}
          onToggleFavorite={toggleFavorite}
          isFavorite={favorites.includes(pdf.id)}
          inStudyList={studyList.includes(pdf.id)}
          onToggleStudy={() => toggleInStudyList(pdf.id)}
          onDownload={registerDownload}
          ratingValue={ratings[pdf.id] || 0}
          onRate={(val) => ratePdf(pdf.id, val)}
        />
      ))}

      {!loading && !error && visible.length === 0 && (
        <div className={styles.emptyState}>موردی مطابق با فیلترها یافت نشد.</div>
      )}

      {error && !loading && (
        <div className={styles.errorState}>
          <div>{errorMessage}</div>
          {error?.transient && <div style={{fontSize:'.65rem'}}>در صورت پایدار بودن اختلال، چند ثانیه دیگر دوباره تلاش کنید.</div>}
          <button className={styles.retryBtn} onClick={retryLoad}>تلاش مجدد</button>
        </div>
      )}

      {canLoadMore && <div ref={sentinelRef} style={{ gridColumn: '1 / -1', height: '1px' }} />}

      {canLoadMore && !loading && !error && (
        <div style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: '-1rem' }}>
          <button onClick={loadMore} className={styles.clearBtn} style={{ fontSize: '.75rem' }}>نمایش بیشتر</button>
        </div>
      )}
    </div>
  );
}

export { PdfGrid };
export default PdfGrid;
