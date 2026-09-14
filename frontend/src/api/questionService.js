// questionService.js - abstraction layer for fetching questions (mock-first)
// Later replace internals with real API calls; keep exported function signatures stable.

import { http, USE_MOCK } from './httpClient';
import { debug } from './logger';

debug('[api] loaded', 'questionService');
let STATIC_QUESTIONS = null; // cache for mock mode only

function delay(ms) { return new Promise(res => setTimeout(res, ms)); }

function mapDifficulty(d) {
  const map = {
    easy: 'ساده', medium: 'متوسط', hard: 'سخت',
    'ساده': 'ساده', 'متوسط': 'متوسط', 'سخت': 'سخت'
  };
  return map[d] || 'متوسط';
}

const difficultyMap = {
  easy: 'ساده', medium: 'متوسط', hard: 'سخت',
  'ساده': 'ساده', 'متوسط': 'متوسط', 'سخت': 'سخت'
};

function adaptMock(q) {
  const rawDiff = q.difficultyFa || q.difficulty;
  const difficultyFa = difficultyMap[rawDiff] || 'متوسط';
  return {
    id: q.id,
    type: q.type || '—',
    difficulty: difficultyFa, // component uses .difficulty directly
    difficultyFa, // explicit for clarity / future filtering
    source: q.source || '',
    text: q.text || q.title || '',
    answer: q.answer || q.modelAnswer || '',
    answerImages: q.answerImages || [],
    reference: q.reference || (q.answerRefChapter ? `${q.answerRefChapter} - ${q.answerRefPage || ''}` : ''),
    chapter: q.chapter,
    pageRaw: q.answerRefPage || q.pageNumber || '',
    grade: q.grade,
    // Matching-specific fields (optional)
    matchingLeft: Array.isArray(q.matchingLeft) ? q.matchingLeft : [],
    matchingRight: Array.isArray(q.matchingRight) ? q.matchingRight : [],
    correctPairs: Array.isArray(q.correctPairs) ? q.correctPairs : [],
    // Multiple-choice specific fields (ensure always defined for uniform rendering)
    options: Array.isArray(q.options) ? q.options : [],
    correctIndex: (typeof q.correctIndex === 'number') ? q.correctIndex : null,
    meta: {
      grade: q.grade,
      chapter: q.chapter,
      addedAt: q.addedDateTs || Date.now(),
      views: q.views,
      setsCount: q.setsCount
    }
  };
}

export async function fetchQuestions(params = {}) {
  if (!STATIC_QUESTIONS) {
    const mod = await import('../data/mockQuestions');
    STATIC_QUESTIONS = mod.mockQuestions || mod.default || [];
  }
  const { page = 1, pageSize = 20 } = params;
  if (!USE_MOCK) {
    // Call backend GET /v1/questions with query params and normalize common paginator shapes
    const resp = await http.get('/v1/questions', { params });
    const data = resp?.data || {};
    // Normalize response: support Laravel paginator (data, current_page, per_page, total, last_page)
    // or custom { items, page, pageSize, total, totalPages }
    let items = [];
    if (Array.isArray(data.data)) items = data.data;
    else if (Array.isArray(data.items)) items = data.items;
    else if (Array.isArray(data)) items = data;

    const pageResp = data.current_page ?? data.page ?? params.page ?? page;
    const pageSizeResp = data.per_page ?? data.pageSize ?? data.page_size ?? params.pageSize ?? pageSize;
    const total = data.total ?? (Array.isArray(items) ? items.length : 0) ?? 0;
    const totalPages = data.last_page ?? data.totalPages ?? Math.max(1, Math.ceil(total / pageSizeResp));
    return { items, page: Number(pageResp), pageSize: Number(pageSizeResp), total: Number(total), totalPages: Number(totalPages) };
  }
  await delay(120); // simulate latency in mock mode
  const adapted = (STATIC_QUESTIONS || []).map(adaptMock);
  const total = adapted.length;
  const items = adapted.slice((page - 1) * pageSize, page * pageSize);
  return { items, page, total, totalPages: Math.ceil(total / pageSize) };
}

export async function fetchQuestion(id) {
  if (!STATIC_QUESTIONS) {
    const mod = await import('../data/mockQuestions');
    STATIC_QUESTIONS = mod.mockQuestions || mod.default || [];
  }
  if (!USE_MOCK) {
    const resp = await http.get(`/v1/questions/${id}`);
    const data = resp?.data;
    // Laravel resources often wrap payload in data
    return data?.data ?? data;
  }
  await delay(80);
  const found = (STATIC_QUESTIONS || []).find(q => q.id === id);
  if (!found) throw new Error('NOT_FOUND');
  return adaptMock(found);
}

// Simple in-memory cache helpers (optional future use)
const _cache = new Map();
export function primeQuestionsCache(list) { list.forEach(q => _cache.set(q.id, q)); }
export function getCachedQuestion(id) { return _cache.get(id); }

// Advanced server-like filtering + pagination over mock data
function toLatinDigits(str = '') { return String(str).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)); }
function stripHtml(s = '') { return String(s).replace(/<[^>]*>/g, ' ').replace(/\s+/g,' ').trim(); }

export async function fetchQuestionsAdvanced(params = {}) {
  if (!STATIC_QUESTIONS) {
    const mod = await import('../data/mockQuestions');
    STATIC_QUESTIONS = mod.mockQuestions || mod.default || [];
  }
  const {
    page = 1,
    pageSize = 20,
    grades = [], // ['7','8','9']
    difficulties = [], // ['ساده','متوسط','سخت']
    types = [], // ['test','truefalse','fillblank','short','long']
    chapters = [], // [{ gradeKey:'7', chapter:'فصل ۱', range:[min,max] }]
    q = '',
    sort = 'newest', // newest | oldest | popular | easy-first | hard-first
  } = params;

  if (!USE_MOCK) {
    // Transform frontend filters to backend API format
    const apiParams = {
      q: q || undefined,
      per_page: pageSize,
      page: page,
    };

    // Map sort options from frontend to backend
    const sortMap = {
      'newest': 'newest',
      'oldest': 'oldest',
      'popular': 'newest', // fallback, backend doesn't have 'popular'
      'easy-first': 'difficulty_asc',
      'hard-first': 'difficulty_desc',
    };
    if (sort && sortMap[sort]) {
      apiParams.sort = sortMap[sort];
    }

    // Map Persian difficulties to English and send as array
    const diffMap = {
      'ساده': 'easy',
      'متوسط': 'medium',
      'سخت': 'hard',
    };
    if (difficulties && difficulties.length > 0) {
      apiParams.difficulties = difficulties.map(d => diffMap[d] || d).filter(Boolean);
    }

    // Map types - send as array
    if (types && types.length > 0) {
      apiParams.types = types;
    }

    // Map chapters - extract page range if available
    if (chapters && chapters.length > 0) {
      const firstChapter = chapters[0];
      if (firstChapter.range && firstChapter.range.length === 2) {
        apiParams.page_from = firstChapter.range[0];
        apiParams.page_to = firstChapter.range[1];
      }
    }

    // Map grade numbers to grade IDs
    // Assuming grades 7, 8, 9 have IDs 1, 2, 3 respectively
    // TODO: Fetch this mapping from backend or make it configurable
    if (grades && grades.length > 0) {
      const gradeIdMap = {
        '7': 1,
        '8': 2,
        '9': 3,
      };
      apiParams.grade_ids = grades.map(g => gradeIdMap[g]).filter(Boolean);
    }

    const resp = await http.get('/v1/questions', { params: apiParams });
    const data = resp?.data || {};
    
    let items = [];
    if (Array.isArray(data.data)) items = data.data;
    else if (Array.isArray(data.items)) items = data.items;
    else if (Array.isArray(data)) items = data;

    const pageResp = data.meta?.current_page ?? data.current_page ?? data.page ?? page;
    const pageSizeResp = data.meta?.per_page ?? data.per_page ?? data.pageSize ?? data.page_size ?? pageSize;
    const total = data.meta?.total ?? data.total ?? (Array.isArray(items) ? items.length : 0) ?? 0;
    const totalPages = data.last_page ?? data.totalPages ?? Math.max(1, Math.ceil(total / pageSizeResp));
    
    return { 
      items, 
      page: Number(pageResp), 
      pageSize: Number(pageSizeResp), 
      total: Number(total), 
      totalPages: Number(totalPages) 
    };
  }
  
  // Mock mode - existing logic
  await delay(120);
  const adapted = STATIC_QUESTIONS.map(adaptMock);
  const gradeAsciiList = grades.map(g => toLatinDigits(g));
  const hasGrade = gradeAsciiList.length > 0;
  const hasDiff = (difficulties || []).length > 0;
  const hasType = (types || []).length > 0;
  const hasChapters = Array.isArray(chapters) && chapters.length > 0;
  const hasQ = !!q;
  const diffOrder = { 'ساده': 0, 'متوسط': 1, 'سخت': 2 };

  const filtered = adapted.filter(qi => {
    const qGradeAscii = toLatinDigits(qi.grade);
    if (hasGrade && !gradeAsciiList.includes(qGradeAscii)) return false;
    if (hasDiff && !difficulties.includes(String(qi.difficulty))) return false;
    if (hasType) {
      const qt = String(qi.type || '').trim();
      if (!types.includes(qt)) return false;
    }
    if (hasChapters) {
      const ok = chapters.some(ch => {
        const chGradeAscii = toLatinDigits(ch.gradeKey);
        if (chGradeAscii !== qGradeAscii) return false;
        const qChapterNorm = toLatinDigits(qi.chapter || qi.meta?.chapter || '');
        const chChapterNorm = toLatinDigits(ch.chapter || '');
        if (qChapterNorm !== chChapterNorm) return false;
        const pageStr = qi.pageRaw || qi.answerRefPage || qi.pageNumber || '';
        const normalized = toLatinDigits(pageStr);
        const numMatch = normalized.match(/\d+/);
        if (!numMatch) return true;
        const pageNum = parseInt(numMatch[0], 10);
        const [min,max] = Array.isArray(ch.range) ? ch.range : [undefined, undefined];
        if (min == null || max == null) return true;
        return pageNum >= min && pageNum <= max;
      });
      if (!ok) return false;
    }
    if (hasQ) {
      const hay = [qi.text, qi.source, qi.chapter].map(stripHtml).join(' | ');
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a,b) => {
    switch (sort) {
      case 'oldest':
        return (a.meta?.addedAt||0) - (b.meta?.addedAt||0);
      case 'popular':
        return (b.meta?.views||0) - (a.meta?.views||0);
      case 'easy-first':
        return (diffOrder[a.difficulty] ?? 1) - (diffOrder[b.difficulty] ?? 1);
      case 'hard-first':
        return (diffOrder[b.difficulty] ?? 1) - (diffOrder[a.difficulty] ?? 1);
      case 'newest':
      default:
        return (b.meta?.addedAt||0) - (a.meta?.addedAt||0);
    }
  });

  const total = sorted.length;
  const start = (page - 1) * pageSize;
  const end = page * pageSize;
  const items = sorted.slice(start, end);
  return { items, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
