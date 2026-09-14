// src/data/mockQuestions.js
// Question types enum used by filters and editor
export const QUESTION_TYPES = [
  { value: 'test', label: 'چهارگزینه‌ای' },
  { value: 'truefalse', label: 'درست/نادرست' },
  { value: 'fillblank', label: 'جاهای خالی' },
  { value: 'short', label: 'پاسخ کوتاه' },
  { value: 'long', label: 'پاسخ بلند' },
  { value: 'matching', label: 'وصل‌کردنی' },
];

// Optional: generic textbook list (unused by current UI but kept for parity)
export const TEXTBOOKS = [
  { value: 'math', label: 'ریاضی' },
  { value: 'science', label: 'علوم تجربی' },
  { value: 'geography', label: 'جغرافیا' },
  { value: 'history', label: 'تاریخ' },
  { value: 'literature', label: 'ادبیات' },
];

// Utilities
const fmtFa = (d) => new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randPick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const gradesFa = ['۷', '۸', '۹'];
const subjectsFa = ['علوم تجربی', 'ریاضی', 'ادبیات', 'تاریخ', 'جغرافیا'];
const chaptersFa = Array.from({ length: 8 }, (_, i) => `فصل ${i + 1}`);
const diffsFa = ['ساده', 'متوسط', 'سخت'];
const statusesFa = ['پیش‌نویس', 'منتشر شده', 'در حال بازبینی'];
const imagesByGrade = {
  '۷': '/images/7th-grade.png',
  '۸': '/images/8th-grade.png',
  '۹': '/images/9th-grade.png',
};

// Domain-aware multiple choice templates (simplified, localized)
// Each template: { prompt, options:[...], correctIndex, explanation }
const TEST_TEMPLATES = {
  'ریاضی': [
    { prompt: 'کدام عدد اول است؟', options: ['۱۲', '۱۵', '۱۷', '۲۱'], correctIndex: 2, explanation: '۱۷ فقط بر ۱ و خودش بخش‌پذیر است.' },
    { prompt: 'مقدار ۳ × ۴ + ۲ چیست؟', options: ['۱۲', '۱۴', '۱۰', '۱۸'], correctIndex: 1, explanation: '۳×۴=۱۲ سپس ۱۲+۲=۱۴.' },
    { prompt: 'کدام کسر معادل ۱/۲ است؟', options: ['۲/۴', '۳/۵', '۲/۳', '۴/۳'], correctIndex: 0, explanation: '۲/۴ در ساده‌ترین حالت ۱/۲ می‌شود.' },
  ],
  'علوم تجربی': [
    { prompt: 'کدام مورد گاز غالب هوای تنفس‌شده است؟', options: ['اکسیژن', 'نیتروژن', 'دی‌اکسیدکربن', 'آرگون'], correctIndex: 1, explanation: 'حدود ۷۸٪ هوای خشک نیتروژن است.' },
    { prompt: 'فرایند تبدیل آب مایع به بخار را چه می‌نامند؟', options: ['میعان', 'تبخیر', 'رسوب', 'ذوب'], correctIndex: 1, explanation: 'تبدیل مایع به گاز = تبخیر.' },
    { prompt: 'کدام مورد یک مهره‌دار است؟', options: ['کرم خاکی', 'ملخ', 'مار', 'هشت‌پا'], correctIndex: 2, explanation: 'مار دارای ستون فقرات است.' },
  ],
  'ادبیات': [
    { prompt: 'کدام گزینه «استعاره» است؟', options: ['دست روزگار', 'مثل کوه', 'چون خورشید', 'اگر چه'], correctIndex: 0, explanation: '«دست روزگار» جان‌بخشی به روزگار (استعاره) است.' },
    { prompt: 'کدام واژه ضد «شاد» است؟', options: ['غمگین', 'روشن', 'لطیف', 'دلنشین'], correctIndex: 0, explanation: 'غمگین متضاد شاد است.' },
  ],
  'تاریخ': [
    { prompt: 'کوروش بزرگ بنیانگذار کدام سلسله است؟', options: ['ساسانی', 'اشکانی', 'صفوی', 'هخامنشی'], correctIndex: 3, explanation: 'کوروش هخامنشیان را بنیان گذاشت.' },
    { prompt: 'کدام رویداد زودتر رخ داده است؟', options: ['ظهور اسلام', 'انقراض ساسانیان', 'حمله مغول', 'صفویه'], correctIndex: 0, explanation: 'ظهور اسلام (قرن هفتم) پیش از دیگر گزینه‌هاست.' },
  ],
  'جغرافیا': [
    { prompt: 'کدام مورد عامل اصلی فصل‌ها است؟', options: ['فاصله زمین تا خورشید', 'زاویه محوری زمین', 'سرعت چرخش زمین', 'تابش ماه'], correctIndex: 1, explanation: 'تمایل محور زمین سبب تغییر زاویه تابش و فصل‌ها می‌شود.' },
    { prompt: 'کدام قاره بزرگ‌ترین مساحت را دارد؟', options: ['افریقا', 'آسیا', 'امریکای شمالی', 'اروپا'], correctIndex: 1, explanation: 'آسیا پهناورترین قاره است.' },
  ],
};

// Build a single question object
const makeQuestion = (idx) => {
  const grade = randPick(gradesFa);
  const subject = randPick(subjectsFa);
  const chapter = randPick(chaptersFa);
  const type = randPick(QUESTION_TYPES).value;
  const difficulty = randPick(diffsFa);
  const status = randPick(statusesFa);
  const baseTitle = `${subject} ${grade} - ${chapter}`;
  const stem = randPick([
    'به سوال زیر پاسخ دهید.',
    'جای خالی را پر کنید.',
    'کدام گزینه صحیح است؟',
    'توضیح دهید.',
    'تعریف کنید.',
  ]);
  const title = `${baseTitle}: ${stem}`;
  const daysAgo = randInt(10, 420);
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  const hasImage = Math.random() < 0.35;

  const q = {
    id: `q-${1000 + idx}`,
    title,
    type, // internal value
    grade,
    chapter,
    subject,
    imageUrl: hasImage ? imagesByGrade[grade] : '',
    // answer fields (type-specific)
    answer: '',
    answerImages: undefined,
    answerRefChapter: chapter,
    answerRefPage: `صفحه ${randInt(10, 120)}`,
    pageNumber: String(randInt(10, 120)),
    difficulty,
    status,
    author: Math.random() < 0.6 ? randPick(['استاد رضایی', 'استاد محمدی', 'استاد همکار', '—']) : '—',
    options: undefined,
    correctIndex: undefined,
    modelAnswer: undefined,
  matchingLeft: undefined,
  matchingRight: undefined,
  correctPairs: undefined,
    accessRevoked: false,
    addedDateTs: date.getTime(),
    addedDateLabel: fmtFa(date),
    views: randInt(20, 800),
    setsCount: randInt(0, 12),
  };

  if (type === 'test') {
    const tmplList = TEST_TEMPLATES[subject];
    if (tmplList && tmplList.length) {
      const tmpl = randPick(tmplList);
      q.title = `${subject} ${grade} - ${chapter}: ${tmpl.prompt}`; // overwrite with semantic prompt
      q.options = tmpl.options.slice();
      q.correctIndex = tmpl.correctIndex;
      q.answer = tmpl.options[tmpl.correctIndex];
      q.modelAnswer = tmpl.explanation;
    } else {
      const opts = ['گزینه درست', 'گزینه نادرست', 'گزینه محتمل', 'گزینه دیگر'];
      q.options = opts;
      q.correctIndex = randInt(0, 3);
      q.answer = q.options[q.correctIndex];
    }
  } else if (type === 'fillblank') {
    q.answer = randPick(['آب', 'اکسیژن', 'فشار', 'چگالی', 'شتاب']);
  } else if (type === 'short' || type === 'long') {
    q.modelAnswer = randPick([
      'پاسخ نمونه کوتاه.',
      'پاسخ نمونه با جزییات بیشتر برای راهنمایی دانش‌آموز.',
      'نمونه پاسخ تشریحی مطابق کتاب درسی.',
    ]);
  } else if (type === 'truefalse') {
    q.answer = randPick(['درست', 'نادرست']);
  } else if (type === 'matching') {
    // Build simple matching lists
    const left = ['الف', 'ب', 'پ'];
    const right = ['A', 'B', 'C'];
    // Random permutation mapping left[i] -> right[p[i]]
    const perm = [0,1,2].sort(() => Math.random() - 0.5);
    q.matchingLeft = left;
    q.matchingRight = right;
    q.correctPairs = perm.map((rIdx, i) => ({ left: i, right: rIdx }));
    q.modelAnswer = 'هر مورد ستون چپ را به مورد متناظر در ستون راست وصل کنید.';
  }

  // some with answer images
  if (Math.random() < 0.12) q.answerImages = ['/images/7th-grade.png'];
  return q;
};

// --- Deterministic exemplar questions (≥2 per type) -------------------------
// Rationale: UI needs predictable examples for each renderer (test, true/false,
// fill-in-the-blank, short, long). These appear first so demos & tests can rely
// on stable ordering and content.

const daysAgoTs = (d) => {
  const date = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
  return { ts: date.getTime(), label: fmtFa(date) };
};

const exemplarQuestions = [
  // Multiple Choice (test)
  {
    id: 'ex-matching-1',
    title: 'علوم ۷ - فصل ۲: عبارات را با مفاهیم متناظر وصل کنید',
    type: 'matching',
    grade: '۷',
    chapter: 'فصل 2',
    subject: 'علوم تجربی',
    imageUrl: '',
    answer: '',
    answerImages: undefined,
    answerRefChapter: 'فصل 2',
    answerRefPage: 'صفحه 20',
    pageNumber: '20',
    difficulty: 'ساده',
    status: 'منتشر شده',
    author: 'استاد رضایی',
    matchingLeft: ['جامد', 'مایع', 'گاز'],
    matchingRight: ['انباشته و فشرده', 'جریان دارد', 'پراکندگی زیاد'],
    correctPairs: [{left:0,right:0},{left:1,right:1},{left:2,right:2}],
    modelAnswer: 'جامد → انباشته و فشرده، مایع → جریان دارد، گاز → پراکندگی زیاد',
    accessRevoked: false,
    ...(() => { const d = daysAgoTs(7); return { addedDateTs: d.ts, addedDateLabel: d.label }; })(),
    views: 80,
    setsCount: 1,
  },
  {
    id: 'ex-matching-2',
    title: 'ادبیات ۸ - فصل ۳: واژه‌ها را با تعریف‌ها وصل کنید',
    type: 'matching',
    grade: '۸',
    chapter: 'فصل 3',
    subject: 'ادبیات',
    imageUrl: '',
    answer: '',
    answerImages: undefined,
    answerRefChapter: 'فصل 3',
    answerRefPage: 'صفحه 30',
    pageNumber: '30',
    difficulty: 'متوسط',
    status: 'منتشر شده',
    author: 'استاد همکار',
    matchingLeft: ['استعاره', 'تشبیه'],
    matchingRight: ['مانند آوردن', 'جان‌بخشی/جایگزینی'],
    correctPairs: [{left:0,right:1},{left:1,right:0}],
    modelAnswer: 'استعاره → جان‌بخشی/جایگزینی، تشبیه → مانند آوردن',
    accessRevoked: false,
    ...(() => { const d = daysAgoTs(18); return { addedDateTs: d.ts, addedDateLabel: d.label }; })(),
    views: 60,
    setsCount: 2,
  },
  {
    id: 'ex-test-1',
    title: 'ریاضی ۷ - فصل ۱: کدام گزینه عدد اول است؟',
    type: 'test',
    grade: '۷',
    chapter: 'فصل 1',
    subject: 'ریاضی',
    imageUrl: imagesByGrade['۷'],
    answer: '',
    answerImages: undefined,
    answerRefChapter: 'فصل 1',
    answerRefPage: 'صفحه 12',
    pageNumber: '12',
    difficulty: 'ساده',
    status: 'منتشر شده',
    author: 'استاد رضایی',
    options: ['۱۴', '۱۵', '۱۷', '۱۸'],
    correctIndex: 2,
    modelAnswer: 'عدد ۱۷ عددی اول است زیرا فقط بر ۱ و خودش بخش‌پذیر است.',
    accessRevoked: false,
    ...(() => { const d = daysAgoTs(5); return { addedDateTs: d.ts, addedDateLabel: d.label }; })(),
    views: 210,
    setsCount: 4,
  },
  {
    id: 'ex-test-2',
    title: 'علوم تجربی ۸ - فصل ۲: کدام گزینه دربارهٔ تنفس صحیح است؟',
    type: 'test',
    grade: '۸',
    chapter: 'فصل 2',
    subject: 'علوم تجربی',
    imageUrl: '',
    answer: '',
    answerImages: undefined,
    answerRefChapter: 'فصل 2',
    answerRefPage: 'صفحه 34',
    pageNumber: '34',
    difficulty: 'متوسط',
    status: 'منتشر شده',
    author: 'استاد محمدی',
    options: ['ورود اکسیژن به خون در شُش‌ها رخ می‌دهد', 'دی‌اکسیدکربن در معده دفع می‌شود', 'شُش چپ از راست بزرگ‌تر است', 'هموگلوبین فقط نیتروژن حمل می‌کند'],
    correctIndex: 0,
    modelAnswer: 'تبادل گاز در کیسه‌های هوایی شش انجام می‌شود و اکسیژن وارد خون می‌گردد.',
    accessRevoked: false,
    ...(() => { const d = daysAgoTs(12); return { addedDateTs: d.ts, addedDateLabel: d.label }; })(),
    views: 145,
    setsCount: 2,
  },
  // True / False
  {
    id: 'ex-truefalse-1',
    title: 'تاریخ ۹ - فصل ۳: سلسلهٔ هخامنشی پیش از مادها تشکیل شد (درست/نادرست)',
    type: 'truefalse',
    grade: '۹',
    chapter: 'فصل 3',
    subject: 'تاریخ',
    imageUrl: '',
    answer: 'نادرست',
    answerImages: undefined,
    answerRefChapter: 'فصل 3',
    answerRefPage: 'صفحه 48',
    pageNumber: '48',
    difficulty: 'متوسط',
    status: 'منتشر شده',
    author: 'استاد همکار',
    options: undefined,
    correctIndex: undefined,
    modelAnswer: 'امپراتوری مادها پیش از هخامنشیان شکل گرفت؛ بنابراین عبارت نادرست است.',
    accessRevoked: false,
    ...(() => { const d = daysAgoTs(20); return { addedDateTs: d.ts, addedDateLabel: d.label }; })(),
    views: 90,
    setsCount: 1,
  },
  {
    id: 'ex-truefalse-2',
    title: 'جغرافیا ۸ - فصل ۴: محور زمین نسبت به مدار گردش زمین زاویه دارد (درست/نادرست)',
    type: 'truefalse',
    grade: '۸',
    chapter: 'فصل 4',
    subject: 'جغرافیا',
    imageUrl: imagesByGrade['۸'],
    answer: 'درست',
    answerImages: undefined,
    answerRefChapter: 'فصل 4',
    answerRefPage: 'صفحه 60',
    pageNumber: '60',
    difficulty: 'ساده',
    status: 'منتشر شده',
    author: 'استاد رضایی',
    options: undefined,
    correctIndex: undefined,
    modelAnswer: 'محور چرخش زمین حدود ۲۳٫۵ درجه نسبت به صفحهٔ مدار گردش به دور خورشید مایل است.',
    accessRevoked: false,
    ...(() => { const d = daysAgoTs(33); return { addedDateTs: d.ts, addedDateLabel: d.label }; })(),
    views: 120,
    setsCount: 3,
  },
  // Fill in the Blank
  {
    id: 'ex-fillblank-1',
    title: 'علوم تجربی ۷ - فصل ۲: جای خالی را پر کنید: هوایی که وارد شُش‌ها می‌شود سرشار از ____ است.',
    type: 'fillblank',
    grade: '۷',
    chapter: 'فصل 2',
    subject: 'علوم تجربی',
    imageUrl: '',
    answer: 'اکسیژن',
    answerImages: undefined,
    answerRefChapter: 'فصل 2',
    answerRefPage: 'صفحه 26',
    pageNumber: '26',
    difficulty: 'ساده',
    status: 'منتشر شده',
    author: 'استاد محمدی',
    options: undefined,
    correctIndex: undefined,
    modelAnswer: 'هوای ورودی دارای درصد بیشتری اکسیژن نسبت به هوای بازدم است.',
    accessRevoked: false,
    ...(() => { const d = daysAgoTs(9); return { addedDateTs: d.ts, addedDateLabel: d.label }; })(),
    views: 60,
    setsCount: 0,
  },
  {
    id: 'ex-fillblank-2',
    title: 'ریاضی ۹ - فصل ۵: جای خالی را پر کنید: مساحت دایره برابر است با π ضربدر ____ به توان دو.',
    type: 'fillblank',
    grade: '۹',
    chapter: 'فصل 5',
    subject: 'ریاضی',
    imageUrl: '',
    answer: 'شعاع',
    answerImages: undefined,
    answerRefChapter: 'فصل 5',
    answerRefPage: 'صفحه 72',
    pageNumber: '72',
    difficulty: 'ساده',
    status: 'منتشر شده',
    author: '—',
    options: undefined,
    correctIndex: undefined,
    modelAnswer: 'مساحت = πr² که r همان شعاع دایره است.',
    accessRevoked: false,
    ...(() => { const d = daysAgoTs(14); return { addedDateTs: d.ts, addedDateLabel: d.label }; })(),
    views: 75,
    setsCount: 1,
  },
  // Short Answer
  {
    id: 'ex-short-1',
    title: 'ادبیات ۸ - فصل ۱: واژهٔ «دانش» را تعریف کنید.',
    type: 'short',
    grade: '۸',
    chapter: 'فصل 1',
    subject: 'ادبیات',
    imageUrl: '',
    answer: '',
    answerImages: undefined,
    answerRefChapter: 'فصل 1',
    answerRefPage: 'صفحه 8',
    pageNumber: '8',
    difficulty: 'ساده',
    status: 'منتشر شده',
    author: 'استاد همکار',
    options: undefined,
    correctIndex: undefined,
    modelAnswer: 'دانش یعنی آگاهی و معلوماتی که از راه مطالعه و تجربه به دست می‌آید.',
    accessRevoked: false,
    ...(() => { const d = daysAgoTs(3); return { addedDateTs: d.ts, addedDateLabel: d.label }; })(),
    views: 50,
    setsCount: 0,
  },
  {
    id: 'ex-short-2',
    title: 'جغرافیا ۷ - فصل ۶: یک علت اصلی تغییرات آب و هوا را نام ببرید.',
    type: 'short',
    grade: '۷',
    chapter: 'فصل 6',
    subject: 'جغرافیا',
    imageUrl: imagesByGrade['۷'],
    answer: '',
    answerImages: undefined,
    answerRefChapter: 'فصل 6',
    answerRefPage: 'صفحه 88',
    pageNumber: '88',
    difficulty: 'متوسط',
    status: 'منتشر شده',
    author: 'استاد رضایی',
    options: undefined,
    correctIndex: undefined,
    modelAnswer: 'یکی از علل مهم تغییرات آب و هوا، افزایش گازهای گلخانه‌ای در جو است.',
    accessRevoked: false,
    ...(() => { const d = daysAgoTs(27); return { addedDateTs: d.ts, addedDateLabel: d.label }; })(),
    views: 95,
    setsCount: 2,
  },
  // Long (Essay)
  {
    id: 'ex-long-1',
    title: 'علوم تجربی ۹ - فصل ۴: چرخهٔ آب را با ذکر مراحل توضیح دهید.',
    type: 'long',
    grade: '۹',
    chapter: 'فصل 4',
    subject: 'علوم تجربی',
    imageUrl: '',
    answer: '',
    answerImages: undefined,
    answerRefChapter: 'فصل 4',
    answerRefPage: 'صفحه 55',
    pageNumber: '55',
    difficulty: 'متوسط',
    status: 'منتشر شده',
    author: 'استاد محمدی',
    options: undefined,
    correctIndex: undefined,
    modelAnswer: 'چرخهٔ آب شامل تبخیر، تراکم، بارش و رواناب است. آب از سطح دریاها تبخیر شده، در جو متراکم و به صورت بارش به سطح زمین بازمی‌گردد و دوباره وارد رودخانه‌ها و اقیانوس‌ها می‌شود.',
    accessRevoked: false,
    ...(() => { const d = daysAgoTs(41); return { addedDateTs: d.ts, addedDateLabel: d.label }; })(),
    views: 130,
    setsCount: 5,
  },
  {
    id: 'ex-long-2',
    title: 'ادبیات ۹ - فصل ۲: نقش استعاره در زیبایی متن ادبی را شرح دهید.',
    type: 'long',
    grade: '۹',
    chapter: 'فصل 2',
    subject: 'ادبیات',
    imageUrl: '',
    answer: '',
    answerImages: undefined,
    answerRefChapter: 'فصل 2',
    answerRefPage: 'صفحه 22',
    pageNumber: '22',
    difficulty: 'سخت',
    status: 'منتشر شده',
    author: 'استاد همکار',
    options: undefined,
    correctIndex: undefined,
    modelAnswer: 'استعاره با جان‌بخشی به مفاهیم抽 و ایجاد تصویر ذهنی، متن را جذاب‌تر و تأثیرگذارتر می‌کند و در انتقال احساس و معنا نقش مهمی دارد.',
    accessRevoked: false,
    ...(() => { const d = daysAgoTs(60); return { addedDateTs: d.ts, addedDateLabel: d.label }; })(),
    views: 160,
    setsCount: 6,
  },
];

// Randomly generated tail for volume (reduced count now since we prepend exemplars)
const generatedRandom = Array.from({ length: 40 }, (_, i) => makeQuestion(i + 1));

// Export combined dataset
export const mockQuestions = [...exemplarQuestions, ...generatedRandom];
export default mockQuestions;
