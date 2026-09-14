import React, { useMemo, useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, PlusCircle, Trash2, Edit, Filter, ChevronDown } from 'lucide-react';
import styles from './Admin.module.css';
import './adminBase.css';
import { VIDEO_TYPES } from '../../data/mockVideos';
import { 
  fetchAdminContentTypes, 
  fetchAdminContents, 
  createAdminContent, 
  updateAdminContent, 
  deleteAdminContent,
  fetchGrades,
  fetchBooksByGrade,
  fetchChaptersByBook,
  fetchSubchaptersByChapter
} from '../../api/adminApi';
import ConfirmationDialog from './ConfirmationDialog';

const AdminVideos = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contentTypes, setContentTypes] = useState([]);
  const [videoTypeId, setVideoTypeId] = useState(null);
  const [query, setQuery] = useState('');
  // Filters
  const [type, setType] = useState('');
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [status, setStatus] = useState('');
  const [accessType, setAccessType] = useState('');
  const [teacherQuery, setTeacherQuery] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialogs/Drawers
  const [confirm, setConfirm] = useState({ open: false, action: null, payload: null });
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  // UI state
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Editor drawer (custom)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerOpenVisual, setDrawerOpenVisual] = useState(false);

  // Curriculum selectors state (options)
  const [gradeOptions, setGradeOptions] = useState([]);
  const [bookOptions, setBookOptions] = useState([]);
  const [chapterOptions, setChapterOptions] = useState([]);
  const [subchapterOptions, setSubchapterOptions] = useState([]);

  // Settings wiring (subjects/chapters)
  const SETTINGS_KEY = 'elmino_admin_settings_v1';
  const settings = useMemo(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, []);
  const subjects = useMemo(() => settings?.content?.subjects || ['علوم تجربی'], [settings]);
  const chaptersFor = (subj, grd) => {
    const count = settings?.content?.chapters?.[subj]?.[grd] || 0;
    return Array.from({ length: count }, (_, i) => `فصل ${i + 1}`);
  };

  const filtered = useMemo(() => {
    return videos.filter(v => {
      if (query) {
        const q = query.toLowerCase();
        if (!v.title?.toLowerCase().includes(q)) return false;
      }
      if (teacherQuery) {
        const t = teacherQuery.toLowerCase();
        if (!v.teacher?.toLowerCase().includes(t)) return false;
      }
      if (type && v.type !== type) return false;
      if (grade && v.grade !== grade) return false;
      if (subject && v.subject !== subject) return false;
      if (chapter && v.chapter !== chapter) return false;
      if (status && v.status !== status) return false;
      if (accessType && v.accessType !== accessType) return false;
      return true;
    });
  }, [videos, query, teacherQuery, type, grade, subject, chapter, status, accessType]);

  const uniqueChapters = useMemo(() => {
    if (subject && grade) return chaptersFor(subject, grade);
    const set = new Set(videos.filter(v => (!subject || v.subject === subject) && (!grade || v.grade === grade)).map(v => v.chapter).filter(Boolean));
    return Array.from(set);
  }, [videos, subject, grade]);

  const [toast, setToast] = useState({ open: false, severity: 'info', message: '' });
  const doDelete = (id) => {
    setVideos((arr) => arr.filter(v => v.id !== id));
    setToast({ open: true, severity: 'success', message: 'ویدیو حذف شد.' });
  };
  // checked: true means access is ON (users have access), false means revoked
  const toggleRevoke = (id, nextChecked) => {
    const item = videos.find(i => i.id === id);
    const hasAccess = item ? !item.accessRevoked : false;
    if (item && hasAccess && !nextChecked) {
      // request revoke confirmation
      setConfirm({ open: true, action: 'revokeAccess', payload: item });
      return;
    }
    setVideos((arr) => arr.map(v => v.id === id ? { ...v, accessRevoked: !nextChecked } : v));
  };
  const handleAdd = (newVideo) => { setVideos((arr) => [newVideo, ...arr]); };
  const handleSave = (updated) => { setVideos(arr => arr.map(v => v.id === updated.id ? updated : v)); };

  const STATUS_OPTIONS = [
    { value: 'published', label: 'منتشر شده' },
    { value: 'draft', label: 'پیش‌نویس' },
    { value: 'revoked', label: 'لغو شده' },
  ];
  const ACCESS_TYPES = [
    { value: 'free', label: 'رایگان' },
    { value: 'paid', label: 'پرداختی' },
  ];

  const startAdd = () => {
    setEditing({
      id: 'v-' + Math.random().toString(36).slice(2, 8),
      title: '', 
      description: '', 
      videoLicense: '', 
      coverImage: null,
      teacher: '', 
      accessType: 'paid', 
      token_price: 0,
      gradeId: '',
      bookId: '',
      chapterId: '',
      subchapterId: '',
    });
    setDrawerOpen(true);
  };

  const startEdit = (v) => { 
    setEditing({ 
      ...v, 
      coverImage: null // Reset file input for editing
    }); 
    setDrawerOpen(true); 
  };

  const saveEditing = () => {
    if (!editing) return;
    // Simple validation
    if (!editing.title) {
      setToast({ open: true, severity: 'error', message: 'عنوان الزامی است.' });
      return;
    }
    (async () => {
      try {
        if (!videoTypeId) {
          setToast({ open: true, severity: 'error', message: 'نوع محتوای ویدیو یافت نشد.' });
          return;
        }
        
        const formData = new FormData();
        formData.append('type_id', videoTypeId);
        formData.append('title', editing.title);
        formData.append('description', editing.description || '');
        formData.append('is_free', editing.accessType === 'free' ? '1' : '0');
        formData.append('token_price', editing.token_price || 0);
        
        if (editing?.subchapterId) {
          formData.append('subchapter_id', Number(editing.subchapterId));
        }
        
        if (editing.coverImage) {
          formData.append('cover_image', editing.coverImage);
        }
        
        const exists = videos.some(x => String(x.id) === String(editing.id));
        if (exists && typeof editing.id === 'number') {
          const updated = await updateAdminContent(editing.id, formData);
          const norm = normalizeContentToVideo(updated);
          setVideos(arr => arr.map(x => String(x.id) === String(norm.id) ? norm : x));
        } else {
          const created = await createAdminContent(formData);
          const norm = normalizeContentToVideo(created);
          handleAdd(norm);
        }
        setToast({ open: true, severity: 'success', message: 'ذخیره شد.' });
        setDrawerOpen(false);
      } catch (e) {
        setToast({ open: true, severity: 'error', message: e?.response?.data?.message || 'خطا در ذخیره' });
      }
    })();
  };

  // Load content types and videos list from API
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setIsLoading(true);
        const types = await fetchAdminContentTypes();
        if (!alive) return;
        setContentTypes(types);
        const toLower = (v) => (v || '').toString().trim().toLowerCase();
        const matchers = ['video','فیلم','ویدیو','ویدئو'];
        const videoType = (types || []).find(t => {
          const n = toLower(t.name);
          const s = toLower(t.slug);
          return matchers.includes(n) || matchers.includes(s) || matchers.some(m => n.includes(m) || s.includes(m));
        });
        const vTypeId = videoType?.id || null;
        setVideoTypeId(vTypeId);
        const { items } = await fetchAdminContents({ per_page: 200, type_id: vTypeId || undefined });
        if (!alive) return;
        const list = Array.isArray(items) ? items.map(normalizeContentToVideo) : [];
        setVideos(list);
      } catch (e) {
        if (alive) setVideos([]);
      } finally {
        if (alive) setIsLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const normalizeContentToVideo = (c) => {
    const id = c?.id ?? c?.data?.id ?? c?.content_id;
    const title = c?.title || '';
    const isFree = !!(c?.is_free ?? c?.isFree);
    const created = c?.created_at || c?.createdAt || '';
    const subchapterId = c?.subchapter?.id ?? c?.subchapter_id ?? null;
    const chapterObj = c?.subchapter?.chapter || null;
    const bookObj = chapterObj?.book || null;
    const gradeObj = bookObj?.grade || null;
    const subjectObj = bookObj?.subject || null;
    
    return {
      id,
      title,
      description: c?.description || '',
      teacher: '',
      grade: gradeObj?.name || '',
      subject: subjectObj?.name || (bookObj?.title || bookObj?.name || ''),
      chapter: chapterObj?.title || (chapterObj?.number ? `فصل ${chapterObj.number}` : ''),
      thumbnailUrl: '',
      accessType: isFree ? 'free' : 'paid',
      accessRevoked: false,
      addedDate: created,
      subchapterId: subchapterId || '',
      token_price: c?.token_price || 0,
    };
  };

  // Deep-link: auto open add video when ?action=add
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

  // Load curriculum options when editor opens
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!drawerOpen) return;
      try {
        const grades = await fetchGrades();
        if (!alive) return;
        const opts = (Array.isArray(grades) ? grades : []).map(g => ({ id: g.id ?? g.value ?? g, name: g.name ?? g.label ?? String(g.id ?? g) }));
        setGradeOptions(opts);
      } catch {
        if (alive) setGradeOptions([]);
      }
    })();
    return () => { alive = false; };
  }, [drawerOpen]);

  // Cascade: grade -> books
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!drawerOpen || !editing) return;
      const gid = editing.gradeId;
      setBookOptions([]);
      setChapterOptions([]);
      setSubchapterOptions([]);
      if (!gid) return;
      try {
        const books = await fetchBooksByGrade(gid);
        if (!alive) return;
        const opts = (Array.isArray(books) ? books : []).map(b => ({ id: b.id ?? b.value ?? b, name: b.name ?? b.title ?? b.label ?? String(b.id ?? b) }));
        setBookOptions(opts);
      } catch {
        if (alive) setBookOptions([]);
      }
    })();
    return () => { alive = false; };
  }, [drawerOpen, editing?.gradeId]);

  // Cascade: book -> chapters
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!drawerOpen || !editing) return;
      const bid = editing.bookId;
      setChapterOptions([]);
      setSubchapterOptions([]);
      if (!bid) return;
      try {
        const chapters = await fetchChaptersByBook(bid);
        if (!alive) return;
        const opts = (Array.isArray(chapters) ? chapters : []).map(c => ({ id: c.id ?? c.value ?? c, name: c.name ?? c.title ?? c.label ?? String(c.id ?? c) }));
        setChapterOptions(opts);
      } catch {
        if (alive) setChapterOptions([]);
      }
    })();
    return () => { alive = false; };
  }, [drawerOpen, editing?.bookId]);

  // Cascade: chapter -> subchapters
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!drawerOpen || !editing) return;
      const cid = editing.chapterId;
      setSubchapterOptions([]);
      if (!cid) return;
      try {
        const subs = await fetchSubchaptersByChapter(cid);
        if (!alive) return;
        const opts = (Array.isArray(subs) ? subs : []).map(s => ({ id: s.id ?? s.value ?? s, name: s.title ? `${s.number ? `بخش ${s.number} – ` : ''}${s.title}` : String(s.id ?? s) }));
        setSubchapterOptions(opts);
      } catch {
        if (alive) setSubchapterOptions([]);
      }
    })();
    return () => { alive = false; };
  }, [drawerOpen, editing?.chapterId]);

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

  return (
    <div dir="rtl">
      <div className={styles.panelHeader}>
        <h2 style={{ margin: 0 }}>مدیریت ویدیوها</h2>
        <button className="btn btn-primary" onClick={startAdd} aria-label="افزودن ویدیو">
          <PlusCircle size={18} style={{ marginInlineEnd: 6 }} />
          افزودن ویدیو
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
                <label>جستجوی عنوان</label>
                <div className="inputWrap">
                  <span className="searchIcon"><Search size={16} /></span>
                  <input type="text" placeholder="جستجو بر اساس عنوان" value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>
              </div>
              <div className="filterGroup filterSearch">
                <label>جستجوی مدرس</label>
                <div className="inputWrap">
                  <span className="searchIcon"><Search size={16} /></span>
                  <input type="text" placeholder="جستجو بر اساس مدرس" value={teacherQuery} onChange={(e) => setTeacherQuery(e.target.value)} />
                </div>
              </div>
              <div className="filterGroup">
                <label>نوع</label>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="">همه</option>
                  {VIDEO_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="filterGroup">
                <label>پایه</label>
                <select value={grade} onChange={(e) => setGrade(e.target.value)}>
                  <option value="">همه</option>
                  {['7','8','9'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="filterGroup">
                <label>درس</label>
                <select value={subject} onChange={(e) => { setSubject(e.target.value); setChapter(''); }}>
                  <option value="">همه</option>
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="filterGroup">
                <label>فصل</label>
                <select value={chapter} onChange={(e) => setChapter(e.target.value)}>
                  <option value="">همه</option>
                  {uniqueChapters.map(ch => <option key={ch} value={ch}>{ch}</option>)}
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
                <label>دسترسی</label>
                <select value={accessType} onChange={(e) => setAccessType(e.target.value)}>
                  <option value="">همه</option>
                  {ACCESS_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
              <div className="full-span flex items-center gap-sm" style={{ marginTop: '.25rem' }}>
                <span className="resultsBadge">نتایج: {filtered.length.toLocaleString('fa-IR')}</span>
                <button className="clearBtn" onClick={() => { setQuery(''); setTeacherQuery(''); setType(''); setGrade(''); setSubject(''); setChapter(''); setStatus(''); setAccessType(''); setPage(0); }}>حذف فیلترها</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={`${styles.tableContainer} ${styles.tableFullRight} ${styles.videosTableContainer}`}>
        <table>
          <thead>
            <tr>
              <th>جلسه</th>
              <th>مدرس</th>
              <th>پایه/درس/فصل</th>
              <th>دسترسی</th>
              <th style={{ textAlign: 'left' }}>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center' }}>در حال بارگذاری...</td>
              </tr>
            )}
            {!isLoading && filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(v => {
              const hasAccess = !v.accessRevoked;
              return (
                <tr key={v.id} className={styles.clickableRow}>
                  <td data-label="جلسه">
                    <div className="cellValue flex items-center gap-sm">
                      {v.thumbnailUrl ? (
                        <img src={v.thumbnailUrl} alt="thumb" style={{ width: 40, height: 28, borderRadius: 6, objectFit: 'cover' }} />
                      ) : (
                        <span className="avatar-sm" aria-hidden>{v.title?.[0] || 'V'}</span>
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm" title={v.title}>{v.title}</span>
                        <span className="text-xs text-muted">{v.addedDate || '-'}</span>
                      </div>
                    </div>
                  </td>
                  <td data-label="مدرس"><div className="cellValue">{v.teacher || '-'}</div></td>
                  <td data-label="پایه/درس/فصل"><div className="cellValue">{`${v.grade || '-'} / ${v.subject || '-'} / ${v.chapter || '-'}`}</div></td>
                  <td data-label="دسترسی">
                    <div className="cellValue" style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem' }}>
                      <label className="switch" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={hasAccess} onChange={(e) => toggleRevoke(v.id, e.target.checked)} />
                        <span className="slider" />
                      </label>
                      <span className="text-xs text-muted">{hasAccess ? 'فعال' : 'لغو شده'}</span>
                      <span className="badge badge-outline">{ACCESS_TYPES.find(a => a.value === v.accessType)?.label || v.accessType || '-'}</span>
                    </div>
                  </td>
                  <td data-label="عملیات" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'left' }}>
                    <div className={styles.actionBtns}>
                      <button className={`btn btn-icon ${styles.actionEdit}`} title="ویرایش" aria-label="ویرایش" onClick={() => startEdit(v)}>
                        <Edit size={18} color="#0d6efd" />
                      </button>
                      <button className={`btn btn-icon ${styles.actionDelete}`} title="حذف" aria-label="حذف" onClick={() => setConfirm({ open: true, action: 'delete', payload: v })}>
                        <Trash2 size={18} color="#dc3545" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center' }}>موردی یافت نشد.</td>
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
        onConfirm={() => {
          if (!confirm.open) return;
          if (confirm.action === 'delete' && confirm.payload) {
            const target = confirm.payload;
            (async () => {
              try {
                if (typeof target.id === 'number') await deleteAdminContent(target.id);
                doDelete(target.id);
              } catch (e) {
                setToast({ open: true, severity: 'error', message: e?.response?.data?.message || 'خطا در حذف' });
              }
            })();
          }
          if (confirm.action === 'revokeAccess' && confirm.payload) setVideos(arr => arr.map(v => v.id === confirm.payload.id ? { ...v, accessRevoked: true } : v));
          setConfirm({ open: false, action: null, payload: null });
        }}
        title={confirm.action === 'revokeAccess' ? 'لغو دسترسی' : 'حذف ویدیو'}
        message={confirm.action === 'revokeAccess' ? 'با تایید، دسترسی این ویدیو برای همه کاربران لغو می‌شود.' : 'آیا از حذف این ویدیو مطمئن هستید؟ این عملیات قابل بازگشت نیست.'}
        confirmLabel={confirm.action === 'revokeAccess' ? 'تایید' : 'حذف'}
        confirmColor={'error'}
      />

      {/* Editor Drawer - Custom */}
      {drawerVisible && (
        <div className={`drawerRoot ${drawerOpenVisual ? 'open' : ''}`} aria-hidden={!drawerOpen}>
          <div className="drawerOverlay" onClick={() => setDrawerOpen(false)} />
          <aside className={`drawerPanel ${drawerOpenVisual ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="افزودن/ویرایش ویدیو">
            <div className="drawerInner">
              <div className="drawerSection flex items-center justify-between" style={{ paddingBottom: '.75rem' }}>
                <h3 className="title-sm" style={{ margin: 0, fontSize: '.9rem' }}>{videos.some(v => v.id === editing?.id) ? 'ویرایش ویدیو' : 'افزودن ویدیو'}</h3>
                {/* <button className="btn btn-icon" onClick={() => setDrawerOpen(false)} aria-label="بستن">×</button> */}
              </div>
              <hr className="divider" />
              {editing && (
                <div className="drawerSection">
                  <div className="filterGrid drawerFilters">
                    <div className="filterGroup full-span">
                      <label>عنوان</label>
                      <input type="text" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                    </div>
                    <div className="filterGroup full-span">
                      <label>توضیحات</label>
                      <textarea rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
                    </div>
                    <div className="filterGroup full-span">
                      <label>لایسنس ویدیو</label>
                      <input type="text" placeholder="لایسنس ویدیو را وارد کنید" value={editing.videoLicense || ''} onChange={(e) => setEditing({ ...editing, videoLicense: e.target.value })} />
                    </div>
                    <div className="filterGroup full-span">
                      <label>کاور (آپلود تصویر)</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => setEditing({ ...editing, coverImage: e.target.files[0] })} 
                      />
                      {editing.coverImage && <span className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>{editing.coverImage.name}</span>}
                    </div>
                    <div className="filterGroup">
                      <label>پایه</label>
                      <select value={editing.gradeId || ''} onChange={(e) => { 
                        const g = e.target.value; 
                        setEditing({ ...editing, gradeId: g, bookId: '', chapterId: '', subchapterId: '' }); 
                      }}>
                        <option value="">انتخاب کنید</option>
                        {gradeOptions.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    </div>
                    <div className="filterGroup">
                      <label>کتاب</label>
                      <select value={editing.bookId || ''} onChange={(e) => { 
                        const b = e.target.value; 
                        setEditing({ ...editing, bookId: b, chapterId: '', subchapterId: '' }); 
                      }} disabled={!editing.gradeId}>
                        <option value="">انتخاب کنید</option>
                        {bookOptions.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                    <div className="filterGroup">
                      <label>فصل</label>
                      <select value={editing.chapterId || ''} onChange={(e) => { 
                        const c = e.target.value; 
                        setEditing({ ...editing, chapterId: c, subchapterId: '' }); 
                      }} disabled={!editing.bookId}>
                        <option value="">انتخاب کنید</option>
                        {chapterOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="filterGroup">
                      <label>زیرفصل</label>
                      <select value={editing.subchapterId || ''} onChange={(e) => setEditing({ ...editing, subchapterId: e.target.value })} disabled={!editing.chapterId}>
                        <option value="">انتخاب کنید</option>
                        {subchapterOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="filterGroup">
                      <label>دسترسی</label>
                      <select value={editing.accessType} onChange={(e) => setEditing({ ...editing, accessType: e.target.value })}>
                        {ACCESS_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                      </select>
                    </div>
                    {editing.accessType === 'paid' && (
                      <div className="filterGroup">
                        <label>قیمت توکن</label>
                        <input 
                          type="number" 
                          min="0"
                          value={editing.token_price || 0} 
                          onChange={(e) => setEditing({ ...editing, token_price: parseInt(e.target.value, 10) || 0 })} 
                        />
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

export default AdminVideos;
