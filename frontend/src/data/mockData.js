// src/data/mockData.js
import React from 'react';
import {
  Video, FileText, LogIn, ShoppingCart, Settings, BookOpen, CheckCircle, XCircle
} from 'lucide-react';

// This mock data simulates what you would fetch from your backend API.
export const mockUsers = Array.from({ length: 100 }, (_, i) => ({
  id: `user-${i + 1}`,
  name: `کاربر ${i + 1}`,
  email: `user${i + 1}@elmino.com`,
  avatar: `https://i.pravatar.cc/150?u=user${i + 1}`,
  role: i % 3 === 0 ? 'مدیر' : (i % 3 === 1 ? 'معلم' : 'دانش‌آموز'),
  grade: `پایه ${Math.floor(i / 10) + 1}`,
  subscriptionStatus: i % 4 === 0 ? 'فعال' : 'منقضی شده',
  content: [
    { id: 1, type: 'video', title: 'فصل اول: مثلثات', purchaseDate: '1403/01/15', access: true, icon: <Video size={20} color="#2962ff" /> },
    { id: 2, type: 'handout', title: 'جزوه کامل فیزیک', purchaseDate: '1403/01/10', access: true, icon: <FileText size={20} color="#2e7d32" /> },
    { id: 3, type: 'video', title: 'فصل دوم: لگاریتم', purchaseDate: '1402/12/20', access: false, icon: <Video size={20} color="#2962ff" /> },
  ],
  activity: [
    { id: 1, type: 'login', description: 'ورود به سیستم از طریق دسکتاپ', date: '1403/05/20 - 10:30', icon: <LogIn color="white" /> },
    { id: 2, type: 'purchase', description: 'خرید دوره "ریاضی جامع"', date: '1403/05/18 - 15:00', icon: <ShoppingCart color="white" /> },
    { id: 3, type: 'content_view', description: 'مشاهده ویدیوی "فصل اول: مثلثات"', date: '1403/05/18 - 15:10', icon: <BookOpen color="white" /> },
    { id: 4, type: 'settings_change', description: 'تغییر رمز عبور', date: '1403/05/15 - 09:00', icon: <Settings color="white" /> },
  ],
  financialHistory: [
    { id: 'tx-1', date: '1403/05/18', item: 'دوره ریاضی جامع', amount: '250,000 تومان', status: 'موفق' },
    { id: 'tx-2', date: '1403/04/10', item: 'افزایش اعتبار کیف پول', amount: '100,000 تومان', status: 'موفق' },
    { id: 'tx-3', date: '1403/03/05', item: 'دوره فیزیک پایه', amount: '180,000 تومان', status: 'ناموفق' },
  ],
  walletBalance: 150000,
  tokenBalance: 50,
}));
