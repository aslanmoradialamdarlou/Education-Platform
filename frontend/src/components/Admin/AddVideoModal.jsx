import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Button, Stack } from '@mui/material';
import styles from './Admin.module.css';
import { VIDEO_TYPES } from '../../data/mockVideos';

const AddVideoModal = ({ open, onClose, onAdd }) => {
  const [form, setForm] = useState({
    title: '',
    type: 'lecture',
    grade: '7',
    chapter: '',
    duration: '',
  url: '',
  addedDate: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = () => {
    if (!form.title || !form.url) return;
  onAdd({ id: 'v-' + Math.random().toString(36).slice(2, 8), accessRevoked: false, ...form });
    onClose();
  setForm({ title: '', type: 'lecture', grade: '7', chapter: '', duration: '', url: '', addedDate: '' });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle className={styles.modalHeader}>افزودن ویدیو</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="عنوان" name="title" value={form.title} onChange={handleChange} fullWidth />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField select label="نوع" name="type" value={form.type} onChange={handleChange} fullWidth>
              {VIDEO_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
            <TextField select label="پایه" name="grade" value={form.grade} onChange={handleChange} fullWidth>
              {['7','8','9'].map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
            </TextField>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="فصل" name="chapter" value={form.chapter} onChange={handleChange} fullWidth />
            <TextField label="مدت زمان (مثال: 12:30)" name="duration" value={form.duration} onChange={handleChange} fullWidth />
          </Stack>
          <TextField label="آدرس فایل (URL)" name="url" value={form.url} onChange={handleChange} fullWidth />
          <TextField label="تاریخ افزودن (مثال: 1403/05/20)" name="addedDate" value={form.addedDate} onChange={handleChange} fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions className={styles.formActions}>
        <Button onClick={onClose} variant="outlined" className={styles.btnSecondary}>انصراف</Button>
        <Button onClick={handleSubmit} variant="contained" className={styles.btnPrimary}>افزودن</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddVideoModal;
