import React, { useState, useEffect } from 'react';
import { KeyRound } from 'lucide-react';
import FormInput from '../Forms/FormInput';
import styles from './SignUp.module.css';
import { verifyOtp } from '../../api/authService';

const EnterCodeStep = ({ phoneNumber, onCodeSubmit, onResend, otpSentAt, isSubmitting = false }) => {
    const [code, setCode] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const [error, setError] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);

    const handleCodeChange = (e) => {
        const value = e.target.value;
        // Allow only numbers and limit length
        if (/^\d*$/.test(value) && value.length <= 6) {
            setCode(value);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!/^\d{6}$/.test(code)) {
            setError('کد تایید باید ۶ رقم باشد');
            return;
        }
        // If no phoneNumber provided, fallback to calling parent handler which may handle verification
        if (!phoneNumber) {
            onCodeSubmit(code);
            return;
        }

        try {
            setIsVerifying(true);
            const res = await verifyOtp({ phone: phoneNumber, otp: code });
            // Expect backend to return { valid: true } on success
            if (res && (res?.data?.valid === true || res?.valid === true)) {
                onCodeSubmit(code);
                return;
            }
            // If backend returned not valid, show generic message
            setError((res && res?.data?.message) || 'کد وارد شده نامعتبر است');
        } catch (err) {
            // Inspect server response for specific error codes
            const server = err?.response?.data;
            if (server) {
                if (server?.code === 'OTP_EXPIRED') setError('کد منقضی شده است. دوباره درخواست دهید.');
                else if (server?.code === 'INVALID_OTP') setError('کد وارد شده نامعتبر است.');
                else setError(server?.message || 'خطا در بررسی کد');
            } else {
                // Network/other error
                setError(err?.message || 'خطا در بررسی کد');
            }
        } finally {
            setIsVerifying(false);
        }
    };

    useEffect(() => {
        try {
            if ((import.meta.env.VITE_DEV_SMS_BYPASS === 'true') && import.meta.env.DEV) {
                // Optionally prefill for convenience, but do NOT auto-submit
                setCode('123456');
            }
        } catch (err) {}
    }, []);

    useEffect(() => {
        if (!otpSentAt) return;
        const cooldownMs = 30000; // 30s
        const end = otpSentAt + cooldownMs;
        const tick = () => {
            const now = Date.now();
            const left = Math.max(0, Math.ceil((end - now) / 1000));
            setResendCooldown(left);
            if (left <= 0) clearInterval(iv);
        };
        tick();
        const iv = setInterval(tick, 1000);
        return () => clearInterval(iv);
    }, [otpSentAt]);

    return (
        <form onSubmit={handleSubmit}>
            <p className={styles.stepInstruction}>کد تایید ارسال شده به شماره <strong>{phoneNumber}</strong> را وارد کنید.</p>
            <FormInput
                id="code"
                label="کد تایید"
                type="text"
                placeholder="کد ۶ رقمی"
                value={code}
                onChange={handleCodeChange}
                onlyDigits
                maxLength={6}
                icon={KeyRound}
            />
            {error && <div className={styles.serverError} style={{ marginBottom: '0.75rem' }}>{error}</div>}
            <div className={styles.actionsRow}>
                <button type="submit" className={styles.submitBtn} disabled={isVerifying || isSubmitting}>{isVerifying || isSubmitting ? 'در حال بررسی...' : 'تایید و ادامه'}</button>
                <button type="button" className={styles.resendBtn} disabled={resendCooldown > 0} onClick={async () => {
                    try {
                        if (resendCooldown > 0) return;
                        if (onResend) await onResend();
                        alert('کد مجدداً ارسال شد');
                    } catch (err) {
                        alert('خطا در ارسال مجدد کد');
                    }
                }}>{resendCooldown > 0 ? `ارسال کد مجدد (${resendCooldown}s)` : 'ارسال کد مجدد'}</button>
            </div>
        </form>
    );
};

export default EnterCodeStep;
