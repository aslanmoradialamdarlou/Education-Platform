import React, { useState } from 'react';
import { Phone } from 'lucide-react';
import FormInput from '../Forms/FormInput';
import styles from './SignUp.module.css';

const EnterPhoneStep = ({ onPhoneSubmit, disabled = false, errorMessage = null, isSubmitting = false }) => {
    const [phone, setPhone] = useState('');

    const handlePhoneChange = (e) => {
        const value = e.target.value;
        if (/^\d*$/.test(value) && value.length <= 11) setPhone(value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (disabled) {
            alert('در حال حاضر ارسال کد غیر فعال است، لطفا کمی بعد تلاش کنید.');
            return;
        }
        if (phone.length === 11) {
            onPhoneSubmit(phone);
        } else {
            alert('لطفا یک شماره تلفن معتبر ۱۱ رقمی وارد کنید.');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <p className={styles.stepInstruction}>برای شروع ثبت‌نام، شماره تلفن همراه خود را وارد کنید.</p>
            <FormInput
                id="phone"
                label="شماره تلفن"
                type="tel"
                placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                value={phone}
                onChange={handlePhoneChange}
                onlyDigits
                maxLength={11}
                icon={Phone}
            />
            <button type="submit" className={styles.submitBtn} disabled={disabled || isSubmitting}>
                {isSubmitting ? 'در حال ارسال...' : 'ارسال کد تایید'}
            </button>
            {errorMessage ? <p className={styles.errorText}>{errorMessage}</p> : null}
        </form>
    );
};

export default EnterPhoneStep;
