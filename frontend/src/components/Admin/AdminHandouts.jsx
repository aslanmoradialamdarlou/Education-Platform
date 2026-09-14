import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Trash2, Edit, Filter, ChevronDown, PlusCircle } from 'lucide-react';
import { Snackbar, Alert } from '@mui/material';
import styles from './Admin.module.css';
import './adminBase.css';
import { HANDOUT_ACCESS } from '../../data/handoutConstants';
import {
  fetchAdminContentTypes,
  fetchAdminContents,
  createAdminContent,
  updateAdminContent,
  deleteAdminContent,
  fetchGrades,
  fetchBooksByGrade,
  fetchChaptersByBook,
  fetchSubchaptersByChapter,
} from '../../api/adminApi';
import ConfirmationDialog from './ConfirmationDialog';
// Removed modal-based add/edit; using drawer editor

const AdminHandouts = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [handouts, setHandouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contentTypes, setContentTypes] = useState([]);
  const [handoutTypeId, setHandoutTypeId] = useState(null);
  const [query, setQuery] = useState('');
  const [accessType, setAccessType] = useState('');
  const [confirm, setConfirm] = useState({ open: false, payload: null, action: null });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  // Curriculum selectors state (options)
  const [gradeOptions, setGradeOptions] = useState([]);
  const [bookOptions, setBookOptions] = useState([]);
  const [chapterOptions, setChapterOptions] = useState([]);
  const [subchapterOptions, setSubchapterOptions] = useState([]);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Removed legacy settings-based subject/chapter mapping; using real curriculum selectors in editor

  const filtered = useMemo(() => {
    return handouts.filter(h => {
      if (query) {
        const q = query.toLowerCase();
        if (!h.title?.toLowerCase().includes(q)) return false;
      }
      // simplified filters; removed teacher/grade/subject/chapter/status
      if (accessType && h.accessType !== accessType) return false;
      return true;
    });
  }, [handouts, query, accessType]);

  // removed uniqueChapters due to simplified filtering

  const doDelete = (id) => setHandouts(arr => arr.filter(h => h.id !== id));
  const handleAdd = (newItem) => setHandouts(arr => [newItem, ...arr]);
  const handleSave = (updated) => setHandouts(arr => arr.map(h => h.id === updated.id ? updated : h));

  const startAdd = () => {
    setEditing({
      id: 'h-' + Math.random().toString(36).slice(2, 8),
      title: '', description: '',
      accessType: 'paid', addedDate: '',
      token_price: 0,
      pdf_file: null,
      // curriculum linkage
      gradeId: '',
      bookId: '',
      chapterId: '',
      subchapterId: '',
    });
    setEditorOpen(true);
  };
  const startEdit = async (h) => {
    // Preserve possible existing subchapter link if present on item (normalized below)
    setEditing({ ...h, pdf_file: null }); // pdf_file null means no new file uploaded
    setEditorOpen(true);
  };
  const saveEditing = () => {
    if (!editing) return;
    if (!editing.title) {
      setToast({ open: true, severity: 'error', message: 'عنوان الزامی است.' });
      return;
    }
    (async () => {
      try {
        // Resolve type id robustly (state, derive from contentTypes, fallback to first)
        const typeIdToUse = handoutTypeId || (() => {
          const matchers = ['handout','handouts','جزوه','جزوه‌ها','جزوه ها'];
          const lower = (s) => (s || '').toString().trim().toLowerCase();
          const found = (contentTypes || []).find(ct => {
            const n = lower(ct.name);
            const s = lower(ct.slug);
            return matchers.includes(n) || matchers.includes(s) || matchers.some(m => n.includes(m) || s.includes(m));
          });
          return found?.id || (contentTypes?.[0]?.id ?? null);
        })();
        if (!typeIdToUse) {
          setToast({ open: true, severity: 'error', message: 'انواع محتوا یافت نشد. لطفاً صفحه را رفرش کنید.' });
          return;
        }
        
        // ساخت FormData برای آپلود فایل
        const formData = new FormData();
        formData.append('type_id', typeIdToUse);
        formData.append('title', editing.title);
        formData.append('description', editing.description || '');
        formData.append('is_free', editing.accessType === 'free' ? '1' : '0');
        formData.append('token_price', editing.token_price || 0);
        
        // اضافه کردن subchapter_id اگر انتخاب شده
        if (editing?.subchapterId) {
          formData.append('subchapter_id', Number(editing.subchapterId));
        }
        
        // اضافه کردن فایل PDF اگر انتخاب شده
        if (editing.pdf_file) {
          formData.append('pdf_file', editing.pdf_file);
        }
        
        const exists = handouts.some(x => String(x.id) === String(editing.id));
        if (exists && typeof editing.id === 'number') {
          const updated = await updateAdminContent(editing.id, formData);
          const norm = normalizeContentToHandout(updated);
          setHandouts(arr => arr.map(x => String(x.id) === String(norm.id) ? norm : x));
        } else {
          const created = await createAdminContent(formData);
          const norm = normalizeContentToHandout(created);
          setHandouts(arr => [norm, ...arr]);
        }
        setEditorOpen(false);
        setToast({ open: true, severity: 'success', message: 'ذخیره شد.' });
      } catch (e) {
        setToast({ open: true, severity: 'error', message: e?.response?.data?.message || 'خطا در ذخیره' });
      }
    })();
  };

  // removed revoke toggle; access is derived solely from is_free

  // Deep-link: auto open add handout when ?action=add
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    if (action === 'add' && !editorOpen) {
      startAdd();
      params.delete('action');
      const base = location.pathname;
      const qs = params.toString();
      navigate(qs ? `${base}?${qs}` : base, { replace: true });
    }
  }, [location.search, editorOpen, navigate, location.pathname]);

  // Load curriculum options when editor opens
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!editorOpen) return;
      try {
        const grades = await fetchGrades();
        if (!alive) return;
        // Normalize to {id, name}
        const opts = (Array.isArray(grades) ? grades : []).map(g => ({ id: g.id ?? g.value ?? g, name: g.name ?? g.label ?? String(g.id ?? g) }));
        setGradeOptions(opts);
      } catch {
        if (alive) setGradeOptions([]);
      }
    })();
    return () => { alive = false; };
  }, [editorOpen]);

  // Cascade: grade -> books
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!editorOpen || !editing) return;
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
  }, [editorOpen, editing?.gradeId]);

  // Cascade: book -> chapters
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!editorOpen || !editing) return;
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
  }, [editorOpen, editing?.bookId]);

  // Cascade: chapter -> subchapters
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!editorOpen || !editing) return;
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
  }, [editorOpen, editing?.chapterId]);

  // Fetch content types and then handouts via contents API (strict: use type_id filter)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setIsLoading(true);
        const types = await fetchAdminContentTypes();
        console.log('📦 Content Types:', types);
        if (!alive) return;
        setContentTypes(types);
        // Robustly derive handout type id; fallback to first available
        const toLower = (v) => (v || '').toString().trim().toLowerCase();
        const matchers = ['handout','handouts','booklet','جزوه','جزوه‌ها','جزوه ها'];
        const handoutType = (types || []).find(t => {
          const n = toLower(t.name);
          const s = toLower(t.slug);
          return matchers.includes(n) || matchers.includes(s) || matchers.some(m => n.includes(m) || s.includes(m));
        });
        console.log('📝 Handout Type Found:', handoutType);
        const typeId = handoutType?.id || null;
        if (!typeId) {
          console.error('❌ No handout type ID found!');
          if (alive) {
            setHandouts([]);
            setToast({ open: true, severity: 'error', message: 'نوع محتوای جزوه یافت نشد.' });
          }
          return;
        }
        setHandoutTypeId(typeId);
        const { items } = await fetchAdminContents({ per_page: 200, type_id: typeId });
        console.log('📚 Handouts Items:', items);
        if (!alive) return;
        const list = Array.isArray(items) ? items.map(normalizeContentToHandout) : [];
        console.log('✅ Normalized Handouts:', list);
        setHandouts(list);
      } catch (e) {
        console.error('❌ Error loading handouts:', e);
        if (alive) {
          setHandouts([]);
          setToast({ open: true, severity: 'error', message: e?.response?.data?.message || 'خطا در دریافت انواع محتوا' });
        }
      } finally {
        if (alive) setIsLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const normalizeContentToHandout = (c) => {
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
      pages: '',
      price: 0,
      status: 'published',
      accessType: isFree ? 'free' : 'paid',
      accessRevoked: false,
      addedDate: created,
      teacherGuideUrl: '',
      classSummaryUrl: '',
      pdfUrl: '',
      // Linkage for editing
      subchapterId: subchapterId || '',
    };
  };

  return (
    <div dir="rtl">
      <div className={styles.panelHeader}>
        <h2 className="title-md" style={{ margin: 0 }}>مدیریت جزوه‌ها</h2>
        <button className="btn btn-primary" onClick={startAdd}>
          <PlusCircle size={18} style={{ marginInlineEnd: 6 }} />
          افزودن جزوه جدید
        </button>
      </div>

      <div className="adminCard" style={{ marginBottom: '1rem' }}>
        <div className="filterToggleRow">
          <button className="btn btn-outline" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(v => !v)}>
            <Filter size={16} />
            فیلترها
            <ChevronDown size={16} style={{ transition: 'transform .2s ease', transform: filtersOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </button>
        </div>
        <div className={`collapsible ${filtersOpen ? 'open' : ''}`}>
          <div className={`${styles.detailFilterContainer} detailFilterContainer`} style={{ background: 'transparent', padding: 0, marginBottom: 0 }}>
            <div className="filterGrid filterGrid--2col" style={{ width: '100%' }}>
          <div className="filterGroup">
            <label>جستجو بر اساس عنوان</label>
            <div className="inputWrap">
              <span className="searchIcon"><Search size={16} /></span>
              <input type="text" placeholder="عنوان..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </div>
          <div className="filterGroup">
            <label>دسترسی</label>
            <select value={accessType} onChange={(e) => setAccessType(e.target.value)}>
              <option value="">همه</option>
              {HANDOUT_ACCESS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`${styles.tableContainer} ${styles.tableFullRight} ${styles.handoutsTableContainer}`}>
        <table>
          <thead>
            <tr>
              <th>عنوان</th>
              <th>پایه/درس/فصل</th>
              <th>دسترسی</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center' }}>در حال بارگذاری...</td>
              </tr>
            )}
            {!isLoading && filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(h => {
              const hasAccess = !h.accessRevoked;
              return (
                <tr key={h.id} className={styles.listItemHover}>
                  <td data-label="عنوان">
                    <div className="flex flex-col gap-xs">
                      <span className="text-sm" title={h.title} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.title}</span>
                      <span className="text-xs text-muted">{h.addedDate || '-'}</span>
                    </div>
                  </td>
                  <td data-label="پایه/درس/فصل">{`${h.grade || '-'} / ${h.subject || '-'} / ${h.chapter || '-'}`}</td>
                  <td data-label="دسترسی">
                    <span className="badge">{HANDOUT_ACCESS.find(a => a.value === h.accessType)?.label || h.accessType || '-'}</span>
                  </td>
                  <td data-label="عملیات">
                    <div className={`flex items-center gap-sm ${styles.actionBtns}`}>
                      <button className={`btn btn-icon ${styles.actionEdit}`} title="ویرایش" aria-label="ویرایش" onClick={() => startEdit(h)}><Edit color='#0d6efd' size={18} /></button>
                      <button className={`btn btn-icon ${styles.actionDelete}`} title="حذف جزوه" aria-label="حذف جزوه" onClick={() => setConfirm({ open: true, payload: h })}><Trash2 color='#dc3545' size={18} /></button>
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

      <div className="paginationRow">
        <div className="flex items-center gap-sm">
          <span className="text-sm">ردیف در صفحه:</span>
          <select
            className="rowsSelect"
            value={rowsPerPage}
            onChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          >
            {[5,10,25].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-sm">
          <button className="btn" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>قبلی</button>
          <span className="text-sm">{page + 1} / {Math.max(1, Math.ceil(filtered.length / rowsPerPage))}</span>
          <button className="btn" onClick={() => setPage(p => Math.min(Math.ceil(filtered.length / rowsPerPage) - 1, p + 1))} disabled={page >= Math.ceil(filtered.length / rowsPerPage) - 1}>بعدی</button>
        </div>
      </div>

      <ConfirmationDialog
        open={confirm.open}
        title={'حذف جزوه'}
        message={'آیا از حذف این جزوه مطمئن هستید؟ این عملیات قابل بازگشت نیست.'}
        confirmLabel={'حذف'}
        confirmColor={'error'}
        onClose={() => setConfirm({ open: false, payload: null, action: null })}
        onConfirm={async () => {
          try {
            // Try server delete; fallback to local remove on error
            try { if (typeof confirm.payload.id === 'number') await deleteAdminContent(confirm.payload.id); }
            catch (e) { /* ignore */ }
            doDelete(confirm.payload.id);
          } finally {
            setConfirm({ open: false, payload: null, action: null });
          }
        }}
      />
      {/* Editor Drawer - custom */}
      {editorOpen && (
        <div className={`drawerRoot open`}>
          <div className="drawerOverlay" onClick={() => setEditorOpen(false)} />
          <div className={`drawerPanel open`} style={{ width: 'min(92vw, 780px)' }}>
            <div className="drawerInner">
              <div className="drawerSection" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 className="title-sm" style={{ margin: 0 }}>{handouts.some(x => x.id === editing?.id) ? 'ویرایش جزوه' : 'افزودن جزوه'}</h3>
              </div>
              <hr className="divider" />
              {editing && (
                <div className="drawerSection drawerFilters">
                  <div className="filterGroup"><label>عنوان</label><input type="text" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
                  <div className="filterGroup"><label>توضیحات</label><textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} /></div>
                  
                  <hr className="divider" />
                  <h4 className="title-sm">فایل PDF</h4>
                  <div className="filterGroup">
                    <label>آپلود PDF (حداکثر 20 مگابایت)</label>
                    <input 
                      type="file" 
                      accept=".pdf,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 20 * 1024 * 1024) {
                            setToast({ open: true, severity: 'error', message: 'حجم فایل نباید بیشتر از 20 مگابایت باشد' });
                            e.target.value = '';
                            return;
                          }
                          setEditing({ ...editing, pdf_file: file });
                        }
                      }}
                    />
                    {editing.pdf_file && (
                      <div style={{ marginTop: '8px', fontSize: '0.875rem', color: '#666' }}>
                        📄 {editing.pdf_file.name} ({(editing.pdf_file.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    )}
                  </div>
                  
                  {/* نوع محتوا حذف شد؛ نوع در این تب ثابت و به‌صورت خودکار تعیین می‌شود */}
                  <hr className="divider" />
                  <h4 className="title-sm">قیمت‌گذاری و دسترسی</h4>
                  <div className="filterGrid">
                    <div className="filterGroup">
                      <label>نوع دسترسی</label>
                      <select value={editing.accessType} onChange={(e) => setEditing({ ...editing, accessType: e.target.value })}>
                        {HANDOUT_ACCESS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                      </select>
                    </div>
                    <div className="filterGroup">
                      <label>قیمت توکن (فقط برای پولی)</label>
                      <input 
                        type="number" 
                        min="0"
                        value={editing.token_price || 0} 
                        onChange={(e) => setEditing({ ...editing, token_price: parseInt(e.target.value) || 0 })}
                        disabled={editing.accessType === 'free'}
                      />
                    </div>
                  </div>
                  
                  <hr className="divider" />
                  <h4 className="title-sm">اتصال به زیرفصل</h4>
                  <div className="filterGrid">
                    <div className="filterGroup"><label>پایه</label>
                      <select value={editing.gradeId || ''} onChange={(e) => setEditing({ ...editing, gradeId: e.target.value, bookId: '', chapterId: '', subchapterId: '' })}>
                        <option value="">انتخاب کنید</option>
                        {gradeOptions.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    </div>
                    <div className="filterGroup"><label>کتاب</label>
                      <select value={editing.bookId || ''} onChange={(e) => setEditing({ ...editing, bookId: e.target.value, chapterId: '', subchapterId: '' })} disabled={!bookOptions.length}>
                        <option value="">انتخاب کنید</option>
                        {bookOptions.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="filterGrid">
                    <div className="filterGroup"><label>فصل</label>
                      <select value={editing.chapterId || ''} onChange={(e) => setEditing({ ...editing, chapterId: e.target.value, subchapterId: '' })} disabled={!chapterOptions.length}>
                        <option value="">انتخاب کنید</option>
                        {chapterOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="filterGroup"><label>زیرفصل</label>
                      <select value={editing.subchapterId || ''} onChange={(e) => setEditing({ ...editing, subchapterId: e.target.value })} disabled={!subchapterOptions.length}>
                        <option value="">انتخاب کنید</option>
                        {subchapterOptions.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}
              <div className="drawerFooter">
                <button className="btn" onClick={() => setEditorOpen(false)}>بستن</button>
                <button className="btn btn-primary" onClick={saveEditing}>ذخیره</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Drawer removed; replaced by hover tooltip per row */}

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast({ ...toast, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} sx={{ zIndex: 14000 }}>
        <Alert severity={toast.severity} variant="filled">{toast.message}</Alert>
      </Snackbar>
    </div>
  );
};

export default AdminHandouts;
