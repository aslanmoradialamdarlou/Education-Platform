import React from 'react';
import { Paper, Radio, Typography, TextField, Button, RadioGroup, FormControlLabel } from '@mui/material';
import styles from './Checkout.module.css';

// Mock payment gateways
const gateways = [
    { id: 'zarinpal', name: 'زرین‌پال', logo: 'https://www.zarinpal.com/assets/images/logo-white.svg' },
    { id: 'mellat', name: 'به‌پرداخت ملت', logo: 'https://www.behpardakht.com/resources/images/logo-fa.png' },
];

const PaymentActions = () => {
    return (
        <div className={styles.actionsContainer}>
            {/* Discount Code Section */}
            <Paper className={styles.actionCard}>
                <Typography variant="h6" component="h3" sx={{ mb: 2 }}>کد تخفیف</Typography>
                <div className={styles.discountInputGroup}>
                    <TextField
                        placeholder="کد تخفیف خود را وارد کنید"
                        variant="outlined"
                        size="small"
                        fullWidth
                    />
                    <Button variant="outlined" className={styles.btnSecondary}>اعمال</Button>
                </div>
            </Paper>

            {/* Payment Gateway Section */}
            <Paper className={styles.actionCard}>
                <Typography variant="h6" component="h3" sx={{ mb: 2 }}>انتخاب درگاه پرداخت</Typography>
                <RadioGroup defaultValue="zarinpal" className={styles.gatewayList}>
                    {gateways.map(gw => (
                        <FormControlLabel
                            key={gw.id}
                            value={gw.id}
                            control={<Radio />} // Show the actual radio button
                            label={<img src={gw.logo} alt={gw.name} />}
                            className={styles.gatewayOption}
                        />
                    ))}
                </RadioGroup>
            </Paper>
        </div>
    );
};

export default PaymentActions;
