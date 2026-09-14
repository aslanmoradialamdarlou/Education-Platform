import React from 'react';
import { CheckCircle } from 'lucide-react';
import styles from './Subscription.module.css';

const SubscriptionCard = ({ plan, children }) => {
    return (
        <div className={`${styles.card} ${plan.isFeatured ? styles.featured : ''}`}>
            <div className={styles.cardHeader}>
                <h3 className={styles.planTitle}>{plan.title}</h3>
                <p className={styles.planPrice}>
                    {plan.price.toLocaleString('fa-IR')}
                    <span> / سالانه</span>
                </p>
                <p className={styles.planDescription}>{plan.description}</p>
            </div>
            <div className={styles.cardBody}>
                {children}
                <ul className={styles.featureList}>
                    {plan.features.map((feature, index) => (
                        <li key={index}><CheckCircle size={16} /> {feature}</li>
                    ))}
                </ul>
            </div>
            <div className={styles.cardFooter}>
                <button className={styles.purchaseBtn}>خرید و فعال‌سازی</button>
            </div>
        </div>
    );
};

export default SubscriptionCard;
