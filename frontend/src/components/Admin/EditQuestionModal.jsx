import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Stack } from '@mui/material';
import { QUESTION_TYPES, TEXTBOOKS } from '../../data/questionMeta';
import HejriDatePicker from './HejriDatePicker';

const fmtFa = (d) => new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

const EditQuestionModal = ({ open, onClose, question, onSave }) => {
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (question) setForm({ ...question });
    else setForm(null);
  }, [question]);

  if (!form) return <Dialog open={open} onClose={onClose}><DialogTitle>ویرایش سوال</DialogTitle></Dialog>;

  const handleChange = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const handleDate = (val) => {
    const d = val ? new Date(val) : new Date();
    setForm(prev => ({ ...prev, addedDateTs: d.getTime(), addedDateLabel: fmtFa(d) }));
  };

  const handleSave = () => {
    onSave?.(form);
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>ویرایش سوال</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="متن سوال" value={form.title} onChange={(e) => handleChange('title', e.target.value)} multiline minRows={2} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField select label="نوع سوال" value={form.type} onChange={(e) => handleChange('type', e.target.value)} fullWidth>
              {QUESTION_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
            <TextField select label="پایه" value={form.grade} onChange={(e) => handleChange('grade', e.target.value)} fullWidth>
              {['7','8','9'].map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
            </TextField>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="فصل" value={form.chapter} onChange={(e) => handleChange('chapter', e.target.value)} fullWidth />
            <TextField select label="کتاب درسی" value={form.textbook} onChange={(e) => handleChange('textbook', e.target.value)} fullWidth>
              {TEXTBOOKS.map(tb => <MenuItem key={tb.value} value={tb.value}>{tb.label}</MenuItem>)}
            </TextField>
          </Stack>
          <TextField label="تصویر بدنه سوال (اختیاری)" value={form.imageUrl || ''} onChange={(e) => handleChange('imageUrl', e.target.value)} helperText="این تصویر به عنوان بخشی از صورت سوال استفاده می‌شود" />
          <TextField label="پاسخ صحیح" value={form.answer || ''} onChange={(e) => handleChange('answer', e.target.value)} multiline minRows={1} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="ارجاع پاسخ - فصل" value={form.answerRefChapter || ''} onChange={(e) => handleChange('answerRefChapter', e.target.value)} fullWidth />
            <TextField label="ارجاع پاسخ - صفحه" value={form.answerRefPage || ''} onChange={(e) => handleChange('answerRefPage', e.target.value)} fullWidth />
          </Stack>
          <HejriDatePicker label="تاریخ افزودن" value={form.addedDateTs ? new Date(form.addedDateTs) : null} onChange={handleDate} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>انصراف</Button>
        <Button onClick={handleSave} variant="contained">ذخیره</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditQuestionModal;
