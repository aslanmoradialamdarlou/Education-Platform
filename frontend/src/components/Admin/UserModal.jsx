import React from 'react';
import { Drawer, Box, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { X } from 'lucide-react';
import styles from './Admin.module.css';

const UserModal = ({ open, onClose, user }) => {
    const isEditMode = Boolean(user);

    return (
        <Drawer
            anchor="right" // In RTL, 'right' anchor places the drawer on the left side
            
            open={open}
            onClose={onClose}
            PaperProps={{ 
                sx: { 
                    backgroundColor: 'var(--bg-content)', 
                    color: 'var(--text-primary)', 
                    borderRight: '1px solid var(--border-color)', 
                    left: 0,
                    right: 'unset',
                    width: { xs: '90%', sm: '400px' },
                    zIndex: 3001 // Ensures it's above the mobile backdrop
                } 
            }}
        >
            <Box p={3} className={styles.drawerContainer}>
                <div className={styles.drawerHeader}>
                    <Typography variant="h6" component="div">
                        {isEditMode ? 'ویرایش کاربر' : 'افزودن کاربر جدید'}
                    </Typography>
                    <button onClick={onClose} className={styles.closeModalBtn}><X /></button>
                </div>
                <form className={styles.userForm}>
                    <TextField label="نام" defaultValue={isEditMode ? user.name.split(' ')[0] : ''} fullWidth />
                    <TextField label="نام خانوادگی" defaultValue={isEditMode ? user.name.split(' ')[1] : ''} fullWidth />
                    <TextField label="ایمیل" defaultValue={isEditMode ? user.email : ''} fullWidth />
                    <FormControl fullWidth>
                        <InputLabel>نقش</InputLabel>
                        <Select defaultValue={isEditMode ? user.role : 'student'} label="نقش">
                            <MenuItem value="student">دانش‌آموز</MenuItem>
                            <MenuItem value="teacher">معلم</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel>پایه</InputLabel>
                        <Select defaultValue={isEditMode ? user.grade : '7'} label="پایه">
                            <MenuItem value="7">هفتم</MenuItem>
                            <MenuItem value="8">هشتم</MenuItem>
                            <MenuItem value="9">نهم</MenuItem>
                        </Select>
                    </FormControl>
                    <div className={styles.formActions}>
                        <Button variant="outlined" onClick={onClose} className={styles.btnSecondary}>انصراف</Button>
                        <Button variant="contained" className={styles.btnPrimary}>{isEditMode ? 'ذخیره تغییرات' : 'ایجاد کاربر'}</Button>
                    </div>
                </form>
            </Box>
        </Drawer>
    );
};

export default UserModal;
