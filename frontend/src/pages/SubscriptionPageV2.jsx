import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import SubscriptionCardV2 from '../components/Subscription/SubscriptionCardV2';
import TokenPacks from '../components/Subscription/TokenPacks';
import PurchaseModal from '../components/Subscription/PurchaseModal';
import { GradeSelector, ChapterSelector } from '../components/Subscription/Selectors';
import styles from '../components/Subscription/Subscription.v2.module.css';
import { getSubscriptionPlans, initiatePurchaseSession, getTokenPacks, initiateTokenPurchase } from '../api/subscriptionService';

const MOCK_USER = { role: 'student', name: 'دانش‌آموز', avatar: 'https://i.pravatar.cc/40?u=student', hasSubscription: false, tokenCount: 120 };

const SubscriptionPageV2 = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalPlan, setModalPlan] = useState(null); // 'grade' | 'chapter'
    const [packs, setPacks] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState('8');
    const [selectedChapterGrade, setSelectedChapterGrade] = useState('7');
    const [selectedChapter, setSelectedChapter] = useState('فصل ۱');
    const navigate = useNavigate();

    // Ensure a default grade data-attribute (ThemeContext manages mode globally)
    // Stable theming: do not set body dataset here

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const [plansData, packsData] = await Promise.all([
                    getSubscriptionPlans(),
                    getTokenPacks(),
                ]);
                if (!cancelled) {
                    setPlans(plansData);
                    setPacks(packsData);
                }
            } catch (e) {
                if (!cancelled) setError('خطا در بارگذاری طرح‌ها');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const handlePurchaseClick = (planId) => {
        if (planId === 'grade' || planId === 'chapter') {
            setModalPlan(planId);
        } else {
            handleDirectCheckout(planId, {});
        }
    };

    const handleDirectCheckout = async (planId, scope) => {
        try {
            const plan = plans.find(p => p.id === planId);
            const session = await initiatePurchaseSession({ planId, scope });
            navigate(session.redirectUrl, { state: { planId, scope, plan } });
        } catch (e) {
            console.error(e);
            alert('ایجاد جلسه پرداخت ناموفق بود');
        }
    };

    const confirmScopedPurchase = async () => {
        if (modalPlan === 'grade') {
            await handleDirectCheckout('grade', { grade: selectedGrade });
        } else if (modalPlan === 'chapter') {
            await handleDirectCheckout('chapter', { grade: selectedChapterGrade, chapter: selectedChapter });
        }
        setModalPlan(null);
    };

    const handleBuyPack = async (packId) => {
        try {
            const session = await initiateTokenPurchase(packId);
            navigate(session.redirectUrl, { state: { tokenPack: packId } });
        } catch (e) {
            console.error(e);
            alert('ایجاد جلسه خرید بسته توکن ناموفق بود');
        }
    };

    return (
        <>
            <Header />
            <main>
                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>خرید اشتراک</h1>
                    <p className={styles.pageSubtitle}>با تهیه اشتراک، به دنیایی از محتوای آموزشی با کیفیت دسترسی پیدا کنید.</p>
                </div>
                <section style={{maxWidth:'880px',margin:'1rem auto',padding:'0 2rem'}} aria-label="راهنمای انتخاب طرح">
                    <div style={{display:'grid',gap:'1.25rem'}}>
                        <p style={{color:'var(--text-secondary)',lineHeight:1.6,fontSize:'.95rem'}}>
                            نمی‌دانید از کجا شروع کنید؟ اگر تازه می‌خواهید منظم درس بخوانید، با «اشتراک پایه» برای یک پایه مشخص شروع کنید. زمان کمی دارید یا فقط یک آزمون نزدیک است؟ «اشتراک فصلی» دقیقاً روی همان فصل تمرکز می‌دهد. اما اگر می‌خواهید بدون محدودیت در هر سه پایه جستجو کنید، مسیر طلایی موفق‌ها «اشتراک طلایی» است.
                        </p>
                        <ul style={{display:'flex',flexWrap:'wrap',gap:'0.75rem',listStyle:'none',padding:0,margin:0,fontSize:'.75rem'}}>
                            <li style={{background:'var(--bg-content)',border:'1px solid var(--border-color)',padding:'.4rem .7rem',borderRadius:'999px'}}>✔️ دسترسی کامل + توکن هدیه</li>
                            <li style={{background:'var(--bg-content)',border:'1px solid var(--border-color)',padding:'.4rem .7rem',borderRadius:'999px'}}>⚡ بدون تبلیغ و محدودیت زمانی</li>
                            <li style={{background:'var(--bg-content)',border:'1px solid var(--border-color)',padding:'.4rem .7rem',borderRadius:'999px'}}>🛡️ ضمانت ۷۲ ساعته بازگشت وجه</li>
                            <li style={{background:'var(--bg-content)',border:'1px solid var(--border-color)',padding:'.4rem .7rem',borderRadius:'999px'}}>🎯 مسیر یادگیری هدایت‌شده</li>
                        </ul>
                    </div>
                </section>
                {loading && (
                    <div style={{ textAlign: 'center', padding: '2rem' }} role="status" aria-live="polite">در حال بارگذاری...</div>
                )}
                {error && !loading && (
                    <div style={{ textAlign: 'center', color: 'var(--danger-color)' }}>{error}</div>
                )}
                {!loading && !error && (
                    <div className={styles.plansContainer}>
                        {plans.map(p => (
                            <SubscriptionCardV2 key={p.id} plan={p} onPurchaseClick={() => handlePurchaseClick(p.id)} />
                        ))}
                    </div>
                )}
                {!loading && !error && packs.length > 0 && (
                    <TokenPacks packs={packs} onBuy={handleBuyPack} />
                )}
                {!loading && !error && (
                    <section style={{maxWidth:'980px',margin:'1rem auto 4rem',padding:'0 2rem'}} aria-label="مقایسه سریع طرح‌ها">
                        <h2 style={{fontSize:'1.15rem',marginBottom:'1rem',color:'var(--text-primary)'}}>کدام طرح مناسب من است؟</h2>
                        <div style={{display:'grid',gap:'1.25rem'}}>
                            <div style={{display:'grid',gap:'.6rem'}}>
                                <div style={{display:'flex',flexWrap:'wrap',gap:'.5rem'}}> 
                                    <span style={{fontSize:'.8rem',background:'var(--bg-content)',border:'1px solid var(--border-color)',padding:'.35rem .65rem',borderRadius:'8px'}}>اشتراک فصلی: تمرکز سریع روی یک امتحان یا جبران عقب‌ماندگی یک فصل</span>
                                    <span style={{fontSize:'.8rem',background:'var(--bg-content)',border:'1px solid var(--border-color)',padding:'.35rem .65rem',borderRadius:'8px'}}>اشتراک پایه: مناسب برنامه‌ریزی میان‌مدت سال تحصیلی</span>
                                    <span style={{fontSize:'.8rem',background:'linear-gradient(135deg,#ffed9a,#ffc107)',color:'#533500',border:'1px solid #ffca2c',padding:'.35rem .65rem',borderRadius:'8px',fontWeight:600}}>اشتراک طلایی: دسترسی نامحدود + بیشترین صرفه‌جویی</span>
                                </div>
                            </div>
                            <ul style={{listStyle:'none',padding:0,margin:0,display:'grid',gap:'.75rem'}}>
                                <li style={{display:'flex',gap:'.5rem',fontSize:'.85rem'}}><strong style={{minWidth:'90px'}}>توکن هدیه:</strong> از ۵۰ تا ۱۰۰۰ توکن برای شروع سریع حل سوالات</li>
                                <li style={{display:'flex',gap:'.5rem',fontSize:'.85rem'}}><strong style={{minWidth:'90px'}}>صرفه‌جویی:</strong> طرح طلایی در مقایسه با خرید جداگانه سه پایه + فصول ارزان‌تر است.</li>
                                <li style={{display:'flex',gap:'.5rem',fontSize:'.85rem'}}><strong style={{minWidth:'90px'}}>مقیاس‌پذیری:</strong> اگر احتمال می‌دهید بعداً پایه‌های دیگر را هم نیاز دارید، مستقیم طلایی انتخاب کنید.</li>
                                <li style={{display:'flex',gap:'.5rem',fontSize:'.85rem'}}><strong style={{minWidth:'90px'}}>تمرکز:</strong> فقط یک آزمون نزدیک؟ فصلی. شروع جدی؟ پایه. هدف برتر؟ طلایی.</li>
                            </ul>
                            <div style={{marginTop:'.5rem',fontSize:'.75rem',opacity:.7}}>هنوز مردد هستید؟ با کوچک‌ترین قدم (فصل) شروع کنید؛ هر زمان ارتقا دادید مابه‌التفاوت هوشمند محاسبه می‌شود (قابل توسعه).</div>
                        </div>
                    </section>
                )}
            </main>
            {/* ThemeSwitcher handled globally in Header */}

            {modalPlan && (
                <PurchaseModal
                    title={`خرید اشتراک ${modalPlan === 'grade' ? 'پایه' : 'فصلی'}`}
                    onClose={() => setModalPlan(null)}
                    onConfirm={confirmScopedPurchase}
                >
                    {modalPlan === 'grade' && (
                        <div className="grade-selector-wrapper">
                            <GradeSelector selected={selectedGrade} onChange={setSelectedGrade} />
                        </div>
                    )}
                    {modalPlan === 'chapter' && (
                        <ChapterSelector
                            selectedGrade={selectedChapterGrade}
                            onGradeChange={setSelectedChapterGrade}
                            selectedChapter={selectedChapter}
                            onChapterChange={setSelectedChapter}
                        />
                    )}
                </PurchaseModal>
            )}
        </>
    );
};

export default SubscriptionPageV2;
