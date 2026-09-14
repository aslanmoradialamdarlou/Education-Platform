import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, MessageCircle, Heart } from 'lucide-react';
import styles from './ArchiveSection.module.css';

// No mock fallback here to ensure Home screen shows only real posts

const ArchiveSection = ({ filters, cards, allUrl, loading = false }) => {
    const [filter, setFilter] = useState('latest');
    const navigate = useNavigate();
    const hasApi = Array.isArray(cards) && cards.length > 0;
    
    // Always show all filters, even during loading
    const useFilters = (Array.isArray(filters) && filters.length > 0) ? filters : [
        { key: 'latest', label: 'جدیدترین' },
        { key: 'hot', label: 'داغ' },
        { key: 'grade_7', label: 'هفتم' },
        { key: 'grade_8', label: 'هشتم' },
        { key: 'grade_9', label: 'نهم' },
    ];

    const uiCards = useMemo(() => {
        if (!hasApi) return [];
        return cards.map(c => ({
            id: c.id,
            category: c.category || 'latest', // Use category from API or default to 'latest'
            img: c.img,
            title: c.title,
            comments: c.comments ?? 0,
            likes: c.likes ?? 0,
            slug: c.slug,
            url: c.url,
        }));
    }, [hasApi, cards]);

    const filteredContent = uiCards.filter(card => filter === 'latest' || card.category === filter);

    return (
        <section className={styles.archiveSection} aria-labelledby="archive-title">
            <div className={styles.archiveHeader}>
                <h2 id="archive-title">آرشیو مطالب</h2>
                <nav className={styles.filterNav} role="navigation">
                    {useFilters.map(f => (
                        <button 
                            key={f.key}
                            className={`${styles.filterBtn} ${filter === f.key ? styles.active : ''}`}
                            onClick={() => setFilter(f.key)}
                        >
                            {f.label}
                        </button>
                    ))}
                </nav>
            </div>

                                    <div className={styles.archiveGrid}>
                                            {/* Show skeleton for remaining cards while loading */}
                                            {loading && Array.from({ length: Math.max(0, 6 - (filteredContent.length || 0)) }).map((_, i) => (
                                                <div key={`sk-${i}`} className={styles.skeletonCard}>
                                                    <div className={styles.skelImage} />
                                                    <div className={styles.skelBody}>
                                                        <div className={styles.skelTitle} />
                                                        <div className={styles.skelFooter} />
                                                    </div>
                                                </div>
                                            ))}
                                            {/* Show loaded cards */}
                                            {filteredContent.map(card => (
                    <figure
                        className={styles.contentCard}
                        key={card.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/blogs/${card.id}`)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/blogs/${card.id}`); } }}
                        style={{ cursor: 'pointer' }}
                    >
                        {card.img ? (
                            <div className={styles.imageWrap} aria-hidden="true">
                                <img
                                    src={card.img}
                                    alt={card.title}
                                    loading="lazy"
                                    onError={(e) => { try { e.currentTarget.style.display = 'none'; } catch (err) { void err; } }}
                                />
                            </div>
                        ) : (
                            <div className={styles.imageWrap} aria-hidden="true" style={{ 
                                background: 'var(--bg-main)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                color: 'var(--text-secondary)',
                                fontSize: '0.85rem'
                            }}>
                                {/* Empty placeholder to maintain card height */}
                            </div>
                        )}
                        <figcaption>
                            <h5>{card.title}</h5>
                            <div className={styles.cardFooter}>
                                <span><Bookmark size={16}/></span>
                                <span><MessageCircle size={16}/> {card.comments}</span>
                                <span><Heart size={16}/> {card.likes}</span>
                            </div>
                        </figcaption>
                    </figure>
                                            ))}
                                            {/* Show empty state only when done loading and no cards */}
                                            {!loading && filteredContent.length === 0 && (
                                                <div className={styles.emptyState}>مطلبی یافت نشد.</div>
                                            )}
            </div>
            {allUrl && (
                <div className={styles.moreLinkWrap}>
                    <button className={styles.moreLink} onClick={() => navigate(allUrl)}>مشاهده همه</button>
                </div>
            )}
        </section>
    );
};

export default ArchiveSection;
