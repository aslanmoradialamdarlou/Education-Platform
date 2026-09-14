import React from 'react';
import { Popover, List, ListItem, ListItemText, ListItemIcon, Divider, Typography, LinearProgress, CircularProgress } from '@mui/material';
import { PlusCircle } from 'lucide-react';

const AddToSetPopover = ({ anchorEl, open, onClose, questionSets, onSelectSet, onCreateNew, loading }) => {
    return (
        <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={onClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ 
                sx: { 
                    backgroundColor: 'var(--bg-content)', 
                    color: 'var(--text-primary)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-md)',
                    marginTop: '8px',
                    fontFamily: 'Vazirmatn, vazirmatn, sans-serif',
                    '*': { fontFamily: 'Vazirmatn, vazirmatn, sans-serif !important' },
                    minWidth: '200px'
                } 
            }}
        >
            <List dense sx={{ padding: '0' }}>
                <ListItem sx={{ fontFamily: 'inherit' }}>
                    <ListItemText 
                        primary={<Typography sx={{ fontWeight: '500', fontFamily:'inherit' }}>انتخاب مجموعه</Typography>} 
                        sx={{ textAlign: 'right', fontFamily:'inherit' }} 
                    />
                </ListItem>
                <Divider sx={{ borderColor: 'var(--border-color)' }} />
                
                {loading ? (
                    <ListItem sx={{ justifyContent: 'center', padding: '1rem' }}>
                        <CircularProgress size={24} sx={{ color: 'var(--accent-primary-solid)' }} />
                    </ListItem>
                ) : questionSets.length === 0 ? (
                    <ListItem sx={{ fontFamily: 'inherit' }}>
                        <ListItemText 
                            primary={<Typography sx={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontFamily:'inherit' }}>مجموعه‌ای وجود ندارد</Typography>}
                            sx={{ textAlign: 'center', fontFamily:'inherit' }} 
                        />
                    </ListItem>
                ) : (
                    questionSets.map(set => (
                        <ListItem button key={set.id} onClick={() => onSelectSet(set.id)} sx={{ fontFamily:'inherit' }}>
                            <ListItemText primary={set.name} sx={{ textAlign: 'right', fontFamily:'inherit' }} />
                        </ListItem>
                    ))
                )}
                
                <Divider sx={{ borderColor: 'var(--border-color)' }} />
                <ListItem button onClick={onCreateNew} sx={{ fontFamily:'inherit' }}>
                    <ListItemIcon sx={{ minWidth: '32px' }}>
                        <PlusCircle size={18} color="var(--accent-primary-solid)" />
                    </ListItemIcon>
                    <ListItemText 
                        primary="ایجاد مجموعه جدید" 
                        sx={{ color: 'var(--accent-primary-solid)', textAlign: 'right', fontFamily:'inherit' }} 
                    />
                </ListItem>
            </List>
        </Popover>
    );
};

export default AddToSetPopover;
