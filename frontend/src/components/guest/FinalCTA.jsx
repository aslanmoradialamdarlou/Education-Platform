import React from 'react';
import { Button } from '@mui/material';
import { Check } from 'lucide-react';
import styles from './FinalCTA.module.css';
import useReveal from '../guest/useReveal';

export default function FinalCTA({ onSignup }) {
  const { ref, visible } = useReveal();
  return (
    <section id="cta" ref={ref} className={`${styles.section} reveal ${visible ? 'show' : ''}`}>
      <div className={styles.cta}>
        <div className={styles.wrap}>
          <div className={styles.content}>
            <h2>شروع سریع در ۳ قدم</h2>
            <p className={styles.lead}>ثبت‌نام رایگان است و کمتر از یک دقیقه زمان می‌برد. همین حالا شروع کن و مسیر یادگیری‌ات را روشن کن.</p>
            <ul className={styles.steps} aria-label="مراحل سریع">
              <li className={styles.step}><span className={styles.bullet}><Check size={14} /></span> ثبت‌نام سریع</li>
              <li className={styles.step}><span className={styles.bullet}><Check size={14} /></span> انتخاب پایه و مباحث</li>
              <li className={styles.step}><span className={styles.bullet}><Check size={14} /></span> شروع یادگیری هدفمند</li>
            </ul>
            <Button variant="contained" size="large" onClick={onSignup} className={styles.btn}>ثبت نام رایگان</Button>
          </div>
          <div className={styles.media}>
            <img
              src="/images/9th-grade.png"
              alt="شروع سریع در المنو"
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
