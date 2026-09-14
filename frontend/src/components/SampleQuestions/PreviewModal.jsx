import React, { useEffect } from 'react';
import RatingStars from './RatingStars';
import styles from './SampleQuestions.module.css';

export default function PreviewModal({ pdf, close, currentUser, ratings, ratePdf, previewModalRef, onDownload }) {
  // Body scroll lock
  useEffect(() => {
    if (!pdf) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [pdf]);

  const handleDownload = () => {
    if (onDownload && pdf) {
      onDownload(pdf.id, pdf.title);
    }
  };

  if (!pdf) return null;
  const isLocked = !pdf.isFree && !currentUser.hasSubscription;
  
  return (
    <div
      className={styles.previewOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`pdf-title-${pdf.id}`}
      aria-describedby={`pdf-desc-${pdf.id}`}
      onClick={e => { if (e.target === e.currentTarget) close(); }}
    >
      <div className={styles.previewModal} ref={previewModalRef}>
        <div className={styles.previewHeader}>
          <h2 id={`pdf-title-${pdf.id}`}>{pdf.title}</h2>
          <button onClick={close} className={styles.previewClose} aria-label="بستن">×</button>
        </div>
        <div className={styles.previewMeta}>
          <span>{pdf.subject}</span>
          <span>• پایه {pdf.grade}</span>
          <span>• {pdf.pages || 0} صفحه</span>
          <span>• بازدید {pdf.viewCount || 0}</span>
          {pdf.downloadCount > 0 && <span>• دانلود {pdf.downloadCount}</span>}
          {pdf.averageRating && <span>• امتیاز {pdf.averageRating.toFixed(1)}</span>}
        </div>
        <div style={{ padding: '0 .9rem' }}>
          <RatingStars
            value={ratings[pdf.id] || 0}
            average={pdf.averageRating || (ratings[pdf.id] || 0)}
            onRate={(v) => ratePdf(pdf.id, v)}
          />
        </div>
        <p id={`pdf-desc-${pdf.id}`} className={styles.previewDesc}>{pdf.description}</p>
        <div className={styles.previewThumbs}>
          {(pdf.samplePages || []).map((sp, i) => (
            <div key={i} className={styles.previewThumb}>صفحه {i + 1}</div>
          ))}
          {(!pdf.samplePages || pdf.samplePages.length === 0) && <div style={{ opacity: .6, fontSize: '.75rem' }}>پیش‌نمایشی موجود نیست</div>}
        </div>
        <div className={styles.previewActions}>
          {isLocked ? (
            <button className={styles.btnSubscribe}>ارتقا برای دسترسی</button>
          ) : (
            <button className={styles.btnDownload} onClick={handleDownload}>دانلود</button>
          )}
        </div>
      </div>
    </div>
  );
}
