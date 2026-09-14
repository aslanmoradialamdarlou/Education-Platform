import React, { useEffect, useMemo, useState } from 'react';
import { Paper, Typography, Stack, TextField, MenuItem, RadioGroup, FormControlLabel, Radio, Button, Switch } from '@mui/material';
import styles from './Admin.module.css';
import HejriDatePicker from './HejriDatePicker';
import { QUESTION_TYPES } from '../../data/questionMeta';

// Minimal full-screen editor (rich text to be added later)
const QuestionEditor = ({ initial, onCancel, onSave }) => {
  const [form, setForm] = useState(() => initial || {
    id: 'q-' + Math.random().toString(36).slice(2,8),
    title: '',
    type: 'test',
    grade: '7',
    subject: 'علوم تجربی',
    chapter: 'فصل ۱',
    pageNumber: '',
    difficulty: 'medium',
    author: '',
    status: 'draft',
    // dynamic answer region
    options: ['', '', '', ''],
    correctIndex: 0,
    answer: '',
    modelAnswer: '',
    imageUrl: '',
    addedDateTs: Date.now(),
    addedDateLabel: '',
    views: 0, setsCount: 0,
    accessRevoked: false,
  });

  useEffect(() => { if (initial) setForm({ ...initial }); }, [initial]);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const updateOption = (i, v) => setForm(prev => { const copy = [...(prev.options || ['', '', '', ''])]; copy[i] = v; return { ...prev, options: copy }; });

  const isTest = form.type === 'test';
  const isFill = form.type === 'fillblank';
  const isShortLong = form.type === 'short' || form.type === 'long';

  return (
    <div dir="rtl" style={{ padding: '1rem' }}>
      <div className={styles.panelHeader}>
        <Typography variant="h5">{initial ? 'ویرایش سوال' : 'افزودن سوال جدید'}</Typography>
        <Stack direction="row" spacing={1}>
          <Button onClick={onCancel}>انصراف</Button>
          <Button variant="contained" onClick={() => onSave(form)} disabled={!form.title}>ذخیره</Button>
        </Stack>
      </div>

      <div className={styles.detailGrid}>
        {/* Core Details */}
        <Paper className={styles.detailCard}>
          <div className={styles.cardTitle}>جزئیات اصلی سوال</div>
          <Stack spacing={2}>
            <TextField label="متن سوال" value={form.title} onChange={(e) => update('title', e.target.value)} multiline minRows={3} helperText="ویرایشگر غنی بعدا اضافه می‌شود. فعلا می‌توانید متن و لینک تصویر وارد کنید." />
            <TextField label="تصویر بدنه سوال (اختیاری)" value={form.imageUrl || ''} onChange={(e) => update('imageUrl', e.target.value)} placeholder="/images/... یا https://..." />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField select label="نوع سوال" value={form.type} onChange={(e) => update('type', e.target.value)} fullWidth>
                {QUESTION_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
              <TextField select label="پایه" value={form.grade} onChange={(e) => update('grade', e.target.value)} fullWidth>
                {['7','8','9'].map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
              </TextField>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField select label="درس" value={form.subject} onChange={(e) => update('subject', e.target.value)} fullWidth>
                {['علوم تجربی'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
              <TextField label="فصل" value={form.chapter} onChange={(e) => update('chapter', e.target.value)} fullWidth />
              <TextField label="شماره صفحه" value={form.pageNumber} onChange={(e) => update('pageNumber', e.target.value)} fullWidth />
            </Stack>
            <RadioGroup row value={form.difficulty} onChange={(e) => update('difficulty', e.target.value)}>
              <FormControlLabel value="easy" control={<Radio />} label="آسان" />
              <FormControlLabel value="medium" control={<Radio />} label="متوسط" />
              <FormControlLabel value="hard" control={<Radio />} label="سخت" />
            </RadioGroup>
            <TextField label="منبع/نویسنده" value={form.author} onChange={(e) => update('author', e.target.value)} />
          </Stack>
        </Paper>

        {/* Answer Config */}
        <Paper className={styles.detailCard}>
          <div className={styles.cardTitle}>پیکربندی پاسخ</div>
          <Stack spacing={2}>
            {isTest && (
              <Stack spacing={1}>
                {[0,1,2,3].map(i => (
                  <Stack key={i} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                    <TextField label={`گزینه ${i+1}`} value={(form.options || ['', '', '', ''])[i]} onChange={(e) => updateOption(i, e.target.value)} fullWidth />
                    <FormControlLabel control={<Radio checked={form.correctIndex === i} onChange={() => update('correctIndex', i)} />} label="پاسخ صحیح" />
                  </Stack>
                ))}
              </Stack>
            )}
            {isFill && (
              <TextField label="پاسخ صحیح" value={form.answer} onChange={(e) => update('answer', e.target.value)} />
            )}
            {isShortLong && (
              <TextField label="پاسخ نمونه" value={form.modelAnswer} onChange={(e) => update('modelAnswer', e.target.value)} multiline minRows={3} />
            )}
          </Stack>
        </Paper>

        {/* Teacher & Class Docs */}
        <Paper className={styles.detailCard}>
          <div className={styles.cardTitle}>مدارک معلم و کلاس</div>
          <Stack spacing={2}>
            <TextField label="راهنمای معلم (URL یا توضیح)" value={form.teacherGuide || ''} onChange={(e) => update('teacherGuide', e.target.value)} placeholder="فعلا آپلود واقعی پیاده‌سازی نشده" />
            <TextField label="خلاصه جلسه کلاس (URL یا توضیح)" value={form.classSummary || ''} onChange={(e) => update('classSummary', e.target.value)} placeholder="فعلا آپلود واقعی پیاده‌سازی نشده" />
          </Stack>
        </Paper>

        {/* Publishing */}
        <Paper className={styles.detailCard}>
          <div className={styles.cardTitle}>انتشار</div>
          <Stack spacing={2}>
            <TextField select label="وضعیت" value={form.status} onChange={(e) => update('status', e.target.value)} sx={{ maxWidth: 260 }}>
              <MenuItem value="draft">پیش‌نویس</MenuItem>
              <MenuItem value="published">منتشر شده</MenuItem>
              <MenuItem value="review">نیازمند بررسی</MenuItem>
            </TextField>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={() => onSave(form)}>ذخیره</Button>
              <Button onClick={onCancel}>انصراف</Button>
            </Stack>
          </Stack>
        </Paper>
      </div>
    </div>
  );
};

export default QuestionEditor;
