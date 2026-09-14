import React from 'react';
import { Gift, Star } from 'lucide-react';
import styles from './Subscription.v2.module.css';
import { formatPrice } from '../../utils/price';

const TokenPacks = ({ packs, onBuy }) => {
  return (
    <section className={styles.tokenPacksSection} aria-label="بسته‌های توکن">
      <div className={styles.tokenPacksHeader}>
        <h2 className={styles.tokenPacksTitle}>خرید بسته توکن</h2>
        <p className={styles.tokenPacksSubtitle}>هر زمان نیاز داشتید توکن بیشتری اضافه کنید.</p>
      </div>
      <div className={styles.tokenPacksGrid}>
        {packs.map(p => (
          <div key={p.id} className={`${styles.card} ${styles.tokenCard}`} style={{borderColor:p.bestValue?'#28a74555':undefined}}>
            <div className={`${styles.cardHeader} ${styles.tokenHeader}`}>
              <div className={styles.badgesRow}>
                {p.popular && <span className={`${styles.badge} ${styles.popular}`}><Star size={12}/> محبوب</span>}
                {p.bestValue && <span className={`${styles.badge} ${styles.saving}`}>به‌صرفه‌ترین</span>}
                {p.bonus>0 && <span className={`${styles.badge} ${styles.tokens}`}><Gift size={12}/> +{p.bonus} توکن هدیه</span>}
                {p.badgeLabel && !p.popular && !p.bestValue && (
                  <span className={styles.badge}>{p.badgeLabel}</span>
                )}
                {!p.popular && !p.bestValue && !p.badgeLabel && p.tokens === 100 && (
                  <span className={styles.badge}>شروع</span>
                )}
              </div>
              <h3 className={styles.tokenPackTitle}>{p.tokens.toLocaleString('fa-IR')} توکن</h3>
              {p.title && <p className={styles.tokenPackSubtitle}>{p.title}</p>}
              <div className={styles.priceWrap}>
                <p className={styles.tokenPackPrice}>{formatPrice(p.price)}</p>
              </div>
            </div>
            <div className={`${styles.cardFooter} ${styles.tokenCardFooter}`}>
              <button className={`${styles.purchaseBtn} ${styles.purchaseBtnMinimal}`} onClick={() => onBuy(p.id)} aria-label={`خرید بسته ${p.tokens} توکن`}>
                خرید این بسته
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TokenPacks;
