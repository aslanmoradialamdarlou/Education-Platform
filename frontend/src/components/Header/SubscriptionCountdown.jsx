import React, { useState, useEffect } from 'react';
import { Timer, AlertCircle } from 'lucide-react';
import styles from './Header.module.css';

const SubscriptionCountdown = ({ expiryDate }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(expiryDate) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    const [isExpired, setIsExpired] = useState(Object.keys(timeLeft).length === 0);

    useEffect(() => {
        const timer = setTimeout(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);
            if (Object.keys(newTimeLeft).length === 0) {
                setIsExpired(true);
            }
        }, 1000);

        return () => clearTimeout(timer);
    });

    // FIX: Default to 0 if the value is undefined to prevent crash
    const formatTime = (value) => (value || 0).toString().padStart(2, '0');

    if (isExpired) {
        return (
            <div className={`${styles.countdownTimer} ${styles.expired}`}>
                <AlertCircle size={18} />
                <span>اشتراک شما تمام شده</span>
            </div>
        )
    }

    return (
        <a href="#" className={styles.countdownTimer}>
            <Timer size={18} />
            <div className={styles.timeDisplay}>
                {timeLeft.days > 0 && <span>{timeLeft.days}d : </span>}
                <span>{formatTime(timeLeft.hours)}h : </span>
                <span>{formatTime(timeLeft.minutes)}m : </span>
                <span>{formatTime(timeLeft.seconds)}s</span>
            </div>
            <span className={styles.countdownLabel}>مانده</span>
        </a>
    );
};

export default SubscriptionCountdown;
