import React from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import { Box, Typography, TextField, Button } from '@mui/material';
import styles from './QuestionBank.module.css';

const CreateSetModal = ({ open, onClose, onCreate }) => {
    const [setName, setSetName] = React.useState('');

    const handleCreate = () => {
        if (setName.trim()) {
            onCreate(setName);
            onClose();
        }
    };

    if (!open) return null;

    return ReactDOM.createPortal(
    <div className={styles.modalOverlay} style={{ fontFamily:'Vazirmatn, vazirmatn, sans-serif' }}>
            <div className={styles.modalBackdrop} onClick={onClose}></div>
            <div className={styles.modalContent} style={{ fontFamily:'inherit' }}>
                <div className={styles.modalHeader}>
                    <Typography variant="h6" component="h3" className={styles.modalTitle} sx={{ fontFamily:'inherit' }}>
                        ایجاد مجموعه سوال جدید
                    </Typography>
                    <button onClick={onClose} className={styles.closeModalBtn}><X /></button>
                </div>
                <div className={styles.modalBody}>
                    <TextField
                        label="نام مجموعه"
                        variant="outlined"
                        fullWidth
                        value={setName}
                        onChange={(e) => setSetName(e.target.value)}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: 'var(--bg-main)',
                                '& fieldset': { borderColor: 'var(--border-color)' },
                                '&:hover fieldset': { borderColor: 'var(--accent-primary-solid)' },
                                fontFamily:'inherit'
                            }
                        }}
                    />
                </div>
                <div className={styles.modalFooter}>
                    <Button variant="outlined" onClick={onClose} className={styles.btnSecondary}>انصراف</Button>
                    <Button variant="contained" onClick={handleCreate} className={styles.btnPrimary}>ایجاد</Button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CreateSetModal;
