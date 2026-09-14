// src/api/contentService.js
import { http } from './httpClient';
import { debug } from './logger';

debug('[api] loaded', 'contentService');

/**
 * دریافت جزئیات یک محتوا (ویدیو، جزوه، نمونه سوال و غیره)
 * @param {number} id - شناسه محتوا
 * @returns {Promise<Object>} - اطلاعات محتوا
 */
export async function fetchContentById(id) {
  const response = await http.get(`/v1/contents/${id}`);
  return response.data?.data || response.data;
}

/**
 * دریافت لیست محتواها با فیلترهای مختلف
 * @param {Object} params - پارامترهای فیلتر و صفحه‌بندی
 * @returns {Promise<Object>} - {items, meta}
 */
export async function fetchContents(params = {}) {
  const response = await http.get('/v1/contents', { params });
  return response.data?.data || response.data;
}
