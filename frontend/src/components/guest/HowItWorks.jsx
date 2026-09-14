import React from 'react';
import { Check } from 'lucide-react';
import styles from './HowItWorks.module.css';
import useReveal from '../guest/useReveal';

export default function HowItWorks() {
  const { ref, visible } = useReveal();
  return (
    <section id="how" ref={ref} className={`${styles.how} reveal ${visible ? 'show' : ''}`}>
      <div className={styles.container}>
        <div className={styles.wrap}>
          <div className={styles.content}>
            <h2>چطور کار می‌کند؟</h2>
            <p className={styles.lead}>
              فقط با چند قدم ساده شروع کنید: ثبت‌نام سریع، انتخاب پایه و مبحث، و شروع یادگیری با محتوای هدفمند.
              هر مرحله طوری طراحی شده که کمترین زمان و بیشترین بازدهی را داشته باشد.
            </p>
            <ul className={styles.steps} aria-label="مراحل اصلی">
              <li><span className={styles.bullet}><Check size={14} /></span> ثبت نام سریع و ساده</li>
              <li><span className={styles.bullet}><Check size={14} /></span> انتخاب پایه و مباحث مورد نیاز</li>
              <li><span className={styles.bullet}><Check size={14} /></span> شروع تمرین و یادگیری هدفمند</li>
            </ul>
          </div>
          <div className={styles.media}>
            <div className={styles.imageBlob}>
              <img
                src="/images/7th-grade.png"
                alt="نمایی از روند یادگیری در المنو"
                className={styles.image}
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
