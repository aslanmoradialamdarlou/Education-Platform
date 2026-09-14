// src/api/sampleQuestionService.js
import { http } from './httpClient';
import { debug } from './logger';

debug('[api] loaded', 'sampleQuestionService');

/**
 * دریافت لیست نمونه سوالات با فیلترهای مختلف
 * @param {Object} params - پارامترهای فیلتر و صفحه‌بندی
 * @returns {Promise<Object>} - {data, pagination}
 */
export async function fetchSampleQuestions(params = {}) {
  const {
    page = 1,
    per_page = 20,
    q = '',
    grade = '',
    subject = '',
    chapter = '',
    is_free = null,
  } = params;

  const queryParams = new URLSearchParams();
  queryParams.append('page', page);
  queryParams.append('per_page', per_page);
  if (q) queryParams.append('q', q);
  if (grade) queryParams.append('grade_id', grade);
  if (subject) queryParams.append('subject_id', subject);
  if (chapter) queryParams.append('chapter', chapter);
  if (is_free !== null) queryParams.append('is_free', is_free ? '1' : '0');

  const response = await http.get(`/v1/sample-questions?${queryParams.toString()}`);
  
  // نرمال‌سازی پاسخ
  const data = response.data?.data || response.data;
  return {
    data: {
      items: data?.items || [],
      pagination: data?.pagination || { total: 0, current_page: page, per_page }
    }
  };
}

/**
 * دریافت جزئیات یک نمونه سوال
 * @param {number} id - شناسه نمونه سوال
 * @returns {Promise<Object>} - اطلاعات نمونه سوال
 */
export async function fetchSampleQuestionById(id) {
  const response = await http.get(`/v1/sample-questions/${id}`);
  return response.data?.data || response.data;
}

/**
 * ثبت بازدید نمونه سوال (برای آمار)
 * @param {number} id - شناسه نمونه سوال
 */
export async function trackSampleQuestionView(id) {
  try {
    await http.post(`/v1/sample-questions/${id}/view`);
  } catch (error) {
    console.error('Failed to track view:', error);
  }
}

/**
 * دانلود امن نمونه سوال
 * این endpoint احراز هویت شده است و چک توکن/اشتراک می‌کند
 * فایل به صورت blob دریافت می‌شود (نه URL مستقیم)
 * 
 * @param {number} id - شناسه نمونه سوال
 * @param {string} title - عنوان نمونه سوال (برای نام فایل)
 * @returns {Promise<void>}
 */
export async function downloadSampleQuestion(id, title = 'sample-question') {
  try {
    const response = await http.get(`/v1/sample-questions/${id}/download`, {
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
      throw new Error('دسترسی به این نمونه سوال ندارید');
    } else if (error.response?.status === 404) {
      throw new Error('فایل یافت نشد');
    }
    
    throw new Error('خطا در دانلود فایل');
  }
}
