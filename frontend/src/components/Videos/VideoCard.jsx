import React from 'react';
import { PlayCircle, Lock, Crown, Heart, HeartOff } from 'lucide-react';
import styles from './Videos.module.css';

const VideoCard = ({
    video,
    user,
    isFavorite = false,
    onToggleFavorite,
}) => {
    // A video is accessible if it's free, or if the user has a subscription that covers it.
    const hasAccess = video.isFree || (user.hasSubscription && user.subscribedItems.includes(video.subscriptionId));

    return (
        <div
            className={styles.videoCard}
            role="group"
            aria-label={`ویدیو: ${video.title}`}
            tabIndex={0}
            onKeyDown={(e)=>{
                if(e.key==='Enter' || e.key===' ') {
                    e.preventDefault();
                    // Placeholder: navigate or open player if access
                }
            }}
        >
            <div className={styles.thumbnailContainer}>
                <img src={video.thumbnail} alt={video.title} />
                <div className={styles.overlay}>
                    {hasAccess ? (
                        <PlayCircle size={48} className={styles.playIcon} />
                    ) : (
                        <Lock size={32} className={styles.lockIcon} />
                    )}
                </div>
                {/* duration removed per design (we no longer show duration on the card) */}
                <div className={styles.cardQuickActions}>
                    <button
                        type="button"
                        className={`${styles.iconCircleBtn} ${isFavorite ? styles.iconCircleBtnActive : ''}`}
                        aria-pressed={isFavorite}
                        aria-label={isFavorite ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite && onToggleFavorite(video.id); }}
                    >
                        {isFavorite ? <Heart size={16} fill="currentColor" /> : <HeartOff size={16} />}
                    </button>
                </div>
            </div>
            <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                    {/* Show grade • book • chapter (fallbacks applied) */}
                    {/* <span className={styles.chapterTag}>{video.grade || 'نامشخص'} • {video.bookTitle || 'کتاب نامشخص'} • {video.chapter || 'فصل نامشخص'}</span> */}
                    <span className={styles.chapterTag}>{video.bookTitle || 'کتاب نامشخص'} • {video.chapter || 'فصل نامشخص'}</span>
                    {!video.isFree && (
                        <span className={`${styles.accessTag} ${hasAccess ? styles.unlocked : styles.locked}`}>
                            {hasAccess ? 'خریداری شده' : 'نیاز به اشتراک'}
                        </span>
                    )}
                </div>
                <h3 className={styles.cardTitle} id={`video-title-${video.id}`}>{video.title}</h3>
                <p className={styles.cardTeacher}>مدرس: {video.teacher}</p>
                {!hasAccess && (
                    <button className={styles.subscribeBtn}>
                        <Crown size={16} />
                        خرید اشتراک
                    </button>
                )}
            </div>
        </div>
    );
};

export default VideoCard;
