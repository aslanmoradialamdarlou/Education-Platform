import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import styles from './MobileSearch.module.css';

const MobileSearch = ({ onClose }) => {
    const inputRef = useRef(null);

    // This effect runs when the component is displayed
    useEffect(() => {
        // Automatically focus the input field for immediate typing
        if (inputRef.current) {
            inputRef.current.focus();
        }
        // Prevent the page behind the overlay from scrolling
        document.body.style.overflow = 'hidden';

        // Cleanup function: This runs when the component is removed
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    // We use a portal to render this component at the top level of the document,
    // which prevents z-index issues with the fixed header.
    return ReactDOM.createPortal(
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.searchContainer} onClick={(e) => e.stopPropagation()}>
                <div className={styles.searchBar}>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="جستجو کنید..."
                        aria-label="Search"
                    />
                    <button onClick={onClose} className={styles.closeButton} aria-label="Close search">
                        <X size={24} />
                    </button>
                </div>
                {/* This area can be used to show recent searches or results in the future */}
                <div className={styles.resultsArea}>
                    <p>نتایج اخیر یا پیشنهادات را اینجا وارد کنید.</p>
                </div>
            </div>
        </div>,
        document.body 
    );
};

export default MobileSearch;
