import React, { useEffect } from 'react';
import styles from './Handouts.module.css';

export default function HandoutPreviewModal({ handout, close, currentUser, previewModalRef, onDownload }) {
  // Body scroll lock
  useEffect(() => {
    if (!handout) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [handout]);

  const handleDownload = () => {
    if (onDownload && handout) {
      onDownload(handout.id, handout.title);
    }
  };

  if (!handout) return null;
  
  const hasAccess = handout.is_free || (currentUser && currentUser.hasSubscription);
  const isLocked = !hasAccess;
  
  return (
    <div
      className={styles.previewOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`handout-title-${handout.id}`}
      aria-describedby={`handout-desc-${handout.id}`}
      onClick={e => { if (e.target === e.currentTarget) close(); }}
    >
      <div className={styles.previewModal} ref={previewModalRef}>
        <div className={styles.previewHeader}>
          <h2 id={`handout-title-${handout.id}`}>{handout.title}</h2>
          <button onClick={close} className={styles.previewClose} aria-label="بستن">×</button>
        </div>
        <div className={styles.previewMeta}>
          <span>{handout.subject}</span>
          {handout.grade && <span>• پایه {handout.grade}</span>}
          <span>• {handout.pages || 0} صفحه</span>
          <span>• بازدید {handout.view_count || 0}</span>
          {handout.download_count > 0 && <span>• دانلود {handout.download_count}</span>}
        </div>
        {handout.description && (
          <p id={`handout-desc-${handout.id}`} className={styles.previewDesc}>
            {handout.description}
          </p>
        )}
        <div className={styles.previewThumbs}>
          {(handout.sample_pages || []).map((sp, i) => (
            <div key={i} className={styles.previewThumb}>صفحه {i + 1}</div>
          ))}
          {(!handout.sample_pages || handout.sample_pages.length === 0) && (
            <div style={{ opacity: .6, fontSize: '.75rem' }}>پیش‌نمایشی موجود نیست</div>
          )}
        </div>
        <div className={styles.previewActions}>
          {isLocked ? (
            <button className={styles.btnSubscribe}>
              {handout.token_price > 0 
                ? `خرید با ${handout.token_price} توکن` 
                : 'ارتقا برای دسترسی'}
            </button>
          ) : (
            <button className={styles.btnDownload} onClick={handleDownload}>دانلود</button>
          )}
        </div>
      </div>
    </div>
  );
}
