import React from 'react';
import { Check } from 'lucide-react';
import styles from './Features.module.css';
import useReveal from '../guest/useReveal';

export default function Features() {
  const { ref, visible } = useReveal();
  return (
    <section id="features" ref={ref} className={`${styles.features} reveal ${visible ? 'show' : ''}`}>
      <div className={styles.container}>
        <div className={styles.wrap}>
          <div className={styles.content}>
            <h2>چرا المنو؟</h2>
            <p className={styles.lead}>
              المنو همه چیز را برای یادگیری مؤثر کنار هم می‌آورد: بانک سوالات طبقه‌بندی‌شده، ویدیوهای آموزشی کوتاه و کاربردی،
              و جزوه‌های خلاصه برای مرور سریع. با فیلترهای هوشمند و مسیرهای پیشنهادی، دقیقاً همان محتوایی را می‌بینید که به پیشرفت شما کمک می‌کند.
            </p>
            <p className={styles.more}>
              چه در حال آمادگی برای امتحان باشید و چه بخواهید مهارت خود را در هر مبحث تقویت کنید، با المنو می‌توانید برنامه‌ریزی کنید، تمرین کنید و نتیجه بگیرید.
            </p>
            <ul className={styles.chips} aria-label="امکانات موجود">
              <li className={styles.chip}><Check size={16} /> بانک سوالات طبقه‌بندی‌شده</li>
              <li className={styles.chip}><Check size={16} /> ویدیوهای آموزشی کوتاه</li>
              <li className={styles.chip}><Check size={16} /> جزوه‌های خلاصه و کاربردی</li>
              <li className={styles.chip}><Check size={16} /> فیلترهای هوشمند و جستجو</li>
              <li className={styles.chip}><Check size={16} /> پیگیری پیشرفت</li>
              <li className={styles.chip}><Check size={16} /> ثبت‌نام رایگان</li>
            </ul>
          </div>
          <div className={styles.media}>
            <img
              src="/images/8th-grade.png"
              alt="نمونه‌ای از محتوای آموزشی المنو"
              className={styles.image}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
