import React from 'react';
import { Star } from 'lucide-react';
import styles from './Testimonials.module.css';
import useReveal from '../guest/useReveal';

const TESTIMONIALS = [
  { quote: 'با المنو برنامه‌ریزی درسم خیلی منظم‌تر شد.', name: 'سارا احمدی', role: 'دانش‌آموز پایه هشتم', rating: 5 },
  { quote: 'نمونه سوالات و جزوه‌ها بسیار کاربردی هستند.', name: 'رضا کریمی', role: 'معلم علوم', rating: 5 },
  { quote: 'فیلترهای بانک سوال واقعاً کمک‌کننده است.', name: 'مینا محمدی', role: 'دانش‌آموز پایه هفتم', rating: 5 },
  { quote: 'ویدیوهای کوتاه خیلی به فهم بهتر کمک کرد.', name: 'پارسا میرزایی', role: 'دانش‌آموز پایه نهم', rating: 5 },
];

function getInitials(name) {
  if (!name) return '؟';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0] || '؟';
  const first = parts[0]?.[0] || '';
  const last = parts[parts.length - 1]?.[0] || '';
  return (first + last) || '؟';
}

export default function Testimonials() {
  const { ref, visible } = useReveal();
  return (
    <section id="testimonials" ref={ref} className={`${styles.section} reveal ${visible ? 'show' : ''}`}>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <h2>کاربران چه می‌گویند؟</h2>
          <div className={styles.ratingRow} aria-label="میانگین امتیاز کاربران">
            <div className={styles.stars}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={16} fill="currentColor" />
              ))}
            </div>
            <span className={styles.ratingText}>۵ از ۵ • ۱۰۰+ بازخورد</span>
          </div>
        </header>

        <div className={styles.grid} role="list">
          {TESTIMONIALS.map((t, i) => (
            <figure key={i} className={styles.card} role="listitem">
              <figcaption className={styles.userRow}>
                <div className={styles.avatar} aria-hidden="true">{getInitials(t.name)}</div>
                <div className={styles.meta}>
                  <div className={styles.name}>{t.name}</div>
                  <div className={styles.role}>{t.role}</div>
                </div>
                <div className={styles.userStars} aria-label={`${t.rating} از ۵`}>
                  {Array.from({ length: t.rating }).map((_, idx) => (
                    <Star key={idx} size={14} fill="currentColor" />
                  ))}
                </div>
              </figcaption>
              <blockquote className={styles.quote}>“{t.quote}”</blockquote>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
