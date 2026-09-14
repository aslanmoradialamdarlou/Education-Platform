import React from 'react';
import styles from './Profile.module.css';

const InfoRow = ({ label, value }) => (
    <div className={styles.infoRow}>
        <span className={styles.infoLabel}>{label}:</span>
        <span className={styles.infoValue}>{value}</span>
    </div>
);

export default InfoRow;
