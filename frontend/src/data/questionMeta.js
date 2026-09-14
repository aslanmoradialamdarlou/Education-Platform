// Small constants-only module for question metadata
// Import these instead of `mockQuestions.js` to avoid bundling the large dataset

export const QUESTION_TYPES = [
  { value: 'test', label: 'چهارگزینه‌ای' },
  { value: 'truefalse', label: 'درست/نادرست' },
  { value: 'fillblank', label: 'جاهای خالی' },
  { value: 'short', label: 'پاسخ کوتاه' },
  { value: 'long', label: 'پاسخ بلند' },
  { value: 'matching', label: 'وصل‌کردنی' },
];

export const TEXTBOOKS = [
  { value: 'math', label: 'ریاضی' },
  { value: 'science', label: 'علوم تجربی' },
  { value: 'geography', label: 'جغرافیا' },
  { value: 'history', label: 'تاریخ' },
  { value: 'literature', label: 'ادبیات' },
];
