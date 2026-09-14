import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Send, Youtube } from 'lucide-react';
import styles from './Footer.module.css';

const Footer = () => {
    const year = useMemo(() => new Date().getFullYear() + 621 - 1 /* rough jalali offset placeholder */ , []);

    return (
        <footer className={styles.siteFooter} role="contentinfo">
            <div className={styles.footerContent}>
                {/* Brand/Intro */}
                <section className={styles.footerSection} aria-labelledby="ft-brand">
                    <h3 id="ft-brand" className={styles.footerLogo}>پلتفرم آموزشی</h3>
                    <p>بهترین منابع آموزشی برای دانش‌آموزان؛ ویدیو، جزوه، بانک سوال و نمونه سوالات در یک جا.</p>
                    <div className={styles.social} aria-label="شبکه‌های اجتماعی">
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram size={18} /></a>
                        <a href="https://t.me" target="_blank" rel="noopener noreferrer" aria-label="Telegram"><Send size={18} /></a>
                        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><Youtube size={18} /></a>
                    </div>
                </section>

                {/* Content */}
                <nav className={styles.footerSection} aria-labelledby="ft-content">
                    <h4 id="ft-content">محتوا</h4>
                    <ul className={styles.linkList}>
                        <li><Link to="/blogs">وبلاگ</Link></li>
                        <li><Link to="/videos">ویدیوها</Link></li>
                        <li><Link to="/handouts">جزوه‌ها</Link></li>
                        <li><Link to="/questions">بانک سوال</Link></li>
                        <li><Link to="/sample-questions">نمونه سوالات</Link></li>
                    </ul>
                </nav>

                        {/* Account & Purchase */}
                <nav className={styles.footerSection} aria-labelledby="ft-account">
                    <h4 id="ft-account">خرید و حساب</h4>
                    <ul className={styles.linkList}>
                        <li><Link to="/subscription">اشتراک‌ها</Link></li>
                        <li><Link to="/login">ورود</Link></li>
                        <li><Link to="/signup">ثبت‌نام</Link></li>
                        <li><Link to="/profile">پروفایل</Link></li>
                    </ul>
                </nav>

                {/* Help & Legal */}
                <nav className={styles.footerSection} aria-labelledby="ft-help">
                    <h4 id="ft-help">راهنما و قوانین</h4>
                                            <ul className={styles.linkList}>
                                                <li><Link to="/support">پشتیبانی</Link></li>
                                    <li><Link to="/faq">سوالات متداول</Link></li>
                                    <li><Link to="/terms">قوانین و مقررات</Link></li>
                                    <li><Link to="/privacy">حریم خصوصی</Link></li>
                                    <li><Link to="/contact">تماس با ما</Link></li>
                                </ul>
                </nav>
            </div>

            <div className={styles.footerBottom}>
                <span>© {year} | تمامی حقوق برای پلتفرم آموزشی محفوظ است.</span>
            </div>
        </footer>
    );
};

export default Footer;
