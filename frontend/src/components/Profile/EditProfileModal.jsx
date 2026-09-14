import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import styles from './EditProfileModal.module.css';

const EditProfileModal = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState(user);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return ReactDOM.createPortal(
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>ویرایش اطلاعات پروفایل</h3>
                    <button onClick={onClose} className={styles.closeButton}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className={styles.editForm}>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label htmlFor="firstName">نام</label>
                            <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="lastName">نام خانوادگی</label>
                            <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="grade">پایه تحصیلی</label>
                            <select id="grade" name="grade" value={formData.grade} onChange={handleChange}>
                                <option value="هفتم">هفتم</option>
                                <option value="هشتم">هشتم</option>
                                <option value="نهم">نهم</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="gender">جنسیت</label>
                            <select id="gender" name="gender" value={formData.gender} onChange={handleChange}>
                                <option value="مرد">مرد</option>
                                <option value="زن">زن</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="state">استان</label>
                            <input type="text" id="state" name="state" value={formData.state} onChange={handleChange} />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="city">شهر</label>
                            <input type="text" id="city" name="city" value={formData.city} onChange={handleChange} />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="phone">شماره تلفن</label>
                            <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="email">ایمیل</label>
                            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} />
                        </div>
                    </div>
                    <div className={styles.formActions}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose}>انصراف</button>
                        <button type="submit" className={styles.saveBtn}>ذخیره تغییرات</button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default EditProfileModal;
