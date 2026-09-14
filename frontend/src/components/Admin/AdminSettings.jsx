import React, { useEffect, useState } from 'react';
import { Upload, Plus, Trash2, Edit2, Save, X, BookOpen, CheckCircle } from 'lucide-react';
import ConfirmationDialog from './ConfirmationDialog';
import styles from './Admin.module.css';
import './adminBase.css';
import './AdminSettings.css';
import { 
  fetchAllChapters, 
  updateChapter, 
  fetchBooksByGrade, 
  fetchGrades, 
  fetchBooks,
  createBook,
  updateBook,
  deleteBook,
  createChapter,
  fetchTokenPackages,
  createTokenPackage,
  updateTokenPackage as updateTokenPackageApi,
  deleteTokenPackage
} from '../../api/adminApi';

const STORAGE_KEY = 'elmino_admin_settings_v1';

const defaultSettings = {
  general: {
    siteName: 'الامینو',
    logoDataUrl: '',
    supportEmail: 'support@example.com',
    supportPhone: '021-12345678',
    maintenanceMode: false,
  },
  monetization: {
    planPrices: { golden: 200000, grade: 120000, chapter: 50000 },
    defaultTokens: 10,
    tokenPackages: [
      { id: 'pkg-100', name: 'بسته ۱۰۰ توکن', tokens: 100, price: 20000 },
      { id: 'pkg-300', name: 'بسته ۳۰۰ توکن', tokens: 300, price: 55000 },
    ],
    wallet: { minDeposit: 5000 },
  },
  content: {
    subjects: ['علوم تجربی'],
    chapters: {
      'علوم تجربی': { '7': 15, '8': 14, '9': 12 },
    },
    requireTeacherGuide: true,
  },
  user: {
    allowRegistration: true,
    defaultRole: 'student',
    enableTeacherApplication: true,
  },
  admin: {
    admins: [
      { id: 'adm-1', email: 'admin@example.com', role: 'owner' },
    ],
    passwordPolicy: { minLength: 8, requireNumber: true, requireSymbol: true },
  },
};

const AdminSettings = () => {
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  // Chapters state
  const [chapters, setChapters] = useState([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null); // {id, title, start_page, end_page}
  const [grades, setGrades] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState('');

  // Book Management state
  const [allBooks, setAllBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [editingBook, setEditingBook] = useState(null); // {id, title, year}
  const [bookToDelete, setBookToDelete] = useState(null);

  // New Book Creation state
  const [newBook, setNewBook] = useState({
    grade_id: '',
    title: '',
    year: new Date().getFullYear(),
    numberOfChapters: 1
  });
  const [creatingBook, setCreatingBook] = useState(false);
  const [bookCreationSuccess, setBookCreationSuccess] = useState(false);

  // Token Packages state
  const [tokenPackages, setTokenPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null); // {id, title, tokens, price}
  const [pkgToDelete, setPkgToDelete] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Load grades on mount
  useEffect(() => {
    loadGrades();
    loadAllBooks();
    loadTokenPackages();
  }, []);

  // Load books when grade changes
  useEffect(() => {
    if (selectedGrade) {
      loadBooks(selectedGrade);
    } else {
      setBooks([]);
      setSelectedBook('');
    }
  }, [selectedGrade]);

  // Load chapters when book changes
  useEffect(() => {
    if (selectedBook) {
      loadChapters(selectedBook);
    } else {
      setChapters([]);
    }
  }, [selectedBook]);

  const loadGrades = async () => {
    try {
      const data = await fetchGrades();
      setGrades(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load grades:', err);
    }
  };

  const loadAllBooks = async () => {
    try {
      setLoadingBooks(true);
      const data = await fetchBooks({ per: 100 });
      setAllBooks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load books:', err);
    } finally {
      setLoadingBooks(false);
    }
  };

  const loadBooks = async (gradeId) => {
    try {
      // Use the admin books endpoint with grade filter for consistency
      const data = await fetchBooks({ grade_id: gradeId, per: 100 });
      console.log('Books loaded for grade', gradeId, ':', data);
      setBooks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load books:', err);
      setBooks([]);
    }
  };

  const loadChapters = async (bookId) => {
    try {
      setLoadingChapters(true);
      const data = await fetchAllChapters({ book_id: bookId, per: 100 });
      setChapters(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load chapters:', err);
      setChapters([]);
    } finally {
      setLoadingChapters(false);
    }
  };

  const handleEditChapter = (chapter) => {
    setEditingChapter({
      id: chapter.id,
      title: chapter.title,
      start_page: chapter.start_page || '',
      end_page: chapter.end_page || '',
    });
  };

  const handleSaveChapter = async () => {
    if (!editingChapter) return;
    try {
      await updateChapter(editingChapter.id, {
        title: editingChapter.title,
        start_page: editingChapter.start_page ? parseInt(editingChapter.start_page) : null,
        end_page: editingChapter.end_page ? parseInt(editingChapter.end_page) : null,
      });
      // Reload chapters
      if (selectedBook) {
        await loadChapters(selectedBook);
      }
      setEditingChapter(null);
    } catch (err) {
      console.error('Failed to update chapter:', err);
      alert('خطا در ذخیره فصل');
    }
  };

  const handleCancelEdit = () => {
    setEditingChapter(null);
  };

  const handleCreateBook = async () => {
    // Validation
    if (!newBook.grade_id || !newBook.title.trim()) {
      alert('لطفاً پایه تحصیلی و عنوان کتاب را وارد کنید');
      return;
    }
    if (newBook.numberOfChapters < 1 || newBook.numberOfChapters > 100) {
      alert('تعداد فصل‌ها باید بین 1 تا 100 باشد');
      return;
    }

    try {
      setCreatingBook(true);
      setBookCreationSuccess(false);

      // Backend will auto-create chapters with Persian titles
      const bookData = {
        grade_id: parseInt(newBook.grade_id),
        subject_id: 1, // Default subject ID (sciences)
        title: newBook.title.trim(),
        year: parseInt(newBook.year),
        numberOfChapters: parseInt(newBook.numberOfChapters)
      };
      
      await createBook(bookData);

      // Success!
      setBookCreationSuccess(true);
      
      // Reload books list
      await loadAllBooks();

      // Reset form
      setNewBook({
        grade_id: '',
        title: '',
        year: new Date().getFullYear(),
        numberOfChapters: 1
      });

      // Show success message
      setTimeout(() => setBookCreationSuccess(false), 3000);

    } catch (err) {
      console.error('Failed to create book:', err);
      const errorMsg = err.response?.data?.message || 'خطا در ایجاد کتاب. لطفاً دوباره تلاش کنید.';
      alert(errorMsg);
    } finally {
      setCreatingBook(false);
    }
  };

  const handleEditBook = (book) => {
    setEditingBook({
      id: book.id,
      title: book.title,
      year: book.year || new Date().getFullYear()
    });
  };

  const handleSaveBook = async () => {
    if (!editingBook) return;
    try {
      await updateBook(editingBook.id, {
        title: editingBook.title,
        year: parseInt(editingBook.year)
      });
      await loadAllBooks();
      setEditingBook(null);
    } catch (err) {
      console.error('Failed to update book:', err);
      alert('خطا در ذخیره کتاب');
    }
  };

  const handleCancelBookEdit = () => {
    setEditingBook(null);
  };

  const handleDeleteBook = async () => {
    if (!bookToDelete) return;
    try {
      await deleteBook(bookToDelete.id);
      await loadAllBooks();
      setBookToDelete(null);
    } catch (err) {
      console.error('Failed to delete book:', err);
      alert('خطا در حذف کتاب');
    }
  };

  // Token Package Functions
  const loadTokenPackages = async () => {
    try {
      setLoadingPackages(true);
      const data = await fetchTokenPackages();
      setTokenPackages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load token packages:', err);
    } finally {
      setLoadingPackages(false);
    }
  };

  const handleAddTokenPackage = async () => {
    try {
      await createTokenPackage({
        title: 'بسته جدید',
        tokens: 100,
        price: 20000
      });
      await loadTokenPackages();
    } catch (err) {
      console.error('Failed to create token package:', err);
      alert('خطا در ایجاد بسته توکن');
    }
  };

  const handleEditPackage = (pkg) => {
    setEditingPackage({
      id: pkg.id,
      title: pkg.title,
      tokens: pkg.tokens,
      price: pkg.price
    });
  };

  const handleSavePackage = async () => {
    if (!editingPackage) return;
    try {
      await updateTokenPackageApi(editingPackage.id, {
        title: editingPackage.title,
        tokens: parseInt(editingPackage.tokens),
        price: parseInt(editingPackage.price)
      });
      await loadTokenPackages();
      setEditingPackage(null);
    } catch (err) {
      console.error('Failed to update token package:', err);
      alert('خطا در ذخیره بسته توکن');
    }
  };

  const handleCancelPackageEdit = () => {
    setEditingPackage(null);
  };

  const handleDeletePackage = async () => {
    if (!pkgToDelete) return;
    try {
      await deleteTokenPackage(pkgToDelete.id);
      await loadTokenPackages();
      setPkgToDelete(null);
    } catch (err) {
      console.error('Failed to delete token package:', err);
      alert('خطا در حذف بسته توکن');
    }
  };

  // Handlers
  const update = (path, value) => {
    setSettings(prev => {
      const clone = structuredClone(prev);
      // path like ['general','siteName']
      let obj = clone;
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
      obj[path[path.length - 1]] = value;
      return clone;
    });
  };

  const handleLogoUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update(['general', 'logoDataUrl'], reader.result);
    reader.readAsDataURL(file);
  };

  // Subject management helpers (for local state)
  const addSubject = () => update(['content', 'subjects'], [...settings.content.subjects, '']);
  const updateSubject = (idx, val) => {
    const copy = [...settings.content.subjects];
    const old = copy[idx];
    copy[idx] = val;
    // preserve chapters mapping when renaming subject
    const chapters = { ...settings.content.chapters };
    if (old && old !== val && chapters[old]) {
      chapters[val] = chapters[old];
      delete chapters[old];
    }
    setSettings(prev => ({ ...prev, content: { ...prev.content, subjects: copy, chapters } }));
  };
  const removeSubject = (idx) => {
    const subj = settings.content.subjects[idx];
    const copy = settings.content.subjects.filter((_, i) => i !== idx);
    const chapters = { ...settings.content.chapters };
    if (chapters[subj]) delete chapters[subj];
    setSettings(prev => ({ ...prev, content: { ...prev.content, subjects: copy, chapters } }));
  };

  const setChapterCount = (subject, grade, count) => {
    setSettings(prev => ({
      ...prev,
      content: {
        ...prev.content,
        chapters: {
          ...prev.content.chapters,
          [subject]: { ...(prev.content.chapters[subject] || {}), [grade]: Math.max(0, Number(count) || 0) },
        },
      },
    }));
  };

  const addAdmin = (email, role) => {
    if (!email) return;
    setSettings(prev => ({
      ...prev,
      admin: {
        ...prev.admin,
        admins: [...prev.admin.admins, { id: 'adm-' + Math.random().toString(36).slice(2,8), email, role: role || 'admin' }],
      },
    }));
  };
  const removeAdmin = (id) => setSettings(prev => ({ ...prev, admin: { ...prev.admin, admins: prev.admin.admins.filter(a => a.id !== id) } }));

  // UI
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('admin');

  const [subjectToDelete, setSubjectToDelete] = useState(null); // { idx, name }
  const [adminToDelete, setAdminToDelete] = useState(null);

  return (
    <div dir="rtl">
      <div className={styles.panelHeader}>
        <h2 className="title-md" style={{ margin: 0 }}>تنظیمات</h2>
      </div>

      <div className="settingsCardGrid">
        {/* General */}
        <div className="settingsCard">
          <div className="settingsCardTitle">تنظیمات عمومی پلتفرم</div>
          <div className="settingsFormGrid">
            <div className="settingsGroup settingsFull">
              <label>نام سایت</label>
              <input type="text" value={settings.general.siteName} onChange={(e) => update(['general','siteName'], e.target.value)} />
            </div>

            <div className="settingsGroup settingsFull">
              <label>لوگو</label>
              <div className="settingsRow">
                <div className="settingsLogoBox">
                  {settings.general.logoDataUrl ? (
                    <img src={settings.general.logoDataUrl} alt="لوگو" />
                  ) : (
                    <span className="text-sm text-muted">{settings.general.siteName?.[0] || 'L'}</span>
                  )}
                </div>
                <input id="logo-file" type="file" accept="image/*" onChange={(e) => handleLogoUpload(e.target.files?.[0])} style={{ display: 'none' }} />
                <label htmlFor="logo-file" className="btn btn-outline">
                  <Upload size={16} />
                  آپلود لوگو
                </label>
                {settings.general.logoDataUrl && (
                  <button className="btn btn-danger" onClick={() => update(['general','logoDataUrl'], '')}>حذف لوگو</button>
                )}
              </div>
            </div>

            <div className="settingsGroup">
              <label>ایمیل پشتیبانی</label>
              <input type="email" value={settings.general.supportEmail} onChange={(e) => update(['general','supportEmail'], e.target.value)} />
            </div>
            <div className="settingsGroup">
              <label>شماره پشتیبانی</label>
              <input type="tel" value={settings.general.supportPhone} onChange={(e) => update(['general','supportPhone'], e.target.value)} />
            </div>

            <div className="settingsGroup settingsFull">
              <label>حالت تعمیرات</label>
              <div className="settingsRow">
                <label className="switch" title="Maintenance Mode">
                  <input type="checkbox" checked={settings.general.maintenanceMode} onChange={(e) => update(['general','maintenanceMode'], e.target.checked)} />
                  <span className="slider"></span>
                </label>
                <span className="settingsTextMuted" style={{ maxWidth: '100%' }}>فعال‌سازی Maintenance Mode</span>
              </div>
            </div>
          </div>
        </div>

        {/* Placeholders for next phases */}
        <div className="settingsCard">
          <div className="settingsCardTitle">تنظیمات درآمدی و مالی</div>
          <div className="settingsFormGrid">
            {/* Subscription plan prices */}
            <div className="settingsGroup">
              <label>قیمت طرح طلایی (تومان)</label>
              <input type="number" value={settings.monetization.planPrices.golden}
                     onChange={(e) => update(['monetization','planPrices','golden'], Number(e.target.value))} />
            </div>
            <div className="settingsGroup">
              <label>قیمت طرح پایه (تومان)</label>
              <input type="number" value={settings.monetization.planPrices.grade}
                     onChange={(e) => update(['monetization','planPrices','grade'], Number(e.target.value))} />
            </div>
            <div className="settingsGroup">
              <label>قیمت طرح فصل (تومان)</label>
              <input type="number" value={settings.monetization.planPrices.chapter}
                     onChange={(e) => update(['monetization','planPrices','chapter'], Number(e.target.value))} />
            </div>

            <div className="settingsGroup settingsFull">
              <hr className="divider" />
            </div>

            {/* Token defaults */}
            <div className="settingsGroup settingsFull">
              <label>توکن اولیه کاربر جدید</label>
              <input type="number" value={settings.monetization.defaultTokens}
                     onChange={(e) => update(['monetization','defaultTokens'], Number(e.target.value))} />
            </div>

            {/* Token packages list */}
            <div className="settingsGroup settingsFull">
              <div className="settingsRow" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <label style={{ margin: 0 }}>بسته‌های خرید توکن</label>
                  <div className="settingsTextMuted">کاربر با خرید هر بسته، به تعداد مشخص توکن دریافت می‌کند. قیمت‌ها به تومان است.</div>
                </div>
                <button type="button" className="btn btn-outline" onClick={handleAddTokenPackage}>
                  <Plus size={16} />
                  افزودن بسته
                </button>
              </div>

              {loadingPackages && <div style={{ textAlign: 'center', padding: '20px' }}>در حال بارگذاری...</div>}

              {/* Token package cards */}
              {!loadingPackages && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', width: '100%', marginTop: '1rem' }}>
                  {tokenPackages.length === 0 && (
                    <div className="settingsTextMuted">هنوز بسته‌ای تعریف نشده است. با کلیک روی «افزودن بسته» شروع کنید.</div>
                  )}
                  {tokenPackages.map((pkg) => (
                    <div key={pkg.id} className="tokenCard">
                      {editingPackage && editingPackage.id === pkg.id ? (
                        // Edit mode
                        <div style={{ padding: '0.5rem' }}>
                          <div className="tokenCardBody" style={{ marginBottom: '1rem' }}>
                            <div className="tokenField">
                              <div className="settingsTextMuted small">نام بسته</div>
                              <input
                                type="text"
                                placeholder="مثلاً: بسته ۱۰۰ توکن"
                                value={editingPackage.title}
                                onChange={(e) => setEditingPackage({...editingPackage, title: e.target.value})}
                              />
                            </div>
                            <div className="tokenField">
                              <div className="settingsTextMuted small">تعداد توکن</div>
                              <input
                                type="number"
                                placeholder="مثلاً: 100"
                                min={1}
                                value={editingPackage.tokens}
                                onChange={(e) => setEditingPackage({...editingPackage, tokens: e.target.value})}
                              />
                            </div>
                            <div className="tokenField">
                              <div className="settingsTextMuted small">قیمت (تومان)</div>
                              <input
                                type="number"
                                placeholder="مثلاً: 20000"
                                min={0}
                                value={editingPackage.price}
                                onChange={(e) => setEditingPackage({...editingPackage, price: e.target.value})}
                              />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-primary" onClick={handleSavePackage}>
                              <Save size={16} />
                              ذخیره
                            </button>
                            <button type="button" className="btn btn-outline" onClick={handleCancelPackageEdit}>
                              <X size={16} />
                              انصراف
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <>
                          <div className="tokenCardHeader">
                            <div style={{ fontWeight: 600 }}>{pkg.title}</div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                type="button"
                                className="btn btn-icon"
                                onClick={() => handleEditPackage(pkg)}
                                title="ویرایش"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-icon"
                                onClick={() => setPkgToDelete(pkg)}
                                title="حذف"
                                style={{ color: '#dc3545' }}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                          <div className="tokenCardBody">
                            <div className="tokenField">
                              <div className="settingsTextMuted small">تعداد توکن</div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{pkg.tokens.toLocaleString()}</div>
                            </div>
                            <div className="tokenField">
                              <div className="settingsTextMuted small">قیمت (تومان)</div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{pkg.price.toLocaleString()}</div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="settingsTextMuted" style={{ marginTop: '0.75rem' }}>توصیه: نام بسته را واضح بنویسید (مثلاً «بسته ۱۰۰ توکن»). قیمت‌ها بدون جداکننده وارد شوند.</div>
            </div>

            <div className="settingsGroup settingsFull">
              <hr className="divider" />
            </div>

            {/* Wallet settings */}
            <div className="settingsGroup settingsFull">
              <label>حداقل واریز کیف پول (تومان)</label>
              <input type="number" value={settings.monetization.wallet.minDeposit}
                     onChange={(e) => update(['monetization','wallet','minDeposit'], Number(e.target.value))} />
            </div>
          </div>
        </div>

        <div className="settingsCard">
          <div className="settingsCardTitle">تنظیمات محتوا و دروس</div>
          <div className="settingsFormGrid">
            

            {/* New Book Creation */}
            <div className="settingsGroup settingsFull">
              <div className="settingsRow" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <label style={{ margin: 0 }}>
                    <BookOpen size={20} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '8px' }} />
                    افزودن کتاب جدید
                  </label>
                  <div className="settingsTextMuted">کتاب جدید را به همراه فصل‌های آن در سیستم ثبت کنید.</div>
                </div>
              </div>

              <div className="newBookForm">
                <div className="formGrid">
                  <div className="formField">
                    <label className="settingsTextMuted small">پایه تحصیلی <span style={{color: '#dc3545'}}>*</span></label>
                    <select 
                      value={newBook.grade_id} 
                      onChange={(e) => setNewBook({...newBook, grade_id: e.target.value})}
                      disabled={creatingBook}
                    >
                      <option value="">-- انتخاب کنید --</option>
                      {grades.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="formField">
                    <label className="settingsTextMuted small">عنوان کتاب <span style={{color: '#dc3545'}}>*</span></label>
                    <input 
                      type="text" 
                      placeholder="مثلاً: علوم تجربی هفتم" 
                      value={newBook.title}
                      onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                      disabled={creatingBook}
                    />
                  </div>

                  <div className="formField">
                    <label className="settingsTextMuted small">سال انتشار</label>
                    <input 
                      type="number" 
                      placeholder="1403" 
                      value={newBook.year}
                      onChange={(e) => setNewBook({...newBook, year: e.target.value})}
                      disabled={creatingBook}
                      min="1300"
                      max="1500"
                    />
                  </div>

                  <div className="formField">
                    <label className="settingsTextMuted small">تعداد فصل‌ها</label>
                    <input 
                      type="number" 
                      placeholder="15" 
                      value={newBook.numberOfChapters}
                      onChange={(e) => setNewBook({...newBook, numberOfChapters: parseInt(e.target.value) || 1})}
                      disabled={creatingBook}
                      min="1"
                      max="100"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleCreateBook}
                    disabled={creatingBook}
                  >
                    {creatingBook ? (
                      <>در حال ایجاد...</>
                    ) : (
                      <>
                        <Plus size={16} />
                        ایجاد کتاب و فصل‌ها
                      </>
                    )}
                  </button>

                  {bookCreationSuccess && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#28a745', fontSize: '14px' }}>
                      <CheckCircle size={18} />
                      <span>کتاب و فصل‌ها با موفقیت ایجاد شدند!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="settingsGroup settingsFull">
              <hr className="divider" />
            </div>

            {/* Book Management */}
            <div className="settingsGroup settingsFull">
              <div className="settingsRow" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <label style={{ margin: 0 }}>مدیریت کتاب‌ها</label>
                  <div className="settingsTextMuted">ویرایش یا حذف کتاب‌های موجود</div>
                </div>
              </div>

              {loadingBooks && <div style={{ textAlign: 'center', padding: '20px' }}>در حال بارگذاری...</div>}

              {!loadingBooks && allBooks.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', marginTop: '1rem' }}>
                  {allBooks.map(book => (
                    <div key={book.id} className="subjectCard">
                      {editingBook && editingBook.id === book.id ? (
                        // Edit mode
                        <div style={{ padding: '0.5rem' }}>
                          <div className="formGrid" style={{ marginBottom: '1rem' }}>
                            <div className="formField">
                              <label className="settingsTextMuted small">عنوان کتاب</label>
                              <input
                                type="text"
                                value={editingBook.title}
                                onChange={(e) => setEditingBook({...editingBook, title: e.target.value})}
                                placeholder="عنوان کتاب"
                              />
                            </div>
                            <div className="formField">
                              <label className="settingsTextMuted small">سال انتشار</label>
                              <input
                                type="number"
                                value={editingBook.year}
                                onChange={(e) => setEditingBook({...editingBook, year: e.target.value})}
                                placeholder="1403"
                                min="1300"
                                max="1500"
                              />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-primary" onClick={handleSaveBook}>
                              <Save size={16} />
                              ذخیره
                            </button>
                            <button type="button" className="btn btn-outline" onClick={handleCancelBookEdit}>
                              <X size={16} />
                              انصراف
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem' }}>
                          <div>
                            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                              {book.title}
                            </div>
                            <div className="settingsTextMuted small">
                              پایه: {book.grade?.name || 'نامشخص'} | سال: {book.year || 'نامشخص'} | تعداد فصل: {book.chapters_cnt || 0}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              type="button"
                              className="btn btn-icon"
                              onClick={() => handleEditBook(book)}
                              title="ویرایش"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-icon"
                              onClick={() => setBookToDelete(book)}
                              title="حذف"
                              style={{ color: '#dc3545' }}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!loadingBooks && allBooks.length === 0 && (
                <div className="settingsTextMuted" style={{ textAlign: 'center', padding: '20px' }}>
                  هیچ کتابی یافت نشد.
                </div>
              )}
            </div>

            <div className="settingsGroup settingsFull">
              <hr className="divider" />
            </div>

            {/* Chapter Editor */}
            <div className="settingsGroup settingsFull">
              <div className="settingsRow" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <label style={{ margin: 0 }}>ویرایش اطلاعات فصل‌ها</label>
                  <div className="settingsTextMuted">نام فصل، صفحه شروع و صفحه پایان هر فصل را مشخص کنید.</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px', minWidth: '150px' }}>
                  <label className="settingsTextMuted small">انتخاب پایه</label>
                  <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
                    <option value="">-- انتخاب کنید --</option>
                    {grades.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: '1 1 200px', minWidth: '150px' }}>
                  <label className="settingsTextMuted small">انتخاب کتاب</label>
                  <select value={selectedBook} onChange={(e) => setSelectedBook(e.target.value)} disabled={!selectedGrade}>
                    <option value="">-- انتخاب کنید --</option>
                    {books.map(b => (
                      <option key={b.id} value={b.id}>{b.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {loadingChapters && <div style={{ textAlign: 'center', padding: '20px' }}>در حال بارگذاری...</div>}
              
              {!loadingChapters && chapters.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                  {chapters.map(chapter => (
                    <div key={chapter.id} className="subjectCard" style={{ border: '1px solid #e0e0e0' }}>
                      {editingChapter && editingChapter.id === chapter.id ? (
                        // Edit mode
                        <div style={{ padding: '1rem' }}>
                          <div className="chapterEditGrid">
                            <div>
                              <label className="settingsTextMuted small">نام فصل</label>
                              <input
                                type="text"
                                value={editingChapter.title}
                                onChange={(e) => setEditingChapter({...editingChapter, title: e.target.value})}
                                placeholder="نام فصل"
                              />
                            </div>
                            <div>
                              <label className="settingsTextMuted small">صفحه شروع</label>
                              <input
                                type="number"
                                value={editingChapter.start_page}
                                onChange={(e) => setEditingChapter({...editingChapter, start_page: e.target.value})}
                                placeholder="مثلاً: 10"
                                min="1"
                              />
                            </div>
                            <div>
                              <label className="settingsTextMuted small">صفحه پایان</label>
                              <input
                                type="number"
                                value={editingChapter.end_page}
                                onChange={(e) => setEditingChapter({...editingChapter, end_page: e.target.value})}
                                placeholder="مثلاً: 25"
                                min="1"
                              />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-primary" onClick={handleSaveChapter}>
                              <Save size={16} />
                              ذخیره
                            </button>
                            <button type="button" className="btn btn-outline" onClick={handleCancelEdit}>
                              <X size={16} />
                              انصراف
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
                          <div>
                            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                              فصل {chapter.number}: {chapter.title}
                            </div>
                            <div className="settingsTextMuted small">
                              {chapter.start_page && chapter.end_page
                                ? `صفحات ${chapter.start_page} تا ${chapter.end_page}`
                                : chapter.start_page
                                ? `از صفحه ${chapter.start_page}`
                                : chapter.end_page
                                ? `تا صفحه ${chapter.end_page}`
                                : 'صفحات تعیین نشده'}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-icon"
                            onClick={() => handleEditChapter(chapter)}
                            title="ویرایش"
                          >
                            <Edit2 size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!loadingChapters && selectedBook && chapters.length === 0 && (
                <div className="settingsTextMuted" style={{ textAlign: 'center', padding: '20px' }}>
                  هیچ فصلی برای این کتاب یافت نشد.
                </div>
              )}

              {!selectedBook && !loadingChapters && (
                <div className="settingsTextMuted" style={{ textAlign: 'center', padding: '20px' }}>
                  لطفاً پایه و کتاب را انتخاب کنید.
                </div>
              )}
            </div>

            <div className="settingsGroup settingsFull">
              <hr className="divider" />
            </div>

            {/* Teacher guide requirement */}
            <div className="settingsGroup settingsFull">
              <label>الزام راهنمای معلم</label>
              <div className="settingsRow">
                <label className="switch" title="نیاز به تایید/راهنمای معلم برای بارگذاری محتوا">
                  <input type="checkbox" checked={!!settings.content.requireTeacherGuide}
                         onChange={(e) => update(['content','requireTeacherGuide'], e.target.checked)} />
                  <span className="slider"></span>
                </label>
                <span className="settingsTextMuted" style={{ maxWidth: '100%' }}>در صورت فعال بودن، انتشار برخی محتواها تنها با تایید/راهنمایی معلم مجاز است.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="settingsCard">
          <div className="settingsCardTitle">تنظیمات کاربران و ثبت‌نام</div>
          <div className="settingsFormGrid">
            <div className="settingsGroup settingsFull">
              <label>فعال‌سازی ثبت‌نام کاربران</label>
              <div className="settingsRow">
                <label className="switch" title="اجازه ثبت‌نام کاربران جدید">
                  <input type="checkbox" checked={!!settings.user.allowRegistration}
                         onChange={(e) => update(['user','allowRegistration'], e.target.checked)} />
                  <span className="slider"></span>
                </label>
                <span className="settingsTextMuted">با غیرفعال کردن، ثبت‌نام کاربران جدید متوقف می‌شود.</span>
              </div>
            </div>

            <div className="settingsGroup">
              <label>نقش پیش‌فرض کاربر جدید</label>
              <select value={settings.user.defaultRole}
                      onChange={(e) => update(['user','defaultRole'], e.target.value)}>
                <option value="student">دانش‌آموز</option>
                <option value="teacher">معلم</option>
              </select>
            </div>

            <div className="settingsGroup settingsFull">
              <label>درخواست معلم شدن</label>
              <div className="settingsRow">
                <label className="switch" title="فعال‌سازی فرم درخواست تبدیل به معلم">
                  <input type="checkbox" checked={!!settings.user.enableTeacherApplication}
                         onChange={(e) => update(['user','enableTeacherApplication'], e.target.checked)} />
                  <span className="slider"></span>
                </label>
                <span className="settingsTextMuted">در صورت فعال‌سازی، کاربران می‌توانند برای نقش معلم شدن درخواست ارسال کنند.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="settingsCard">
          <div className="settingsCardTitle">تنظیمات مدیران و امنیت</div>
          <div className="settingsFormGrid">
            {/* Admins list */}
            <div className="settingsGroup settingsFull">
              <label>مدیران سیستم</label>
              <div className="settingsRow" style={{ gap: '.35rem' }}>
                <input type="email" placeholder="ایمیل مدیر جدید" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                  <option value="admin">مدیر</option>
                  <option value="owner">مالک</option>
                </select>
                <button className="btn btn-primary" type="button" onClick={() => { addAdmin(inviteEmail, inviteRole); setInviteEmail(''); }}>
                  دعوت
                </button>
              </div>
              {settings.admin.admins.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr auto', gap: '.5rem', width: '100%', marginTop: '.5rem' }}>
                  <div className="settingsTextMuted">ایمیل</div>
                  <div className="settingsTextMuted">نقش</div>
                  <div></div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', width: '100%' }}>
                {settings.admin.admins.length === 0 ? (
                  <div style={{ padding: '.75rem', border: '1px dashed var(--border-color)', borderRadius: '12px', background: 'var(--bg-main)' }}>
                    <div className="settingsTextMuted">هیچ مدیری تعریف نشده است. ایمیل مدیر جدید را وارد کرده و روی دکمه «دعوت» کلیک کنید.</div>
                  </div>
                ) : (
                  settings.admin.admins.map(a => (
                    <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr auto', gap: '.5rem', width: '100%' }}>
                      <input type="email" value={a.email} onChange={(e) => setSettings(prev => ({ ...prev, admin: { ...prev.admin, admins: prev.admin.admins.map(x => x.id === a.id ? { ...x, email: e.target.value } : x) } }))} />
                      <select value={a.role} onChange={(e) => setSettings(prev => ({ ...prev, admin: { ...prev.admin, admins: prev.admin.admins.map(x => x.id === a.id ? { ...x, role: e.target.value } : x) } }))}>
                        <option value="admin">مدیر</option>
                        <option value="owner">مالک</option>
                      </select>
                      <button className="btn btn-danger" type="button" onClick={() => setAdminToDelete(a)}>
                        حذف
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="settingsGroup settingsFull">
              <hr className="divider" />
            </div>

            {/* Password policy */}
            <div className="settingsGroup">
              <label>حداقل طول رمز عبور</label>
              <input type="number" min={4} value={settings.admin.passwordPolicy.minLength}
                     onChange={(e) => setSettings(prev => ({ ...prev, admin: { ...prev.admin, passwordPolicy: { ...prev.admin.passwordPolicy, minLength: Math.max(4, Number(e.target.value || 4)) } } }))} />
            </div>
            <div className="settingsGroup">
              <label>الزام عدد در رمز</label>
              <div className="settingsRow">
                <label className="switch" title="وجود حداقل یک عدد">
                  <input type="checkbox" checked={!!settings.admin.passwordPolicy.requireNumber}
                         onChange={(e) => setSettings(prev => ({ ...prev, admin: { ...prev.admin, passwordPolicy: { ...prev.admin.passwordPolicy, requireNumber: e.target.checked } } }))} />
                  <span className="slider"></span>
                </label>
                <span className="settingsTextMuted">کاربران باید حداقل یک عدد در رمز عبور داشته باشند.</span>
              </div>
            </div>
            <div className="settingsGroup">
              <label>الزام نماد در رمز</label>
              <div className="settingsRow">
                <label className="switch" title="وجود حداقل یک نماد مانند !@#">
                  <input type="checkbox" checked={!!settings.admin.passwordPolicy.requireSymbol}
                         onChange={(e) => setSettings(prev => ({ ...prev, admin: { ...prev.admin, passwordPolicy: { ...prev.admin.passwordPolicy, requireSymbol: e.target.checked } } }))} />
                  <span className="slider"></span>
                </label>
                <span className="settingsTextMuted">کاربران باید حداقل یک نماد (مانند !@#) در رمز عبور داشته باشند.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Delete confirmation dialog for token packages */}
      <ConfirmationDialog
        open={!!pkgToDelete}
        onClose={() => setPkgToDelete(null)}
        onConfirm={handleDeletePackage}
        title="حذف بسته توکن"
        message={pkgToDelete ? `آیا از حذف «${pkgToDelete.title || 'بسته بدون نام'}» مطمئن هستید؟ این عمل غیرقابل بازگشت است.` : ''}
        confirmLabel="حذف"
        confirmColor="error"
      />

      {/* Delete confirmation dialog for subjects */}
      <ConfirmationDialog
        open={!!subjectToDelete}
        onClose={() => setSubjectToDelete(null)}
        onConfirm={() => {
          if (subjectToDelete) removeSubject(subjectToDelete.idx);
          setSubjectToDelete(null);
        }}
        title="حذف درس"
        message={subjectToDelete ? `آیا از حذف درس «${subjectToDelete.name || 'بدون نام'}» مطمئن هستید؟` : ''}
        confirmLabel="حذف"
        confirmColor="error"
      />

      {/* Delete confirmation for admin */}
      <ConfirmationDialog
        open={!!adminToDelete}
        onClose={() => setAdminToDelete(null)}
        onConfirm={() => {
          if (adminToDelete) removeAdmin(adminToDelete.id);
          setAdminToDelete(null);
        }}
        title="حذف مدیر"
        message={adminToDelete ? `آیا از حذف دسترسی «${adminToDelete.email}» مطمئن هستید؟` : ''}
        confirmLabel="حذف"
        confirmColor="error"
      />

      {/* Delete confirmation for book */}
      <ConfirmationDialog
        open={!!bookToDelete}
        onClose={() => setBookToDelete(null)}
        onConfirm={handleDeleteBook}
        title="حذف کتاب"
        message={bookToDelete ? `آیا از حذف کتاب «${bookToDelete.title}» مطمئن هستید؟ تمام فصل‌ها و محتوای مرتبط نیز حذف خواهند شد.` : ''}
        confirmLabel="حذف"
        confirmColor="error"
      />
    </div>
  );
};

export default AdminSettings;
