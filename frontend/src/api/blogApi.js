// Blog API layer (mock-first). When USE_MOCK=false routes requests through real backend endpoints.
import { http, USE_MOCK } from './httpClient';
import { debug } from './logger';

debug('[api] loaded', 'blogApi');
// Keeps an in-memory posts store in mock mode and exposes async functions.

const delay = (ms = 250) => new Promise(res => setTimeout(res, ms));

// Initial mock post used by the app. Keep structure similar to what the UI expects.
const initialPost = {
  id: 'post-1',
  title: 'چرا فلایمنگوها یک پا میایستند؟ یک بررسی علمی',
  author: 'دکتر ال مینو',
  authorAvatar: 'https://i.pravatar.cc/150?u=doc',
  date: '18 مرداد 1404',
  featuredImage: 'https://images.unsplash.com/photo-1536623975707-c4b33c6231a4?q=80&w=1000&auto=format&fit=crop',
  content: `<p>ایستادن روی یک پا برای مدتی طولانی ممکن است برای انسان‌ها دشوار باشد، اما برای فلایمنگوها، این یک استراتژی طبیعی است...</p>`,
  comments: [
    { id: 1, author: 'سارا رضایی', avatar: 'https://i.pravatar.cc/150?u=sara', text: 'خیلی جالب بود! همین‌شه این سوال برام پیش میومد.' , replies: []},
    { id: 2, author: 'علی محمدی', avatar: 'https://i.pravatar.cc/150?u=ali', text: 'ممنون از مقاله خوبتون.' , replies: []}
  ],
  rating: 4.8,
  voteCount: 251
};

// Additional mock posts for listing
const extraPosts = [
  {
    id: 'post-2',
    title: 'آیا گیاهان می‌توانند بشنوند؟',
    author: 'دکتر ال مینو',
    authorAvatar: 'https://i.pravatar.cc/150?u=doc2',
    date: '20 مرداد 1404',
    featuredImage: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1000&auto=format&fit=crop',
    content: `<p>پژوهش‌های جدید نشان می‌دهند که برخی گیاهان نسبت به ارتعاشات صوتی واکنش نشان می‌دهند...</p>`,
    comments: [], rating: 4.4, voteCount: 121
  },
  {
    id: 'post-3',
    title: 'رازهای مغناطیس زمین',
    author: 'تحریریه',
    authorAvatar: 'https://i.pravatar.cc/150?u=editor',
    date: '25 مرداد 1404',
    featuredImage: 'https://images.unsplash.com/photo-1552858725-0eb7f0e1fae3?q=80&w=1000&auto=format&fit=crop',
    content: `<p>میدان مغناطیسی زمین سپر محافظ ما در برابر بادهای خورشیدی است...</p>`,
    comments: [], rating: 4.2, voteCount: 78
  },
  {
    id: 'post-4',
    title: 'چگونه رنگین‌کمان تشکیل می‌شود؟',
    author: 'تحریریه',
    authorAvatar: 'https://i.pravatar.cc/150?u=editor2',
    date: '30 مرداد 1404',
    featuredImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000&auto=format&fit=crop',
    content: `<p>شکست و بازتاب نور در قطرات باران رنگین‌کمان را می‌سازد...</p>`,
    comments: [], rating: 4.9, voteCount: 402
  },
  {
    id: 'post-5',
    title: 'چرخه آب در طبیعت',
    author: 'تحریریه',
    authorAvatar: 'https://i.pravatar.cc/150?u=editor3',
    date: '5 شهریور 1404',
    featuredImage: 'https://images.unsplash.com/photo-1497561813398-8fcc7a37b567?q=80&w=1000&auto=format&fit=crop',
    content: `<p>تبخیر، تراکم و بارش سه گام مهم در چرخه آب هستند...</p>`,
    comments: [], rating: 4.1, voteCount: 60
  },
  {
    id: 'post-6',
    title: 'نور آبی و خواب',
    author: 'دکتر ال مینو',
    authorAvatar: 'https://i.pravatar.cc/150?u=doc3',
    date: '9 شهریور 1404',
    featuredImage: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1000&auto=format&fit=crop',
    content: `<p>قرارگیری طولانی در معرض نور آبی می‌تواند ریتم خواب را بر هم بزند...</p>`,
    comments: [], rating: 4.0, voteCount: 45
  }
];

// In-memory posts store. Replaceable with real network requests later.
const posts = Object.fromEntries([
  [initialPost.id, JSON.parse(JSON.stringify(initialPost))],
  ...extraPosts.map(p => [p.id, JSON.parse(JSON.stringify(p))])
]);

function ensureReplies(items = []) {
  return items.map(it => ({ ...it, replies: ensureReplies(it.replies || []) }));
}

export async function fetchPost(postId = 'post-1') {
  if (!USE_MOCK) {
    const response = await http.get(`/v1/blog-posts/${postId}`, { _public: true });
    // Backend returns { code, message, data: {...} }
    return response.data.data || response.data;
  }
  await delay(150);
  const p = posts[postId];
  if (!p) throw new Error('Post not found');
  const copy = JSON.parse(JSON.stringify({ ...p, comments: ensureReplies(p.comments) }));
  return copy;
}

// List posts (with simple pagination and optional tag/category in future)
export async function fetchPosts({ page = 1, pageSize = 10, tag = '' } = {}) {
  if (!USE_MOCK) {
    const query = new URLSearchParams({ page, per_page: pageSize, q: tag }).toString();
    const { data } = await http.get(`/v1/blog-posts?${query}`, { _public: true });
    // Backend returns { data: [...], meta: {...} }, map to expected format
    const items = (data.data || data).map(p => ({
      id: p.id,
      title: p.title,
      date: p.date,
      featuredImage: p.cover_image_url || null,
      slug: p.slug,
      url: p.url,
    }));
    return { items, total: data.meta?.total || items.length, page, pageSize };
  }
  await delay(150);
  const all = Object.values(posts);
  const start = (page - 1) * pageSize;
  const items = all.slice(start, start + pageSize).map(p => ({ id: p.id, title: p.title, date: p.date, featuredImage: p.featuredImage, author: p.author, authorAvatar: p.authorAvatar, rating: p.rating, voteCount: p.voteCount }));
  return { items, total: all.length, page, pageSize };
}

// Admin: fetch posts for admin listing (paginated)
export async function fetchAdminPosts({ page = 1, per_page = 50, q = '' } = {}) {
  if (!USE_MOCK) {
    const params = new URLSearchParams({ page, per_page, q }).toString();
    const { data } = await http.get(`/v1/admin/blog-posts?${params}`);
    // Backend returns { code, message, data, meta } where data is a collection/resource array
    // Normalize to { items, meta }
    const raw = Array.isArray(data?.data) ? data.data : (data?.data?.data ?? []);
    const items = (raw || []).map(normalizeAdminPost);
    return { items, meta: data?.meta ?? {} };
  }
  await delay(150);
  const all = Object.values(posts);
  const start = (page - 1) * per_page;
  const items = all.slice(start, start + per_page).map(p => ({ id: p.id, title: p.title, date: p.date, featuredImage: p.featuredImage, author: p.author, authorAvatar: p.authorAvatar }));
  return { items, meta: { total: all.length, page, per_page } };
}

// Admin: fetch a single post detail
export async function fetchAdminPost(id) {
  if (!USE_MOCK) {
    const { data } = await http.get(`/v1/admin/blog-posts/${id}`);
    const raw = data?.data ?? data;
    return normalizeAdminPost(raw);
  }
  await delay(120);
  const p = posts[id];
  if (!p) throw new Error('Post not found');
  // mock normalize; assume p.content is HTML in mock; map to markdown-ish placeholder
  return normalizeAdminPost({
    id: p.id,
    title: p.title,
    slug: (p.title || '').toLowerCase().replace(/\s+/g,'-'),
    excerpt: '',
    cover_image_url: p.featuredImage,
    content: p.content || '',
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
}

// Helper: normalize admin post resource to UI shape expected by AdminBlogs
export function normalizeAdminPost(item = {}) {
  return {
    id: item.id,
    title: item.title ?? '',
    slug: item.slug ?? '',
    excerpt: item.excerpt ?? '',
    coverImage: item.cover_image_url ?? '',
    status: item.status ?? 'draft',
    createdAt: item.created_at ?? item.createdAt ?? null,
    updatedAt: item.updated_at ?? item.updatedAt ?? null,
    content: item.content ?? '',
  };
}

// createComment will either create a top-level comment or a reply when parentId is provided.
export async function createComment(postId = 'post-1', { text, author = 'کاربر مهمان', avatar = 'https://i.pravatar.cc/150?u=guest', parentId = null }) {
  if (!USE_MOCK) {
    const payload = { text, parentId };
    const response = await http.post(`/v1/blog-posts/${postId}/comments`, payload);
    // Backend returns { code, message, data: {...} }
    return response.data.data || response.data;
  }
  await delay(120);
  return { id: `c-${Date.now()}`, text, author, avatar, parentId, createdAt: new Date().toISOString(), replies: [] };
}

function appendReplyRecursive(items, parentId, reply) {
  for (let i = 0; i < items.length; i++) {
    if (String(items[i].id) === String(parentId)) {
      if (!items[i].replies) items[i].replies = [];
      items[i].replies.push(reply);
      return true;
    }
    if (items[i].replies && items[i].replies.length) {
      const ok = appendReplyRecursive(items[i].replies, parentId, reply);
      if (ok) return true;
    }
  }
  return false;
}

// Count total top-level comments and total including replies
function countTopLevel(comments = []) { return comments.length; }
function countAll(comments = []) {
  let total = 0;
  const walk = (arr) => { (arr||[]).forEach(c => { total += 1; if (c.replies && c.replies.length) walk(c.replies); }); };
  walk(comments);
  return total;
}

// Fetch paginated top-level comments; replies are included with each item
export async function fetchComments(postId = 'post-1', { page = 1, pageSize = 5 } = {}) {
  if (!USE_MOCK) {
    const response = await http.get(`/v1/blog-posts/${postId}/comments`, { _public: true });
    // Backend returns { code, message, data: { items, totalTopLevel, totalAll, ... } }
    const result = response.data.data || response.data;
    return {
      items: result.items || [],
      totalTopLevel: result.totalTopLevel || 0,
      totalAll: result.totalAll || 0,
      page: result.page || page,
      pageSize: result.pageSize || pageSize,
      hasMore: result.hasMore || false
    };
  }
  await delay(120);
  // Return empty comments for now since posts come from real DB
  return { items: [], totalTopLevel: 0, totalAll: 0, page, pageSize, hasMore: false };
}

function updateCommentRecursive(items, id, updater) {
  for (let i = 0; i < items.length; i++) {
    if (String(items[i].id) === String(id)) {
      items[i] = updater(items[i]);
      return true;
    }
    if (items[i].replies && items[i].replies.length) {
      const ok = updateCommentRecursive(items[i].replies, id, updater);
      if (ok) return true;
    }
  }
  return false;
}

export async function updateComment(postId = 'post-1', commentId, { text }) {
  if (!USE_MOCK) {
    const payload = { text };
    const response = await http.put(`/v1/blog-posts/${postId}/comments/${commentId}`, payload);
    // Backend returns { code, message, data: {...} }
    return response.data.data || response.data;
  }
  await delay(100);
  return { id: commentId, text };
}

function deleteCommentRecursive(items, id) {
  for (let i = 0; i < items.length; i++) {
    if (String(items[i].id) === String(id)) {
      items.splice(i, 1);
      return true;
    }
    if (items[i].replies && items[i].replies.length) {
      const ok = deleteCommentRecursive(items[i].replies, id);
      if (ok) return true;
    }
  }
  return false;
}

export async function deleteComment(postId = 'post-1', commentId) {
  if (!USE_MOCK) {
    const response = await http.delete(`/v1/blog-posts/${postId}/comments/${commentId}`);
    // Backend returns { code, message, data: { id } }
    return response.data.data || response.data;
  }
  await delay(100);
  return { id: commentId };
}

export async function createReport(commentId, { reason, details }) {
  if (!USE_MOCK) {
    const payload = { reason, details };
    const response = await http.post(`/v1/blog-comments/${commentId}/report`, payload);
    // Backend returns { code, message, data: { ticket_code, ticket_id } }
    return response.data.data || response.data;
  }
  await delay(100);
  // Mock: just return success
  return { success: true, ticket_code: 'T-MOCK123' };
}

// Exporting API surface. Replace with fetch()/axios later.
export default {
  fetchPost,
  fetchPosts,
  fetchComments,
  createComment,
  updateComment,
  deleteComment,
  createReport
};

