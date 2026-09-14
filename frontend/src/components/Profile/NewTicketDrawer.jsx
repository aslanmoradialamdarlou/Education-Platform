import React from 'react';
import { Drawer, Box, Typography, TextField, Button } from '@mui/material';
import styles from './Profile.module.css';

const NewTicketDrawer = ({ open, onClose }) => {
    return (
        <Drawer
            anchor="bottom"
            open={open}
            onClose={onClose}
            PaperProps={{ sx: { backgroundColor: 'var(--bg-content)', color: 'var(--text-primary)', borderTop: '1px solid var(--border-color)', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' } }}
        >
            <Box p={3} className={styles.drawerContainer}>
                <Typography variant="h6" component="div" sx={{ mb: 2 }}>
                    ایجاد تیکت جدید
                </Typography>
                <TextField
                    label="موضوع"
                    variant="outlined"
                    fullWidth
                    sx={{ mb: 2, '& .MuiOutlinedInput-root': { backgroundColor: 'var(--bg-main)' } }}
                />
                <TextField
                    label="پیام شما"
                    multiline
                    rows={4}
                    variant="outlined"
                    fullWidth
                    sx={{ mb: 2, '& .MuiOutlinedInput-root': { backgroundColor: 'var(--bg-main)' } }}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" onClick={onClose} className={styles.btnPrimary}>ارسال تیکت</Button>
                    <Button variant="outlined" onClick={onClose} className={styles.btnSecondary}>انصراف</Button>
                </Box>
            </Box>
        </Drawer>
    );
};

export default NewTicketDrawer;
