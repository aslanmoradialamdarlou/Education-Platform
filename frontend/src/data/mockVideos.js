// src/data/mockVideos.js
export const mockVideos = [
  { id: 'v-101', title: 'علوم ۷ - فصل ۱: آشنایی با بدن انسان', type: 'lecture', grade: '7', subject: 'علوم تجربی', chapter: 'فصل ۱', duration: '12:30', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnailUrl: '', description: 'مرور فصل اول علوم هفتم', teacher: 'استاد رضایی', accessType: 'free', status: 'published', accessRevoked: false, addedDate: '1403/01/12' },
  { id: 'v-102', title: 'علوم ۷ - فصل ۲: مواد و مخلوط‌ها', type: 'practice', grade: '7', subject: 'علوم تجربی', chapter: 'فصل ۲', duration: '18:20', url: 'https://example.com/v102.mp4', thumbnailUrl: '', description: 'تمرین فصل دوم', teacher: 'استاد احمدی', accessType: 'paid', status: 'draft', accessRevoked: false, addedDate: '1403/02/05' },
  { id: 'v-201', title: 'علوم ۸ - فصل ۳: چرخه آب', type: 'lecture', grade: '8', subject: 'علوم تجربی', chapter: 'فصل ۳', duration: '22:05', url: 'https://example.com/v201.mp4', thumbnailUrl: '', description: 'چرخه آب در طبیعت', teacher: 'استاد محمدی', accessType: 'paid', status: 'published', accessRevoked: false, addedDate: '1403/03/10' },
  { id: 'v-202', title: 'علوم ۸ - فصل ۴: فشار و چگالی', type: 'solution', grade: '8', subject: 'علوم تجربی', chapter: 'فصل ۴', duration: '15:10', url: 'https://example.com/v202.mp4', thumbnailUrl: '', description: 'حل تمرین‌های منتخب', teacher: 'استاد محمدی', accessType: 'free', status: 'published', accessRevoked: false, addedDate: '1403/04/01' },
  { id: 'v-301', title: 'علوم ۹ - فصل ۱: زمین‌ساخت', type: 'lecture', grade: '9', subject: 'علوم تجربی', chapter: 'فصل ۱', duration: '19:45', url: 'https://example.com/v301.mp4', thumbnailUrl: '', description: 'زمین‌ساخت و صفحات تکتونیکی', teacher: 'استاد داودی', accessType: 'paid', status: 'published', accessRevoked: false, addedDate: '1403/04/21' },
  { id: 'v-302', title: 'علوم ۹ - فصل ۲: نور و بینایی', type: 'practice', grade: '9', subject: 'علوم تجربی', chapter: 'فصل ۲', duration: '17:00', url: 'https://example.com/v302.mp4', thumbnailUrl: '', description: 'تمرین دیداری', teacher: 'استاد داودی', accessType: 'paid', status: 'revoked', accessRevoked: true, addedDate: '1403/05/02' },
];

export const VIDEO_TYPES = [
  { value: 'lecture', label: 'آموزشی' },
  { value: 'practice', label: 'تمرین' },
  { value: 'solution', label: 'حل تمرین' },
];
