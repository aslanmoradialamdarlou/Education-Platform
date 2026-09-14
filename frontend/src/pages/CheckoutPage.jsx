import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSubscriptionPlans, getTokenPacks, createFreeCheckout } from '../api/subscriptionService';
import styles from '../components/Checkout/Checkout.module.css';
import { sanitizeInline } from '../utils/sanitize';
import { Check, Gift } from 'lucide-react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { useUser } from '../context/UserContext';

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshUser = () => {} } = useUser();
  const navState = location.state || {};
  const [resolvedPlan, setResolvedPlan] = useState(navState.plan || null);
  const [scope, setScope] = useState(navState.scope || {});
  const [tokenPack, setTokenPack] = useState(navState.tokenPack || null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  // Support direct entry via URL: /checkout?plan=grade&grade=8&chapter=... (optional)
  useEffect(() => {
    if (resolvedPlan) return; // already have plan from navigation state
    const params = new URLSearchParams(location.search);
  const planId = params.get('plan');
  const packId = params.get('tokenPack');
  if (!planId && !packId) return; // nothing to resolve
    const grade = params.get('grade') || undefined;
    const chapter = params.get('chapter') || undefined;
    setScope(prev => Object.keys(prev).length ? prev : { grade, chapter });
    let cancelled = false;
    (async () => {
      try {
        setLoadingPlan(true);
        if (packId) {
          const packs = await getTokenPacks();
          if (cancelled) return;
          const foundPack = packs.find(p => p.id === packId);
          setTokenPack(foundPack || { id: packId, tokens: 0, price: 0, bonus: 0 });
        }
        if (planId) {
          const all = await getSubscriptionPlans();
          if (cancelled) return;
          const found = all.find(p => p.id === planId);
          setResolvedPlan(found || null);
        }
      } catch (e) {
        console.error('Failed to load plan for checkout', e);
      } finally {
        if (!cancelled) setLoadingPlan(false);
      }
    })();
    return () => { cancelled = true; };
  }, [resolvedPlan, location.search]);

  const plan = resolvedPlan || {
    id: 'unknown',
    title: loadingPlan ? 'در حال بارگذاری...' : 'طرح نامشخص',
    price: 0,
    features: loadingPlan ? ['در حال واکشی اطلاعات طرح'] : ['اطلاعات طرح در دسترس نیست'],
    tokenBenefit: '',
  };
  const isTokenPack = !!(tokenPack);

  const gateways = [
    { id: 'pay1', name: 'درگاه ملی', logo: '<rect width="48" height="28" rx="4" fill="#fff"/>' },
    { id: 'pay2', name: 'پی‌لاین', logo: '<circle cx="14" cy="14" r="12" fill="#fff"/>' },
    { id: 'pay3', name: 'درگاه سریع', logo: '<rect x="6" y="6" width="36" height="16" rx="3" fill="#fff"/>' },
  ];

  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [applyMsg, setApplyMsg] = useState('');
  const [selectedGateway, setSelectedGateway] = useState(gateways[0].id);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // ensure this page uses the app's primary theme (matches other pages)
  // Stable theming: previously adjusted body dataset here; now no-op
    return () => {
  // No body dataset adjustments needed anymore
    };
  }, []);

  const handleApply = () => {
    if (!discountCode.trim()) {
      setApplyMsg('لطفا کد را وارد کنید.');
      return;
    }
    if (discountCode.trim().toLowerCase() === 'gold20') {
      setDiscountAmount(20000);
      setApplyMsg('تخفیف اعمال شد: ۲۰٬۰۰۰ تومان');
    } else if (discountCode.trim().toLowerCase() === 'welcome') {
      setDiscountAmount(10000);
      setApplyMsg('تخفیف اعمال شد: ۱۰٬۰۰۰ تومان');
    } else {
      setDiscountAmount(0);
      setApplyMsg('کد نامعتبر است');
    }
  };

  const subtotal = isTokenPack ? (tokenPack?.price || 0) : plan.price;
  const total = Math.max(0, subtotal - discountAmount);

  const handlePay = async () => {
    if (!plan || !plan.id) {
      alert('لطفاً یک پلن را انتخاب کنید');
      return;
    }

    setProcessing(true);
    try {
      const result = await createFreeCheckout(
        plan.id,
        discountCode.trim() || null
      );

      // Refresh user data to get updated subscription info
      await refreshUser();

      // Show success message
      alert(`پرداخت با موفقیت انجام شد!\nشناسه سفارش: ${result.order_id}\nاشتراک شما فعال شد.`);

      // Redirect to profile page or subscription success page
      navigate('/profile?tab=courses', { 
        state: { 
          orderSuccess: true,
          orderId: result.order_id 
        } 
      });
    } catch (error) {
      console.error('Checkout failed:', error);
      const errorMsg = error.response?.data?.message || 'خطا در پردازش سفارش. لطفاً دوباره تلاش کنید.';
      alert(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className={styles.page} style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
  <Header />
      <main className={styles.container}>
        <section className={styles.headerBlock}>
          <h1 className={styles.title}>تکمیل خرید</h1>
          <p className={styles.subtitle}>سفارش خود را بررسی و پرداخت را نهایی کنید.</p>
        </section>

        <div className={styles.grid}>
          <div className={styles.leftColumn}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>کد تخفیف</h3>
              <div className={styles.discountRow}>
                <input className={styles.input} value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} placeholder="کد تخفیف را وارد کنید" />
                <button className={styles.applyBtn} onClick={handleApply}>اعمال</button>
              </div>
              {applyMsg && <div className={styles.applyMsg}>{applyMsg}</div>}
            </div>

            <div className={styles.card} style={{ marginTop: 16 }}>
              <h3 className={styles.cardTitle}>انتخاب درگاه پرداخت</h3>
              <div className={styles.gatewayList} role="radiogroup">
                {gateways.map(g => (
                  <label key={g.id} className={`${styles.gatewayItem} ${selectedGateway === g.id ? styles.selected : ''}`}>
                    <input type="radio" name="gateway" value={g.id} checked={selectedGateway === g.id} onChange={() => setSelectedGateway(g.id)} />
                    <div className={styles.gatewayName}>{g.name}</div>
                    <div className={styles.gatewayLogo} aria-hidden dangerouslySetInnerHTML={{ __html: sanitizeInline(g.logo) }} />
                    <div className={styles.radioVisual} aria-hidden>
                      <span className={styles.radioOuter}>{selectedGateway === g.id && <span className={styles.radioInner} />}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <aside className={styles.rightColumn}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryHeader}>
                <h4>خلاصه سفارش</h4>
              </div>
              <div className={styles.priceList}>
                <div className={styles.row}><div>{isTokenPack ? 'بسته توکن' : 'اشتراک'}</div><div>{isTokenPack ? `${(tokenPack?.tokens||0).toLocaleString('fa-IR')} توکن` : (plan.title || plan.name)}</div></div>
                {scope.grade && <div className={styles.row}><div>پایه انتخابی</div><div>{scope.grade}</div></div>}
                {scope.chapter && <div className={styles.row}><div>فصل انتخابی</div><div>{scope.chapter}</div></div>}
                <div className={styles.row}><div>قیمت</div><div>{subtotal.toLocaleString()} تومان</div></div>
                <div className={styles.row}><div>تخفیف</div><div className={styles.discountVal} style={{ color: 'var(--success-color)' }}>-{discountAmount.toLocaleString()} تومان</div></div>
                <div className={styles.divider} />
                <div className={styles.totalRow}><div>مبلغ نهایی</div><div className={styles.totalPrice}>{total.toLocaleString()} تومان</div></div>
              </div>

              <div className={styles.featuresCard}>
                {!isTokenPack && plan.tokenBenefit && <div className={styles.tokenBadge}><Gift size={14} /> <span>{plan.tokenBenefit}</span></div>}
                <ul className={styles.featuresList}>
                  {isTokenPack ? (
                    <>
                      <li><Check size={14} className={styles.checkIcon} /> افزایش موجودی توکن‌ها</li>
                      <li><Check size={14} className={styles.checkIcon} /> بدون انقضا تا زمان مصرف</li>
                    </>
                  ) : (
                    Array.isArray(plan.features) && plan.features.map((f, i) => (
                      <li key={i}><Check size={14} className={styles.checkIcon} /> {f}</li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </aside>
        </div>

        <div className={styles.payRow}>
          <div className={styles.payWrapper}>
            <button className={styles.payBtn} onClick={handlePay} disabled={processing}>{processing ? 'در حال پرداخت...' : 'پرداخت و تکمیل خرید'}</button>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
};

export default CheckoutPage;
