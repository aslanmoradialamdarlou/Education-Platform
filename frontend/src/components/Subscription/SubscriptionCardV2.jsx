import React from 'react';
import { CheckCircle, Gift, Star, ShieldCheck } from 'lucide-react';
import styles from './Subscription.v2.module.css';
import { formatPrice } from '../../utils/price';

// plan object expected extended shape (see subscriptionService.js):
// { id,title,price,billingPeriod,description,features[],cta,isFeatured,tokenBenefit,
//   originalPrice?, savingsPercent?, tagline?, badgeLabel?, highlightColor?, valueScore?, popular? }
// onPurchaseClick: callback invoked for button or keyboard activation
const SubscriptionCardV2 = ({ plan, onPurchaseClick }) => {
    const cardContent = (
        <div
            className={styles.card}
            role="group"
            aria-labelledby={`plan-${plan.id}-title`}
            aria-describedby={`plan-${plan.id}-desc`}
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onPurchaseClick();
                }
            }}
        >
            <div className={styles.cardHeader} style={plan.highlightColor ? { background: `linear-gradient(145deg, var(--bg-content) 60%, ${plan.highlightColor})` } : undefined}>
                <div className={styles.badgesRow}>
                    {plan.popular && <span className={`${styles.badge} ${styles.popular}`}><Star size={14}/> محبوب ترین</span>}
                    {plan.badgeLabel && !plan.popular && <span className={styles.badge}>{plan.badgeLabel}</span>}
                    {plan.savingsPercent && (
                        <span className={`${styles.badge} ${styles.saving}`}>صرفه‌جویی {plan.savingsPercent}%</span>
                    )}
                    {plan.tokenBenefit && (
                        <span className={`${styles.badge} ${styles.tokens}`}><Gift size={14} /> {plan.tokenBenefit}</span>
                    )}
                </div>
                <h3 id={`plan-${plan.id}-title`} className={styles.planTitle}>{plan.title}</h3>
                {plan.tagline && <div className={styles.planTagline}>{plan.tagline}</div>}
                <div className={styles.priceWrap}>
                    {plan.originalPrice && plan.originalPrice > plan.price && (
                        <span className={styles.originalPrice}>{formatPrice(plan.originalPrice)}</span>
                    )}
                    <p className={styles.planPrice}>
                        {formatPrice(plan.price)}
                        <span> {plan.billingPeriod === 'annual' ? '/ سالانه' : ''}</span>
                    </p>
                </div>
                <p id={`plan-${plan.id}-desc`} className={styles.planDescription}>{plan.description}</p>
            </div>
            <div className={styles.cardBody}>
                <ul className={styles.featureList}>
                    {plan.features.map((feature, index) => (
                        <li key={index}><CheckCircle size={16} /> {feature}</li>
                    ))}
                </ul>
                {/* {typeof plan.valueScore === 'number' && (
                    <div className={styles.valueMeter} aria-label="شاخص ارزش نسبت به قیمت">
                        <div className={styles.valueMeterBar} style={{ width: `${plan.valueScore}%` }} />
                        <span className={styles.valueMeterLabel}>ارزش {plan.valueScore}/100</span>
                    </div>
                )} */}
            </div>
            <div className={styles.cardFooter}>
                <button
                    onClick={onPurchaseClick}
                    className={styles.purchaseBtn}
                    aria-label={`انتخاب یا خرید ${plan.title}`}
                >
                    {plan.cta}
                </button>
                <div className={styles.guarantee}><ShieldCheck size={14}/> ضمانت بازگشت وجه تا ۷۲ ساعت</div>
            </div>
        </div>
    );

    if (plan.isFeatured) {
        return (
            <div className={styles.featuredContainer} id={`${plan.id}`}>
                {cardContent}
            </div>
        );
    }

    // Non-featured: apply tier styling (silver / bronze) based on plan id
    return (
        <div className={`${styles.tierContainer} ${styles['tier_'+plan.id]}`} id={`${plan.id}`}>
            {cardContent}
        </div>
    );
};

export default SubscriptionCardV2;
