import { debug } from './logger';

debug('[api] loaded', 'blogStore');

// LocalStorage-backed blog store for markdown posts
const STORAGE_KEY = 'elmino_blog_posts_v1';
const CATS_KEY = 'elmino_blog_categories_v1';
const BLOG_SETTINGS_KEY = 'elmino_blog_settings_v1';

function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAll(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function genId() {
  return 'post_' + Math.random().toString(36).slice(2, 10);
}

export function listPosts() {
  return loadAll();
}

export function getPost(id) {
  return loadAll().find(p => p.id === id) || null;
}

function toSlug(s) {
  return (s || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9\-\u0600-\u06FF]+/gi, '')
    .replace(/\-+/g, '-');
}

export function upsertPost(partial) {
  const now = new Date().toISOString();
  const posts = loadAll();
  if (!partial.id) {
    const post = {
      id: genId(),
      title: partial.title || 'بدون عنوان',
      slug: partial.slug || toSlug(partial.title || ''),
      markdown: partial.markdown || '',
      excerpt: partial.excerpt || '',
      coverImage: partial.coverImage || '',
      status: partial.status || 'draft',
      createdAt: now,
      updatedAt: now,
      author: partial.author || 'admin',
      category: partial.category || '',
      tags: partial.tags || []
    };
    posts.unshift(post);
    saveAll(posts);
    return post;
  }
  const idx = posts.findIndex(p => p.id === partial.id);
  if (idx === -1) {
    const post = { ...partial, id: partial.id || genId(), createdAt: now, updatedAt: now };
    posts.unshift(post);
    saveAll(posts);
    return post;
  }
  const merged = { ...posts[idx], ...partial, updatedAt: now };
  posts[idx] = merged;
  saveAll(posts);
  return merged;
}

export function deletePost(id) {
  const posts = loadAll().filter(p => p.id !== id);
  saveAll(posts);
}

// Categories
function loadCats() {
  try { return JSON.parse(localStorage.getItem(CATS_KEY) || '[]'); } catch { return []; }
}
function saveCats(cats) { localStorage.setItem(CATS_KEY, JSON.stringify(cats)); }
function genCatId() { return 'cat_' + Math.random().toString(36).slice(2, 10); }

export function listCategories() { return loadCats(); }
export function upsertCategory(partial) {
  const cats = loadCats();
  if (!partial.id) {
    const c = { id: genCatId(), name: partial.name || '', slug: partial.slug || toSlug(partial.name || '') };
    cats.push(c); saveCats(cats); return c;
  }
  const idx = cats.findIndex(c => c.id === partial.id);
  if (idx === -1) { const c = { id: partial.id, name: partial.name || '', slug: partial.slug || toSlug(partial.name || '') }; cats.push(c); saveCats(cats); return c; }
  cats[idx] = { ...cats[idx], ...partial };
  saveCats(cats); return cats[idx];
}
export function deleteCategory(id) { saveCats(loadCats().filter(c => c.id !== id)); }

// Blog Settings
const DEFAULT_BLOG_SETTINGS = {
  postsPerPage: 10,
  enableRSS: true,
  defaultSeoTitle: '',
  defaultSeoDescription: '',
  defaultOgImage: ''
};

export function getBlogSettings() {
  try { return { ...DEFAULT_BLOG_SETTINGS, ...(JSON.parse(localStorage.getItem(BLOG_SETTINGS_KEY) || '{}')) }; } catch { return { ...DEFAULT_BLOG_SETTINGS }; }
}
export function saveBlogSettings(patch) {
  const merged = { ...getBlogSettings(), ...(patch || {}) };
  localStorage.setItem(BLOG_SETTINGS_KEY, JSON.stringify(merged));
  return merged;
}
