import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, TablePagination, CircularProgress } from '@mui/material';
import { Search, User, LifeBuoy, ArrowRight, Send, Paperclip } from 'lucide-react';
import styles from './Admin.module.css';
import './adminBase.css';
import './AdminTickets.css';
import {
  getAdminTickets,
  getAdminTicket,
  addAdminTicketMessage,
  updateTicketStatus,
  updateTicketPriority,
} from '../../api/adminTicketService';

const statusChip = (status) => {
  const map = {
    open: { label: 'باز', color: '#dc3545' },
    in_progress: { label: 'در حال پیگیری', color: '#0d6efd' },
    waiting_user: { label: 'منتظر پاسخ کاربر', color: '#fd7e14' },
    closed: { label: 'بسته شده', color: '#198754' },
  };
  const cfg = map[status] || { label: status, color: '#6c757d' };
  return (
    <span className="badge" style={{ backgroundColor: `${cfg.color}22`, color: cfg.color }}>
      {cfg.label}
    </span>
  );
};

const priorityChip = (p) => {
  const map = {
    low: { label: 'کم', color: '#6c757d' },
    medium: { label: 'متوسط', color: '#0d6efd' },
    high: { label: 'زیاد', color: '#dc3545' },
  };
  const cfg = map[p] || { label: p, color: '#6c757d' };
  return (
    <span className="badge" style={{ backgroundColor: `${cfg.color}22`, color: cfg.color }}>
      {cfg.label}
    </span>
  );
};

const numberFa = (n) => new Intl.NumberFormat('fa-IR').format(n);
const formatTime = (ts) => new Date(ts).toLocaleString('fa-IR', { hour: '2-digit', minute: '2-digit', year: 'numeric', month: '2-digit', day: '2-digit' });

const AdminTickets = ({ onQuickNavigate }) => {
  // State
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [selected, setSelected] = useState(null); // ticket object
  const [reply, setReply] = useState('');
  const [file, setFile] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesRef = useRef(null);
  const replyRef = useRef(null);
  const MAX_REPLY_LINES = 6;

  // Load tickets on mount
  useEffect(() => {
    loadTickets();
  }, []);

  // Auto-refresh selected ticket messages every 5 seconds
  useEffect(() => {
    if (!selected) return;
    
    const refreshInterval = setInterval(async () => {
      try {
        const freshTicket = await getAdminTicket(selected.id);
        // Update if there are changes (new messages, status change, priority change, etc.)
        if (freshTicket.messages.length !== selected.messages.length || 
            freshTicket.status !== selected.status ||
            freshTicket.priority !== selected.priority) {
          setSelected(freshTicket);
        }
      } catch (err) {
        console.error('Auto-refresh failed:', err);
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(refreshInterval);
  }, [selected]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await getAdminTickets({ per_page: 100 }); // Get all tickets
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load tickets:', err);
      setToast({ open: true, severity: 'error', message: 'خطا در بارگذاری تیکت‌ها' });
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const openTicket = async (ticket) => {
    try {
      const fullTicket = await getAdminTicket(ticket.id);
      setSelected(fullTicket);
      setReply('');
      setFile(null);
    } catch (err) {
      console.error('Failed to load ticket:', err);
      setToast({ open: true, severity: 'error', message: 'خطا در بارگذاری تیکت' });
    }
  };


  const filtered = useMemo(() => {
    return tickets.filter(t => {
      const q = query.trim();
      if (q) {
        const inText = t.subject.includes(q) || t.code.includes(q) || t.user?.name.includes(q) || t.user?.email.includes(q);
        if (!inText) return false;
      }
      if (status !== 'all' && t.status !== status) return false;
      if (priority !== 'all' && t.priority !== priority) return false;
      return true;
    });
  }, [tickets, query, status, priority]);

  const paged = useMemo(() => {
    const start = page * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const handleSendReply = async () => {
    if (!selected) return;
    if (!reply.trim() && !file) {
      setToast({ open: true, severity: 'warning', message: 'متن پاسخ یا فایل پیوست لازم است.' });
      return;
    }
    
    try {
      setSendingMessage(true);
      const message = reply.trim();
      
      if (message) {
        const newMsg = await addAdminTicketMessage(selected.id, message);
        
        // Update local state
        setSelected(prev => ({
          ...prev,
          messages: [...(prev.messages || []), newMsg],
          status: prev.status === 'open' ? 'in_progress' : prev.status,
        }));
        
        // Update tickets list
        await loadTickets();
        
        setReply('');
        setFile(null);
        setToast({ open: true, severity: 'success', message: 'پاسخ ارسال شد.' });
        
        // Reset textarea height
        if (replyRef.current) {
          replyRef.current.style.height = 'auto';
          replyRef.current.style.overflowY = 'hidden';
        }
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
      setToast({ open: true, severity: 'error', message: 'خطا در ارسال پاسخ' });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleStatus = async (st) => {
    if (!selected) return;
    try {
      await updateTicketStatus(selected.id, st);
      setSelected(s => s ? { ...s, status: st } : s);
      await loadTickets();
      setToast({ open: true, severity: 'success', message: 'وضعیت تیکت تغییر کرد.' });
    } catch (err) {
      console.error('Failed to update status:', err);
      setToast({ open: true, severity: 'error', message: 'خطا در تغییر وضعیت' });
    }
  };

  const handlePriority = async (pr) => {
    if (!selected) return;
    try {
      await updateTicketPriority(selected.id, pr);
      setSelected(s => s ? { ...s, priority: pr } : s);
      await loadTickets();
      setToast({ open: true, severity: 'success', message: 'اولویت تیکت تغییر کرد.' });
    } catch (err) {
      console.error('Failed to update priority:', err);
      setToast({ open: true, severity: 'error', message: 'خطا در تغییر اولویت' });
    }
  };

  // Auto-hide toast (manual replacement for Snackbar)
  useEffect(() => {
    if (!toast.open) return;
    const t = setTimeout(() => setToast(prev => ({ ...prev, open: false })), 2200);
    return () => clearTimeout(t);
  }, [toast.open]);

  // Auto-scroll messages to bottom when opening a ticket or new messages arrive
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
    // Initialize reply textarea height on open
    if (replyRef.current) {
      autoResizeTextarea(replyRef.current);
    }
  }, [selected, selected?.messages?.length]);

  // Auto-resize textarea based on content, up to MAX_REPLY_LINES
  const autoResizeTextarea = (el) => {
    if (!el) return;
    const lineHeight = 20; // px, approximate to match .replyInput font-size/line-height
    el.style.height = 'auto';
    const maxHeight = lineHeight * MAX_REPLY_LINES + 16; // add padding allowance
    const newHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = newHeight + 'px';
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  };

  const handleReplyChange = (e) => {
    setReply(e.target.value);
    autoResizeTextarea(e.target);
  };

  const handleReplyKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  // Main List View
  if (!selected) {
    return (
      <div dir="rtl" className="ticketsTab">
        <div className={styles.panelHeader}>
          <h2 className="title-md" style={{ margin: 0 }}>مدیریت تیکت‌ها</h2>
        </div>

        <div className={`${styles.detailFilterContainer} detailFilterContainer adminCard adminCard--tight`}>
          <div className={styles.filtersRow}>
            <div className="filterGroup" style={{ flex: '1 1 360px' }}>
              <label htmlFor="tickets-search">جستجو</label>
              <div className="inputWrap">
                <input
                  id="tickets-search"
                  type="text"
                  placeholder="جستجو در موضوع/شناسه/کاربر"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setPage(0); }}
                  aria-label="جستجو در موضوع/شناسه/کاربر"
                />
                <Search className="searchIcon" size={16} aria-hidden="true" />
              </div>
            </div>
            <div className="filterGroup" style={{ flex: '0 1 200px' }}>
              <label htmlFor="tickets-status">وضعیت</label>
              <select id="tickets-status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
                <option value="all">همه</option>
                <option value="open">باز</option>
                <option value="in_progress">در حال پیگیری</option>
                <option value="waiting_user">منتظر پاسخ کاربر</option>
                <option value="closed">بسته شده</option>
              </select>
            </div>
            <div className="filterGroup" style={{ flex: '0 1 180px' }}>
              <label htmlFor="tickets-priority">اولویت</label>
              <select id="tickets-priority" value={priority} onChange={(e) => { setPriority(e.target.value); setPage(0); }}>
                <option value="all">همه</option>
                <option value="low">کم</option>
                <option value="medium">متوسط</option>
                <option value="high">زیاد</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <CircularProgress />
          </div>
        ) : (
        <div className={`${styles.tableContainer} ${styles.tableFullRight}`}>
          <table>
            <thead>
              <tr>
                <th>شناسه/موضوع</th>
                <th>کاربر</th>
                <th>وضعیت</th>
                <th>اولویت</th>
                <th>آخرین بروزرسانی</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(t => (
                <tr key={t.id} className={`${styles.listItemHover} ${styles.clickableRow}`} onClick={() => openTicket(t)}>
                  <td data-label="شناسه/موضوع">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span className="text-sm" style={{ fontWeight: 600 }}>{t.code}</span>
                      <span className="subjectSecondary">{t.subject}</span>
                    </div>
                  </td>
                  <td data-label="کاربر">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar sx={{ width: 28, height: 28 }}><User size={14} /></Avatar>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span className="text-sm">{t.user?.name || 'بدون نام'}</span>
                        <span className="emailSecondary">{t.user?.email || ''}</span>
                      </div>
                    </div>
                  </td>
                  <td data-label="وضعیت">{statusChip(t.status)}</td>
                  <td data-label="اولویت">{priorityChip(t.priority)}</td>
                  <td data-label="آخرین بروزرسانی">{formatTime(t.last_activity_at)}</td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>موردی یافت نشد.</td>
                </tr>
              )}
            </tbody>
          </table>
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(e, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage="تعداد در صفحه"
            labelDisplayedRows={({ from, to, count }) => `${numberFa(from)}–${numberFa(to)} از ${numberFa(count)}`}
          />
        </div>
        )}

        {toast.open && (
          <div className={`toast ${toast.severity === 'success' ? 'toast-success' : ''} ${toast.severity === 'error' ? 'toast-error' : ''}`} role="status" aria-live="polite">
            {toast.message}
          </div>
        )}
      </div>
    );
  }

  // Detail View
  const t = selected;
  return (
    <div dir="rtl" className="ticketsTab">
      <div className={styles.detailHeader}>
        <button className={`btn btn-outline ${styles.backButton}`} onClick={() => setSelected(null)}>
          <ArrowRight size={16} />
          بازگشت
        </button>
        <h3 className="title-md" style={{ margin: 0 }}>تیکت {t.id} — {t.subject}</h3>
      </div>

      <div className="ticketDetailGrid">
        {/* Conversation */}
        <div className={`${styles.detailCard} chatCard`}>
          <div className={styles.cardTitle}>گفتگو</div>
          <hr className="divider" />
          <div className="chatMessages" ref={messagesRef}>
            {(t.messages || []).map((m, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: m.sender_role === 'agent' ? 'flex-start' : 'flex-end' }}>
                <div className={`msgBubble ${m.sender_role === 'agent' ? 'from-admin' : 'from-user'}`}>
                  <div className="text-xs text-muted">{m.sender_role === 'agent' ? 'پشتیبانی' : t.user?.name}</div>
                  <div className="text-sm" style={{ marginTop: 4 }}>{m.body}</div>
                  <div className="text-xs text-muted" style={{ marginTop: 4 }}>
                    {m.created_at_human || new Date(m.created_at).toLocaleString('fa-IR', { hour: '2-digit', minute: '2-digit', month: '2-digit', day: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="chatFooter">
            <div className="replyRow">
              <label htmlFor="reply" className="sr-only">پاسخ پشتیبانی</label>
              <textarea
                id="reply"
                ref={replyRef}
                className="replyInput"
                placeholder="پاسخ خود را بنویسید..."
                value={reply}
                onChange={handleReplyChange}
                onKeyDown={handleReplyKeyDown}
                rows={1}
                disabled={sendingMessage || t.status === 'closed'}
              />
              <input id="ticket-file" type="file" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <label htmlFor="ticket-file" className="btn btn-icon" title={file ? file.name : 'افزودن فایل'}>
                <Paperclip size={18} />
              </label>
              <button 
                className={`btn btn-primary ${styles.btnPrimary}`} 
                onClick={handleSendReply}
                disabled={sendingMessage || t.status === 'closed' || (!reply.trim() && !file)}
              >
                <Send size={16} />
                {sendingMessage ? 'در حال ارسال...' : 'ارسال'}
              </button>
            </div>
            {file && <div className="text-xs text-muted" style={{ marginTop: '.35rem' }}>فایل انتخاب‌شده: {file.name}</div>}
          </div>
        </div>

        {/* Sidebar Details & Actions */}
        <div className="rightCol">
          <div className={styles.detailCard}>
            <div className={styles.cardTitle}>جزئیات تیکت</div>
            <div className="flex flex-col gap-sm">
              <div className="flex items-center gap-sm"><LifeBuoy size={16} /><span className="text-sm">{t.code}</span></div>
              <div className="text-sm">موضوع: {t.subject}</div>
              <div className="flex items-center gap-sm">
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-main)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  <User size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm">{t.user?.name || 'بدون نام'}</span>
                  <span className="text-xs text-muted">{t.user?.email || ''}</span>
                </div>
              </div>
              <div className="text-xs text-muted">آخرین بروزرسانی: {formatTime(t.last_activity_at)}</div>
            </div>
            <button
              className="btn btn-outline"
              style={{ marginTop: '.6rem' }}
              onClick={() => {
                if (!onQuickNavigate) return null;
                const email = encodeURIComponent(t.user?.email || '');
                const name = encodeURIComponent(t.user?.name || '');
                onQuickNavigate(`users?openUserEmail=${email}&openUserName=${name}`);
              }}
            >
              مشاهده پروفایل کاربر
            </button>
          </div>

          <div className={styles.detailCard}>
            <div className={styles.cardTitle}>اقدامات</div>
            <div className="drawerFilters" style={{ display: 'grid', gap: '.6rem' }}>
              <div className="filterGroup">
                <label>وضعیت</label>
                <select value={t.status} onChange={(e) => handleStatus(e.target.value)}>
                  <option value="open">باز</option>
                  <option value="in_progress">در حال پیگیری</option>
                  <option value="waiting_user">منتظر پاسخ کاربر</option>
                  <option value="closed">بسته شده</option>
                </select>
              </div>
              <div className="filterGroup">
                <label>اولویت</label>
                <select value={t.priority} onChange={(e) => handlePriority(e.target.value)}>
                  <option value="low">کم</option>
                  <option value="medium">متوسط</option>
                  <option value="high">زیاد</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast.open && (
        <div className={`toast ${toast.severity === 'success' ? 'toast-success' : ''} ${toast.severity === 'error' ? 'toast-error' : ''}`} role="status" aria-live="polite">
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default AdminTickets;
