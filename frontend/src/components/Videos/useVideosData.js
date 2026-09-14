// Hook: useVideosData
// Mirrors patterns from useSampleQuestionsData for parity, simplified for videos.
// Provides: loading, error, retryLoad, visible list, filters (grade, chapter, access, search, favoritesOnly, sortOption),
// favorites (by id), watchlist, toggleFavorite, toggleWatchlist, offline detection, simulated async fetch & retry.

import { useState, useEffect, useCallback, useRef } from 'react';
import { USE_MOCK, http } from '../../api/httpClient';

const LOCAL_FAV_KEY = 'videos_favorites';
const LOCAL_WATCH_KEY = 'videos_watchlist';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

export function useVideosData(allVideos) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videos, setVideos] = useState([]);
  const [gradesFilter, setGradesFilter] = useState([]); // array of labels e.g., ['هفتم','هشتم']
  // Chapters filter: array of { grade:'7'|'8'|'9', chapter:'فصل ۱' }
  const [chaptersFilter, setChaptersFilter] = useState([]);
  const [accessFilter, setAccessFilter] = useState('all'); // 'all' | 'free' | 'premium'
  const [searchTerm, setSearchTerm] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortOption, setSortOption] = useState('newest'); // 'newest' | 'popular' | 'duration' | 'longest'
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LOCAL_FAV_KEY) || '[]'); } catch { return []; }
  });
  const [watchlist, setWatchlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LOCAL_WATCH_KEY) || '[]'); } catch { return []; }
  });
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const abortRef = useRef(false);

  // Offline listeners
  useEffect(() => {
    const onOff = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', onOff);
    window.addEventListener('offline', onOff);
    return () => { window.removeEventListener('online', onOff); window.removeEventListener('offline', onOff); };
  }, []);

  // Simulated fetch with random transient failure chance
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    abortRef.current = false;
    let attempt = 0;
    while (attempt < 3) {
      try {
        if (USE_MOCK) {
          await delay(300 + attempt * 150);
          if (Math.random() < 0.1 && attempt < 2) throw Object.assign(new Error('transient'), { transient: true });
          if (abortRef.current) return;
          const enriched = allVideos.map(v => ({
            ...v,
            viewCount: v.viewCount ?? Math.floor(200 + Math.random()*2000),
            addedAt: v.addedAt ?? (Date.now() - Math.floor(Math.random()*7)*86400000),
            durationSec: v.durationSec ?? parseDurationToSec(v.duration),
            grade: v.grade ?? mockInferGrade(v.chapter),
          }));
          setVideos(enriched);
        } else {
          // Real API mode: fetch list from /api/v1/contents with type=video filter
          const params = {
            type: 'video',
            per_page: 50,
          };
          
          // Add grade filter if selected
          const gradeKeyMap = { 'هفتم': '7', 'هشتم': '8', 'نهم': '9' };
          if (gradesFilter.length > 0) {
            const gradeIds = gradesFilter.map(g => gradeKeyMap[g]).filter(Boolean);
            if (gradeIds.length === 1) {
              params.grade_id = gradeIds[0];
            }
          }
          
          // Add search term
          if (searchTerm.trim()) {
            params.q = searchTerm.trim();
          }
          
          // Add access filter (send as 1/0 instead of true/false for better URL compatibility)
          if (accessFilter === 'free') params.is_free = 1;
          if (accessFilter === 'premium') params.is_free = 0;
          
          const { data } = await http.get('/v1/contents', { params });
          if (abortRef.current) return;
          
          // Normalize the response
          const items = data.data?.items || data.items || [];
          const enriched = items.map(v => {
            const toFa = { '7': 'هفتم', '8': 'هشتم', '9': 'نهم' };
            return {
              id: v.id,
              title: v.title || 'بدون عنوان',
              chapter: v.subchapter?.chapter?.title || v.chapter || 'فصل نامشخص',
              chapterId: v.subchapter?.chapter?.id || null,
              bookTitle: v.subchapter?.chapter?.book?.title || v.book_title || null,
              bookId: v.subchapter?.chapter?.book?.id || v.book_id || null,
              gradeId: v.subchapter?.chapter?.book?.grade_id || v.grade_id || null,
              teacher: v.teacher || v.author || 'استاد',
              duration: v.duration || '00:00',
              thumbnail: v.thumbnail || v.cover_image_url || 'https://placehold.co/600x400/8A2BE2/fefefe?text=Video',
              isFree: v.is_free === true || v.is_free === 1,
              subscriptionId: v.subscription_id || v.id,
              grade: toFa[String(v.subchapter?.chapter?.book?.grade_id)] || v.grade || 'نامشخص',
              viewCount: v.view_count || 0,
              addedAt: new Date(v.created_at || Date.now()).getTime(),
              durationSec: v.duration_sec || parseDurationToSec(v.duration || '00:00'),
            };
          });
          // Deduplicate by id (in case backend returns duplicates)
          const seen = new Set();
          const unique = enriched.filter(v => {
            if (seen.has(v.id)) return false;
            seen.add(v.id);
            return true;
          });
          setVideos(unique);
        }
        setLoading(false);
        return;
      } catch (e) {
        if (!e.transient) {
          setError(e.message || 'خطا در بارگذاری ویدیوها');
          setLoading(false);
          return;
        }
        attempt += 1;
      }
    }
    if (!abortRef.current) {
      setError('عدم موفقیت پس از چند تلاش، بعدا دوباره امتحان کنید.');
      setLoading(false);
    }
  }, [allVideos, gradesFilter, searchTerm, accessFilter]);

  useEffect(() => { load(); return () => { abortRef.current = true; }; }, [load]);

  const retryLoad = useCallback(() => { load(); }, [load]);

  // Persist favorites/watchlist
  useEffect(() => { try { localStorage.setItem(LOCAL_FAV_KEY, JSON.stringify(favorites)); } catch {} }, [favorites]);
  useEffect(() => { try { localStorage.setItem(LOCAL_WATCH_KEY, JSON.stringify(watchlist)); } catch {} }, [watchlist]);

  const toggleFavorite = useCallback((id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);
  const toggleWatchlist = useCallback((id) => {
    setWatchlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  // Helper to normalize chapter strings for comparison
  const normalizeChapter = (str) => {
    if (!str) return '';
    return str.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
              .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
              .toLowerCase()
              .trim();
  };

  const filtered = videos.filter(v => {
    if (Array.isArray(gradesFilter) && gradesFilter.length > 0 && !gradesFilter.includes(v.grade)) return false;
    if (chaptersFilter.length > 0) {
      const mapFaToKey = { 'هفتم':'7','هشتم':'8','نهم':'9' };
      const vGradeKey = mapFaToKey[v.grade] || v.grade;
      const vChapterNorm = normalizeChapter(v.chapter);
      const matches = chaptersFilter.some(cf => {
        if (cf.grade !== vGradeKey) return false;
        const cfChapterNorm = normalizeChapter(cf.chapter);
        return vChapterNorm === cfChapterNorm;
      });
      if (!matches) return false;
    }
    if (accessFilter === 'free' && !v.isFree) return false;
    if (accessFilter === 'premium' && v.isFree) return false;
    if (favoritesOnly && !favorites.includes(v.id)) return false;
    if (searchTerm && !v.title.includes(searchTerm)) return false;
    return true;
  });

  // Sorting
  const sorted = [...filtered].sort((a,b) => {
    switch (sortOption) {
      case 'popular':
        return (b.viewCount || 0) - (a.viewCount || 0);
      case 'duration': // shortest first
        return (a.durationSec || 0) - (b.durationSec || 0);
      case 'longest': // longest first
        return (b.durationSec || 0) - (a.durationSec || 0);
      case 'newest':
      default:
        return (b.addedAt || 0) - (a.addedAt || 0);
    }
  });

  return {
    loading, error, retryLoad, isOffline,
  gradesFilter, setGradesFilter,
  chaptersFilter, setChaptersFilter,
    accessFilter, setAccessFilter,
    searchTerm, setSearchTerm,
    favoritesOnly, setFavoritesOnly,
    sortOption, setSortOption,
    favorites, toggleFavorite,
    watchlist, toggleWatchlist,
    visible: sorted, // no pagination first phase
    allVideos: videos, // Return all videos for deriving available chapters
  };
}

function parseDurationToSec(str='') {
  const parts = str.split(':');
  if (parts.length !== 2) return 0;
  const [m,s] = parts.map(n => parseInt(n.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)),10));
  return (m||0)*60 + (s||0);
}
function mockInferGrade(chapter) {
  // Crude inference for demo (could be removed when data real)
  if (/۱|۱\b/.test(chapter)) return 'هفتم';
  if (/۲|۲\b/.test(chapter)) return 'هشتم';
  return 'نهم';
}
