import React from 'react';
import { Link } from 'react-router-dom';
import styles from './guest.module.css';

export default function PreviewCard({ title, to, onClick, badge = 'پیش‌نمایش' }) {
  return (
    <Link to={to} className={styles.card} onClick={onClick}>
      <span className={styles.cardTitle}>{title}</span>
      {badge && <span className={styles.badge}>{badge}</span>}
    </Link>
  );
}
