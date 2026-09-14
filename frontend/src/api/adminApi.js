import { http, USE_MOCK } from './httpClient';
import { debug } from './logger';

debug('[api] loaded', 'adminApi');
// Lightweight mock data to keep Admin screens usable when backend is unreachable
const MOCK_GRADES = [
  { id: 7, name: 'پایه هفتم' },
  { id: 8, name: 'پایه هشتم' },
  { id: 9, name: 'پایه نهم' },
];
const MOCK_USERS = [
  { id: 1, name: 'کاربر نمونه ۱', email: 'u1@example.com', role: 'student', grade_id: 7, phone: '09120000001', subscription: { status: 'inactive' }, joined_at: new Date().toISOString(), is_active: true },
  { id: 2, name: 'کاربر نمونه ۲', email: 'u2@example.com', role: 'teacher', grade_id: null, phone: '09120000002', subscription: { status: 'active' }, joined_at: new Date(Date.now()-86400000*12).toISOString(), is_active: true },
  { id: 3, name: 'کاربر نمونه ۳', email: 'u3@example.com', role: 'student', grade_id: 8, phone: '09120000003', subscription: { status: 'inactive' }, joined_at: new Date(Date.now()-86400000*30).toISOString(), is_active: false },
];

export async function fetchAdminStats() {
  const { data } = await http.get('/v1/admin/stats');
  // Normalize response shape
  const totals = data?.totals || {};
  return {
    users: totals.users ?? 0,
    recentUsers30: totals.recentUsers30 ?? 0,
    activeSubs: totals.activeSubs ?? 0,
    monthlyRevenue: totals.monthlyRevenue ?? 0,
    openTickets: totals.openTickets ?? 0,
  };
}

// --- Admin Users ---
// Defensive parser: supports { data: { data: [], meta: {} }, meta: {} } and { data: [], meta: {} }
function parseListResponse(resp) {
  const root = resp?.data ?? {};
  const listNode = Array.isArray(root.data) ? root : root.data;
  const items = Array.isArray(listNode?.data) ? listNode.data : (Array.isArray(root.data) ? root.data : []);
  const meta = root.meta || listNode?.meta || {};
  return { items, meta };
}

export async function fetchAdminUsers(params = {}) {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.role) query.set('role', params.role);
  if (params.grade_id) query.set('grade_id', String(params.grade_id));
  if (params.subscription) query.set('subscription', params.subscription); // all|active|none
  if (params.status) query.set('status', params.status); // all|active|suspended
  if (params.page) query.set('page', String(params.page));
  if (params.per_page) query.set('per_page', String(params.per_page));

  const url = '/v1/admin/users' + (query.toString() ? `?${query.toString()}` : '');
  try {
    const res = await http.get(url);
    return parseListResponse(res);
  } catch (e) {
    // Fallback to mock on network/CORS errors to keep UI functional
    const isNetwork = !e?.response;
    if (isNetwork) {
      const items = Array.from(MOCK_USERS);
      const per = Number(params.per_page || items.length);
      const page = Number(params.page || 1);
      const start = (page - 1) * per;
      const sliced = items.slice(start, start + per);
      return { items: sliced, meta: { total: items.length, per_page: per, page } };
    }
    throw e;
  }
}

export async function fetchGrades() {
  try {
    const res = await http.get('/v1/grades');
    // Expecting an array of { id, name }
    return res.data?.data || res.data || [];
  } catch (e) {
    if (!e?.response) return MOCK_GRADES;
    throw e;
  }
}

export async function fetchSubjects() {
  try {
    const res = await http.get('/v1/admin/subjects?per=100');
    // Handle paginated response
    const data = res.data?.data;
    if (Array.isArray(data?.data)) {
      return data.data; // Paginated structure
    }
    return data || [];
  } catch (e) {
    console.error('Failed to fetch subjects:', e);
    return [];
  }
}

export async function fetchBooks(params = {}) {
  const query = new URLSearchParams();
  if (params.grade_id) query.set('grade_id', String(params.grade_id));
  if (params.per) query.set('per', String(params.per));
  const url = '/v1/admin/books' + (query.toString() ? `?${query.toString()}` : '');
  const res = await http.get(url);
  const data = res.data?.data;
  if (Array.isArray(data?.data)) {
    return data.data; // Paginated
  }
  return data || [];
}

export async function fetchBooksByGrade(gradeId) {
  const res = await http.get(`/v1/grades/${gradeId}/books`);
  return res.data?.data || res.data || [];
}

export async function createBook(payload) {
  const res = await http.post('/v1/admin/books', payload);
  return res.data?.data || res.data;
}

export async function updateBook(id, payload) {
  const res = await http.put(`/v1/admin/books/${id}`, payload);
  return res.data?.data || res.data;
}

export async function deleteBook(id) {
  const res = await http.delete(`/v1/admin/books/${id}`);
  return res.data?.data || res.data;
}

export async function createChapter(payload) {
  const res = await http.post('/v1/admin/chapters', payload);
  return res.data?.data || res.data;
}

export async function fetchChaptersByBook(bookId) {
  const res = await http.get(`/v1/books/${bookId}/chapters`);
  return res.data?.data || res.data || [];
}

export async function fetchSubchaptersByChapter(chapterId) {
  const res = await http.get(`/v1/chapters/${chapterId}/subchapters`);
  const root = res.data?.data ?? res.data ?? [];
  // Normalize various shapes to an array of objects
  let arr = [];
  if (!root) arr = [];
  else if (Array.isArray(root)) arr = root;
  else if (Array.isArray(root.items)) arr = root.items;
  else if (Array.isArray(root.data)) arr = root.data;
  else arr = [root];
  // Map to canonical shape (id, number, title)
  return arr.map((x) => ({
    id: x?.id ?? x?.subchapter_id ?? x?.value ?? null,
    number: x?.number ?? x?.no ?? x?.index ?? x?.order ?? null,
    title: x?.title ?? x?.name ?? x?.label ?? '',
  })).filter(sc => sc.id != null);
}

export async function createAdminUser(payload) {
  const res = await http.post('/v1/admin/users', payload);
  return res.data?.data || res.data;
}

export async function fetchAdminHandouts(params = {}) {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.page) query.set('page', String(params.page));
  if (params.per_page) query.set('per_page', String(params.per_page));
  const url = '/v1/admin/handouts' + (query.toString() ? `?${query.toString()}` : '');
  const res = await http.get(url);
  // Backend returns: { code, message, data: { items: [...], meta: {...} } }
  // But some endpoints may use { data: [...], meta: {...} } or plain array.
  const root = res.data?.data ?? res.data;
  // If root has items (PaginationResource wrapper)
  if (root && Array.isArray(root.items)) return { items: root.items.map(normalizeHandout), meta: root.meta || {} };
  // If root itself is the collection wrapper with data key
  if (root && Array.isArray(root.data)) return { items: root.data.map(normalizeHandout), meta: root.meta || {} };
  // If res.data is already an array
  if (Array.isArray(res.data)) return { items: res.data.map(normalizeHandout), meta: {} };
  return { items: [], meta: {} };
}

// --- Contents (admin) ---
export async function fetchAdminContentTypes() {
  const res = await http.get('/v1/admin/content-types');
  const raw = res.data?.data || res.data || [];
  return Array.isArray(raw) ? raw : [];
}

export async function fetchAdminContents(params = {}) {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.page) query.set('page', String(params.page));
  if (params.per_page) query.set('per_page', String(params.per_page));
  if (params.type_id) query.set('type_id', String(params.type_id));
  if (params.subchapter_id) query.set('subchapter_id', String(params.subchapter_id));
  if (typeof params.is_free === 'boolean') query.set('is_free', params.is_free ? '1' : '0');

  const url = '/v1/admin/contents' + (query.toString() ? `?${query.toString()}` : '');
  const res = await http.get(url);
  
  // Response structure: { code: "OK", message: "...", data: [...], meta: {...} }
  const data = res.data?.data;
  const meta = res.data?.meta || {};
  
  if (Array.isArray(data)) {
    return { items: data, meta };
  }
  
  // Fallback for other formats
  if (Array.isArray(res.data)) {
    return { items: res.data, meta: {} };
  }
  
  return { items: [], meta: {} };
}

export async function fetchAdminContent(id) {
  const res = await http.get(`/v1/admin/contents/${id}`);
  return res.data?.data || res.data || null;
}

export async function createAdminContent(payload) {
  const config = {};
  // اگر payload یک FormData است، axios خودکار Content-Type را تنظیم می‌کند
  if (payload instanceof FormData) {
    config.headers = { 'Content-Type': 'multipart/form-data' };
  }
  const res = await http.post('/v1/admin/contents', payload, config);
  return res.data?.data || res.data;
}

export async function updateAdminContent(id, payload) {
  const config = {};
  // برای FormData از POST با _method=PUT استفاده می‌کنیم (Laravel workaround)
  if (payload instanceof FormData) {
    config.headers = { 'Content-Type': 'multipart/form-data' };
    payload.append('_method', 'PUT');
    const res = await http.post(`/v1/admin/contents/${id}`, payload, config);
    return res.data?.data || res.data;
  }
  const res = await http.put(`/v1/admin/contents/${id}`, payload);
  return res.data?.data || res.data;
}

export async function deleteAdminContent(id) {
  const res = await http.delete(`/v1/admin/contents/${id}`);
  return res.data?.data || res.data;
}

// --- Admin User (single) ---
export async function fetchAdminUser(id) {
  try {
    const res = await http.get(`/v1/admin/users/${id}`);
    return res.data?.data || res.data || null;
  } catch (e) {
    if (!e?.response) {
      // On network error, attempt to synthesize a plausible minimal user object from list mocks
      const u = (MOCK_USERS || []).find(x => String(x.id) === String(id));
      return u || null;
    }
    throw e;
  }
}

// --- Per-user nested (admin) ---
export async function fetchUserActivityLogs(userId, params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.per_page) query.set('per_page', String(params.per_page));
  const url = `/v1/admin/users/${userId}/activity-logs` + (query.toString() ? `?${query.toString()}` : '');
  const res = await http.get(url);
  const root = res.data || {};
  const items = Array.isArray(root.data) ? root.data : (Array.isArray(root) ? root : []);
  const meta = root.meta || {};
  return { items, meta };
}

export async function fetchUserWallet(userId) {
  const res = await http.get(`/v1/admin/users/${userId}/wallet`);
  const d = res.data?.data || res.data || {};
  return { balance: d.balance ?? 0, transactions: Array.isArray(d.transactions) ? d.transactions : [] };
}

export async function adjustUserWallet(userId, { type, amount, reason }) {
  const res = await http.post(`/v1/admin/users/${userId}/wallet/adjust`, { type, amount, reason });
  return res.data?.data || res.data || {};
}

export async function fetchUserVideoLicenses(userId, params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.per_page) query.set('per_page', String(params.per_page));
  const url = `/v1/admin/users/${userId}/video-licenses` + (query.toString() ? `?${query.toString()}` : '');
  const res = await http.get(url);
  const root = res.data || {};
  const items = Array.isArray(root.data) ? root.data : (Array.isArray(root) ? root : []);
  const meta = root.meta || {};
  return { items, meta };
}

export async function fetchAdminSubscriptionsByUser(userId, params = {}) {
  const query = new URLSearchParams();
  query.set('user_id', String(userId));
  if (params.page) query.set('page', String(params.page));
  if (params.per_page) query.set('per_page', String(params.per_page));
  if (params.status) query.set('status', String(params.status));
  const url = `/v1/admin/subscriptions?${query.toString()}`;
  const res = await http.get(url);
  const root = res.data?.data || res.data || {};
  // Laravel paginator returns data under 'data' key
  const items = Array.isArray(root.data) ? root.data : (Array.isArray(res.data?.data) ? res.data.data : []);
  const meta = root.meta || res.data?.meta || {};
  return { items, meta };
}

export async function topupUserTokens(userId, amount, plan_id = null, valid_until = null) {
  const payload = { user_id: userId, amount };
  if (plan_id) payload.plan_id = plan_id;
  if (valid_until) payload.valid_until = valid_until;
  const res = await http.post('/v1/admin/tokens/topup', payload);
  return res.data?.data || res.data || {};
}

// --- Questions (admin) ---
export async function fetchAdminQuestionTypes() {
  const res = await http.get('/v1/admin/question-types');
  const raw = res.data?.data || res.data || [];
  // normalize to array of {id, name}
  return Array.isArray(raw) ? raw : [];
}

export async function fetchAdminQuestions(params = {}) {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.page) query.set('page', String(params.page));
  if (params.per_page) query.set('per_page', String(params.per_page));
  if (params.type_id) query.set('type_id', String(params.type_id));
  if (params.subchapter_id) query.set('subchapter_id', String(params.subchapter_id));
  const url = '/v1/admin/questions' + (query.toString() ? `?${query.toString()}` : '');
  const res = await http.get(url);
  const root = res.data?.data || res.data || {};
  // backend returns paginated wrapper
  if (root && Array.isArray(root.items)) return { items: root.items, meta: root.meta || {} };
  if (root && Array.isArray(root.data)) return { items: root.data, meta: root.meta || {} };
  if (Array.isArray(res.data)) return { items: res.data, meta: {} };
  return { items: [], meta: {} };
}

export async function fetchAdminQuestion(id) {
  const res = await http.get(`/v1/admin/questions/${id}`);
  const raw = res.data?.data || res.data || null;
  return raw;
}

export async function createAdminQuestion(payload) {
  const res = await http.post('/v1/admin/questions', payload);
  return res.data?.data || res.data;
}

export async function updateAdminQuestion(id, payload) {
  const res = await http.put(`/v1/admin/questions/${id}`, payload);
  return res.data?.data || res.data;
}

export async function deleteAdminQuestion(id) {
  const res = await http.delete(`/v1/admin/questions/${id}`);
  return res.data?.data || res.data;
}

// Helper: build backend `pairs` payload from editor state
export function buildPairsFromMatching(matchingLeft = [], matchingRight = [], correctPairs = []) {
  if (!Array.isArray(correctPairs)) return [];
  const left = Array.isArray(matchingLeft) ? matchingLeft : [];
  const right = Array.isArray(matchingRight) ? matchingRight : [];
  const out = [];
  for (const p of correctPairs) {
    if (!Array.isArray(p) || p.length !== 2) continue;
    const li = Number(p[0]);
    const ri = Number(p[1]);
    if (!Number.isFinite(li) || !Number.isFinite(ri)) continue;
    const ltxt = (left[li] || '').trim();
    const rtxt = (right[ri] || '').trim();
    if (!ltxt || !rtxt) continue;
    out.push({ left_text: ltxt, right_text: rtxt, match_key: null });
  }
  return out;
}

export async function createAdminHandout(payload) {
  const res = await http.post('/v1/admin/handouts', payload);
  const raw = res.data?.data || res.data;
  return normalizeHandout(raw);
}

export async function fetchAdminHandout(id) {
  const res = await http.get(`/v1/admin/handouts/${id}`);
  let raw = res.data?.data || res.data;
  // some APIs may nest again under `data` (defensive)
  if (raw && raw.data) raw = raw.data;
  return normalizeHandout(raw);
}

export async function updateAdminHandout(id, payload) {
  const res = await http.put(`/v1/admin/handouts/${id}`, payload);
  const raw = res.data?.data || res.data;
  return normalizeHandout(raw);
}

export async function deleteAdminHandout(id) {
  const res = await http.delete(`/v1/admin/handouts/${id}`);
  return res.data?.data || res.data;
}

export async function fetchAdminHandoutStats(id) {
  const res = await http.get(`/v1/admin/handouts/${id}/stats`);
  const d = res.data?.data || res.data || {};
  return {
    downloadsTotal: d.downloads_total ?? 0,
    downloads7d: d.downloads_7d ?? 0,
    viewsTotal: d.views_total ?? 0,
    views7d: d.views_7d ?? 0,
  };
}

export async function updateAdminUser(id, payload) {
  const res = await http.put(`/v1/admin/users/${id}`, payload);
  return res.data?.data || res.data;
}

export async function deleteAdminUser(id) {
  const res = await http.delete(`/v1/admin/users/${id}`);
  return res.data?.data || res.data;
}

export async function suspendAdminUser(id) {
  const res = await http.patch(`/v1/admin/users/${id}/suspend`);
  return res.data?.data || res.data;
}

export async function activateAdminUser(id) {
  const res = await http.patch(`/v1/admin/users/${id}/activate`);
  return res.data?.data || res.data;
}

// Chapter CRUD
export async function fetchAllChapters(params = {}) {
  const query = new URLSearchParams();
  if (params.book_id) query.set('book_id', String(params.book_id));
  if (params.q) query.set('q', params.q);
  if (params.per) query.set('per', String(params.per));
  const url = '/v1/admin/chapters' + (query.toString() ? `?${query.toString()}` : '');
  const res = await http.get(url);
  return res.data?.data || res.data || [];
}

export async function updateChapter(id, data) {
  const res = await http.put(`/v1/admin/chapters/${id}`, data);
  return res.data?.data || res.data;
}

// Token Packages CRUD
export async function fetchTokenPackages() {
  const res = await http.get('/v1/admin/token-packages');
  return res.data?.data || res.data || [];
}

export async function createTokenPackage(payload) {
  const res = await http.post('/v1/admin/token-packages', payload);
  return res.data?.data || res.data;
}

export async function updateTokenPackage(id, payload) {
  const res = await http.put(`/v1/admin/token-packages/${id}`, payload);
  return res.data?.data || res.data;
}

export async function deleteTokenPackage(id) {
  const res = await http.delete(`/v1/admin/token-packages/${id}`);
  return res.data?.data || res.data;
}

export default {
  fetchAdminStats,
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  suspendAdminUser,
  activateAdminUser,
  fetchGrades,
  fetchSubjects,
  fetchBooks,
  fetchBooksByGrade,
  createBook,
  updateBook,
  deleteBook,
  fetchChaptersByBook,
  createChapter,
  fetchSubchaptersByChapter,
  fetchAllChapters,
  updateChapter,
  fetchTokenPackages,
  createTokenPackage,
  updateTokenPackage,
  deleteTokenPackage,
  fetchAdminQuestionTypes,
  fetchAdminQuestions,
  fetchAdminQuestion,
  createAdminQuestion,
  updateAdminQuestion,
  deleteAdminQuestion,
  buildPairsFromMatching,
};

// Helper: normalize server handout shape (snake_case) to camelCase expected by UI
function normalizeHandout(raw) {
  if (!raw) return raw;
  // If it's a paginated wrapper, try to extract 'items'
  const h = raw?.data || raw;
  if (!h) return raw;
  const map = obj => ({
    id: obj.id,
    title: obj.title,
    description: obj.description,
  pdfUrl: obj.pdf_url || obj.pdfUrl || obj.pdf || obj.file_url || obj.fileUrl || obj.file || obj.document_url || obj.documentUrl || '',
    pages: obj.pages ?? obj.page_count ?? obj.pages_count ?? null,
    price: obj.price ?? 0,
    teacher: obj.teacher ?? obj.teacher_name ?? '',
    grade: obj.grade ?? '',
    subject: obj.subject ?? '',
    chapter: obj.chapter ?? '',
    accessType: obj.access_type || obj.accessType || (obj.is_free ? 'free' : 'paid'),
    status: obj.status ?? 'draft',
    accessRevoked: !!obj.access_revoked || !!obj.accessRevoked || false,
    addedDate: obj.added_date || obj.addedAt || obj.added_at || '',
    teacherGuideUrl: obj.teacher_guide_url || obj.teacherGuideUrl || '',
    classSummaryUrl: obj.class_summary_url || obj.classSummaryUrl || '',
  });
  if (Array.isArray(h)) return h.map(map);
  return map(h);
}
