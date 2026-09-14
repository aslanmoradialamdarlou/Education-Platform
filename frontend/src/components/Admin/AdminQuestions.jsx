import React, { useMemo, useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, PlusCircle, Trash2, Edit, Filter, ChevronDown, X } from 'lucide-react';
import styles from './Admin.module.css';
import './adminBase.css';
import { QUESTION_TYPES } from '../../data/questionMeta';
import {
  fetchAdminQuestionTypes,
  createAdminQuestion,
  updateAdminQuestion,
  buildPairsFromMatching,
  fetchGrades,
  fetchBooksByGrade,
  fetchChaptersByBook,
  fetchSubchaptersByChapter,
  fetchAdminQuestions,
  fetchAdminQuestion,
  deleteAdminQuestion,
} from '../../api/adminApi';
import ConfirmationDialog from './ConfirmationDialog';

// Map backend canonical type names to UI values
const mapBackendTypeToUI = (name) => {
  const m = { mcq: 'test', match: 'matching', fill_blank: 'fillblank', short_answer: 'short', descriptive: 'long' };
  return m[name] || name || '';
};
// Map backend difficulty/status to UI Persian labels
const mapBackendDifficultyToUI = (d) => ({ easy: 'ساده', medium: 'متوسط', hard: 'سخت' }[d] || d);
const mapBackendStatusToUI = (s) => ({ published: 'منتشر شده', draft: 'پیش‌نویس', archived: 'آرشیو' }[s] || s);

const normalizeServerQuestion = (sq) => {
  if (!sq || typeof sq !== 'object') return sq;
  // Detect already-ui-shaped
  if (sq.title && typeof sq.type === 'string') return sq;
  // Server shape uses question_text and type: {id,name}
  const typeName = (sq.type && typeof sq.type === 'object') ? sq.type.name : sq.type;
  return {
    id: sq.id,
    title: sq.question_text || sq.title || '',
    type: mapBackendTypeToUI(typeName || ''),
    difficulty: mapBackendDifficultyToUI(sq.difficulty || ''),
    author: sq.source || '',
    status: mapBackendStatusToUI(sq.status || ''),
    imageUrl: (sq.children && Array.isArray(sq.children.assets) && sq.children.assets[0]?.file_url) || sq.imageUrl || '',
    pageNumber: sq.book_page ? String(sq.book_page) : '',
    // Best-effort curriculum labels
    grade: sq.subchapter?.chapter?.book?.grade_id ? String(sq.subchapter.chapter.book.grade_id) : '',
    subject: sq.subchapter?.chapter?.book?.title || sq.subchapter?.chapter?.book?.name || '',
    chapter: sq.subchapter?.chapter?.title || sq.subchapter?.chapter?.name || '',
    // Keep any counters if present
    views: 0,
    setsCount: 0,
    accessRevoked: false,
  };
};

// Convert server detailed question to editor-friendly shape
const mapServerDetailToEditing = (sq) => {
  const base = normalizeServerQuestion(sq) || {};
  const children = sq?.children || {};
  const typeName = (sq?.type && typeof sq.type === 'object') ? sq.type.name : sq?.type;
  const uiType = mapBackendTypeToUI(typeName || '');
  const out = {
    ...base,
    type: uiType,
    // curriculum ids for saving
    grade_id: sq?.subchapter?.chapter?.book?.grade_id ?? sq?.grade_id ?? null,
    book_id: sq?.subchapter?.chapter?.book?.id ?? sq?.subchapter?.chapter?.book_id ?? sq?.book_id ?? null,
    subchapter_id: sq?.subchapter?.id || sq?.subchapter_id || null,
    chapter_id: sq?.subchapter?.chapter?.id || sq?.chapter_id || null,
    subchapter_number: sq?.subchapter?.number ?? null,
    pageNumber: sq?.book_page ? String(sq.book_page) : '',
    imageUrl: (Array.isArray(children.assets) && children.assets[0]?.file_url) || base.imageUrl || '',
    is_free: sq?.is_free ?? true,
    token_price: sq?.token_price ?? 0,
  };
  // Type specific prefill
  if (uiType === 'test' || uiType === 'truefalse') {
    const opts = Array.isArray(children.options) ? children.options : [];
    out.options = opts.map(o => o.text);
    const ci = opts.findIndex(o => o.is_correct);
    out.correctIndex = ci >= 0 ? ci : 0;
    // Heuristic for true/false
    const texts = out.options.map(t => String(t || '').trim());
    if (texts.length === 2 && texts.includes('درست') && texts.includes('نادرست')) {
      out.type = 'truefalse';
      out.answer = opts[0]?.is_correct ? 'درست' : (opts[1]?.is_correct ? 'نادرست' : 'درست');
    }
  } else if (uiType === 'matching') {
    const pairs = Array.isArray(children.pairs) ? children.pairs : [];
    const lefts = [];
    const rights = [];
    const idxOf = (arr, val) => { const i = arr.indexOf(val); return i === -1 ? (arr.push(val), arr.length - 1) : i; };
    const cp = [];
    pairs.forEach(p => {
      const li = idxOf(lefts, p.left_text);
      const ri = idxOf(rights, p.right_text);
      cp.push([li, ri]);
    });
    out.matchingLeft = lefts;
    out.matchingRight = rights;
    out.correctPairs = cp;
  } else if (uiType === 'fillblank') {
    const blanks = Array.isArray(children.blanks) ? children.blanks : [];
    out.answer = blanks[0]?.correct_text || '';
  } else if (uiType === 'short' || uiType === 'long') {
    out.modelAnswer = sq?.answer_text || '';
  }
  return out;
};

const AdminQuestions = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [grade, setGrade] = useState('');
  const [chapter, setChapter] = useState('');
  const [subject, setSubject] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [status, setStatus] = useState('');
  const [confirm, setConfirm] = useState({ open: false, action: null, payload: null });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  // UI state
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Editor drawer (custom)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerOpenVisual, setDrawerOpenVisual] = useState(false);
  const [editing, setEditing] = useState(null);
  // Curriculum selectors (IDs)
  const [grades, setGrades] = useState([]);
  const [books, setBooks] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [subchapters, setSubchapters] = useState([]);

  // Use English digits for grade options
  const uniqueGrades = ['7','8','9'];
  const subjects = useMemo(() => Array.from(new Set(questions.map(q => q.subject).filter(Boolean))), [questions]);
  const chaptersFor = useMemo(() => {
    // simple based on current selection
    return Array.from(new Set(questions
      .filter(q => (!subject || q.subject === subject) && (!grade || q.grade === grade))
      .map(q => q.chapter)
      .filter(Boolean)));
  }, [questions, subject, grade]);

  const filtered = useMemo(() => {
    return questions.filter(q => {
      const t = (q.title || '').toLowerCase();
      if (query && !t.includes(query.toLowerCase())) return false;
      if (type && q.type !== type) return false;
      if (grade && q.grade !== grade) return false;
      if (chapter && q.chapter !== chapter) return false;
      if (subject && q.subject !== subject) return false;
      if (dateFrom) {
        const tsFrom = new Date(dateFrom).getTime();
        if (!isNaN(tsFrom) && q.addedDateTs < tsFrom) return false;
      }
      if (dateTo) {
        const tsTo = new Date(dateTo).getTime();
        if (!isNaN(tsTo) && q.addedDateTs > tsTo) return false;
      }
      if (difficulty && (q.difficulty === undefined || q.difficulty !== difficulty)) return false;
      if (status && (q.status === undefined || q.status !== status)) return false;
      return true;
    });
  }, [questions, query, type, grade, chapter, subject, dateFrom, dateTo, difficulty, status]);

  // Load questions from API on mount
  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        setIsLoading(true);
        const { items } = await fetchAdminQuestions({ per_page: 50 });
        if (!aborted) setQuestions(Array.isArray(items) ? items.map(normalizeServerQuestion) : []);
      } catch (e) {
        // Keep empty list on failure; snackbar will show on demand during save
        if (!aborted) setQuestions([]);
      } finally {
        if (!aborted) setIsLoading(false);
      }
    })();
    return () => { aborted = true; };
  }, []);

  // Load grades on mount for cascading selection
  useEffect(() => {
    let mounted = true;
    fetchGrades().then(gs => { if (mounted) setGrades(Array.isArray(gs) ? gs : []); }).catch(()=>{});
    return () => { mounted = false; };
  }, []);

  // When a grade is picked, load books
  useEffect(() => {
    let mounted = true;
    const gid = editing?.grade_id || editing?.gradeId;
    if (gid) {
      fetchBooksByGrade(gid).then(bs => { if (mounted) setBooks(Array.isArray(bs) ? bs : []); }).catch(()=>{});
    } else {
      setBooks([]);
    }
    // Reset below levels
    setChapters([]); setSubchapters([]);
    return () => { mounted = false; };
  }, [editing?.grade_id, editing?.gradeId]);

  // When a book is picked, load chapters
  useEffect(() => {
    let mounted = true;
    const bid = editing?.book_id || editing?.bookId;
    if (bid) {
      fetchChaptersByBook(bid).then(cs => { if (mounted) setChapters(Array.isArray(cs) ? cs : []); }).catch(()=>{});
    } else {
      setChapters([]);
    }
    setSubchapters([]);
    return () => { mounted = false; };
  }, [editing?.book_id, editing?.bookId]);

  // When a chapter is picked, load subchapters
  useEffect(() => {
    let mounted = true;
    const cid = editing?.chapter_id || editing?.chapterId;
    if (cid) {
      fetchSubchaptersByChapter(cid).then(sc => {
        console.debug('[AdminQuestions] fetched subchapters for chapter', cid, sc);
        const out = Array.isArray(sc) ? sc : (sc ? [sc] : []);
        if (mounted) setSubchapters(out);
      }).catch((e) => { console.warn('[AdminQuestions] failed loading subchapters', cid, e); });
    } else {
      setSubchapters([]);
    }
    return () => { mounted = false; };
  }, [editing?.chapter_id, editing?.chapterId]);

  const doDelete = async (id) => {
    // If id is not a server id (temporary client id), just remove locally
    const isServerId = (typeof id === 'number') || (typeof id === 'string' && /^\d+$/.test(id));
    try {
      if (isServerId) {
        await deleteAdminQuestion(id);
      }
      setQuestions(arr => arr.filter(q => String(q.id) !== String(id)));
      setToast({ open: true, severity: 'success', message: 'سوال حذف شد.' });
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'خطا در حذف سوال';
      setToast({ open: true, severity: 'error', message: msg });
      throw e;
    }
  };
  const handleSave = (updated) => {
    const norm = normalizeServerQuestion(updated);
    setQuestions(arr => {
      const exists = arr.some(q => q.id === norm.id);
      return exists ? arr.map(q => q.id === norm.id ? norm : q) : [norm, ...arr];
    });
  };

  // checked means access is ON
  const toggleRevoke = (id, checked) => {
    const item = questions.find(i => i.id === id);
    if (item && !item.accessRevoked && !checked) {
      setConfirm({ open: true, action: 'revoke', payload: item });
      return;
    }
    setQuestions(arr => arr.map(q => q.id === id ? { ...q, accessRevoked: !checked } : q));
  };

  // Deep-link: auto open add question when ?action=add
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    if (action === 'add' && !drawerOpen) {
      startAdd();
      params.delete('action');
      const base = location.pathname;
      const qs = params.toString();
      navigate(qs ? `${base}?${qs}` : base, { replace: true });
    }
  }, [location.search, drawerOpen, navigate, location.pathname]);

  // Drawer animations and body lock
  useEffect(() => {
    if (drawerOpen) {
      setDrawerVisible(true);
      const raf = requestAnimationFrame(() => setDrawerOpenVisual(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setDrawerOpenVisual(false);
      if (drawerVisible) {
        const t = setTimeout(() => setDrawerVisible(false), 300);
        return () => clearTimeout(t);
      }
    }
  }, [drawerOpen, drawerVisible]);

  useEffect(() => {
    if (!drawerVisible) return;
    const onKey = (e) => { if (e.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [drawerVisible]);

  const STATUS_OPTIONS = [
    { value: 'منتشر شده', label: 'منتشر شده' },
    { value: 'پیش‌نویس', label: 'پیش‌نویس' },
    { value: 'در حال بازبینی', label: 'در حال بازبینی' },
  ];
  const DIFF_OPTIONS = [
    { value: 'ساده', label: 'ساده' },
    { value: 'متوسط', label: 'متوسط' },
    { value: 'سخت', label: 'سخت' },
  ];

  const startAdd = () => {
    // Use first available grade as default if grades are loaded
    const defaultGradeId = grades.length > 0 ? grades[0].id : null;
    setEditing({
      id: 'q-' + Math.random().toString(36).slice(2,8),
      title: '',
      type: 'test',
      grade: '', subject: '', chapter: '', pageNumber: '',
      // IDs for backend - start with first grade to trigger book loading
      grade_id: defaultGradeId,
      book_id: null,
      chapter_id: null,
      subchapter_id: null,
      difficulty: 'متوسط', author: '', status: 'پیش‌نویس',
      options: ['', '', '', ''], correctIndex: 0, answer: '', modelAnswer: '', imageUrl: '',
      addedDateTs: Date.now(), addedDateLabel: '', views: 0, setsCount: 0, accessRevoked: false,
      is_free: true,
      token_price: 0,
    });
    setDrawerOpen(true);
  };

  // load admin question types (type -> id mapping) for API
  const [questionTypesMap, setQuestionTypesMap] = React.useState({});
  useEffect(() => {
    let mounted = true;
    fetchAdminQuestionTypes().then(types => {
      if (!mounted) return;
      const map = {};
      (types || []).forEach(t => { if (t && t.name) map[t.name] = t.id; });
      setQuestionTypesMap(map);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const startEdit = async (q) => {
    try {
      const raw = await fetchAdminQuestion(q.id);
      const ed = mapServerDetailToEditing(raw || q);
      setEditing(ed);
    } catch (_) {
      // fallback to existing list item if detail fetch fails
      setEditing({ ...q });
    }
    setDrawerOpen(true);
  };

  const saveEditing = () => {
    if (!editing) return;
    if (!editing.title) { setToast({ open: true, severity: 'error', message: 'متن سوال الزامی است.' }); return; }
    if (editing.type === 'matching') {
      const left = Array.isArray(editing.matchingLeft) ? editing.matchingLeft : [];
      const right = Array.isArray(editing.matchingRight) ? editing.matchingRight : [];
      const pairs = Array.isArray(editing.correctPairs) ? editing.correctPairs : [];
      const cleanedLeft = left.map(s => (s ?? '').trim());
      const cleanedRight = right.map(s => (s ?? '').trim());
      const validPairs = pairs.filter(p => Array.isArray(p) && p.length === 2 && p[0] >= 0 && p[1] >= 0 && cleanedLeft[p[0]] && cleanedRight[p[1]]);
      if (cleanedLeft.filter(Boolean).length === 0 || cleanedRight.filter(Boolean).length === 0) {
        setToast({ open: true, severity: 'warning', message: 'برای سوال وصل‌کردنی، حداقل یک مورد در هر ستون لازم است.' });
        return;
      }
      if (validPairs.length === 0) {
        setToast({ open: true, severity: 'warning', message: 'برای سوال وصل‌کردنی، حداقل یک جفت صحیح انتخاب کنید.' });
        return;
      }
    }
    // Prepare payload for API
    (async () => {
      try {
        // Map frontend type value to backend type id.
        // Frontend QUESTION_TYPES values are friendly strings (e.g. 'matching'). Backend types use names like 'match'.
        // Try to resolve by mapping known synonyms, otherwise fall back to questionTypesMap by matching substring.
        const frontType = editing.type || '';
        const resolveTypeId = () => {
          // direct mapping for common values
          const mapping = {
            test: 'mcq',
            matching: 'match',
            fillblank: 'fill_blank',
            short: 'short_answer',
            long: 'descriptive',
            truefalse: 'mcq',
          };
          const backendName = mapping[frontType] || frontType;
          // try exact match
          if (questionTypesMap[backendName]) return questionTypesMap[backendName];
          // try contains
          for (const k of Object.keys(questionTypesMap)) {
            if (k.includes(backendName) || backendName.includes(k)) return questionTypesMap[k];
          }
          return null;
        };

        let typeId = resolveTypeId();
        // Try one-time fetch to populate map (non-blocking if fails)
        if (!typeId) {
          try {
            const types = await fetchAdminQuestionTypes();
            const map = {};
            (types || []).forEach(t => { if (t && t.name) map[t.name] = t.id; });
            setQuestionTypesMap(map);
            const mapping = { test: 'mcq', matching: 'match', fillblank: 'fill_blank', short: 'short_answer', long: 'descriptive', truefalse: 'mcq' };
            const backendName = mapping[frontType] || frontType;
            typeId = map[backendName] || null;
          } catch { /* proceed with server-side mapping using payload.type */ }
        }

        // Build base payload
        const gradeId = editing.grade_id || editing.gradeId || null;
        const bookId = editing.book_id || editing.bookId || null;
        const chapterId = editing.chapter_id || editing.chapterId || null;
        const subchapterId = editing.subchapter_id || editing.subchapterId || null;
        const subNum = editing.subchapter_number || editing.subchapterNumber || (Number.isFinite(Number(editing.subchapter_id)) ? null : null);
        if (!subchapterId && !(chapterId && subNum)) {
          setToast({ open: true, severity: 'error', message: 'لطفاً زیرفصل (subchapter) را انتخاب کنید.' });
          return;
        }
        // Map UI status/difficulty (FA) to backend canonical values
        const statusMap = { 'منتشر شده': 'published', 'پیش‌نویس': 'draft', 'در حال بازبینی': 'draft' };
        const statusCanonical = statusMap[editing.status] || (['draft','published','archived'].includes(editing.status) ? editing.status : 'draft');
        const diffMap = { 'ساده': 'easy', 'متوسط': 'medium', 'سخت': 'hard' };
        const difficultyCanonical = diffMap[editing.difficulty] || (['easy','medium','hard'].includes(editing.difficulty) ? editing.difficulty : undefined);
        const payload = {
          ...(typeId ? { type_id: typeId } : {}),
          ...(gradeId ? { grade_id: gradeId } : {}),
          ...(bookId ? { book_id: bookId } : {}),
          ...(chapterId ? { chapter_id: chapterId } : {}),
          ...(subchapterId ? { subchapter_id: subchapterId } : {}),
          ...(chapterId && subNum ? { subchapter_number: subNum } : {}),
          question_text: editing.title,
          status: statusCanonical,
          ...(difficultyCanonical ? { difficulty: difficultyCanonical } : {}),
          ...(editing.author ? { source: editing.author } : {}),
          is_free: !!editing.is_free,
          token_price: editing.token_price || 0,
          book_page: editing.pageNumber ? parseInt(editing.pageNumber, 10) : null,
        };
        // Send a fallback 'type' string too, for backward compatibility and server-side mapping
        const typeNameMap = { test: 'mcq', matching: 'match', fillblank: 'fill_blank', short: 'short_answer', long: 'descriptive', truefalse: 'mcq' };
        payload.type = typeNameMap[frontType] || frontType;

        // Type-specific: matching => pairs
        if (editing.type === 'matching') {
          const pairs = buildPairsFromMatching(editing.matchingLeft, editing.matchingRight, editing.correctPairs);
          payload.pairs = pairs;
        }
        // MCQ (test): build options
        if (editing.type === 'test') {
          const opts = (editing.options || ['', '', '', '']).map((t, i) => ({ label: String.fromCharCode(65 + i), text: t || '', is_correct: editing.correctIndex === i }));
          // Ensure at least one correct remains true
          if (!opts.some(o => o.is_correct)) opts[0].is_correct = true;
          payload.options = opts;
        }
        // True/False as MCQ with two options
        if (editing.type === 'truefalse') {
          const ans = (editing.answer || 'درست').trim();
          payload.options = [
            { label: 'A', text: 'درست', is_correct: ans === 'درست' },
            { label: 'B', text: 'نادرست', is_correct: ans === 'نادرست' },
          ];
        }
        // Fill-in-the-blank: single blank from simple UI
        if (editing.type === 'fillblank') {
          const ans = (editing.answer || '').trim();
          if (ans) payload.blanks = [{ blank_index: 1, correct_text: ans }];
        }
        // Short/Long descriptive answers
        if (editing.type === 'short' || editing.type === 'long') {
          if (editing.modelAnswer && editing.modelAnswer.trim()) {
            payload.answer_text = editing.modelAnswer.trim();
          }
        }

        // Decide create vs update based on server-style id (numeric)
        const isServerId = (typeof editing.id === 'number') || (typeof editing.id === 'string' && /^\d+$/.test(editing.id));
        if (!isServerId) {
          const created = await createAdminQuestion(payload);
          handleSave(created?.data || created || { id: created?.id, title: editing.title });
          setToast({ open: true, severity: 'success', message: 'ذخیره شد.' });
        } else {
          try {
            const updated = await updateAdminQuestion(editing.id, payload);
            handleSave(updated?.data || updated || editing);
            setToast({ open: true, severity: 'success', message: 'ذخیره شد.' });
          } catch (e) {
            // If the server rejects the id (404), fallback to create once
            if (e?.response?.status === 404) {
              const created = await createAdminQuestion(payload);
              handleSave(created?.data || created || { id: created?.id, title: editing.title });
              setToast({ open: true, severity: 'success', message: 'ذخیره شد.' });
            } else {
              throw e;
            }
          }
        }
        setDrawerOpen(false);
      } catch (err) {
        console.error('Failed saving question', err);
        const msg = err?.response?.data?.message || err?.message || 'خطا در ذخیره سوال';
        setToast({ open: true, severity: 'error', message: msg });
      }
    })();
  };

  // Local toast state for snackbar notifications
  const [toast, setToast] = useState({ open: false, severity: 'info', message: '' });

  return (
    <div dir="rtl">
      <div className={styles.panelHeader}>
        <h2 style={{ margin: 0 }}>مدیریت بانک سوالات</h2>
        <button className="btn btn-primary" onClick={() => startAdd()} aria-label="افزودن سوال">
          <PlusCircle size={18} style={{ marginInlineEnd: 6 }} />
          افزودن سوال
        </button>
      </div>

      {/* Filters - collapsible */}
      <div className="adminCard" style={{ marginBottom: '1rem' }}>
        <div className="filterToggleRow">
          <button className="btn btn-outline" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(v => !v)}>
            <Filter size={16} />
            فیلترها
            <ChevronDown size={16} style={{ transition: 'transform .2s ease', transform: filtersOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </button>
        </div>
        <div className={`collapsible ${filtersOpen ? 'open' : ''}`}>
          <div className={`${styles.detailFilterContainer} detailFilterContainer`}>
            <div className="filterGrid filterGrid--2col" style={{ width: '100%' }}>
              <div className="filterGroup filterSearch">
                <label>جستجو در متن سوال</label>
                <div className="inputWrap">
                  <span className="searchIcon"><Search size={16} /></span>
                  <input type="text" placeholder="جستجو بر اساس متن" value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>
              </div>
              <div className="filterGroup">
                <label>نوع سوال</label>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="">همه</option>
                  {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="filterGroup">
                <label>پایه</label>
                <select value={grade} onChange={(e) => setGrade(e.target.value)}>
                  <option value="">همه</option>
                  {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="filterGroup">
                <label>درس</label>
                <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                  <option value="">همه</option>
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="filterGroup">
                <label>فصل</label>
                <select value={chapter} onChange={(e) => setChapter(e.target.value)}>
                  <option value="">همه</option>
                  {chaptersFor.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                </select>
              </div>
              <div className="filterGroup">
                <label>دشواری</label>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  <option value="">همه</option>
                  {DIFF_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div className="filterGroup">
                <label>وضعیت</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">همه</option>
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="filterGroup">
                <label>از تاریخ</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="filterGroup">
                <label>تا تاریخ</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
              <div className="full-span flex items-center gap-sm" style={{ marginTop: '.25rem' }}>
                <span className="resultsBadge">نتایج: {filtered.length.toLocaleString('fa-IR')}</span>
                <button className="clearBtn" onClick={() => { setQuery(''); setType(''); setGrade(''); setSubject(''); setChapter(''); setDifficulty(''); setStatus(''); setDateFrom(''); setDateTo(''); setPage(0); }}>حذف فیلترها</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={`${styles.tableContainer} ${styles.tableFullRight} ${styles.questionsTableContainer}`}>
        <table>
          <thead>
            <tr>
              <th>متن سوال</th>
              <th>پایه/درس/فصل</th>
              <th>نوع</th>
              <th>دشواری</th>
              <th>منبع</th>
              <th>دسترسی</th>
              <th>وضعیت</th>
              <th style={{ textAlign: 'left' }}>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center' }}>در حال بارگذاری...</td>
              </tr>
            )}
            {!isLoading && filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(q => {
              return (
                <tr key={q.id} className={styles.clickableRow}>
                  <td data-label="متن سوال">
                    <div className="cellValue flex items-center gap-sm">
                      {q.imageUrl ? (
                        <img src={q.imageUrl} alt="thumb" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                      ) : (
                        <span className="avatar-sm" aria-hidden>{q.title?.[0] || 'س'}</span>
                      )}
                      <span className="text-sm" title={q.title} style={{ maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.title}</span>
                    </div>
                  </td>
                  <td data-label="پایه/درس/فصل"><div className="cellValue">{`${q.grade || '-'} / ${q.subject || '-'} / ${q.chapter || '-'}`}</div></td>
                  <td data-label="نوع"><div className="cellValue"><span className="badge badge-outline">{
                    (() => {
                      const typeValue = (q && typeof q.type === 'object') ? q.type.name : q.type;
                      return QUESTION_TYPES.find(t => t.value === typeValue)?.label || typeValue || '-';
                    })()
                  }</span></div></td>
                  <td data-label="دشواری"><div className="cellValue"><span className="badge badge-outline">{q.difficulty || '-'}</span></div></td>
                  <td data-label="منبع"><div className="cellValue">{q.author || '—'}</div></td>
                  <td data-label="دسترسی">
                    <div className="cellValue">
                      {(() => { const hasAccess = !q.accessRevoked; return (
                        <label className="switch" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={hasAccess} onChange={(e) => toggleRevoke(q.id, e.target.checked)} />
                          <span className="slider" />
                        </label>
                      ); })()}
                    </div>
                  </td>
                  <td data-label="وضعیت"><div className="cellValue"><span className={`badge ${q.status === 'منتشر شده' ? 'badge-accent' : 'badge-outline'}`}>{q.status || '-'}</span></div></td>
                  <td data-label="عملیات" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'left' }}>
                    <div className={styles.actionBtns}>
                      <button className={`btn btn-icon ${styles.actionEdit}`} title="ویرایش" aria-label="ویرایش" onClick={() => startEdit(q)}><Edit color="#0d6efd" size={18} /></button>
                      <button className={`btn btn-icon ${styles.actionDelete}`} title="حذف" aria-label="حذف" onClick={() => setConfirm({ open: true, action: 'delete', payload: q })}><Trash2 color="#dc3545" size={18} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center' }}>موردی یافت نشد.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Custom Pagination */}
      <div className="drawerSection paginationRow" style={{ marginTop: '.5rem' }}>
        <div className="flex items-center" style={{ justifyContent: 'space-between', gap: '.75rem' }}>
          <div className="flex items-center gap-sm">
            <span className="text-sm" style={{ fontSize: '.65rem' }}>تعداد در صفحه</span>
            <select className="rowsSelect" value={rowsPerPage} onChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}>
              <option value={5}>۵</option>
              <option value={10}>۱۰</option>
              <option value={20}>۲۰</option>
              <option value={50}>۵۰</option>
            </select>
          </div>
          <div className="flex items-center gap-sm">
            <button className="btn btn-outline" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>قبلی</button>
            {(() => { const total = filtered.length; const from = total ? page * rowsPerPage + 1 : 0; const to = Math.min(total, (page + 1) * rowsPerPage); return (
              <span className="text-sm" style={{ fontSize: '.65rem' }}>{`${from.toLocaleString('fa-IR')}–${to.toLocaleString('fa-IR')} از ${total.toLocaleString('fa-IR')}`}</span>
            ); })()}
            <button className="btn btn-outline" onClick={() => setPage(p => Math.min(Math.ceil(filtered.length / rowsPerPage) - 1, p + 1))} disabled={page >= Math.ceil(filtered.length / rowsPerPage) - 1}>بعدی</button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirm.open}
        onClose={() => setConfirm({ open: false, action: null, payload: null })}
        onConfirm={async () => {
          if (!confirm.open) return;
          try {
            if (confirm.action === 'delete' && confirm.payload) await doDelete(confirm.payload.id);
            if (confirm.action === 'revoke' && confirm.payload) setQuestions(arr => arr.map(q => q.id === confirm.payload.id ? { ...q, accessRevoked: true } : q));
          } finally {
            setConfirm({ open: false, action: null, payload: null });
          }
        }}
        title={confirm.action === 'revoke' ? 'لغو دسترسی' : 'حذف سوال'}
        message={confirm.action === 'revoke' ? 'با تایید، دسترسی این سوال برای همه کاربران لغو می‌شود.' : 'آیا از حذف این سوال مطمئن هستید؟ این عملیات قابل بازگشت نیست.'}
        confirmLabel={confirm.action === 'revoke' ? 'تایید' : 'حذف'}
        confirmColor={confirm.action === 'revoke' ? 'error' : 'error'}
      />

      {/* Editor Drawer - Custom */}
      {drawerVisible && (
        <div className={`drawerRoot ${drawerOpenVisual ? 'open' : ''}`} aria-hidden={!drawerOpen}>
          <div className="drawerOverlay" onClick={() => setDrawerOpen(false)} />
          <aside className={`drawerPanel ${drawerOpenVisual ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="افزودن/ویرایش سوال">
            <div className="drawerInner">
              <div className="drawerSection flex items-center justify-between" style={{ paddingBottom: '.75rem' }}>
                <h3 className="title-sm" style={{ margin: 0, fontSize: '.9rem' }}>{questions.some(x => x.id === editing?.id) ? 'ویرایش سوال' : 'افزودن سوال'}</h3>
                {/* <button className="btn btn-icon" onClick={() => setDrawerOpen(false)} aria-label="بستن"><X size={20} /></button> */}
              </div>
              <hr className="divider" />
              {editing && (
                <div className="drawerSection">
                  <div className="filterGrid drawerFilters">
                    <div className="filterGroup full-span">
                      <label>متن سوال</label>
                      <textarea
                        rows={3}
                        value={editing.title || ''}
                        onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                      />
                    </div>
                    <div className="filterGroup">
                      <label>نوع سوال</label>
                      <select
                        value={editing.type}
                        onChange={(e) => setEditing({ ...editing, type: e.target.value })}
                      >
                        {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div className="filterGroup">
                      <label>پایه تحصیلی</label>
                      <select
                        value={editing.grade_id || ''}
                        onChange={(e) => setEditing({ ...editing, grade_id: e.target.value ? parseInt(e.target.value,10) : null, book_id: null, chapter_id: null, subchapter_id: null })}
                      >
                        <option value="">انتخاب کنید</option>
                        {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    </div>
                    <div className="filterGroup">
                      <label>کتاب</label>
                      <select
                        value={editing.book_id || ''}
                        onChange={(e) => setEditing({ ...editing, book_id: e.target.value ? parseInt(e.target.value,10) : null, chapter_id: null, subchapter_id: null })}
                        disabled={!books.length}
                      >
                        <option value="">انتخاب کنید</option>
                        {books.map(b => <option key={b.id} value={b.id}>{b.title || b.name}</option>)}
                      </select>
                    </div>
                    <div className="filterGroup">
                      <label>فصل</label>
                      <select
                        value={editing.chapter_id || ''}
                        onChange={(e) => setEditing({
                          ...editing,
                          chapter_id: e.target.value ? parseInt(e.target.value,10) : null,
                          // reset subchapter selections on chapter change
                          subchapter_id: null,
                          subchapter_number: null,
                        })}
                        disabled={!chapters.length}
                      >
                        <option value="">انتخاب کنید</option>
                        {chapters.map(c => <option key={c.id} value={c.id}>{c.title || c.name}</option>)}
                      </select>
                    </div>
                    {/*
                    <div className="filterGroup">
                      <label>زیرفصل</label>
                      <select
                        value={editing.subchapter_id || ''}
                        onChange={(e) => setEditing({ ...editing, subchapter_id: e.target.value ? parseInt(e.target.value,10) : null })}
                        disabled={!editing?.chapter_id}
                      >
                        <option value="">انتخاب کنید</option>
                        {subchapters.map(sc => (
                          <option key={sc.id} value={sc.id}>{
                            (typeof sc.number !== 'undefined' && sc.number !== null)
                              ? String(sc.number)
                              : (sc.title || sc.name || '')
                          }</option>
                        ))}
                      </select>
                      {editing?.chapter_id && subchapters.length === 0 && (
                        <div className="text-xs text-muted" style={{ marginTop: '.25rem' }}>
                          زیرفصلی برای این فصل یافت نشد.
                        </div>
                      )}
                    </div>
                    */}
                    <div className="filterGroup">
                      <label>زیرفصل (شماره)</label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="مثلاً 1 یا 2"
                        value={editing.subchapter_number || ''}
                        onKeyDown={(e) => { if (['e','E','+','-','.'].includes(e.key)) e.preventDefault(); }}
                        onChange={(e) => {
                          const onlyDigits = (e.target.value || '').replace(/[^0-9]/g, '');
                          setEditing({ ...editing, subchapter_number: onlyDigits ? parseInt(onlyDigits, 10) : null, subchapter_id: null });
                        }}
                      />
                    </div>
                    <div className="filterGroup full-span">
                      <label>تصویر بدنه سوال (لینک اختیاری)</label>
                      <input type="text" value={editing.imageUrl || ''} onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })} />
                    </div>
                    <div className="filterGroup">
                      <label>شماره صفحه</label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={editing.pageNumber || ''}
                        onKeyDown={(e) => { if (['e','E','+','-','.'].includes(e.key)) e.preventDefault(); }}
                        onChange={(e) => {
                          const val = (e.target.value || '').replace(/[^0-9]/g, '');
                          setEditing({ ...editing, pageNumber: val });
                        }}
                      />
                    </div>
                    <div className="filterGroup">
                      <label>دشواری</label>
                      <select value={editing.difficulty} onChange={(e) => setEditing({ ...editing, difficulty: e.target.value })}>
                        {DIFF_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                    </div>
                    <div className="filterGroup">
                      <label>منبع/نویسنده</label>
                      <input type="text" value={editing.author || ''} onChange={(e) => setEditing({ ...editing, author: e.target.value })} />
                    </div>
                    <div className="filterGroup">
                      <label>وضعیت</label>
                      <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                        {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                    <div className="filterGroup">
                      <label>دسترسی</label>
                      <select 
                        value={editing.is_free ? 'free' : 'paid'} 
                        onChange={(e) => setEditing({ ...editing, is_free: e.target.value === 'free' })}
                      >
                        <option value="free">رایگان</option>
                        <option value="paid">پولی</option>
                      </select>
                    </div>
                    <div className="filterGroup">
                      <label>قیمت توکن</label>
                      <input 
                        type="number" 
                        min={0}
                        step={1}
                        inputMode="numeric"
                        value={editing.token_price || 0}
                        onKeyDown={(e) => { if (['e','E','+','-','.'].includes(e.key)) e.preventDefault(); }}
                        onChange={(e) => {
                          const val = (e.target.value || '').replace(/[^0-9]/g, '');
                          setEditing({ ...editing, token_price: val ? parseInt(val, 10) : 0 });
                        }}
                      />
                    </div>

                    {/* Answer configuration */}
                    {editing.type === 'test' && (
                      <div className="full-span">
                        <label className="title-sm" style={{ display:'block', marginBottom: '.35rem' }}>گزینه‌ها</label>
                        {[0,1,2,3].map(i => (
                          <div key={i} className="filterGroup full-span" style={{ marginBottom: '.1rem' }}>
                            <div className="flex items-center gap-sm">
                              <input type="radio" name="correctIndex" checked={editing.correctIndex === i} onChange={() => setEditing({ ...editing, correctIndex: i })} />
                              <input type="text" value={(editing.options || ['', '', '', ''])[i]} onChange={(e) => {
                                const copy = [...(editing.options || ['', '', '', ''])];
                                copy[i] = e.target.value;
                                setEditing({ ...editing, options: copy });
                              }} style={{ flex: 1 }} placeholder={`گزینه ${i+1}`} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {editing.type === 'fillblank' && (
                      <div className="filterGroup full-span">
                        <label>پاسخ صحیح</label>
                        <input type="text" value={editing.answer || ''} onChange={(e) => setEditing({ ...editing, answer: e.target.value })} />
                      </div>
                    )}
                    {editing.type === 'truefalse' && (
                      <div className="filterGroup">
                        <label>پاسخ صحیح</label>
                        <div className="flex items-center gap-sm">
                          <label className="flex items-center gap-sm">
                            <input
                              type="radio"
                              name="tfAnswer"
                              checked={(editing.answer || 'درست') === 'درست'}
                              onChange={() => setEditing({ ...editing, answer: 'درست' })}
                            />
                            <span>درست</span>
                          </label>
                          <label className="flex items-center gap-sm">
                            <input
                              type="radio"
                              name="tfAnswer"
                              checked={editing.answer === 'نادرست'}
                              onChange={() => setEditing({ ...editing, answer: 'نادرست' })}
                            />
                            <span>نادرست</span>
                          </label>
                        </div>
                      </div>
                    )}
                    {(editing.type === 'short' || editing.type === 'long') && (
                      <div className="filterGroup full-span">
                        <label>پاسخ نمونه</label>
                        <textarea rows={3} value={editing.modelAnswer || ''} onChange={(e) => setEditing({ ...editing, modelAnswer: e.target.value })} />
                      </div>
                    )}
                    {editing.type === 'matching' && (
                      <div className="full-span" style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                        <label className="title-sm" style={{ display: 'block' }}>وصل‌کردنی</label>
                        <div className="flex wrap gap-md" style={{ alignItems: 'flex-start' }}>
                          {/* Left column (A) */}
                          <div className="adminCard adminCard--tight" style={{ flex: '1 1 280px', minWidth: 260 }}>
                            <div className="flex items-center justify-between" style={{ marginBottom: '.5rem' }}>
                              <strong>ستون A</strong>
                              <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => setEditing(prev => ({ ...prev, matchingLeft: [...(prev.matchingLeft || []), ''] }))}
                              >
                                افزودن مورد
                              </button>
                            </div>
                            <div className="flex flex-col gap-sm">
                              {(editing.matchingLeft || ['']).map((txt, idx) => (
                                <div key={`L-${idx}`} className="flex items-center gap-sm">
                                  <span className="badge">A{idx + 1}</span>
                                  <input
                                    type="text"
                                    className="inputPill"
                                    value={txt}
                                    onChange={(e) => {
                                      const copy = [...(editing.matchingLeft || [])];
                                      copy[idx] = e.target.value;
                                      setEditing({ ...editing, matchingLeft: copy });
                                    }}
                                    placeholder={`متن گزینه A${idx + 1}`}
                                    style={{ flex: 1 }}
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-icon"
                                    title="حذف"
                                    aria-label="حذف"
                                    onClick={() => {
                                      const left = [...(editing.matchingLeft || [])];
                                      left.splice(idx, 1);
                                      // Remove/shift pairs referencing this left index
                                      let pairs = Array.isArray(editing.correctPairs) ? [...editing.correctPairs] : [];
                                      // Keep only valid tuple pairs
                                      pairs = pairs.filter((p) => Array.isArray(p) && p.length >= 2);
                                      // Remove references to this left index and shift indices > idx
                                      pairs = pairs
                                        .filter((p) => p[0] !== idx)
                                        .map((p) => [p[0] > idx ? p[0] - 1 : p[0], p[1]]);
                                      setEditing({ ...editing, matchingLeft: left.length ? left : [''], correctPairs: pairs });
                                    }}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Right column (B) */}
                          <div className="adminCard adminCard--tight" style={{ flex: '1 1 280px', minWidth: 260 }}>
                            <div className="flex items-center justify-between" style={{ marginBottom: '.5rem' }}>
                              <strong>ستون B</strong>
                              <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => setEditing(prev => ({ ...prev, matchingRight: [...(prev.matchingRight || []), ''] }))}
                              >
                                افزودن مورد
                              </button>
                            </div>
                            <div className="flex flex-col gap-sm">
                              {(editing.matchingRight || ['']).map((txt, idx) => (
                                <div key={`R-${idx}`} className="flex items-center gap-sm">
                                  <span className="badge">B{idx + 1}</span>
                                  <input
                                    type="text"
                                    className="inputPill"
                                    value={txt}
                                    onChange={(e) => {
                                      const copy = [...(editing.matchingRight || [])];
                                      copy[idx] = e.target.value;
                                      setEditing({ ...editing, matchingRight: copy });
                                    }}
                                    placeholder={`متن گزینه B${idx + 1}`}
                                    style={{ flex: 1 }}
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-icon"
                                    title="حذف"
                                    aria-label="حذف"
                                    onClick={() => {
                                      const right = [...(editing.matchingRight || [])];
                                      right.splice(idx, 1);
                                      // Remove/shift pairs referencing this right index
                                      let pairs = Array.isArray(editing.correctPairs) ? [...editing.correctPairs] : [];
                                      pairs = pairs
                                        .filter((p) => Array.isArray(p) && p.length >= 2)
                                        .filter((p) => p[1] !== idx)
                                        .map((p) => [p[0], p[1] > idx ? p[1] - 1 : p[1]]);
                                      setEditing({ ...editing, matchingRight: right.length ? right : [''], correctPairs: pairs });
                                    }}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Pair mapping */}
                        <div className="adminCard adminCard--tight" style={{ marginTop: '.25rem' }}>
                          <div className="flex flex-col gap-sm">
                            {(editing.matchingLeft || []).map((txt, li) => {
                              const pairs = Array.isArray(editing.correctPairs) ? editing.correctPairs : [];
                              const current = pairs.find(p => p[0] === li)?.[1] ?? -1;
                              const rightOptions = (editing.matchingRight || []).map((r, idx) => ({ idx, label: r?.trim() ? r : `B${idx + 1}` }));
                              return (
                                <div key={`MAP-${li}`} className="flex items-center gap-sm">
                                  <span className="badge" title={txt?.trim() || `A${li + 1}`}>A{li + 1}</span>
                                  <span className="text-sm" style={{ minWidth: 60, textAlign: 'center' }}>وصل به</span>
                                  <select
                                    className="inputPill-select"
                                    value={current}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value, 10);
                                      let next = Array.isArray(editing.correctPairs) ? [...editing.correctPairs] : [];
                                      // Keep only valid tuple pairs
                                      next = next.filter((p) => Array.isArray(p) && p.length >= 2);
                                      // Remove previous link from this left
                                      next = next.filter((p) => p[0] !== li);
                                      if (!isNaN(val) && val >= 0) {
                                        // Ensure one-to-one: remove any pair that already uses this right
                                        next = next.filter((p) => p[1] !== val);
                                        next.push([li, val]);
                                      }
                                      setEditing({ ...editing, correctPairs: next });
                                    }}
                                  >
                                    <option value={-1}>—</option>
                                    {rightOptions.map(opt => (
                                      <option key={`Ropt-${opt.idx}`} value={opt.idx}>{opt.label}</option>
                                    ))}
                                  </select>
                                </div>
                              );
                            })}
                          </div>
                          {/* Preview */}
                          <div className="text-xs text-muted" style={{ marginTop: '.5rem' }}>
                            {Array.isArray(editing.correctPairs) && editing.correctPairs.length > 0
                              ? editing.correctPairs
                                  .filter(p => p && p.length === 2 && p[0] >= 0 && p[1] >= 0)
                                  .map(([l, r]) => `A${l + 1} → B${r + 1}`)
                                  .join(' ، ')
                              : 'هیچ جفتی انتخاب نشده است.'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="drawerFooter">
                <button className="btn" onClick={() => setDrawerOpen(false)}>بستن</button>
                <button className="btn btn-primary" onClick={saveEditing}>ذخیره</button>
              </div>
            </div>
          </aside>
        </div>
      )}
      {/* Snackbar */}
      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast({ ...toast, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} sx={{ zIndex: 14000 }}>
        <Alert severity={toast.severity} variant="filled">{toast.message}</Alert>
      </Snackbar>
    </div>
  );
};

export default AdminQuestions;
