import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import styles from './Subscription.v2.module.css';

// Accessible modal with focus trap & escape handling
const PurchaseModal = ({ title, children, onClose, onConfirm, confirmLabel = 'تایید و ادامه خرید', initialFocusRef }) => {
    const overlayRef = useRef(null);
    const contentRef = useRef(null);
    const previouslyFocused = useRef(null);
    const titleId = useRef('modal-title-' + Math.random().toString(36).slice(2, 8));

    useEffect(() => {
        previouslyFocused.current = document.activeElement;
        const focusable = contentRef.current.querySelectorAll(
            'button, [href], select, textarea, input, [tabindex]:not([tabindex="-1"])'
        );
        const first = initialFocusRef?.current || focusable[0];
        first && first.focus();
        function handleKey(e) {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onClose();
            } else if (e.key === 'Tab') {
                // basic trap
                const nodes = Array.from(focusable).filter(el => !el.disabled);
                if (!nodes.length) return;
                const firstEl = nodes[0];
                const lastEl = nodes[nodes.length - 1];
                if (e.shiftKey && document.activeElement === firstEl) {
                    e.preventDefault();
                    lastEl.focus();
                } else if (!e.shiftKey && document.activeElement === lastEl) {
                    e.preventDefault();
                    firstEl.focus();
                }
            }
        }
        document.addEventListener('keydown', handleKey, true);
        return () => {
            document.removeEventListener('keydown', handleKey, true);
            if (previouslyFocused.current && previouslyFocused.current.focus) {
                previouslyFocused.current.focus();
            }
        };
    }, [onClose, initialFocusRef]);

    return ReactDOM.createPortal(
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby={titleId.current}>
            <div className={styles.modalBackdrop} onClick={onClose} ref={overlayRef}></div>
            <div className={styles.modalContent} ref={contentRef}>
                <div className={styles.modalHeader}>
                    <h3 id={titleId.current} className={styles.modalTitle}>{title}</h3>
                    <button onClick={onClose} className={styles.closeModalBtn} aria-label="بستن پنجره"><X /></button>
                </div>
                <div className={styles.modalBody}>{children}</div>
                <div className={styles.modalFooter}>
                    <button className={styles.purchaseBtn} onClick={onConfirm}>{confirmLabel}</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PurchaseModal;
