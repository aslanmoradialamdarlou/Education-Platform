import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Book, BookOpen, Calendar, TrendingUp, Award, ChevronLeft } from 'lucide-react';
import styles from './Profile.module.css';
import Favorites from './Favorites';
import { getMySubscriptions } from '../../api/subscriptionService';

const MyCourses = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubscription, setSelectedSubscription] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadSubscriptions();
    }, []);

    const loadSubscriptions = async () => {
        setLoading(true);
        try {
            const data = await getMySubscriptions();
            setSubscriptions(data || []);
        } catch (error) {
            console.error('Failed to load subscriptions:', error);
            // Use mock data on error for development
            setSubscriptions(getMockSubscriptions());
        } finally {
            setLoading(false);
        }
    };

    const getMockSubscriptions = () => [
        {
            id: 1,
            plan: {
                id: 1,
                name: 'اشتراک طلایی',
                slug: 'golden',
                description: 'دسترسی کامل به تمام محتوای سایت',
                type: 'golden',
            },
            start_date: '2025-09-01',
            end_date: '2026-09-01',
            status: 'active',
            token_quota: 500,
            tokens_used: 120,
        },
        {
            id: 2,
            plan: {
                id: 2,
                name: 'اشتراک نقره‌ای - علوم هفتم',
                slug: 'silver-science-7',
                description: 'دسترسی به تمام محتوای کتاب علوم پایه هفتم',
                type: 'silver',
            },
            book: {
                id: 1,
                title: 'علوم تجربی',
                grade: 'هفتم',
            },
            start_date: '2025-10-01',
            end_date: '2026-04-01',
            status: 'active',
            token_quota: 200,
            tokens_used: 45,
        },
        {
            id: 3,
            plan: {
                id: 3,
                name: 'اشتراک برنزی - فصل ۱ ریاضی هفتم',
                slug: 'bronze-math-7-ch1',
                description: 'دسترسی به محتوای فصل ۱ کتاب ریاضی پایه هفتم',
                type: 'bronze',
            },
            book: {
                id: 2,
                title: 'ریاضی',
                grade: 'هفتم',
            },
            chapter: {
                id: 1,
                title: 'فصل ۱: مجموعه‌ها',
            },
            start_date: '2025-11-01',
            end_date: '2025-12-01',
            status: 'active',
            token_quota: 50,
            tokens_used: 12,
        },
    ];

    const getPlanIcon = (type) => {
        switch (type) {
            case 'golden':
                return <Crown size={24} />;
            case 'silver':
                return <Book size={24} />;
            case 'bronze':
                return <BookOpen size={24} />;
            default:
                return <Award size={24} />;
        }
    };

    const getPlanColor = (type) => {
        switch (type) {
            case 'golden':
                return { bg: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', color: '#8B4513' };
            case 'silver':
                return { bg: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)', color: '#4A4A4A' };
            case 'bronze':
                return { bg: 'linear-gradient(135deg, #CD7F32 0%, #A0522D 100%)', color: '#4A2511' };
            default:
                return { bg: 'var(--accent-primary-solid)', color: 'white' };
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fa-IR').format(date);
    };

    const getDaysRemaining = (endDate) => {
        if (!endDate) return 0;
        const end = new Date(endDate);
        const now = new Date();
        const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
        return Math.max(0, diff);
    };

    const getSubscriptionTitle = (sub) => {
        if (sub.plan.type === 'golden') {
            return 'همه محتوا';
        } else if (sub.plan.type === 'silver' && sub.book) {
            return `${sub.book.title} - پایه ${sub.book.grade}`;
        } else if (sub.plan.type === 'bronze' && sub.book && sub.chapter) {
            return `${sub.book.title} - ${sub.chapter.title}`;
        }
        return sub.plan.name;
    };

    const getSubscriptionScope = (sub) => {
        if (sub.plan.type === 'golden') {
            return 'تمام پایه‌ها، تمام کتاب‌ها، تمام محتوا';
        } else if (sub.plan.type === 'silver' && sub.book) {
            return `تمام فصل‌های کتاب ${sub.book.title}`;
        } else if (sub.plan.type === 'bronze' && sub.chapter) {
            return `فقط ${sub.chapter.title}`;
        }
        return sub.plan.description || '';
    };

    if (selectedSubscription) {
        return (
            <div className={styles.subscriptionDetail}>
                <button 
                    className={styles.backButton}
                    onClick={() => setSelectedSubscription(null)}
                >
                    <ChevronLeft size={20} />
                    بازگشت به لیست اشتراک‌ها
                </button>
                {/* Detailed view can be implemented here */}
                <div className={styles.detailPlaceholder}>
                    <h3>جزئیات اشتراک</h3>
                    <p>این بخش می‌تواند شامل آمار استفاده، محتوای دسترسی‌پذیر و موارد دیگر باشد.</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Favorites Section */}
            <Favorites />

            {/* Subscriptions Section */}
            <section className={styles.contentSection} style={{ marginTop: '2rem' }}>
                <div className={styles.subscriptionSectionHeader}>
                    <h3 className={styles.sectionTitle}>اشتراک‌های من</h3>
                    {subscriptions.length > 0 && (
                        <span className={styles.subscriptionCount}>
                            {subscriptions.length} اشتراک فعال
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.spinner}></div>
                        <p>در حال بارگذاری اشتراک‌ها...</p>
                    </div>
                ) : subscriptions.length === 0 ? (
                    <div className={styles.emptySubscriptions}>
                        <Award size={64} strokeWidth={1.5} style={{ color: 'var(--text-tertiary)', marginBottom: '1rem' }} />
                        <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                            هنوز اشتراکی ندارید
                        </h4>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            با خرید اشتراک، به محتوای آموزشی دسترسی پیدا کنید
                        </p>
                        <button 
                            className={styles.buySubscriptionBtn}
                            onClick={() => navigate('/subscription')}
                        >
                            <Crown size={18} />
                            مشاهده پکیج‌ها
                        </button>
                    </div>
                ) : (
                    <div className={styles.subscriptionsGrid}>
                        {subscriptions.map(sub => {
                            const planStyle = getPlanColor(sub.plan.type);
                            const daysLeft = getDaysRemaining(sub.end_date);
                            const tokenProgress = sub.token_quota > 0 
                                ? ((sub.tokens_used || 0) / sub.token_quota) * 100 
                                : 0;

                            return (
                                <div key={sub.id} className={styles.subscriptionCard}>
                                    {/* Header with gradient */}
                                    <div 
                                        className={styles.subscriptionCardHeader}
                                        style={{ background: planStyle.bg }}
                                    >
                                        <div className={styles.subscriptionCardIcon} style={{ color: planStyle.color }}>
                                            {getPlanIcon(sub.plan.type)}
                                        </div>
                                        <div className={styles.subscriptionCardType}>
                                            <span style={{ color: planStyle.color }}>
                                                {sub.plan.type === 'golden' && 'طلایی'}
                                                {sub.plan.type === 'silver' && 'نقره‌ای'}
                                                {sub.plan.type === 'bronze' && 'برنزی'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className={styles.subscriptionCardContent}>
                                        <h4 className={styles.subscriptionCardTitle}>
                                            {getSubscriptionTitle(sub)}
                                        </h4>
                                        <p className={styles.subscriptionCardScope}>
                                            {getSubscriptionScope(sub)}
                                        </p>

                                        {/* Stats */}
                                        <div className={styles.subscriptionStats}>
                                            <div className={styles.statItem}>
                                                <Calendar size={16} />
                                                <span>{daysLeft} روز باقیمانده</span>
                                            </div>
                                            {sub.token_quota > 0 && (
                                                <div className={styles.statItem}>
                                                    <TrendingUp size={16} />
                                                    <span>{sub.tokens_used || 0} / {sub.token_quota} توکن</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Token Progress Bar */}
                                        {sub.token_quota > 0 && (
                                            <div className={styles.tokenProgress}>
                                                <div className={styles.tokenProgressLabel}>
                                                    <span>مصرف توکن</span>
                                                    <span>{tokenProgress.toFixed(0)}%</span>
                                                </div>
                                                <div className={styles.tokenProgressBar}>
                                                    <div 
                                                        className={styles.tokenProgressFill}
                                                        style={{ width: `${Math.min(tokenProgress, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Dates */}
                                        <div className={styles.subscriptionDates}>
                                            <div className={styles.dateItem}>
                                                <span className={styles.dateLabel}>شروع:</span>
                                                <span>{formatDate(sub.start_date)}</span>
                                            </div>
                                            <div className={styles.dateItem}>
                                                <span className={styles.dateLabel}>پایان:</span>
                                                <span>{formatDate(sub.end_date)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className={styles.subscriptionCardFooter}>
                                        <button
                                            className={styles.viewContentBtn}
                                            onClick={() => {
                                                // Navigate based on plan type
                                                if (sub.plan.type === 'golden') {
                                                    window.location.href = '/videos';
                                                } else if (sub.plan.type === 'silver') {
                                                    window.location.href = `/videos?book=${sub.book?.id}`;
                                                } else if (sub.plan.type === 'bronze') {
                                                    window.location.href = `/videos?chapter=${sub.chapter?.id}`;
                                                }
                                            }}
                                        >
                                            مشاهده محتوا
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </>
    );
};

export default MyCourses;
