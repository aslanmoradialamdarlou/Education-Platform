import React from 'react';
import { Drawer, Box, Typography, TextField, Button, Divider } from '@mui/material';
import { X } from 'lucide-react'; // Import the X icon
import styles from './Profile.module.css';

const TicketDetailsDrawer = ({ open, onClose, ticket }) => {
    if (!ticket) return null;

    return (
        <Drawer
            anchor="bottom"
            open={open}
            onClose={onClose}
            PaperProps={{ sx: { backgroundColor: 'var(--bg-content)', color: 'var(--text-primary)', borderTop: '1px solid var(--border-color)', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' } }}
        >
            <Box p={3} className={styles.drawerContainer}>
                {/* New Header Section */}
                <div className={styles.drawerHeader}>
                    <Typography variant="h6" component="div">
                        موضوع: {ticket.subject}
                    </Typography>
                    <button onClick={onClose} className={styles.closeModalBtn}><X /></button>
                </div>

                <span className={`${styles.statusBadge} ${
                    ticket.status === 'بسته شده' ? styles.statusClosed :
                    ticket.status === 'پاسخ داده شده' ? styles.statusSuccess : styles.statusPending
                }`}>
                    {ticket.status}
                </span>
                <Divider sx={{ my: 2, borderColor: 'var(--border-color)' }} />

                {/* Mock Conversation */}
                <Box className={styles.conversationArea}>
                    <div className={`${styles.messageBubble} ${styles.userMessage}`}>
                        <p>سلام، من در ورود به حسابم مشکل دارم.</p>
                    </div>
                    <div className={`${styles.messageBubble} ${styles.adminMessage}`}>
                        <p>سلام، لطفا مشکل خود را با جزئیات بیشتری توضیح دهید.</p>
                    </div>
                </Box>

                <TextField
                    label="پاسخ شما"
                    multiline
                    rows={3}
                    variant="outlined"
                    fullWidth
                    sx={{ mt: 2, mb: 2, '& .MuiOutlinedInput-root': { backgroundColor: 'var(--bg-main)' } }}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" onClick={onClose} className={styles.btnPrimary}>ارسال پاسخ</Button>
                </Box>
            </Box>
        </Drawer>
    );
};

export default TicketDetailsDrawer;
