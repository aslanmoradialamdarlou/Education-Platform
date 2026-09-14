import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import styles from './GuestFooter.module.css';

export default function GuestFooter() {
  const year = useMemo(() => new Date().getFullYear(), []);
  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.content}>
        <section className={styles.section} aria-labelledby="gf-brand">
          <h3 id="gf-brand" className={styles.logo}>پلتفرم آموزشی</h3>
          <p>منابع آموزشی منتخب برای دانش‌آموزان؛ ویدیو، جزوه و بانک سوال در یک جا.</p>
        </section>
        <nav className={styles.section} aria-labelledby="gf-help">
          <h4 id="gf-help">راهنما و قوانین</h4>
          <ul className={styles.linkList}>
            <li><Link to="/support">پشتیبانی</Link></li>
            <li><Link to="/faq">سوالات متداول</Link></li>
            <li><Link to="/terms">قوانین و مقررات</Link></li>
            <li><Link to="/privacy">حریم خصوصی</Link></li>
            <li><Link to="/contact">تماس با ما</Link></li>
          </ul>
        </nav>
      </div>
      <div className={styles.bottom}>
        <span>© {year} | تمامی حقوق محفوظ است.</span>
      </div>
    </footer>
  );
}
