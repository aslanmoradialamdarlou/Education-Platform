import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from './Forms.module.css'; // Assuming you have a CSS module for styling


const FormInput = ({ id, label, type, value, onChange, icon: Icon, placeholder, onlyDigits = false, maxLength, inputMode, required = true, readOnly = false, disabled = false }) => {
    const [isPasswordVisible, setPasswordVisible] = useState(false);
    const isPassword = type === 'password';

    const togglePasswordVisibility = () => {
        setPasswordVisible(!isPasswordVisible);
    };

    const handleKeyDown = (e) => {
        if (!onlyDigits) return;
        // allow navigation keys and control keys
        const allowed = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete', 'Tab'];
        if (allowed.includes(e.key)) return;
        // block non-digit characters
        if (!/^[0-9]$/.test(e.key)) {
            e.preventDefault();
        }
    };

    const handlePaste = (e) => {
        if (!onlyDigits) return;
        const text = (e.clipboardData || window.clipboardData).getData('text');
        if (!/^[0-9]+$/.test(text)) {
            e.preventDefault();
            // optionally, paste only digits
            const digits = (text.match(/[0-9]+/g) || []).join('');
            if (digits && onChange) {
                const fakeEvent = { target: { value: (value || '') + digits } };
                onChange(fakeEvent);
            }
        }
    };

    return (
        <div className={styles.formGroup}>
            <label htmlFor={id}>{label}</label>
            <div className={styles.inputWrapper}>
                {Icon && <Icon className={styles.inputIcon} size={20} />}
                <input
                    id={id}
                    name={id}
                    type={isPassword ? (isPasswordVisible ? 'text' : 'password') : type}
                    placeholder={placeholder ?? ''}
                    value={value}
                    onChange={onChange}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    inputMode={inputMode || (onlyDigits ? 'numeric' : undefined)}
                    maxLength={maxLength}
                    required={required}
                    readOnly={readOnly}
                    disabled={disabled}
                    className={onlyDigits ? styles.digitsInput : undefined}
                />
                {isPassword && (
                    <button type="button" onClick={togglePasswordVisibility} className={styles.eyeIcon}>
                        {isPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                )}
            </div>
        </div>
    );
};

export default FormInput;
