import React from 'react';
import styles from './ShareChip.module.css';

const ShareChip = ({ icon, label, onClick, title }) => {
  return (
    <button className={styles.chip} onClick={onClick} title={title || label}>
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.label}>{label}</span>
    </button>
  );
};

export default ShareChip;
