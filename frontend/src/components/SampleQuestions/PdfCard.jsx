import React from 'react';
import { FileText, Lock, Download, Crown, Eye, Plus, Heart, Check } from 'lucide-react';
import RatingStars from './RatingStars';
import styles from './SampleQuestions.module.css';

const PdfCard = ({
    pdf,
    user,
    onPreview,
    onToggleFavorite,
    isFavorite,
    onDownload,
    ratingValue,
    onRate,
    inStudyList = false,
    onToggleStudy
}) => {
    const isLocked = !pdf.isFree && !user.hasSubscription;

    const handleDownload = () => {
        if (isLocked) return; // guard
        if (onDownload) {
            onDownload(pdf.id, pdf.title);
        }
    };

    return (
        <div className={`${styles.pdfCard} ${isLocked ? styles.locked : ''}`}>
            {isLocked && <div className={styles.lockIcon}><Lock size={18} /></div>}
            {!pdf.isFree && !isLocked && <div className={styles.premiumBadge}><Crown size={14} /></div>}
            {pdf.tokenCost && isLocked && (
                <div className={styles.tokenBadge}>{pdf.tokenCost} توکن</div>
            )}
            <div className={styles.cardIcon}><FileText size={40} /></div>
            <h3 className={styles.cardTitle}>{pdf.title}</h3>
            <p className={styles.cardMeta}>{pdf.pages} صفحه • {pdf.subject} • بازدید {pdf.viewCount}</p>
            <div style={{display:'flex', justifyContent:'center', marginTop:'-.5rem', marginBottom:'.5rem'}}>
                <RatingStars value={ratingValue} average={pdf.averageRating} onRate={onRate} compact size={14} />
            </div>
            <div className={styles.hoverActions}>
                <button type="button" onClick={() => onPreview && onPreview(pdf)} title="پیش‌نمایش" className={styles.hovBtn}><Eye size={16} /></button>
                <button
                    type="button"
                    onClick={() => onToggleFavorite && onToggleFavorite(pdf.id)}
                    title={isFavorite ? 'حذف از لیست من' : 'افزودن به لیست من'}
                    className={`${styles.hovBtn} ${isFavorite ? styles.favActive : ''}`}
                    aria-pressed={!!isFavorite}
                >
                    <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
                <button
                    type="button"
                    title={inStudyList ? 'حذف از لیست مطالعه' : 'افزودن به لیست مطالعه'}
                    aria-pressed={inStudyList}
                    onClick={() => onToggleStudy && onToggleStudy()}
                    className={`${styles.hovBtn} ${inStudyList ? styles.studyActive : ''}`}
                >
                    {inStudyList ? <Check size={16} /> : <Plus size={16} />}
                </button>
            </div>
            <div className={styles.cardActions}>
                {isLocked ? (
                    <button className={`${styles.btn} ${styles.btnSubscribe}`}>
                        <Crown size={16} />
                        ارتقا
                    </button>
                ) : (
                    <button className={`${styles.btn} ${styles.btnDownload}`} onClick={handleDownload}>
                        <Download size={16} />
                        دانلود{pdf.downloadCount ? ` (${pdf.downloadCount})` : ''}
                    </button>
                )}
            </div>
            {isLocked && <div className={styles.lockOverlay} />}
        </div>
    );
};

export default PdfCard;
