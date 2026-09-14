import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Bold, Italic, Strikethrough, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code, Sigma, Undo, Redo, Link as LinkIcon, Image as ImageIcon, Eraser, Filter as FilterIcon } from 'lucide-react';
import ConfirmationDialog from './ConfirmationDialog';
import styles from './Admin.module.css';
import './adminBase.css';
import './AdminSettings.css';
import './AdminBlogs.css';
import { listPosts, getPost, upsertPost, deletePost, listCategories, upsertCategory, deleteCategory, getBlogSettings, saveBlogSettings } from '../../api/blogStore';
import { http, USE_MOCK } from '../../api/httpClient';
import { fetchAdminPosts, fetchAdminPost } from '../../api/blogApi';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Markdown } from 'tiptap-markdown';
import PostRenderer from '../PostRenderer';
import katex from 'katex';

// Safe helper for KaTeX rendering
const renderKatexSafe = (latex, displayMode = false) => {
  try { return katex.renderToString(latex || '', { throwOnError: false, displayMode: !!displayMode }); } catch (e) { return ''; }
};

// Collapse unintended double backslashes inside math blocks in Markdown
// Example: "$$\\frac{a}{b}$$" -> "$$\frac{a}{b}$$"
const collapseDoubleBackslashesInMath = (md) => {
  if (!md || typeof md !== 'string') return md || '';
  return md.replace(/(\$\$?)([\s\S]*?)(\1)/g, (full, open, inner, close) => {
    // Only convert sequences that start a command (\\letter -> \letter)
    const fixed = inner.replace(/\\\\([A-Za-z])/g, '\\$1');
    return `${open}${fixed}${close}`;
  });
};

// Simple reading stats based on cleaned markdown: words and minutes
const readStats = (md) => {
  const text = (md || '').replace(/`[^`]*`/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  const words = text.split(' ').filter(Boolean).length;
  const wpm = 200; // average reading speed
  const minutes = Math.max(1, Math.ceil(words / wpm));
  return `${words} کلمه · ${minutes} دقیقه`;
};

const Editor = ({ postId, onSaved, onDirtyChange }) => {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingPost, setLoadingPost] = useState(false);
  const [preview, setPreview] = useState(true);
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [mdPreview, setMdPreview] = useState('');
  const [slugError, setSlugError] = useState('');
  const [status, setStatus] = useState('draft'); // draft | published
  const [mdRaw, setMdRaw] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState(null); // snapshot of last saved/loaded
  const [autosaveInfo, setAutosaveInfo] = useState({ available: false, data: null });
  // Upload UI state
  const [uploadingInline, setUploadingInline] = useState(false);
  const [inlineProgress, setInlineProgress] = useState(0);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverProgress, setCoverProgress] = useState(0);
  // Math helper UI (AsciiMath -> LaTeX)
  const [showMath, setShowMath] = useState(false);
  const [mathInput, setMathInput] = useState('');
  const [mathMode, setMathMode] = useState('inline'); // inline | block
  const [mathLatex, setMathLatex] = useState('');
  const [mathHtml, setMathHtml] = useState('');

  const extensions = useMemo(() => [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      bulletList: { keepMarks: true, keepAttributes: false },
      orderedList: { keepMarks: true, keepAttributes: false },
    }),
    Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
    Image,
    Markdown.configure({
      html: false,
      tightLists: true,
      tightListClass: 'tight',
      bulletListMarker: '-',
      linkify: true,
      breaks: false,
    }),
  ], []);

  const prevRawRef = useRef('');

  const editor = useEditor({
    extensions,
    content: '',
    onUpdate: ({ editor }) => {
      const raw = editor.storage?.markdown?.getMarkdown?.() || '';
      // Prevent re-entrant update loops: only update state when content truly changed
      if (raw === prevRawRef.current) return;
      prevRawRef.current = raw;
      const cleaned = collapseDoubleBackslashesInMath(raw);
      setMdRaw(raw);
      setMdPreview(cleaned);
    }
  });

  // Treat input as LaTeX directly + KaTeX HTML preview
  useEffect(() => {
    try {
      const latex = (mathInput || '');
      setMathLatex(latex);
      if (latex) {
        const html = renderKatexSafe(latex, mathMode === 'block');
        setMathHtml(html);
      } else {
        setMathHtml('');
      }
    } catch (e) {
      setMathHtml('');
    }
  }, [mathInput, mathMode]);

  const insertMath = () => {
    if (!editor) return;
    const latex = (mathLatex || '').trim();
    if (!latex) return;
    // Insert LaTeX as-is; we'll normalize any serializer-added escapes before save/preview
    const content = mathMode === 'inline' ? `$${latex}$` : `\n\n$$\n${latex}\n$$\n\n`;
    editor.chain().focus().insertContent(content).run();
    // reset panel
    setShowMath(false);
    setMathInput('');
  };

  useEffect(() => {
    if (!editor) return;
    let cancelled = false;
    const clearAll = () => {
      setTitle(''); setSlug(''); setExcerpt(''); setCoverImage(''); setMdPreview(''); setStatus('draft');
      editor.commands.clearContent(true);
      setMdRaw('');
      setLastSaved({ title: '', excerpt: '', coverImage: '', status: 'draft', markdown: '' });
      setIsDirty(false);
      onDirtyChange && onDirtyChange(false);
      setAutosaveInfo({ available: false, data: null });
    };
    if (!postId) {
      clearAll();
      return;
    }
    (async () => {
      try {
        setLoadingPost(true);
        if (USE_MOCK) {
          const p = getPost(postId);
          if (!p || cancelled) return;
          setTitle(p.title || '');
          setSlug(p.slug || '');
          setExcerpt(p.excerpt || '');
          setCoverImage(p.coverImage || '');
          setStatus(p.status || 'draft');
          const md = p.markdown || '';
          editor.commands.setContent(md, true, { from: 'markdown' });
          setMdRaw(md);
          setMdPreview(collapseDoubleBackslashesInMath(md));
          const snap = { title: p.title || '', excerpt: p.excerpt || '', coverImage: p.coverImage || '', status: p.status || 'draft', markdown: md };
          setLastSaved(snap);
          setIsDirty(false);
          onDirtyChange && onDirtyChange(false);
          // Check autosave availability
          checkAutosaveAvailability(postId, snap);
          return;
        }
  const p = await fetchAdminPost(postId);
  if (cancelled || !p) return;
        setTitle(p.title || '');
        setSlug(p.slug || '');
        setExcerpt(p.excerpt || '');
        setCoverImage(p.coverImage || '');
        setStatus(p.status || 'draft');
        const md = p.content || '';
        editor.commands.setContent(md, true, { from: 'markdown' });
        setMdRaw(md);
        setMdPreview(collapseDoubleBackslashesInMath(md));
        const snap = { title: p.title || '', excerpt: p.excerpt || '', coverImage: p.coverImage || '', status: p.status || 'draft', markdown: md };
        setLastSaved(snap);
        setIsDirty(false);
        onDirtyChange && onDirtyChange(false);
        checkAutosaveAvailability(postId, snap);
      } catch (e) {
        console.error('Failed to load post for editing', e);
        clearAll();
      } finally {
        setLoadingPost(false);
      }
    })();
    return () => { cancelled = true; };
  }, [postId, editor]);

  // Dirty state tracking whenever fields or content change
  useEffect(() => {
    const cur = { title: title || '', excerpt: excerpt || '', coverImage: coverImage || '', status: status || 'draft', markdown: mdRaw || '' };
    const curStr = JSON.stringify(cur);
    const lastStr = JSON.stringify(lastSaved || { title: '', excerpt: '', coverImage: '', status: 'draft', markdown: '' });
    const dirtyNow = curStr !== lastStr;
    setIsDirty(dirtyNow);
    onDirtyChange && onDirtyChange(dirtyNow);
  }, [title, excerpt, coverImage, status, mdRaw, lastSaved, onDirtyChange]);

  // Autosave to localStorage every 10s when dirty
  useEffect(() => {
    const key = autosaveKey(postId);
    const timer = setInterval(() => {
      if (!isDirty) return;
      try {
        const data = { title, excerpt, coverImage, status, markdown: mdPreview, ts: Date.now(), postId: postId || null };
        localStorage.setItem(key, JSON.stringify(data));
        setAutosaveInfo({ available: true, data });
      } catch {}
    }, 10000);
    return () => clearInterval(timer);
  }, [isDirty, title, excerpt, coverImage, status, mdPreview, postId]);

  // Before unload guard
  useEffect(() => {
    const handler = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const autosaveKey = (id) => `blog-autosave:${id ? id : 'new'}`;
  const checkAutosaveAvailability = (id, snap) => {
    try {
      const key = autosaveKey(id);
      const raw = localStorage.getItem(key);
      if (!raw) { setAutosaveInfo({ available: false, data: null }); return; }
      const data = JSON.parse(raw);
      // If autosaved content differs from loaded snapshot, show banner
      const diff = !data || data.markdown !== snap.markdown || data.title !== snap.title || data.excerpt !== snap.excerpt || data.coverImage !== snap.coverImage || (data.status || 'draft') !== snap.status;
      setAutosaveInfo({ available: !!diff, data: data || null });
    } catch { setAutosaveInfo({ available: false, data: null }); }
  };
  const restoreAutosave = () => {
    const data = autosaveInfo.data;
    if (!data || !editor) return;
    setTitle(data.title || '');
    setExcerpt(data.excerpt || '');
    setCoverImage(data.coverImage || '');
    setStatus(data.status || 'draft');
    editor.commands.setContent(data.markdown || '', true, { from: 'markdown' });
    setMdRaw(data.markdown || '');
    setMdPreview(collapseDoubleBackslashesInMath(data.markdown || ''));
    setAutosaveInfo({ available: false, data: null });
  };
  const discardAutosave = () => {
    try { localStorage.removeItem(autosaveKey(postId)); } catch {}
    setAutosaveInfo({ available: false, data: null });
  };

  const toSlug = (s) => (s || '').toString().trim().toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9\-\u0600-\u06FF]+/gi, '')
    .replace(/\-+/g, '-');

  const handleTitle = (v) => { setTitle(v); if (!slug) setSlug(toSlug(v)); };

  const ensureUniqueSlug = (base, currentId) => {
    let s = (base || '').trim() || toSlug(title || '');
    if (!s) s = 'post';
    const all = listPosts();
    const exists = (val) => all.some(p => p.slug === val && p.id !== currentId);
    if (!exists(s)) return s;
    let i = 2;
    while (exists(`${s}-${i}`)) i++;
    return `${s}-${i}`;
  };

  useEffect(() => {
    if (!slug || !slug.trim()) setSlugError('اسلاگ نباید خالی باشد.'); else setSlugError('');
  }, [slug]);

  const insertImageFile = (file) => {
    if (!file || !editor) return;
    // If using mock, embed as base64 so local store can render it. Otherwise upload and insert URL.
    if (USE_MOCK) {
      const reader = new FileReader();
      reader.onload = () => {
        editor.chain().focus().setImage({ src: reader.result, alt: file.name }).run();
      };
      reader.readAsDataURL(file);
      return;
    }

    // Upload to server and insert returned URL
    (async () => {
      try {
        setUploadingInline(true);
        setInlineProgress(0);
        const fd = new FormData();
        fd.append('file', file);
        const upl = await http.post('/v1/admin/blog/uploads', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            if (!e) return;
            const total = e.total || (e.progress ? e.loaded / e.progress : 0);
            const percent = total ? Math.min(100, Math.round((e.loaded / total) * 100)) : (e.progress ? Math.round(e.progress * 100) : 0);
            if (!Number.isNaN(percent)) setInlineProgress(percent);
          }
        });
        const url = upl?.data?.data?.url ?? upl?.data?.url ?? null;
        if (url) {
          editor.chain().focus().setImage({ src: url, alt: file.name }).run();
          // ensure markdown preview is updated immediately
          try {
            const mdNow = editor.storage?.markdown?.getMarkdown?.() || '';
            setMdPreview(mdNow);
          } catch (e) {}
        } else {
          console.warn('Upload succeeded but no URL returned');
        }
      } catch (err) {
        console.error('Image upload failed', err);
        // fallback to base64 so the user still sees the image
        try {
          const reader = new FileReader();
          reader.onload = () => {
            editor.chain().focus().setImage({ src: reader.result, alt: file.name }).run();
            try { const mdNow = editor.storage?.markdown?.getMarkdown?.() || ''; setMdPreview(mdNow); } catch (e) {}
          };
          reader.readAsDataURL(file);
        } catch (e) {}
      } finally {
        setUploadingInline(false);
        setInlineProgress(0);
      }
    })();
  };

  const handleCoverUpload = (file) => {
    if (!file) return;
    // If mock, keep base64 preview and store file for later save
    if (USE_MOCK) {
      const reader = new FileReader();
      reader.onload = () => setCoverImage(reader.result);
      reader.readAsDataURL(file);
      setCoverFile(file);
      return;
    }

    // Upload immediately and use returned URL as cover
    (async () => {
      try {
        setUploadingCover(true);
        setCoverProgress(0);
        const fd = new FormData();
        fd.append('file', file);
        const upl = await http.post('/v1/admin/blog/uploads', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            if (!e) return;
            const total = e.total || (e.progress ? e.loaded / e.progress : 0);
            const percent = total ? Math.min(100, Math.round((e.loaded / total) * 100)) : (e.progress ? Math.round(e.progress * 100) : 0);
            if (!Number.isNaN(percent)) setCoverProgress(percent);
          }
        });
        const url = upl?.data?.data?.url ?? upl?.data?.url ?? null;
        if (url) {
          setCoverImage(url);
          setCoverFile(null);
        } else {
          // fallback to base64 preview
          const reader = new FileReader();
          reader.onload = () => setCoverImage(reader.result);
          reader.readAsDataURL(file);
          setCoverFile(file);
        }
      } catch (err) {
        console.error('Cover upload failed', err);
        const reader = new FileReader();
        reader.onload = () => setCoverImage(reader.result);
        reader.readAsDataURL(file);
        setCoverFile(file);
      } finally {
        setUploadingCover(false);
        // if success and we reached 100, keep it; otherwise reset
        setCoverProgress(0);
      }
    })();
  };

  const handleSave = async () => {
    if (!editor) return;
    setSaving(true);
    try {
      const rawMd = editor.storage?.markdown?.getMarkdown?.() || '';
      const markdown = collapseDoubleBackslashesInMath(rawMd);
      const baseSlug = slug?.trim() || toSlug(title || '');
      const uniqueSlug = ensureUniqueSlug(baseSlug, postId);

      // If using mock mode, keep local behavior
      if (USE_MOCK) {
        const saved = upsertPost({ id: postId, title: title?.trim() || 'بدون عنوان', slug: uniqueSlug, markdown, excerpt, coverImage, status });
        onSaved && onSaved(saved);
        return;
      }

      // If there's a cover file (not yet uploaded), upload it first
      let coverUrl;
      if (coverFile) {
        const fd = new FormData();
        fd.append('file', coverFile);
        const upl = await http.post('/v1/admin/blog/uploads', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        coverUrl = upl?.data?.data?.url ?? upl?.data?.url ?? null;
      } else if (coverImage && /^https?:\/\//i.test(coverImage)) {
        coverUrl = coverImage;
      } else if (!coverImage) {
        // User removed the cover; send explicit null to clear on backend
        coverUrl = null;
      }

      // Let backend generate/ensure slug; omit slug and empty cover field
      const payload = {
        title: title?.trim() || 'بدون عنوان',
        content: markdown,
        excerpt,
        ...(coverUrl !== undefined ? { cover_image_url: coverUrl } : {}),
        status,
      };

      let resp;
      if (postId) {
        resp = await http.put(`/v1/admin/blog-posts/${postId}`, payload);
      } else {
        resp = await http.post('/v1/admin/blog-posts', payload);
      }

      const saved = resp?.data?.data ?? resp?.data;
      onSaved && onSaved(saved);
      // Update lastSaved snapshot and dirty state, clear autosave
      const snap = { title: title?.trim() || 'بدون عنوان', excerpt, coverImage: coverUrl !== undefined ? (coverUrl ?? '') : coverImage, status, markdown };
      setLastSaved(snap);
      setIsDirty(false);
      onDirtyChange && onDirtyChange(false);
      try { localStorage.removeItem(autosaveKey(postId)); } catch {}
    } finally { setSaving(false); }
  };

  return (
    <div className="settingsCard">
      <div className="settingsCardTitle">ویرایش پست</div>
      <div className="settingsFormGrid">
        <div className="settingsGroup settingsFull">
          <label>عنوان</label>
          <input type="text" value={title} onChange={(e) => handleTitle(e.target.value)} />
        </div>
        <div className="settingsGroup settingsFull">
          <label>اسلاگ</label>
          <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="مثلاً: how-to-study-better" />
          {slugError && <div className="settingsTextMuted" style={{ color: 'var(--danger, #dc3545)' }}>{slugError}</div>}
        </div>

        <div className="settingsGroup settingsFull">
          <label>وضعیت</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="draft">پیش‌نویس</option>
            <option value="published">منتشر شده</option>
          </select>
        </div>

        <div className="settingsGroup settingsFull">
          <label>محتوا (ویرایشگر دیداری)</label>
          {autosaveInfo.available && (
            <div className="autosaveBanner" role="alert">
              <div>پیش‌نویس ذخیره‌شده پیدا شد.</div>
              <div className="autosaveActions">
                <button className="btn btn-outline" type="button" onClick={restoreAutosave}>بازگردانی</button>
                <button className="btn btn-ghost" type="button" onClick={discardAutosave}>نادیده گرفتن</button>
              </div>
            </div>
          )}
          <div className="blogToolbar settingsRow">
            <button type="button" className="btn btn-outline" onClick={() => editor?.chain().focus().toggleBold().run()} title="بولد"><Bold size={16} /></button>
            <button type="button" className="btn btn-outline" onClick={() => editor?.chain().focus().toggleItalic().run()} title="ایتالیک"><Italic size={16} /></button>
            <button type="button" className="btn btn-outline" onClick={() => editor?.chain().focus().toggleStrike().run()} title="خط‌خورده"><Strikethrough size={16} /></button>
            <span style={{ width: 8 }} />
            {/* Math (LaTeX) helper */}
            <button
              type="button"
              className={`btn btn-outline ${showMath ? 'active' : ''}`}
              onClick={() => setShowMath(v => !v)}
              title="فرمول (LaTeX)"
            >
              <Sigma size={16} />
            </button>
            <span style={{ width: 8 }} />
            <button type="button" className="btn btn-outline" onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1"><Heading1 size={16} /></button>
            <button type="button" className="btn btn-outline" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2"><Heading2 size={16} /></button>
            <button type="button" className="btn btn-outline" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3"><Heading3 size={16} /></button>
            <span style={{ width: 8 }} />
            <button type="button" className="btn btn-outline" onClick={() => editor?.chain().focus().toggleBulletList().run()} title="Bullet List"><List size={16} /></button>
            <button type="button" className="btn btn-outline" onClick={() => editor?.chain().focus().toggleOrderedList().run()} title="Ordered List"><ListOrdered size={16} /></button>
            <button type="button" className="btn btn-outline" onClick={() => editor?.chain().focus().toggleBlockquote().run()} title="Quote"><Quote size={16} /></button>
            <button type="button" className="btn btn-outline" onClick={() => editor?.chain().focus().toggleCodeBlock().run()} title="Code Block"><Code size={16} /></button>
            <span style={{ width: 8 }} />
            <button type="button" className="btn btn-outline" onClick={() => {
              const url = prompt('آدرس لینک را وارد کنید:');
              if (url) editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
            }} title="Link"><LinkIcon size={16} /></button>
            <label className={`btn btn-outline ${uploadingInline ? 'isDisabled' : ''}`} title="Insert Image" style={{ cursor: uploadingInline ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}>
              <ImageIcon size={16} />
              <span>تصویر</span>
              {uploadingInline && (
                <span className="uploadHint">آپلود: {inlineProgress}%</span>
              )}
              <input type="file" accept="image/*" disabled={uploadingInline} onChange={(e) => insertImageFile(e.target.files?.[0])} style={{ display: 'none' }} />
            </label>
            <span style={{ width: 8 }} />
            <button type="button" className="btn btn-outline" onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()} title="پاک‌سازی"><Eraser size={16} /></button>
            <button type="button" className="btn btn-outline" onClick={() => editor?.chain().focus().undo().run()} title="Undo"><Undo size={16} /></button>
            <button type="button" className="btn btn-outline" onClick={() => editor?.chain().focus().redo().run()} title="Redo"><Redo size={16} /></button>
            <div style={{ flex: 1 }} />
            <div className="settingsRow">
              <span className="settingsTextMuted">پیش‌نمایش Markdown</span>
              <label className="switch" title="نمایش پیش‌نمایش Markdown">
                <input type="checkbox" checked={preview} onChange={(e) => setPreview(e.target.checked)} />
                <span className="slider"></span>
              </label>
              <span className="settingsTextMuted" style={{ marginInlineStart: '.5rem' }}>{readStats(mdPreview)}</span>
            </div>
          </div>
          {showMath && (
            <div className="mathPanel" role="dialog" aria-label="درج فرمول">
              <div className="mathPanelRow">
                <div className="mathPanelLabel">فرمول (LaTeX):</div>
                <input
                  dir="ltr"
                  type="text"
                  className="mathInput"
                  placeholder="مثلاً: \\frac{a}{b} یا \\int_{0}^{1} x^2 \\mathrm{d}x"
                  value={mathInput}
                  onChange={(e) => setMathInput(e.target.value)}
                />
              </div>
              <div className="mathPanelRow">
                <div className="mathModeToggle" role="group" aria-label="حالت نمایش">
                  <label className={`chip ${mathMode === 'inline' ? 'active' : ''}`}>
                    <input type="radio" name="math-mode" value="inline" checked={mathMode === 'inline'} onChange={() => setMathMode('inline')} />
                    درون‌خطی
                  </label>
                  <label className={`chip ${mathMode === 'block' ? 'active' : ''}`}>
                    <input type="radio" name="math-mode" value="block" checked={mathMode === 'block'} onChange={() => setMathMode('block')} />
                    بلوکی
                  </label>
                </div>
                <div className="mathQuick" aria-label="میانبرها">
                  {['\\frac{a}{b}', '\\sqrt{x}', '\\alpha', '\\beta', '\\theta', '\\pi', '\\sum_{i=1}^{n}', '\\int_{0}^{1}', '\\cdot'].map(s => (
                    <button key={s} type="button" className="chip" onClick={() => setMathInput(m => (m ? `${m} ${s}` : s))}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="mathPanelRow">
                <div className="mathPanelCol">
                  <div className="mathPanelSub">LaTeX:</div>
                  <div className="mathLatexBox">{mathLatex || '—'}</div>
                </div>
                <div className="mathPanelCol">
                  <div className="mathPanelSub">پیش‌نمایش:</div>
                  <div className="mathPreview" dangerouslySetInnerHTML={{ __html: mathHtml || '<span class="settingsTextMuted">—</span>' }} />
                </div>
              </div>
              <div className="mathPanelActions">
                <button className="btn btn-primary" type="button" disabled={!mathLatex} onClick={insertMath}>درج</button>
                <button className="btn btn-outline" type="button" onClick={() => setShowMath(false)}>بستن</button>
              </div>
            </div>
          )}
          <div className={preview ? 'blogEditorSplit' : ''}>
            <div className="blogEditorBox">
              <EditorContent editor={editor} />
                {loadingPost && (
                <div className="editorLoadingOverlay" aria-hidden>
                  <div className="editorLoadingInner">
                    <div className="editorLoadingText">در حال بارگذاری پست…</div>
                    <div className="editorLoadingBar" role="progressbar" aria-busy="true" aria-label="loading" />
                  </div>
                </div>
              )}
                {uploadingInline && (
                  <div className="inlineUploadBanner" role="status">
                    <div className="inlineUploadText">در حال آپلود تصویر…</div>
                    <div className="inlineUploadProgress" aria-hidden style={{ ['--p']: `${inlineProgress}%` }}>
                      <span style={{ display: 'block', height: '100%', width: `${inlineProgress}%`, background: 'linear-gradient(90deg, rgba(255,255,255,0.22), rgba(255,255,255,0.5))', transition: 'width .18s linear' }}></span>
                    </div>
                  </div>
                )}
            </div>
            {preview && (
              <div className="blogPreviewBox">
                <PostRenderer markdown={mdPreview} />
              </div>
            )}
          </div>
        </div>

        <div className="settingsGroup settingsFull">
          <label>خلاصه (Excerpt)</label>
          <textarea rows={3} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="چند جمله کوتاه درباره این پست..." />
        </div>

        <div className="settingsGroup settingsFull">
          <label>تصویر کاور</label>
          <div className="settingsRow">
            <div className="blogCoverBox uploadable">
              {coverImage ? <img src={coverImage} alt="کاور" /> : <span className="settingsTextMuted">بدون تصویر</span>}
              {uploadingCover && (
                <div className="uploadOverlay">
                  <div className="uploadText">در حال آپلود... {coverProgress}%</div>
                </div>
              )}
            </div>
            <input id="cover-file" type="file" accept="image/*" disabled={uploadingCover} onChange={(e) => handleCoverUpload(e.target.files?.[0])} style={{ display: 'none' }} />
            <label htmlFor="cover-file" className={`btn btn-outline ${uploadingCover ? 'isDisabled' : ''}`}>{uploadingCover ? 'در حال آپلود...' : 'آپلود کاور'}</label>
            {coverImage && <button className="btn btn-danger" type="button" onClick={() => { setCoverImage(''); setCoverFile(null); }}>حذف</button>}
          </div>
        </div>

        <div className="settingsGroup settingsFull">
            <div className="settingsRow" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || uploadingInline || uploadingCover || loadingPost || !editor}>{saving ? 'در حال ذخیره…' : 'ذخیره'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminBlogs = () => {
  const [version, setVersion] = useState(0);
  const [currentId, setCurrentId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [navConfirm, setNavConfirm] = useState(null); // { action, payload }
  const [dirty, setDirty] = useState(false);
  const [isNarrow, setIsNarrow] = useState(() => {
    try { return window.innerWidth <= 700; } catch { return false; }
  });
  const [activeTab, setActiveTab] = useState('editor'); // editor | posts | categories | settings
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); // newest | oldest | title-az | title-za
  const [flash, setFlash] = useState(null); // { type: 'success'|'error', msg: string }
  // Auto-hide/dismissible flash
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 4000);
    return () => clearTimeout(t);
  }, [flash]);
  const [highlightId, setHighlightId] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // list | cards
  const [filters, setFilters] = useState({
    status: 'all', // all | draft | published
    category: 'all', // slug or 'all'
    author: '',
    hasCover: false,
    hasExcerpt: false,
    dateFrom: '', // yyyy-mm-dd
    dateTo: '',   // yyyy-mm-dd
    tags: ''      // comma-separated
  });

  const [posts, setPosts] = useState(() => USE_MOCK ? listPosts() : []);
  const requestNav = requestNavFactory(dirty, setNavConfirm, setActiveTab, setCurrentId);

  // Track viewport width to force card view on small screens
  useEffect(() => {
    const onResize = () => {
      try { setIsNarrow(window.innerWidth <= 700); } catch {}
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // load admin posts from backend when not using mock
  useEffect(() => {
    let mounted = true;
    if (USE_MOCK) {
      setPosts(listPosts());
      return;
    }
    const load = async () => {
      try {
        const res = await fetchAdminPosts({ page: 1, per_page: 200 });
        if (!mounted) return;
        setPosts(res.items || []);
      } catch (err) {
        console.error('Failed to load admin posts', err);
      }
    };
    load();
    return () => { mounted = false; };
  }, [version]);

  const filteredSorted = useMemo(() => {
    const arr = posts.filter(p => {
      // Status
      if (filters.status !== 'all' && (p.status || 'draft') !== filters.status) return false;
      // Category
      if (filters.category !== 'all' && (p.category || '') !== filters.category) return false;
      // Author
      if (filters.author && !(p.author || '').toLowerCase().includes(filters.author.toLowerCase())) return false;
      // Has cover / excerpt
      if (filters.hasCover && !(p.coverImage && p.coverImage.length > 0)) return false;
      if (filters.hasExcerpt && !(p.excerpt && p.excerpt.trim().length > 0)) return false;
      // Date range
      const created = p.createdAt ? new Date(p.createdAt) : null;
      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom + 'T00:00:00');
        if (!created || created < from) return false;
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo + 'T23:59:59');
        if (!created || created > to) return false;
      }
      // Tags
      if (filters.tags.trim()) {
        const wanted = filters.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        const have = Array.isArray(p.tags) ? p.tags.map(t => (t||'').toLowerCase()) : [];
        const any = wanted.length === 0 || wanted.some(t => have.includes(t));
        if (!any) return false;
      }
      // Search
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (p.title || '').toLowerCase().includes(q) || (p.slug || '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'newest' || sortBy === 'oldest') {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return sortBy === 'newest' ? db - da : da - db;
      }
      const ta = (a.title || '').toLocaleLowerCase();
      const tb = (b.title || '').toLocaleLowerCase();
      if (ta < tb) return sortBy === 'title-az' ? -1 : 1;
      if (ta > tb) return sortBy === 'title-az' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [posts, filters, query, sortBy]);

  useEffect(() => {
    // Only validate currentId against local mock store when in mock mode.
    if (!USE_MOCK) return;
    if (currentId && !getPost(currentId)) setCurrentId(null);
  }, [version, currentId]);

  const tabTitle = {
    editor: 'ویرایشگر',
    posts: 'پست‌ها',
    categories: 'دسته‌بندی‌ها',
    settings: 'تنظیمات وبلاگ'
  }[activeTab] || 'وبلاگ';

  return (
    <div dir="rtl" className="blogRoot">
      <div className={styles.panelHeader} style={{ alignItems: 'flex-start' }}>
        <h2 className="title-md blogHeaderTitle" style={{ margin: 0 }}>{tabTitle}</h2>
      </div>

      <div className="blogTabs" role="tablist" aria-label="Blog sections">
        <button className={`blogTab ${activeTab === 'editor' ? 'active' : ''}`} role="tab" aria-selected={activeTab==='editor'} onClick={() => requestNav({ action: 'tab', payload: 'editor' })}>ویرایشگر</button>
        <button className={`blogTab ${activeTab === 'posts' ? 'active' : ''}`} role="tab" aria-selected={activeTab==='posts'} onClick={() => requestNav({ action: 'tab', payload: 'posts' })}>پست‌ها</button>
        <button className={`blogTab ${activeTab === 'categories' ? 'active' : ''}`} role="tab" aria-selected={activeTab==='categories'} onClick={() => requestNav({ action: 'tab', payload: 'categories' })}>دسته‌بندی‌ها</button>
        <button className={`blogTab ${activeTab === 'settings' ? 'active' : ''}`} role="tab" aria-selected={activeTab==='settings'} onClick={() => requestNav({ action: 'tab', payload: 'settings' })}>تنظیمات وبلاگ</button>
      </div>

      <div className="blogSection">
        {activeTab === 'editor' && (
          <Editor
            postId={currentId}
            onDirtyChange={setDirty}
            onSaved={(saved) => {
              setVersion(v => v + 1);
              if (saved && saved.id) {
                setCurrentId(saved.id);
                setActiveTab('posts');
                setHighlightId(saved.id);
                setFlash({ type: 'success', msg: `پست «${saved.title || 'بدون عنوان'}» ذخیره شد.` });
              } else {
                setFlash({ type: 'success', msg: 'پست ذخیره شد.' });
                setActiveTab('posts');
              }
            }}
          />
        )}

        {activeTab === 'posts' && (
          <div className="settingsCard blogListCard">
            <div className="settingsCardTitle">پست‌ها</div>
            {flash && (
              <div className={`blogFlash ${flash.type === 'success' ? 'success' : 'error'}`} role="status">
                <div className="blogFlashContainer">
                  <div>{flash.msg}</div>
                  <div>
                    <button className="flashClose" aria-label="بستن" onClick={() => setFlash(null)}>×</button>
                  </div>
                </div>
              </div>
            )}

            {/* Search + Actions */}
            <div className="settingsRow blogListToolbar" style={{ justifyContent: 'space-between', gap: '.5rem', flexWrap: 'wrap' }}>
              <div className="settingsGroup" style={{ flex: 1, minWidth: '200px' }}>
                <input type="text" placeholder="جستجو در عنوان یا اسلاگ" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <div className="settingsGroup">
                <select aria-label="مرتب‌سازی" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="newest">جدیدترین</option>
                  <option value="oldest">قدیمی‌ترین</option>
                  <option value="title-az">عنوان (الف→ی)</option>
                  <option value="title-za">عنوان (ی→الف)</option>
                </select>
              </div>
              <div className="settingsRow" style={{ gap: '.5rem', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-outline"
                  aria-expanded={filtersOpen}
                  aria-controls="blog-post-filters"
                  onClick={() => setFiltersOpen(v => !v)}
                >
                  <FilterIcon size={16} /> فیلترها
                </button>
                <div className="blogViewToggle settingsRow" role="group" aria-label="نمایش">
                  <button className={`btn btn-outline ${viewMode === 'list' ? 'active' : ''}`} aria-pressed={viewMode==='list'} onClick={() => setViewMode('list')}>لیست</button>
                  <button className={`btn btn-outline ${viewMode === 'cards' ? 'active' : ''}`} aria-pressed={viewMode==='cards'} onClick={() => setViewMode('cards')}>کارت‌ها</button>
                </div>
                <button className="btn btn-outline" onClick={() => requestNav({ action: 'new' })}><Plus size={16} /> پست جدید</button>
              </div>
            </div>

            {/* Filters dropdown below actions */}
            <div id="blog-post-filters" className={`blogFiltersCollapse ${filtersOpen ? 'open' : ''}`} aria-hidden={!filtersOpen}>
              <div className="blogFiltersBox settingsFormGrid">
                <div className="settingsGroup">
                  <label>وضعیت</label>
                  <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                    <option value="all">همه</option>
                    <option value="draft">پیش‌نویس</option>
                    <option value="published">منتشر شده</option>
                  </select>
                </div>
                <div className="settingsGroup">
                  <label>دسته‌بندی</label>
                  <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                    <option value="all">همه</option>
                    {listCategories().map(c => (
                      <option key={c.id} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="settingsGroup">
                  <label>نویسنده</label>
                  <input type="text" placeholder="مثلاً: admin" value={filters.author} onChange={(e) => setFilters({ ...filters, author: e.target.value })} />
                </div>
                <div className="settingsGroup settingsFull">
                  <div className="settingsRow" style={{ gap: '.75rem', flexWrap: 'wrap' }}>
                    <label className="switch" title="دارای کاور">
                      <input type="checkbox" checked={filters.hasCover} onChange={(e) => setFilters({ ...filters, hasCover: e.target.checked })} />
                      <span className="slider"></span>
                    </label>
                    <span>دارای تصویر کاور</span>
                    <label className="switch" title="دارای خلاصه">
                      <input type="checkbox" checked={filters.hasExcerpt} onChange={(e) => setFilters({ ...filters, hasExcerpt: e.target.checked })} />
                      <span className="slider"></span>
                    </label>
                    <span>دارای خلاصه</span>
                  </div>
                </div>
                <div className="settingsGroup">
                  <label>از تاریخ</label>
                  <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />
                </div>
                <div className="settingsGroup">
                  <label>تا تاریخ</label>
                  <input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} />
                </div>
                <div className="settingsGroup">
                  <label>برچسب‌ها</label>
                  <input type="text" placeholder="مثلاً: physics,study" value={filters.tags} onChange={(e) => setFilters({ ...filters, tags: e.target.value })} />
                </div>
                <div className="settingsGroup" style={{ alignSelf: 'end' }}>
                  <button className="btn btn-outline" type="button" onClick={() => setFilters({ status: 'all', category: 'all', author: '', hasCover: false, hasExcerpt: false, dateFrom: '', dateTo: '', tags: '' })}>پاک‌سازی فیلترها</button>
                </div>
              </div>
            </div>

            {posts.length === 0 ? (
              <div className="settingsTextMuted blogEmpty">هنوز پستی وجود ندارد. روی «پست جدید» کلیک کنید.</div>
            ) : (
              <>
                {(isNarrow ? 'cards' : viewMode) === 'list' && (
                  <div className="blogList">
                    {filteredSorted.map(p => {
                  const formatDT = (iso) => {
                    if (!iso) return '—';
                    try { return new Date(iso).toLocaleString('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return iso; }
                  };
                  const cat = (slug => {
                    const c = listCategories().find(x => x.slug === slug);
                    return c ? c.name : '';
                  })(p.category || '');
                  return (
                    <div
                      key={p.id}
                      className={`settingsRow blogRow ${highlightId === p.id ? 'highlight' : ''}`}
                      onAnimationEnd={() => { if (highlightId === p.id) setHighlightId(null); }}
                      onClick={() => requestNav({ action: 'open', payload: p.id })}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') requestNav({ action: 'open', payload: p.id }); }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flex: 1, minWidth: 0 }}>
                        <div className="blogRowThumb" aria-hidden="true">
                          {p.coverImage ? <img src={p.coverImage} alt="" /> : <span className="settingsTextMuted">پست</span>}
                        </div>
                        <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', flex: 1, minWidth: 0 }} onClick={(e) => { e.stopPropagation(); requestNav({ action: 'open', payload: p.id }); }}>
                          <div className="blogRowTitle">{p.title || 'بدون عنوان'}</div>
                          <div className="blogRowMeta">
                            <span>آخرین ویرایش: {formatDT(p.updatedAt || p.createdAt)}</span>
                            {p.slug ? <span>اسلاگ: /{p.slug}</span> : null}
                            <span>وضعیت: {(p.status || 'draft') === 'published' ? 'منتشر شده' : 'پیش‌نویس'}</span>
                            {cat ? <span>دسته: {cat}</span> : null}
                          </div>
                        </button>
                      </div>
                      <button className="btn btn-icon" title="حذف" onClick={(e) => { e.stopPropagation(); setToDelete(p); }} style={{ color: '#dc3545' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                    })}
                  </div>
                )}
                {(isNarrow ? 'cards' : viewMode) === 'cards' && (
                  <div className="blogCardGrid">
                    {filteredSorted.map(p => {
                      const formatDT = (iso) => {
                        if (!iso) return '—';
                        try { return new Date(iso).toLocaleString('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return iso; }
                      };
                      const cat = (slug => {
                        const c = listCategories().find(x => x.slug === slug);
                        return c ? c.name : '';
                      })(p.category || '');
                      return (
                        <div
                          key={p.id}
                          className={`blogCard ${highlightId === p.id ? 'highlight' : ''}`}
                          onAnimationEnd={() => { if (highlightId === p.id) setHighlightId(null); }}
                          onClick={() => requestNav({ action: 'open', payload: p.id })}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter') requestNav({ action: 'open', payload: p.id }); }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="blogCardCover">
                            {p.coverImage ? <img src={p.coverImage} alt="" /> : <div className="blogCardCoverEmpty">بدون تصویر</div>}
                          </div>
                          <div className="blogCardBody">
                            <div className="blogCardTitle">{p.title || 'بدون عنوان'}</div>
                            {p.excerpt ? <div className="blogCardExcerpt">{p.excerpt}</div> : null}
                            <div className="blogCardMeta">
                              <span>{formatDT(p.updatedAt || p.createdAt)}</span>
                              {p.slug ? <span>/{p.slug}</span> : null}
                              {cat ? <span>{cat}</span> : null}
                              <span className={`statusBadge ${ (p.status||'draft') === 'published' ? 'published' : 'draft'}`}>{(p.status||'draft') === 'published' ? 'منتشر شده' : 'پیش‌نویس'}</span>
                            </div>
                            <div className="blogCardActions">
                              <button className="btn btn-icon" title="حذف" onClick={(e) => { e.stopPropagation(); setToDelete(p); }} style={{ color: '#dc3545' }}>
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <CategoriesPanel />
        )}

        {activeTab === 'settings' && (
          <BlogSettingsPanel />
        )}
      </div>

      <ConfirmationDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          try {
            if (!toDelete) return;
            if (USE_MOCK) {
              deletePost(toDelete.id);
            } else {
              await http.delete(`/v1/admin/blog-posts/${toDelete.id}`);
            }
            setFlash({ type: 'success', msg: 'پست حذف شد.' });
          } catch (e) {
            console.error('Delete post failed', e);
            setFlash({ type: 'error', msg: 'حذف پست ناموفق بود.' });
          } finally {
            setToDelete(null);
            setVersion(v => v + 1);
          }
        }}
        title="حذف پست"
        message={toDelete ? `آیا از حذف «${toDelete.title || 'بدون عنوان'}» مطمئن هستید؟` : ''}
        confirmLabel="حذف"
        confirmColor="error"
      />

      <ConfirmationDialog
        open={!!navConfirm}
        onClose={() => setNavConfirm(null)}
        onConfirm={() => {
          if (!navConfirm) return;
          const { action, payload } = navConfirm;
          if (action === 'tab') setActiveTab(payload);
          if (action === 'new') { setCurrentId(null); setActiveTab('editor'); }
          if (action === 'open') { setCurrentId(payload); setActiveTab('editor'); }
          setNavConfirm(null);
          setDirty(false);
        }}
        title="خروج بدون ذخیره؟"
        message="تغییرات ذخیره نشده‌ای دارید. آیا مطمئنید می‌خواهید خارج شوید؟"
        confirmLabel="خروج"
        confirmColor="error"
      />
    </div>
  );
};

export default AdminBlogs;

// Navigation guard helper
function requestNavFactory(dirty, setNavConfirm, setActiveTab, setCurrentId) {
  return ({ action, payload }) => {
    if (dirty) { setNavConfirm({ action, payload }); return; }
    if (action === 'tab') setActiveTab(payload);
    if (action === 'new') { setCurrentId(null); setActiveTab('editor'); }
    if (action === 'open') { setCurrentId(payload); setActiveTab('editor'); }
  };
}

// Categories Panel
const CategoriesPanel = () => {
  const [cats, setCats] = useState(() => listCategories());
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [view, setView] = useState('list'); // list | cards

  const toSlug = (s) => (s || '').toString().trim().toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9\-\u0600-\u06FF]+/gi, '')
    .replace(/\-+/g, '-');

  const resetForm = () => { setName(''); setSlug(''); setEditing(null); };
  const refresh = () => setCats(listCategories());

  const save = () => {
    const baseSlug = (slug || toSlug(name || '')).trim();
    if (!name.trim()) return;
    // ensure unique slug
    const all = cats;
    const exists = (val, id) => all.some(c => c.slug === val && c.id !== id);
    let finalSlug = baseSlug || 'cat';
    if (exists(finalSlug, editing?.id)) {
      let i = 2;
      while (exists(`${finalSlug}-${i}`, editing?.id)) i++;
      finalSlug = `${finalSlug}-${i}`;
    }
    upsertCategory({ id: editing?.id, name: name.trim(), slug: finalSlug });
    refresh();
    resetForm();
  };

  return (
    <div className="settingsCard">
      <div className="settingsCardTitle">دسته‌بندی‌ها</div>
      <div className="settingsFormGrid">
        <div className="settingsGroup settingsFull">
          <label>نام دسته</label>
          <input type="text" value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(toSlug(e.target.value)); }} placeholder="مثلاً: آموزش" />
        </div>
        <div className="settingsGroup settingsFull">
          <label>اسلاگ</label>
          <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="مثلاً: education" />
        </div>
        <div className="settingsGroup settingsFull">
          <div className="settingsRow" style={{ justifyContent: 'flex-end' }}>
            {editing && <button className="btn btn-outline" type="button" onClick={resetForm}>انصراف</button>}
            <button className="btn btn-primary" type="button" onClick={save}>{editing ? 'به‌روزرسانی' : 'افزودن'}</button>
          </div>
        </div>
      </div>

      <div className="blogListCard" style={{ marginTop: '.75rem' }}>
        <div className="settingsRow" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem', gap: '.5rem', flexWrap: 'wrap' }}>
          <div className="settingsTextMuted">نمایش</div>
          <div className="blogViewToggle settingsRow" role="group" aria-label="نمایش دستهبندیها">
            <button className={`btn btn-outline ${view === 'list' ? 'active' : ''}`} aria-pressed={view==='list'} onClick={() => setView('list')}>لیست</button>
            <button className={`btn btn-outline ${view === 'cards' ? 'active' : ''}`} aria-pressed={view==='cards'} onClick={() => setView('cards')}>کارتها</button>
          </div>
        </div>
        {cats.length === 0 ? (
          <div className="settingsTextMuted blogEmpty">هیچ دسته‌ای وجود ندارد.</div>
        ) : (
          <>
            {view === 'list' && (
              <div className="blogList">
                {cats.map(c => (
                  <div key={c.id} className="settingsRow blogRow">
                    <div style={{ flex: 1, display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div className="settingsTextMuted">/{c.slug}</div>
                      <div className="settingsTextMuted">{(() => { try { return `${(listPosts()||[]).filter(p => (p.category||'') === c.slug).length} پست`; } catch { return ''; } })()}</div>
                    </div>
                    <button className="btn btn-outline" onClick={() => { setEditing(c); setName(c.name); setSlug(c.slug); }}>ویرایش</button>
                    <button className="btn btn-icon" title="حذف" onClick={() => setConfirm(c)} style={{ color: '#dc3545' }}><Trash2 size={18} /></button>
                  </div>
                ))}
              </div>
            )}
            {view === 'cards' && (
              <div className="blogCardGrid">
                {cats.map(c => (
                  <div key={c.id} className="blogCard">
                    <div className="blogCardBody">
                      <div className="blogCardTitle">{c.name}</div>
                      <div className="blogCardMeta">
                        <span>/{c.slug}</span>
                        <span>{(() => { try { return `${(listPosts()||[]).filter(p => (p.category||'') === c.slug).length} پست`; } catch { return ''; } })()}</span>
                      </div>
                      <div className="blogCardActions" style={{ gap: '.4rem' }}>
                        <button className="btn btn-outline" onClick={() => { setEditing(c); setName(c.name); setSlug(c.slug); }}>ویرایش</button>
                        <button className="btn btn-icon" title="حذف" onClick={() => setConfirm(c)} style={{ color: '#dc3545' }}><Trash2 size={18} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmationDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => { if (confirm) deleteCategory(confirm.id); setConfirm(null); refresh(); }}
        title="حذف دسته"
        message={confirm ? `آیا از حذف «${confirm.name}» مطمئن هستید؟` : ''}
        confirmLabel="حذف"
        confirmColor="error"
      />
    </div>
  );
};

// Blog Settings Panel
const BlogSettingsPanel = () => {
  const [s, setS] = useState(() => getBlogSettings());
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try { saveBlogSettings(s); } finally { setSaving(false); }
  };

  return (
    <div className="settingsCard">
      <div className="settingsCardTitle">تنظیمات وبلاگ</div>
      <div className="settingsFormGrid">
        <div className="settingsGroup settingsFull">
          <label>تعداد پست در هر صفحه</label>
          <input type="number" min={1} max={50} value={s.postsPerPage} onChange={(e) => setS({ ...s, postsPerPage: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })} />
        </div>
        <div className="settingsGroup settingsRow settingsFull">
          <label className="switch">
            <input type="checkbox" checked={s.enableRSS} onChange={(e) => setS({ ...s, enableRSS: e.target.checked })} />
            <span className="slider"></span>
          </label>
          <span>فعال‌سازی RSS</span>
        </div>
        <div className="settingsGroup settingsFull">
          <label>عنوان پیش‌فرض SEO</label>
          <input type="text" value={s.defaultSeoTitle} onChange={(e) => setS({ ...s, defaultSeoTitle: e.target.value })} />
        </div>
        <div className="settingsGroup settingsFull">
          <label>توضیح پیش‌فرض SEO</label>
          <textarea rows={3} value={s.defaultSeoDescription} onChange={(e) => setS({ ...s, defaultSeoDescription: e.target.value })} />
        </div>
        <div className="settingsGroup settingsFull">
          <label>تصویر پیش‌فرض OpenGraph</label>
          <div className="settingsRow">
            <div className="blogCoverBox">
              {s.defaultOgImage ? <img src={s.defaultOgImage} alt="OG" /> : <span className="settingsTextMuted">بدون تصویر</span>}
            </div>
            <input id="og-file" type="file" accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setS({ ...s, defaultOgImage: r.result }); r.readAsDataURL(f);
            }} style={{ display: 'none' }} />
            <label htmlFor="og-file" className="btn btn-outline">آپلود</label>
            {s.defaultOgImage && <button className="btn btn-danger" type="button" onClick={() => setS({ ...s, defaultOgImage: '' })}>حذف</button>}
          </div>
        </div>

        <div className="settingsGroup settingsFull">
          <div className="settingsRow" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'در حال ذخیره…' : 'ذخیره تنظیمات'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};
