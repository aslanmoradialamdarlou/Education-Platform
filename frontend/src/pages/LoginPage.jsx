import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import LoginWithPassword from '../components/Login/LoginWithPassword';
import LoginWithCode from '../components/Login/LoginWithCode';
import styles from '../components/Login/Login.module.css';

const LoginPage = () => {
    const [activeTab, setActiveTab] = useState('password');

    // Set a default theme for the login page
    useEffect(() => {
    // Stable theme; do not alter body dataset by page
    }, []);

    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const next = params.get('next') || '/home';

    return (
        <div className={styles.loginPage}>
            <div className={styles.loginBox}>
                <h1 className={styles.logo}>Elmino</h1>
                <h2 className={styles.title}>به پلتفرم المینو خوش آمدید</h2>
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'password' ? styles.active : ''}`}
                        onClick={() => setActiveTab('password')}
                    >
                        ورود با رمز عبور
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'code' ? styles.active : ''}`}
                        onClick={() => setActiveTab('code')}
                    >
                        ورود با کد یکبار مصرف
                    </button>
                </div>
                {activeTab === 'password' ? <LoginWithPassword /> : <LoginWithCode />}
                <div className={styles.authSwitch}>
                    حساب کاربری ندارید؟{' '}
                    <Link to={`/signup?next=${encodeURIComponent(next)}`}>ثبت نام کنید</Link>
                </div>
                <div className={styles.guestLink}>
                    <Link to={next}>ادامه به عنوان مهمان</Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
