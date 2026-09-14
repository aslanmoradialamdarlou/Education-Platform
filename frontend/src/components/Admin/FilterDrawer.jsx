import React from 'react';
import { Drawer, Box, Typography, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import { X } from 'lucide-react';
import styles from './Admin.module.css';

const FilterDrawer = ({ open, onClose }) => {
    return (
    <Drawer
        anchor="right" // In RTL, this appears on the left side
            open={open}
            onClose={onClose}
            PaperProps={{ 
                sx: { 
                    backgroundColor: 'var(--bg-content)', 
                    color: 'var(--text-primary)', 
                    left: 0,
                    right: 'unset',
                    width: { xs: '90%', sm: '350px' },
            borderRight: '1px solid var(--border-color)',
            zIndex: 3001 // Ensures it's above the mobile backdrop
                } 
            }}
        >
            <Box p={3} className={styles.drawerContainer}>
                <div className={styles.drawerHeader}>
                    <Typography variant="h6" component="div">فیلترهای پیشرفته</Typography>
                    <button onClick={onClose} className={styles.closeModalBtn}><X /></button>
                </div>
                <form className={styles.userForm}>
                    <FormControl fullWidth>
                        <InputLabel>نقش</InputLabel>
                        <Select label="نقش" defaultValue="all">
                            <MenuItem value="all">همه نقش‌ها</MenuItem>
                            <MenuItem value="student">دانش‌آموز</MenuItem>
                            <MenuItem value="teacher">معلم</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel>پایه</InputLabel>
                        <Select label="پایه" defaultValue="all">
                            <MenuItem value="all">همه پایه‌ها</MenuItem>
                            <MenuItem value="7">هفتم</MenuItem>
                            <MenuItem value="8">هشتم</MenuItem>
                            <MenuItem value="9">نهم</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel>وضعیت اشتراک</InputLabel>
                        <Select label="وضعیت اشتراک" defaultValue="all">
                            <MenuItem value="all">همه وضعیت‌ها</MenuItem>
                            <MenuItem value="active">فعال</MenuItem>
                            <MenuItem value="inactive">عادی</MenuItem>
                        </Select>
                    </FormControl>
                    <div className={styles.formActions}>
                        <Button variant="outlined" onClick={onClose} className={styles.btnSecondary}>پاک کردن</Button>
                        <Button variant="contained" className={styles.btnPrimary}>اعمال فیلتر</Button>
                    </div>
                </form>
            </Box>
        </Drawer>
    );
};

export default FilterDrawer;
