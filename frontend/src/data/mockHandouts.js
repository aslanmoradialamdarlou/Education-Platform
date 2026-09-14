// src/data/mockHandouts.js
export const mockHandouts = [
  { id: 'h-101', title: 'خلاصه نکات فصل ۱ علوم هفتم', subject: 'علوم تجربی', teacher: 'استاد رضایی', accessType: 'paid', status: 'published', grade: '7', chapter: 'فصل ۱', pages: 24, price: 50000, pdfUrl: 'https://example.com/h101.pdf', description: 'خلاصه و نکات مهم فصل ۱', teacherGuideUrl: '', classSummaryUrl: '', accessRevoked: false, addedDate: '1403/01/11' },
  { id: 'h-102', title: 'نمونه سوالات فصل ۲ علوم هفتم', subject: 'علوم تجربی', teacher: 'استاد احمدی', accessType: 'free', status: 'draft', grade: '7', chapter: 'فصل ۲', pages: 18, price: 0, pdfUrl: 'https://example.com/h102.pdf', description: 'نمونه سوالات و تمرین‌ها', teacherGuideUrl: '', classSummaryUrl: '', accessRevoked: false, addedDate: '1403/02/03' },
  { id: 'h-201', title: 'جزوه کامل فصل ۳ علوم هشتم', subject: 'علوم تجربی', teacher: 'استاد محمدی', accessType: 'paid', status: 'published', grade: '8', chapter: 'فصل ۳', pages: 30, price: 65000, pdfUrl: 'https://example.com/h201.pdf', description: 'جزوه کامل همراه با مثال', teacherGuideUrl: '', classSummaryUrl: '', accessRevoked: false, addedDate: '1403/03/09' },
  { id: 'h-202', title: 'راهنمای حل تمرین فصل ۴ علوم هشتم', subject: 'علوم تجربی', teacher: 'استاد محمدی', accessType: 'free', status: 'published', grade: '8', chapter: 'فصل ۴', pages: 16, price: 0, pdfUrl: 'https://example.com/h202.pdf', description: 'راهنمای قدم‌به‌قدم تمرین‌ها', teacherGuideUrl: '', classSummaryUrl: '', accessRevoked: false, addedDate: '1403/04/01' },
  { id: 'h-301', title: 'خلاصه فصل ۱ علوم نهم', subject: 'علوم تجربی', teacher: 'استاد داودی', accessType: 'paid', status: 'revoked', grade: '9', chapter: 'فصل ۱', pages: 28, price: 60000, pdfUrl: 'https://example.com/h301.pdf', description: 'نکات کلیدی', teacherGuideUrl: '', classSummaryUrl: '', accessRevoked: true, addedDate: '1403/04/21' },
  { id: 'h-302', title: 'نمونه سوال فصل ۲ علوم نهم', subject: 'علوم تجربی', teacher: 'استاد داودی', accessType: 'paid', status: 'published', grade: '9', chapter: 'فصل ۲', pages: 22, price: 55000, pdfUrl: 'https://example.com/h302.pdf', description: 'سوالات پرتکرار', teacherGuideUrl: '', classSummaryUrl: '', accessRevoked: false, addedDate: '1403/05/02' },
];

export const HANDOUT_ACCESS = [
  { value: 'free', label: 'رایگان' },
  { value: 'paid', label: 'اشتراکی' },
];
