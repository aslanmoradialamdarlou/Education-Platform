import React from 'react';
import styles from './Header.module.css';

const SubscriptionPopover = ({ timeLeft }) => {
    const timeParts = [
        { label: 'ماه', value: timeLeft.months },
        { label: 'روز', value: timeLeft.days },
        { label: 'ساعت', value: timeLeft.hours },
        { label: 'دقیقه', value: timeLeft.minutes },
        { label: 'ثانیه', value: timeLeft.seconds },
    ];

    return (
        <div className={styles.popover}>
            <div className={styles.popoverHeader}>زمان باقی‌مانده اشتراک</div>
            <div className={styles.popoverBody}>
                {timeParts.map(part => (
                    <div key={part.label} className={styles.timePart}>
                        <span className={styles.timeValue}>{(part.value || 0).toString().padStart(2, '0')}</span>
                        <span className={styles.timeLabel}>{part.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SubscriptionPopover;
