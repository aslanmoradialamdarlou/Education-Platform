import React, { useState, useEffect, useRef } from 'react';
import { Timer } from 'lucide-react';
import SubscriptionPopover from './SubscriptionPopover';
import styles from './Header.module.css';

const SubscriptionProgress = ({ expiryDate, totalDurationInDays = 30 }) => {
    const [timeLeft, setTimeLeft] = useState({});
    const [isPopoverOpen, setPopoverOpen] = useState(false);
    const popoverRef = useRef(null);

    // Timer logic to update time left
    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +new Date(expiryDate) - +new Date();
            let tempTimeLeft = {};
            if (difference > 0) {
                tempTimeLeft = {
                    months: Math.floor(difference / (1000 * 60 * 60 * 24 * 30)),
                    days: Math.floor((difference / (1000 * 60 * 60 * 24)) % 30),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                };
            }
            return tempTimeLeft;
        };

        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
        return () => clearInterval(timer);
    }, [expiryDate]);

    // Logic to close popover when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                setPopoverOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const totalDuration = totalDurationInDays * 24 * 60 * 60 * 1000;
    const timeRemainingMs = +new Date(expiryDate) - +new Date();
    const percentageLeft = Math.max(0, (timeRemainingMs / totalDuration) * 100);
    const circumference = 2 * Math.PI * 18;
    const strokeDashoffset = circumference - (percentageLeft / 100) * circumference;

    return (
        <div className={styles.progressContainer} ref={popoverRef}>
            <button className={styles.progressButton} onClick={() => setPopoverOpen(!isPopoverOpen)}>
                <svg className={styles.progressSvg} viewBox="0 0 40 40">
                    <circle className={styles.progressBg} cx="20" cy="20" r="18" />
                    <circle
                        className={styles.progressBar}
                        cx="20"
                        cy="20"
                        r="18"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                    />
                </svg>
                <Timer size={18} className={styles.progressIcon} />
            </button>
            {isPopoverOpen && <SubscriptionPopover timeLeft={timeLeft} />}
        </div>
    );
};

export default SubscriptionProgress;
