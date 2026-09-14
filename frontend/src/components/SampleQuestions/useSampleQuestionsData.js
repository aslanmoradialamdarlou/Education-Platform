import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { fetchSampleQuestions, downloadSampleQuestion, trackSampleQuestionView } from '../../api/sampleQuestionService';

// Shared hook encapsulating data loading, interactions, and derived lists for Sample Questions
export function useSampleQuestionsData(initialPdfs, page = 1, perPage = 12) {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // { message, code, transient }
  const [attempt, setAttempt] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [subjectFilter, setSubjectFilter] = useState('همه');
  // Multi-grade filtering (array of Persian labels e.g., ['هفتم','هشتم'])
  const [gradesFilter, setGradesFilter] = useState([]);
  // Chapters filter: array of { grade:'7'|'8'|'9', chapter:'فصل ۱' }
  const [chaptersFilter, setChaptersFilter] = useState([]);
  const [accessFilter, setAccessFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortOption, setSortOption] = useState('newest');

  // Favorites
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pdf-favorites')||'[]'); } catch { return []; }
  });
  useEffect(() => { try { localStorage.setItem('pdf-favorites', JSON.stringify(favorites)); } catch(_){} }, [favorites]);
  const toggleFavorite = useCallback(id => {
    setFavorites(list => list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
  }, []);

  // Ratings
  const [ratings, setRatings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pdf-ratings')||'{}'); } catch { return {}; }
  });
  useEffect(() => { try { localStorage.setItem('pdf-ratings', JSON.stringify(ratings)); } catch(_){} }, [ratings]);
  const ratePdf = useCallback((id, val) => {
    setRatings(r => ({ ...r, [id]: val }));
    setPdfs(list => list.map(p => p.id === id ? { ...p, averageRating: val } : p));
  }, []);

  // Study list / custom collection ("لیست مطالعه")
  const [studyList, setStudyList] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pdf-study-list')||'[]'); } catch { return []; }
  });
  useEffect(() => { try { localStorage.setItem('pdf-study-list', JSON.stringify(studyList)); } catch(_){} }, [studyList]);
  const toggleInStudyList = useCallback(id => {
    setStudyList(list => list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
  }, []);

  // Download history
  const [downloadHistory, setDownloadHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pdf-download-history')||'[]'); } catch { return []; }
  });
  useEffect(() => { try { localStorage.setItem('pdf-download-history', JSON.stringify(downloadHistory)); } catch(_){} }, [downloadHistory]);
  const registerDownload = useCallback(async (id, title) => {
    try {
      await downloadSampleQuestion(id, title);
      setDownloadHistory(h => [...h, { id, ts: Date.now() }]);
      setPdfs(list => list.map(p => p.id === id ? { ...p, downloadCount: (p.downloadCount||0)+1 } : p));
    } catch (err) {
      alert(err.message || 'خطا در دانلود فایل');
    }
  }, []);

  // View increment
  const incrementView = useCallback(id => {
    setPdfs(list => list.map(p => p.id === id ? { ...p, viewCount: (p.viewCount||0)+1 } : p));
  }, []);

  // نرمال‌سازی داده‌های دریافتی از سرور به فرمت مورد انتظار کامپوننت
  const normalizePdf = useCallback((item) => {
    const toFa = { '7': 'هفتم', '8': 'هشتم', '9': 'نهم' };
    
    return {
      id: item.id,
      title: item.title || 'بدون عنوان',
      subject: item.subject_name || item.book?.title || 'عمومی',
      grade: toFa[String(item.grade_id)] || item.grade_name || 'نامشخص',
      pages: item.pages || 0,
      isFree: item.is_free === true || item.is_free === 1,
      tokenCost: item.token_price || null,
      description: item.description || '',
      samplePages: [],
      tags: item.tags || [],
      updatedAt: new Date(item.updated_at || Date.now()).getTime(),
      viewCount: item.view_count || 0,
      downloadCount: item.download_count || 0,
      averageRating: item.average_rating || 0,
    };
  }, []);

  // Fetch data from API
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Map Persian grades to numeric values
        const gradeKeyMap = { 'هفتم':'7','هشتم':'8','نهم':'9' };
        const gradeValues = gradesFilter.map(g => gradeKeyMap[g] || g).filter(Boolean);
        
        // Prepare API params
        const params = {
          page,
          per_page: perPage,
          q: searchTerm.trim(),
          grade: gradeValues.join(','),
          subject: subjectFilter !== 'همه' ? subjectFilter : '',
        };

        // Add access filter
        if (accessFilter === 'free') params.is_free = true;
        if (accessFilter === 'paid') params.is_free = false;

        const response = await fetchSampleQuestions(params);
        
        if (!active) return;

        const items = response.data?.items || [];
        const normalized = items.map(normalizePdf);
        
        setPdfs(normalized);
        setTotalItems(response.data?.pagination?.total || 0);
        setLoading(false);
        setAttempt(0);
        
      } catch (err) {
        if (!active) return;
        console.error('Error fetching sample questions:', err);
        setError({ 
          message: 'خطا در بارگذاری نمونه سوالات', 
          code: 'FETCH_ERROR', 
          transient: true 
        });
        setLoading(false);
      }
    };

    loadData();

    return () => {
      active = false;
      controller.abort();
    };
  }, [page, perPage, searchTerm, gradesFilter, subjectFilter, accessFilter, attempt, normalizePdf]);

  const retryLoad = useCallback(() => {
    setAttempt(a => a + 1);
  }, []);

  // Derived lists
  const subjects = useMemo(() => ['همه', ...Array.from(new Set(pdfs.map(p => p.subject)))], [pdfs]);
  const grades = useMemo(() => Array.from(new Set(pdfs.map(p => p.grade))), [pdfs]);
  // Available chapters by grade (scan tags or title for "فصل N")
  const availableChapters = useMemo(() => {
    const map = { 'هفتم': new Set(), 'هشتم': new Set(), 'نهم': new Set() };
    const chapterRegex = /(فصل\s+\d+)/g;
    pdfs.forEach(p => {
      const grade = p.grade;
      if (!map[grade]) return;
      const sources = [p.title, ...(p.tags||[])].join(' ');
      let m; while ((m = chapterRegex.exec(sources)) !== null) { map[grade].add(m[1]); }
    });
    return Object.fromEntries(Object.entries(map).map(([g,set]) => [g, Array.from(set).sort()]));
  }, [pdfs]);

  // Client-side filtering for chapters and favorites (server doesn't support these yet)
  const filtered = useMemo(() => {
    return pdfs.filter(pdf => {
      // Chapters filter (client-side)
      if (chaptersFilter.length > 0) {
        const gradeKeyMap = { 'هفتم':'7','هشتم':'8','نهم':'9' };
        const pdfGradeKey = gradeKeyMap[pdf.grade];
        const tags = new Set([...(pdf.tags||[])]);
        const title = pdf.title || '';
        const ok = chaptersFilter.some(cf => {
          if (cf.grade !== pdfGradeKey) return false;
          return tags.has(cf.chapter) || title.includes(cf.chapter);
        });
        if (!ok) return false;
      }
      
      // Favorites filter (client-side)
      if (favoritesOnly && !favorites.includes(pdf.id)) return false;
      
      return true;
    });
  }, [pdfs, chaptersFilter, favoritesOnly, favorites]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sortOption) {
      case 'mostViewed': list.sort((a,b) => b.viewCount - a.viewCount); break;
      case 'pagesAsc': list.sort((a,b) => a.pages - b.pages); break;
      case 'pagesDesc': list.sort((a,b) => b.pages - a.pages); break;
      case 'titleAz': list.sort((a,b) => a.title.localeCompare(b.title, 'fa')); break;
      case 'newest':
      default: list.sort((a,b) => b.updatedAt - a.updatedAt); break;
    }
    return list;
  }, [filtered, sortOption]);

  // Preview modal state
  const [previewPdf, setPreviewPdf] = useState(null);
  const previewModalRef = useRef(null);
  const previouslyFocusedElRef = useRef(null);
  const openPreview = useCallback(pdf => {
    previouslyFocusedElRef.current = document.activeElement;
    
    // Track view on server
    trackSampleQuestionView(pdf.id);
    
    // Update local state
    incrementView(pdf.id);
    setPreviewPdf({ ...pdf, viewCount: (pdf.viewCount||0)+1 });
  }, [incrementView]);
  const closePreview = useCallback(() => {
    setPreviewPdf(null);
    setTimeout(() => {
      if (previouslyFocusedElRef.current && previouslyFocusedElRef.current.focus) {
        try { previouslyFocusedElRef.current.focus(); } catch(_){}
      }
    }, 0);
  }, []);

  return {
    // data
    pdfs, loading, error, retryLoad,
    // filters
    subjectFilter, setSubjectFilter,
    gradesFilter, setGradesFilter,
    chaptersFilter, setChaptersFilter,
    accessFilter, setAccessFilter,
    searchTerm, setSearchTerm,
    favoritesOnly, setFavoritesOnly,
    sortOption, setSortOption,
    subjects, grades, availableChapters,
    // interactions
    favorites, toggleFavorite,
    ratings, ratePdf,
    studyList, toggleInStudyList,
    registerDownload,
    // pagination - return sorted for rendering (page-based pagination handled by parent)
    visible: sorted,
    canLoadMore: false,
    loadMore: () => {},
    // preview
    previewPdf, openPreview, closePreview, previewModalRef,
    // meta for list length
    total: totalItems
  };
}
