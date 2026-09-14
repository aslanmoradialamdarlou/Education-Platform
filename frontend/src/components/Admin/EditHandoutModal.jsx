import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Button, Stack } from '@mui/material';
import styles from './Admin.module.css';
import { HANDOUT_TYPES } from '../../data/handoutConstants';

const EditHandoutModal = ({ open, onClose, handout, onSave }) => {
  const [form, setForm] = useState(handout);

  useEffect(() => setForm(handout), [handout]);

  if (!form) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === 'pages' || name === 'price' ? Number(value) : value }));
  };

  const handleSubmit = () => {
    if (!form.title) return;
    const payload = { ...form };
    if (payload.type === 'free') payload.price = 0;
    onSave(payload);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle className={styles.modalHeader}>ویرایش جزوه</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="عنوان" name="title" value={form.title} onChange={handleChange} fullWidth />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField select label="نوع" name="type" value={form.type} onChange={handleChange} fullWidth>
              {HANDOUT_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
            <TextField select label="پایه" name="grade" value={form.grade} onChange={handleChange} fullWidth>
              {['7','8','9'].map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
            </TextField>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="فصل" name="chapter" value={form.chapter} onChange={handleChange} fullWidth />
            <TextField label="تعداد صفحات" name="pages" type="number" value={form.pages} onChange={handleChange} fullWidth />
          </Stack>
          <TextField label="قیمت (تومان)" name="price" type="number" value={form.type==='free'?0:form.price} onChange={handleChange} fullWidth disabled={form.type==='free'} />
          <TextField label="تاریخ افزودن (مثال: 1403/05/20)" name="addedDate" value={form.addedDate || ''} onChange={handleChange} fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions className={styles.formActions}>
        <Button onClick={onClose} variant="outlined" className={styles.btnSecondary}>انصراف</Button>
        <Button onClick={handleSubmit} variant="contained" className={styles.btnPrimary}>ذخیره</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditHandoutModal;
