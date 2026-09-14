import React from 'react';
import { FileText, Download, Crown, Eye, Heart, Plus, Check, Lock } from 'lucide-react';
import styles from './Handouts.module.css';

const HandoutCard = ({ 
    handout, 
    user, 
    onDownload,
    onPreview,
    onToggleFavorite,
    isFavorite,
    inStudyList = false,
    onToggleStudy
}) => {
    // چک دسترسی: رایگان است یا اشتراک دارد
    const hasAccess = handout.is_free || handout.isFree || (user?.hasSubscription && user?.subscribedItems?.includes(handout.subscriptionId));
    const isLocked = !hasAccess;
    
    // Normalize grade to key 7|8|9 regardless of input format
    const normalizeGradeKey = (g) => {
        if (g == null) return undefined;
        const str = String(g).trim();
        const faToEn = (s) => s.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
        const s = faToEn(str);
        if (s === '7' || s === '8' || s === '9') return s;
        const map = { 'هفتم': '7', 'هشتم': '8', 'نهم': '9' };
        return map[str] || undefined;
    };
    const gradeKey = normalizeGradeKey(handout.grade);

    const handleDownload = () => {
        if (isLocked) return;
        if (onDownload) {
            onDownload(handout.id, handout.title);
        }
    };

    return (
        <div className={`${styles.handoutCard} ${isLocked ? styles.locked : ''}`}>
            {isLocked && <div className={styles.lockIcon}><Lock size={18} /></div>}
            {!handout.is_free && !handout.isFree && !isLocked && <div className={styles.premiumBadge}><Crown size={14} /></div>}
            {handout.token_price > 0 && isLocked && (
                <div className={styles.tokenBadge}>{handout.token_price} توکن</div>
            )}
            <div className={styles.cardIcon}>
                <FileText size={40} />
            </div>
            <div className={styles.cardContent}>
                <div className={styles.cardTags}>
                    <span className={styles.chapterTag}>{handout.chapter}</span>
                    <span className={styles.gradeTag} data-grade={gradeKey}>
                        {handout.grade}
                    </span>
                </div>
                <h3 className={styles.cardTitle}>{handout.title}</h3>
                <p className={styles.cardMeta}>
                    {handout.pages || 0} صفحه • {handout.subject || 'عمومی'}
                    {handout.view_count > 0 && ` • بازدید ${handout.view_count}`}
                </p>
            </div>
            
            {/* Hover actions for desktop, always visible on mobile */}
            <div className={styles.hoverActions}>
                <button 
                    type="button" 
                    onClick={() => onPreview && onPreview(handout)} 
                    title="پیش‌نمایش" 
                    className={styles.hovBtn}
                >
                    <Eye size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => onToggleFavorite && onToggleFavorite(handout.id)}
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
                    onClick={() => onToggleStudy && onToggleStudy(handout.id)}
                    className={`${styles.hovBtn} ${inStudyList ? styles.studyActive : ''}`}
                >
                    {inStudyList ? <Check size={16} /> : <Plus size={16} />}
                </button>
            </div>
            
            <div className={styles.cardFooter}>
                {isLocked ? (
                    <button className={`${styles.btn} ${styles.btnSubscribe}`}>
                        <Crown size={16} />
                        {handout.token_price > 0 ? `خرید با ${handout.token_price} توکن` : 'خرید اشتراک'}
                    </button>
                ) : (
                    <button 
                        className={`${styles.btn} ${styles.btnDownload}`}
                        onClick={handleDownload}
                    >
                        <Download size={16} />
                        دانلود{handout.download_count > 0 ? ` (${handout.download_count})` : ''}
                    </button>
                )}
            </div>
            {isLocked && <div className={styles.lockOverlay} />}
        </div>
    );
};


export default HandoutCard;
