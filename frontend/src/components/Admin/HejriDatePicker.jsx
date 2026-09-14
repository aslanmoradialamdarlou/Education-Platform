import React, { useState } from 'react';
// The import path has been corrected here (V3 removed)
import { AdapterDateFnsJalali } from '@mui/x-date-pickers/AdapterDateFnsJalali';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useTheme } from '@mui/material/styles';

const HejriDatePicker = ({ label, value: controlledValue, onChange, ...rest }) => {
    const [uncontrolledValue, setUncontrolledValue] = useState(null);
    const theme = useTheme();
    const value = controlledValue !== undefined ? controlledValue : uncontrolledValue;
    const handleChange = (newValue) => {
        if (onChange) onChange(newValue);
        else setUncontrolledValue(newValue);
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFnsJalali}>
            <DatePicker
                label={label}
                value={value}
                onChange={handleChange}
                {...rest}
                slotProps={{
                    textField: {
                        fullWidth: true,
                        size: 'small',
                        sx: {
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: 'var(--bg-content)',
                                fontFamily: 'Vazirmatn, sans-serif',
                                borderRadius: '9999px',
                                color: 'var(--text-primary)',
                                '& fieldset': { borderColor: 'var(--border-color)', borderRadius: '9999px' },
                                '&:hover fieldset': { borderColor: 'var(--border-color)' },
                                '&.Mui-focused fieldset': { borderColor: 'var(--accent-primary-solid)', boxShadow: '0 0 0 2px rgba(var(--accent-primary-rgb, 0,120,240), 0.15)', borderRadius: '9999px' },
                            },
                            '& .MuiInputLabel-root': {
                                fontFamily: 'Vazirmatn, sans-serif',
                                color: 'var(--text-secondary)'
                            },
                            '& .MuiOutlinedInput-input': {
                                padding: '.55rem .9rem',
                                paddingRight: '40px !important',
                                color: 'var(--text-primary)'
                            },
                            '& .MuiIconButton-root': {
                                color: 'var(--text-secondary)'
                            },
                            '& .MuiOutlinedInput-notchedOutline legend': {
                                display: 'none'
                            }
                        }
                    },
                    popper: { sx: { zIndex: 5000, '& .MuiPaper-root': { borderRadius: '16px' } } }
                }}
            />
        </LocalizationProvider>
    );
};

export default HejriDatePicker;
