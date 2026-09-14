import React from 'react';
import { Drawer, Box, Typography, RadioGroup, FormControlLabel, Radio, TextField, Button } from '@mui/material';
import styles from './QuestionBank.module.css';

const ReportDrawer = ({ open, onClose }) => {
    return (
        <Drawer
            anchor="bottom"
            open={open}
            onClose={onClose}
            PaperProps={{ sx: { backgroundColor: 'var(--bg-content)', color: 'var(--text-primary)', borderTop: '1px solid var(--border-color)', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', fontFamily:'Vazirmatn, vazirmatn, sans-serif', '*': { fontFamily:'Vazirmatn, vazirmatn, sans-serif !important' } } }}
        >
            <Box p={3} className={styles.drawerContainer} sx={{ fontFamily:'inherit' }}>
                <Typography variant="h6" component="div" sx={{ mb: 2, fontFamily:'inherit' }}>
                    گزارش مشکل سوال
                </Typography>
                <RadioGroup>
                    <FormControlLabel value="wrong-answer" control={<Radio sx={{color: 'var(--accent-primary-solid)'}} />} label="پاسخ اشتباه است" sx={{ fontFamily:'inherit' }} />
                    <FormControlLabel value="ambiguous" control={<Radio sx={{color: 'var(--accent-primary-solid)'}} />} label="صورت سوال مبهم است" sx={{ fontFamily:'inherit' }} />
                    <FormControlLabel value="other" control={<Radio sx={{color: 'var(--accent-primary-solid)'}} />} label="سایر موارد" sx={{ fontFamily:'inherit' }} />
                </RadioGroup>
                <TextField
                    multiline
                    rows={3}
                    placeholder="توضیحات بیشتر..."
                    variant="outlined"
                    fullWidth
                    sx={{ mt: 2, mb: 2, '& .MuiOutlinedInput-root': { backgroundColor: 'var(--bg-main)', '& fieldset': { borderColor: 'var(--border-color)' }, '&:hover fieldset': { borderColor: 'var(--accent-primary-solid)' }, fontFamily:'inherit' } }}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" onClick={onClose} className={styles.btnPrimary} sx={{ fontFamily:'inherit' }}>ارسال گزارش</Button>
                    <Button variant="outlined" onClick={onClose} className={styles.btnSecondary} sx={{ fontFamily:'inherit' }}>انصراف</Button>
                </Box>
            </Box>
        </Drawer>
    );
};

export default ReportDrawer;
