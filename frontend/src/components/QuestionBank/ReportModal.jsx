import React from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import styles from './QuestionBank.module.css';

const ReportModal = ({ onClose }) => {
    return ReactDOM.createPortal(
        <div className={styles.modalOverlay}>
            <div className={styles.modalBackdrop} onClick={onClose}></div>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>گزارش مشکل سوال</h3>
                    <button onClick={onClose} className={styles.closeModalBtn}><X /></button>
                </div>
                <div className={styles.modalBody}>
                    <p>لطفا نوع مشکل را انتخاب کنید:</p>
                    <div className={styles.reportOptions}>
                        <label><input type="radio" name="report" value="wrong-answer" /> پاسخ اشتباه است</label>
                        <label><input type="radio" name="report" value="ambiguous" /> صورت سوال مبهم است</label>
                        <label><input type="radio" name="report" value="image-issue" /> تصویر مشکل دارد</label>
                        <label><input type="radio" name="report" value="other" /> سایر موارد</label>
                    </div>
                    <textarea placeholder="توضیحات بیشتر (اختیاری)..." rows="4"></textarea>
                </div>
                <div className={styles.modalFooter}>
                    <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onClose}>انصراف</button>
                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={onClose}>ارسال گزارش</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ReportModal;
