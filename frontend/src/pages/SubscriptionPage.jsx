import React, { useState, useEffect } from 'react';
import Header from '../components/Header/Header';
import SubscriptionCard from '../components/Subscription/SubscriptionCard';
import { GradeSelector, ChapterSelector } from '../components/Subscription/Selectors';
import styles from '../components/Subscription/Subscription.module.css';

// Mock Data
const MOCK_PLANS = [
    { 
        id: 'grade', 
        title: 'اشتراک پایه', 
        price: 150000, 
        description: 'دسترسی کامل به محتوای یک پایه تحصیلی',
        features: ['بانک سوالات کامل پایه', 'جزوات و فیلم‌های آموزشی', 'نمونه سوالات امتحانی'],
        isFeatured: false 
    },
    { 
        id: 'golden', 
        title: 'اشتراک طلایی', 
        price: 350000, 
        description: 'دسترسی کامل به تمام محتوای سایت',
        features: ['تمام ویژگی‌های اشتراک پایه', 'دسترسی به محتوای هر سه پایه', 'پشتیبانی ویژه و اولویت‌دار'],
        isFeatured: true 
    },
    { 
        id: 'chapter', 
        title: 'اشتراک فصلی', 
        price: 50000, 
        description: 'دسترسی کامل به محتوای یک فصل',
        features: ['بانک سوالات فصل انتخابی', 'جزوات و فیلم‌های آموزشی فصل', 'نمونه سوالات مرتبط با فصل'],
        isFeatured: false 
    },
];

const MOCK_USER = { role: 'student', name: 'دانش‌آموز', avatar: 'https://i.pravatar.cc/40?u=student', hasSubscription: false };

const SubscriptionPage = () => {
    // Dark mode handled globally

    // Stable theming: do not set body dataset here

    return (
        <>
            <Header />
            <main>
                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>خرید اشتراک</h1>
                    <p className={styles.pageSubtitle}>
                        با تهیه اشتراک، به دنیایی از محتوای آموزشی با کیفیت دسترسی پیدا کنید.
                    </p>
                </div>
                <div className={styles.plansContainer}>
                    <SubscriptionCard plan={MOCK_PLANS[0]}>
                        <GradeSelector />
                    </SubscriptionCard>
                    <SubscriptionCard plan={MOCK_PLANS[1]} />
                    <SubscriptionCard plan={MOCK_PLANS[2]}>
                        <ChapterSelector />
                    </SubscriptionCard>
                </div>
            </main>
            {/* ThemeSwitcher provided globally */}
        </>
    );
};

export default SubscriptionPage;
