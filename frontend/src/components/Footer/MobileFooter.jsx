import React from 'react';
import { Link } from 'react-router-dom';
import styles from './MobileFooter.module.css';

export default function MobileFooter() {
  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.row}>
        <div className={styles.brand}>پلتفرم آموزشی</div>
        <nav className={styles.links} aria-label="لینک‌های سریع">
          <Link to="/subscription">اشتراک‌ها</Link>
          <Link to="/faq">سوالات متداول</Link>
          <Link to="/contact">تماس</Link>
        </nav>
      </div>
      <div className={styles.copy}>© {new Date().getFullYear()} | حقوق محفوظ است.</div>
    </footer>
  );
}
