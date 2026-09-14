import React from 'react';
import styles from './Profile.module.css';

// Mock Data for billing history
const MOCK_INVOICES = [
    { id: 'ELM-1403-01', date: '۱۴۰۳/۰۵/۱۰', amount: 350000, status: 'موفق', description: 'خرید اشتراک طلایی' },
    { id: 'ELM-1402-12', date: '۱۴۰۲/۱۲/۲۵', amount: 50000, status: 'موفق', description: 'خرید اشتراک فصلی' },
    { id: 'ELM-1402-11', date: '۱۴۰۲/۱۱/۱۵', amount: 150000, status: 'ناموفق', description: 'خرید اشتراک پایه' },
];

const Billing = () => {
    return (
        <section className={styles.contentSection}>
            <h3 className={styles.sectionTitle}>فاکتورهای مالی</h3>
            <div className={styles.tableContainer}>
                <table className={styles.billingTable}>
                    <thead>
                        <tr>
                            <th>شماره فاکتور</th>
                            <th>تاریخ</th>
                            <th>مبلغ (تومان)</th>
                            <th>وضعیت</th>
                            <th>توضیحات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {MOCK_INVOICES.map(invoice => (
                            <tr key={invoice.id}>
                                <td data-label="شماره فاکتور">{invoice.id}</td>
                                <td data-label="تاریخ">{invoice.date}</td>
                                <td data-label="مبلغ">{invoice.amount.toLocaleString('fa-IR')}</td>
                                <td data-label="وضعیت">
                                    <span className={`${styles.statusBadge} ${invoice.status === 'موفق' ? styles.statusSuccess : styles.statusFailed}`}>
                                        {invoice.status}
                                    </span>
                                </td>
                                <td data-label="توضیحات">{invoice.description}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default Billing;
