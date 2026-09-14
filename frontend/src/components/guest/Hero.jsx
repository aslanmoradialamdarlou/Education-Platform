import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Library, PlaySquare, FileText } from 'lucide-react';
import ThemeSwitcher from '../ThemeSwitcher/ThemeSwitcher';
import styles from './Hero.module.css';

export default function Hero({ onSignup }) {
  const { pathname, search } = useLocation();
  const next = encodeURIComponent(pathname + (search || ''));
  return (
    <section className={styles.hero}>
      <div className={styles.bg} aria-hidden />
      <div className={styles.overlay} aria-hidden />
      <div className={styles.inner}>
        <header className={styles.pageHeader} role="banner">
          <div className={styles.headerLeft}>
            <Link to="/home" className={styles.logo}>Elmino</Link>
          </div>
          <div className={styles.headerRight}>
            <ThemeSwitcher />
            <nav className={styles.headerActions} aria-label="Guest">
              <Link to={`/login?next=${next}`} className={styles.loginBtn}>ورود</Link>
              <Link to={`/signup?next=${next}`} className={styles.registerBtn}>ثبت نام رایگان</Link>
            </nav>
          </div>
        </header>
        <div className={styles.content}>
          <h1>مسیر یادگیری خود را هوشمند انتخاب کنید</h1>
          <p className={styles.subtitle}>دسترسی به هزاران نمونه سوال، ویدیوی آموزشی و جزوه برای پایه‌های هفتم، هشتم و نهم.</p>
          <p className={styles.inspire}>هر روز کمی بهتر شو. با تمرین‌های هدفمند و محتوای باکیفیت، پیشرفت قدم‌به‌قدم حس می‌شود.</p>

          <ul className={styles.chips} aria-label="ویژگی‌های اصلی">
            <li><Library size={16} /> بانک سوالات</li>
            <li><PlaySquare size={16} /> ویدیوهای آموزشی</li>
            <li><FileText size={16} /> جزوه‌های خلاصه</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
