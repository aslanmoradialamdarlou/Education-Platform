import React from 'react';
import { Edit, Trash2, Download } from 'lucide-react';
import styles from './Profile.module.css';

const QuestionSetCard = ({ title, questionCount }) => {
    return (
        <div className={styles.questionSetCard}>
            <div className={styles.questionSetInfo}>
                <h4 className={styles.questionSetTitle}>{title}</h4>
                <p className={styles.questionSetCount}>{questionCount} سوال</p>
            </div>
            <div className={styles.questionSetActions}>
                <button className={styles.actionBtn} aria-label="Export"><Download size={18} /></button>
                <button className={styles.actionBtn} aria-label="Edit"><Edit size={18} /></button>
                <button className={`${styles.actionBtn} ${styles.deleteBtn}`} aria-label="Delete"><Trash2 size={18} /></button>
            </div>
        </div>
    );
};

export default QuestionSetCard;
