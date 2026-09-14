import React, { useMemo, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Stack, Typography, InputAdornment, Avatar } from '@mui/material';
import HejriDatePicker from './HejriDatePicker';
import { QUESTION_TYPES, TEXTBOOKS } from '../../data/questionMeta';

const fmtFa = (d) => new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

const AddQuestionModal = ({ open, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('test');
  const [grade, setGrade] = useState('7');
  const [chapter, setChapter] = useState('فصل ۱');
  const [textbook, setTextbook] = useState('math');
  const [imageUrl, setImageUrl] = useState('');
  const [answer, setAnswer] = useState('');
  const [answerRefChapter, setAnswerRefChapter] = useState('');
  const [answerRefPage, setAnswerRefPage] = useState('');
  const [addedDate, setAddedDate] = useState(null);

  const canAdd = title.trim().length > 2;

  const handleAdd = () => {
    const date = addedDate ? new Date(addedDate) : new Date();
    const newItem = {
      id: 'q-' + Math.random().toString(36).slice(2, 8),
      title,
      type,
      grade,
      chapter,
      textbook,
      imageUrl,
      answer,
      answerRefChapter,
      answerRefPage,
      accessRevoked: false,
      addedDateTs: date.getTime(),
      addedDateLabel: fmtFa(date),
      views: 0,
      setsCount: 0,
    };
    onAdd?.(newItem);
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>افزودن سوال</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="متن سوال" value={title} onChange={(e) => setTitle(e.target.value)} multiline minRows={2} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField select label="نوع سوال" value={type} onChange={(e) => setType(e.target.value)} fullWidth>
              {QUESTION_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
            <TextField select label="پایه" value={grade} onChange={(e) => setGrade(e.target.value)} fullWidth>
              {['7','8','9'].map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
            </TextField>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="فصل" value={chapter} onChange={(e) => setChapter(e.target.value)} fullWidth />
            <TextField select label="کتاب درسی" value={textbook} onChange={(e) => setTextbook(e.target.value)} fullWidth>
              {TEXTBOOKS.map(tb => <MenuItem key={tb.value} value={tb.value}>{tb.label}</MenuItem>)}
            </TextField>
          </Stack>
          <TextField label="تصویر بدنه سوال (اختیاری)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="/images/7th-grade.png یا https://..." helperText="این تصویر به عنوان بخشی از صورت سوال استفاده می‌شود" />
          <TextField label="پاسخ صحیح" value={answer} onChange={(e) => setAnswer(e.target.value)} multiline minRows={1} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="ارجاع پاسخ - فصل" value={answerRefChapter} onChange={(e) => setAnswerRefChapter(e.target.value)} fullWidth />
            <TextField label="ارجاع پاسخ - صفحه" value={answerRefPage} onChange={(e) => setAnswerRefPage(e.target.value)} fullWidth />
          </Stack>
          <HejriDatePicker label="تاریخ افزودن" value={addedDate} onChange={setAddedDate} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>انصراف</Button>
        <Button onClick={handleAdd} disabled={!canAdd} variant="contained">افزودن</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddQuestionModal;
