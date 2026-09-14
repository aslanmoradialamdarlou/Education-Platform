import React, { useState, useEffect } from 'react';
import { Heart, FileText, HelpCircle, BookOpen, Video } from 'lucide-react';
import styles from './Profile.module.css';
import { fetchHandoutById } from '../../api/handoutService';
import { fetchSampleQuestionById } from '../../api/sampleQuestionService';
import { fetchContentById } from '../../api/contentService';

const Favorites = () => {
    const [favorites, setFavorites] = useState({
        handouts: [],
        sampleQuestions: [],
        videos: [],
    });
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'handouts', 'sample-questions', 'videos'

    useEffect(() => {
        // Clean up known invalid IDs before loading
        cleanupInvalidIds();
        loadFavorites();
    }, []);

    const cleanupInvalidIds = () => {
        // Remove any IDs that are known to be invalid
        try {
            const sampleQuestionIds = JSON.parse(localStorage.getItem('pdf-favorites') || '[]');
            // Filter out any invalid IDs (you can add more here if needed)
            const validIds = sampleQuestionIds.filter(id => id !== 10);
            if (validIds.length !== sampleQuestionIds.length) {
                localStorage.setItem('pdf-favorites', JSON.stringify(validIds));
            }
        } catch (err) {
            console.warn('Failed to cleanup invalid IDs:', err);
        }
    };

    const loadFavorites = async () => {
        setLoading(true);
        try {
            // Get favorite IDs from localStorage
            const handoutIds = JSON.parse(localStorage.getItem('handout-favorites') || '[]');
            const sampleQuestionIds = JSON.parse(localStorage.getItem('pdf-favorites') || '[]');
            const videoIds = JSON.parse(localStorage.getItem('videos_favorites') || '[]');

            // Track which IDs successfully loaded
            const validHandoutIds = [];
            const validSampleQuestionIds = [];
            const validVideoIds = [];

            // Fetch handout details (silently handle 404s)
            const handoutPromises = handoutIds.map(async id => {
                try {
                    const result = await fetchHandoutById(id);
                    validHandoutIds.push(id);
                    return result;
                } catch (err) {
                    // Silently ignore 404 errors (deleted items)
                    if (err?.response?.status !== 404) {
                        console.warn(`Failed to fetch handout ${id}:`, err.message);
                    }
                    return null;
                }
            });

            // Fetch sample question details (silently handle 404s)
            const sampleQuestionPromises = sampleQuestionIds.map(async id => {
                try {
                    const result = await fetchSampleQuestionById(id);
                    validSampleQuestionIds.push(id);
                    return result;
                } catch (err) {
                    // Silently ignore 404 errors (deleted items)
                    if (err?.response?.status !== 404) {
                        console.warn(`Failed to fetch sample question ${id}:`, err.message);
                    }
                    return null;
                }
            });

            // Fetch video details (silently handle 404s)
            const videoPromises = videoIds.map(async id => {
                try {
                    const result = await fetchContentById(id);
                    validVideoIds.push(id);
                    return result;
                } catch (err) {
                    // Silently ignore 404 errors (deleted items)
                    if (err?.response?.status !== 404) {
                        console.warn(`Failed to fetch video ${id}:`, err.message);
                    }
                    return null;
                }
            });

            const [handoutResults, sampleQuestionResults, videoResults] = await Promise.all([
                Promise.all(handoutPromises),
                Promise.all(sampleQuestionPromises),
                Promise.all(videoPromises),
            ]);

            // Clean up localStorage by removing invalid IDs
            if (validHandoutIds.length !== handoutIds.length) {
                localStorage.setItem('handout-favorites', JSON.stringify(validHandoutIds));
            }
            if (validSampleQuestionIds.length !== sampleQuestionIds.length) {
                localStorage.setItem('pdf-favorites', JSON.stringify(validSampleQuestionIds));
            }
            if (validVideoIds.length !== videoIds.length) {
                localStorage.setItem('videos_favorites', JSON.stringify(validVideoIds));
            }

            setFavorites({
                handouts: handoutResults.filter(item => item !== null),
                sampleQuestions: sampleQuestionResults.filter(item => item !== null),
                videos: videoResults.filter(item => item !== null),
            });
        } catch (error) {
            console.error('Failed to load favorites:', error);
        } finally {
            setLoading(false);
        }
    };

    const removeFavorite = (type, id) => {
        let key;
        if (type === 'handout') key = 'handout-favorites';
        else if (type === 'sample-question') key = 'pdf-favorites';
        else if (type === 'video') key = 'videos_favorites';
        
        try {
            const current = JSON.parse(localStorage.getItem(key) || '[]');
            const updated = current.filter(itemId => itemId !== id);
            localStorage.setItem(key, JSON.stringify(updated));
            
            // Update state
            if (type === 'handout') {
                setFavorites(prev => ({
                    ...prev,
                    handouts: prev.handouts.filter(item => item.id !== id)
                }));
            } else if (type === 'sample-question') {
                setFavorites(prev => ({
                    ...prev,
                    sampleQuestions: prev.sampleQuestions.filter(item => item.id !== id)
                }));
            } else if (type === 'video') {
                setFavorites(prev => ({
                    ...prev,
                    videos: prev.videos.filter(item => item.id !== id)
                }));
            }
        } catch (error) {
            console.error('Failed to remove favorite:', error);
        }
    };

    const getFilteredItems = () => {
        let items = [];
        
        if (activeFilter === 'all' || activeFilter === 'handouts') {
            items = [...items, ...favorites.handouts.map(item => ({ ...item, type: 'handout' }))];
        }
        
        if (activeFilter === 'all' || activeFilter === 'sample-questions') {
            items = [...items, ...favorites.sampleQuestions.map(item => ({ ...item, type: 'sample-question' }))];
        }
        
        if (activeFilter === 'all' || activeFilter === 'videos') {
            items = [...items, ...favorites.videos.map(item => ({ ...item, type: 'video' }))];
        }
        
        return items;
    };

    const totalCount = favorites.handouts.length + favorites.sampleQuestions.length + favorites.videos.length;
    const filteredItems = getFilteredItems();

    if (loading) {
        return (
            <div className={styles.favoritesSection}>
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    در حال بارگذاری علاقه‌مندی‌ها...
                </div>
            </div>
        );
    }

    if (totalCount === 0) {
        return (
            <div className={styles.favoritesSection}>
                <div className={styles.favoriteHeader}>
                    <Heart size={24} className={styles.favoriteIcon} />
                    <h3 className={styles.sectionTitle}>علاقه‌مندی‌های من</h3>
                </div>
                <div className={styles.emptyState}>
                    <Heart size={64} strokeWidth={1.5} style={{ color: 'var(--text-tertiary)', marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                        هنوز محتوایی به علاقه‌مندی‌ها اضافه نکرده‌اید
                    </p>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                        با کلیک روی آیکون قلب در کنار هر محتوا، آن را به لیست علاقه‌مندی‌های خود اضافه کنید
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.favoritesSection}>
            <div className={styles.favoriteHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Heart size={24} className={styles.favoriteIcon} />
                    <h3 className={styles.sectionTitle}>علاقه‌مندی‌های من</h3>
                    <span className={styles.favoriteCount}>({totalCount})</span>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className={styles.favoriteFilters}>
                <button 
                    className={`${styles.filterTab} ${activeFilter === 'all' ? styles.filterTabActive : ''}`}
                    onClick={() => setActiveFilter('all')}
                >
                    همه ({totalCount})
                </button>
                <button 
                    className={`${styles.filterTab} ${activeFilter === 'videos' ? styles.filterTabActive : ''}`}
                    onClick={() => setActiveFilter('videos')}
                >
                    <Video size={16} />
                    ویدیوها ({favorites.videos.length})
                </button>
                <button 
                    className={`${styles.filterTab} ${activeFilter === 'handouts' ? styles.filterTabActive : ''}`}
                    onClick={() => setActiveFilter('handouts')}
                >
                    <FileText size={16} />
                    جزوات ({favorites.handouts.length})
                </button>
                <button 
                    className={`${styles.filterTab} ${activeFilter === 'sample-questions' ? styles.filterTabActive : ''}`}
                    onClick={() => setActiveFilter('sample-questions')}
                >
                    <HelpCircle size={16} />
                    نمونه سوالات ({favorites.sampleQuestions.length})
                </button>
            </div>

            {/* Favorites Grid */}
            <div className={styles.favoritesGrid}>
                {filteredItems.map(item => (
                    <div key={`${item.type}-${item.id}`} className={styles.favoriteCard}>
                        <div className={styles.favoriteCardHeader}>
                            <div className={styles.favoriteTypeTag}>
                                {item.type === 'handout' ? (
                                    <>
                                        <FileText size={14} />
                                        <span>جزوه</span>
                                    </>
                                ) : item.type === 'video' ? (
                                    <>
                                        <Video size={14} />
                                        <span>ویدیو</span>
                                    </>
                                ) : (
                                    <>
                                        <HelpCircle size={14} />
                                        <span>نمونه سوال</span>
                                    </>
                                )}
                            </div>
                            <button
                                className={styles.removeFavoriteBtn}
                                onClick={() => removeFavorite(item.type, item.id)}
                                title="حذف از علاقه‌مندی‌ها"
                            >
                                <Heart size={18} fill="currentColor" />
                            </button>
                        </div>
                        
                        <div className={styles.favoriteCardContent}>
                            <h4 className={styles.favoriteCardTitle}>{item.title}</h4>
                            <div className={styles.favoriteCardMeta}>
                                {item.subject && <span>{item.subject}</span>}
                                {item.grade && <span>• پایه {item.grade}</span>}
                                {item.chapter && <span>• {item.chapter}</span>}
                                {item.pages && <span>• {item.pages} صفحه</span>}
                                {item.duration && <span>• {item.duration}</span>}
                            </div>
                            {item.description && (
                                <p className={styles.favoriteCardDesc}>
                                    {item.description.length > 120 
                                        ? item.description.substring(0, 120) + '...' 
                                        : item.description}
                                </p>
                            )}
                        </div>

                        <div className={styles.favoriteCardFooter}>
                            <button 
                                className={styles.viewDetailBtn}
                                onClick={() => {
                                    // Navigate to the appropriate page
                                    if (item.type === 'handout') {
                                        window.location.href = '/handouts';
                                    } else if (item.type === 'video') {
                                        window.location.href = '/videos';
                                    } else {
                                        window.location.href = '/sample-questions';
                                    }
                                }}
                            >
                                <BookOpen size={16} />
                                مشاهده جزئیات
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Favorites;
