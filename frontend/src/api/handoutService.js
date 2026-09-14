// src/api/handoutService.js
import { http } from './httpClient';
import { debug } from './logger';

debug('[api] loaded', 'handoutService');

/**
 * دریافت لیست جزوات با فیلترهای مختلف
 * @param {Object} params - پارامترهای فیلتر و صفحه‌بندی
 * @returns {Promise<Object>} - {data, pagination}
 */
export async function fetchHandouts(params = {}) {
  const {
    page = 1,
    per_page = 20,
    q = '',
    grade = '',
    subject = '',
  } = params;

  const queryParams = new URLSearchParams();
  queryParams.append('page', page);
  queryParams.append('per_page', per_page);
  if (q) queryParams.append('q', q);
  if (grade) queryParams.append('grade', grade);
  if (subject) queryParams.append('subject', subject);

  const response = await http.get(`/v1/handouts?${queryParams.toString()}`);
  return response.data;
}

/**
 * دریافت جزئیات یک جزوه
 * @param {number} id - شناسه جزوه
 * @returns {Promise<Object>} - اطلاعات جزوه
 */
export async function fetchHandoutById(id) {
  const response = await http.get(`/v1/handouts/${id}`);
  return response.data;
}

/**
 * ثبت بازدید جزوه (برای آمار)
 * @param {number} id - شناسه جزوه
 */
export async function trackHandoutView(id) {
  try {
    await http.post(`/v1/handouts/${id}/view`);
  } catch (error) {
    console.error('Failed to track view:', error);
  }
}

/**
 * دانلود امن جزوه
 * این endpoint احراز هویت شده است و چک توکن/اشتراک می‌کند
 * فایل به صورت blob دریافت می‌شود (نه URL مستقیم)
 * 
 * @param {number} id - شناسه جزوه
 * @param {string} title - عنوان جزوه (برای نام فایل)
 * @returns {Promise<void>}
 */
export async function downloadHandout(id, title = 'handout') {
  try {
    const response = await http.get(`/v1/handouts/${id}/download`, {
      responseType: 'blob', // دریافت فایل به صورت blob
    });

    // ساخت URL موقت از blob
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);

    // ساخت لینک دانلود و کلیک خودکار
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}.pdf`;
    document.body.appendChild(link);
    link.click();

    // پاک‌سازی
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download failed:', error);
    
    // بررسی نوع خطا
    if (error.response?.status === 401) {
      throw new Error('برای دانلود باید وارد حساب کاربری شوید');
    } else if (error.response?.status === 402) {
      throw new Error('توکن کافی ندارید');
    } else if (error.response?.status === 403) {
      throw new Error('دسترسی به این جزوه ندارید');
    } else if (error.response?.status === 404) {
      throw new Error('فایل یافت نشد');
    }
    
    throw new Error('خطا در دانلود فایل');
  }
}
