import React from 'react';
import './adminBase.css';

const ConfirmationDialog = ({ open, onClose, onConfirm, title, message, confirmLabel = 'تایید', confirmColor = 'error' }) => {
    if (!open) return null;
    return (
        <div className="modalRoot" role="dialog" aria-modal="true" aria-label={title}>
            <div className="modalOverlay" onClick={onClose} />
            <div className="modalPanel">
                <div className="modalHeader">
                    <h3 className="title-md" style={{ margin: 0 }}>{title}</h3>
                </div>
                <div className="modalBody">
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{message}</p>
                </div>
                <div className="modalActions">
                    <button className="btn" onClick={onClose}>انصراف</button>
                    <button
                        className={`btn ${confirmColor === 'error' ? 'btn-danger' : 'btn-primary'}`}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationDialog;
