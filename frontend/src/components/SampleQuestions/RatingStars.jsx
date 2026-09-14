import React from 'react';
import { Star } from 'lucide-react';
import styles from './SampleQuestions.module.css';

/**
 * RatingStars
 * props:
 *  - value: current user rating (1-5 or 0)
 *  - average: average rating (optional display)
 *  - onRate: function(newValue)
 *  - size: icon size
 */
const RatingStars = ({ value = 0, average, onRate, size = 16, readOnly = false, compact = false }) => {
  const stars = [1,2,3,4,5];
  return (
    <div className={styles.ratingWrapper} aria-label={average ? `امتیاز میانگین ${average.toFixed(1)}` : 'امتیاز'}>
      {stars.map(s => {
        const active = s <= value;
        return (
          <button
            key={s}
            type="button"
            className={`${styles.starBtn} ${active ? styles.starActive : ''}`}
            onClick={() => !readOnly && onRate && onRate(s)}
            aria-pressed={active}
            aria-label={`امتیاز ${s}`}
            disabled={readOnly}
          >
            <Star size={size} />
          </button>
        );
      })}
      {average != null && !compact && (
        <span className={styles.avgLabel}>{average.toFixed(1)}</span>
      )}
    </div>
  );
};

export default RatingStars;
