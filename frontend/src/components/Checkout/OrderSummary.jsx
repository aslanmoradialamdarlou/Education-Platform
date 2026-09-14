import React from 'react';
import { Paper, Typography, Divider } from '@mui/material';
import { Ticket, CheckCircle } from 'lucide-react';
import styles from './Checkout.module.css';

const OrderSummary = ({ plan, discount, finalPrice }) => {
    return (
        <Paper className={styles.summaryCard}>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>خلاصه سفارش</Typography>
            <div className={styles.summaryRow}>
                <span>{plan.title}</span>
                <span>{plan.price.toLocaleString('fa-IR')} تومان</span>
            </div>
            <Divider sx={{ my: 1, borderColor: 'var(--border-color)' }} />
            <div className={styles.summaryRow}>
                <span>تخفیف</span>
                <span className={styles.discountAmount}>- {discount.toLocaleString('fa-IR')} تومان</span>
            </div>
            <Divider sx={{ my: 1, borderColor: 'var(--border-color)' }} />
            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                <Typography variant="h6">مبلغ نهایی</Typography>
                <Typography variant="h6">{finalPrice.toLocaleString('fa-IR')} تومان</Typography>
            </div>

            {/* New Detailed Section */}
            <div className={styles.planDetails}>
                {plan.tokenBenefit && (
                    <div className={styles.tokenBenefit}>
                        <Ticket size={20} />
                        <span>{plan.tokenBenefit}</span>
                    </div>
                )}
                {plan.features && (
                    <ul className={styles.featureList}>
                        {plan.features.map((feature, index) => (
                            <li key={index}>
                                <CheckCircle size={16} />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </Paper>
    );
};

export default OrderSummary;
