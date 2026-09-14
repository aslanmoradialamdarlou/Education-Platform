import React, { useEffect, useRef, useState } from 'react';
import { PlusCircle, ArrowRight, Send, Trash2 } from 'lucide-react';
import { TextField, Button, Divider, CircularProgress } from '@mui/material';
import styles from './Profile.module.css';
import ConfirmationDialog from '../Admin/ConfirmationDialog';
import { getTickets, getTicket, createTicket, addTicketMessage, closeTicket } from '../../api/profileService';

const Support = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list' | 'ticket' | 'new'
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [newSubject, setNewSubject] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [newPriority, setNewPriority] = useState('low');
    const chatEndRef = useRef(null);
    const [filterKey, setFilterKey] = useState('all'); // 'all' | 'open' | 'in_progress' | 'closed'
    const [query, setQuery] = useState('');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState(null);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [error, setError] = useState(null);
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

    // Load tickets on mount
    useEffect(() => {
        loadTickets();
    }, []);

    // Auto-refresh selected ticket messages every 5 seconds
    useEffect(() => {
        if (!selectedTicket || !autoRefreshEnabled || view !== 'ticket') return;
        
        const refreshInterval = setInterval(async () => {
            try {
                const freshTicket = await getTicket(selectedTicket.id);
                // Update if there are changes (new messages, status change, etc.)
                if (freshTicket.messages.length !== selectedTicket.messages.length || 
                    freshTicket.status !== selectedTicket.status) {
                    setSelectedTicket(freshTicket);
                }
            } catch (err) {
                console.error('Auto-refresh failed:', err);
            }
        }, 5000); // Refresh every 5 seconds

        return () => clearInterval(refreshInterval);
    }, [selectedTicket, autoRefreshEnabled, view]);

    const loadTickets = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getTickets();
            setTickets(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load tickets:', err);
            setError('خطا در بارگذاری تیکت‌ها');
            setTickets([]);
        } finally {
            setLoading(false);
        }
    };

    const openTicket = async (ticket) => {
        try {
            setError(null);
            const fullTicket = await getTicket(ticket.id);
            setSelectedTicket(fullTicket);
            setView('ticket');
            setReplyText('');
        } catch (err) {
            console.error('Failed to load ticket:', err);
            setError('خطا در بارگذاری تیکت');
        }
    };

    const handleSendReply = async () => {
        if (!replyText.trim() || !selectedTicket) return;
        if (selectedTicket.status === 'closed') return;
        
        try {
            setSendingMessage(true);
            setError(null);
            const newMsg = await addTicketMessage(selectedTicket.id, replyText.trim());
            
            // Update local state
            setSelectedTicket(prev => ({
                ...prev,
                messages: [...(prev.messages || []), newMsg],
            }));
            setReplyText('');
        } catch (err) {
            console.error('Failed to send message:', err);
            setError('خطا در ارسال پیام');
        } finally {
            setSendingMessage(false);
        }
    };

    const handleNewTicket = () => {
        setNewSubject('');
        setNewMessage('');
        setNewPriority('low');
        setView('new');
    };

    const handleCreateTicket = async () => {
        const subject = newSubject.trim();
        const message = newMessage.trim();
        if (!subject || !message) return;
        
        try {
            setSendingMessage(true);
            setError(null);
            const newTicket = await createTicket({
                subject,
                message,
                priority: newPriority,
            });
            
            // Reload tickets list
            await loadTickets();
            
            // Open the newly created ticket
            setSelectedTicket(newTicket);
            setView('ticket');
            setNewSubject('');
            setNewMessage('');
        } catch (err) {
            console.error('Failed to create ticket:', err);
            setError('خطا در ایجاد تیکت');
        } finally {
            setSendingMessage(false);
        }
    };

    const backToList = () => {
        setView('list');
        setSelectedTicket(null);
        setReplyText('');
        loadTickets(); // Refresh list when going back
    };

    const requestDeleteTicket = (id) => {
        setPendingDeleteId(id);
        setConfirmOpen(true);
    };

    const performDeleteTicket = async () => {
        if (pendingDeleteId == null) return;
        const id = pendingDeleteId;
        
        try {
            await closeTicket(id);
            // Refresh tickets list
            await loadTickets();
            setConfirmOpen(false);
            setPendingDeleteId(null);
        } catch (err) {
            console.error('Failed to close ticket:', err);
            setError('خطا در بستن تیکت');
        }
    };

    // Auto-scroll to bottom on conversation change
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [selectedTicket, view]);

    // Map backend status to UI labels
    const getStatusLabel = (status) => {
        const map = {
            'open': { key: 'pending', label: 'در انتظار پاسخ' },
            'in_progress': { key: 'answered', label: 'پاسخ داده شده' },
            'waiting_user': { key: 'pending', label: 'در انتظار پاسخ' },
            'closed': { key: 'ended', label: 'پایان یافته' },
        };
        return map[status] || { key: 'notAnswered', label: 'در انتظار پاسخ' };
    };

    const getChatStatus = () => {
        if (!selectedTicket) return { key: 'notAnswered', label: 'در انتظار پاسخ' };
        return getStatusLabel(selectedTicket.status);
    };

    return (
        <section className={styles.contentSection}>
            {error && (
                <div style={{
                    padding: '12px 16px',
                    marginBottom: '16px',
                    backgroundColor: '#fee',
                    color: '#c33',
                    borderRadius: '8px',
                    border: '1px solid #fcc'
                }}>
                    {error}
                    <button onClick={() => setError(null)} style={{ float: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </div>
            )}

            {view === 'list' && (
                <>
                    <div className={styles.supportHeader}>
                        <h3 className={styles.sectionTitle}>تیکت و پشتیبانی</h3>
                        <button className={styles.newTicketBtn} onClick={handleNewTicket}>
                            <PlusCircle size={18} />
                            <span>تیکت جدید</span>
                        </button>
                    </div>
                    <div className={styles.ticketFilters}>
                        <div className={styles.filterChips}>
                            {[
                                { key: 'all', label: 'همه' },
                                { key: 'pending', label: 'در انتظار پاسخ' },
                                { key: 'answered', label: 'پاسخ داده شده' },
                                { key: 'ended', label: 'پایان یافته' },
                            ].map(f => (
                                <button
                                    key={f.key}
                                    className={`${styles.chip} ${filterKey === f.key ? styles.active : ''}`}
                                    onClick={() => setFilterKey(f.key)}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        <input
                            className={styles.ticketSearchInput}
                            placeholder="جستجو در موضوع یا شناسه"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <CircularProgress />
                        </div>
                    ) : (
                        <ul className={styles.ticketList}>
                            {tickets
                                .filter(ticket => {
                                    const statusInfo = getStatusLabel(ticket.status);
                                    return filterKey === 'all' || statusInfo.key === filterKey;
                                })
                                .filter(ticket => {
                                    const q = query.trim();
                                    if (!q) return true;
                                    const hay = `${ticket.subject} ${ticket.code}`.toLowerCase();
                                    return hay.includes(q.toLowerCase());
                                })
                                .map(ticket => {
                                    const statusInfo = getStatusLabel(ticket.status);
                                    return (
                                        <li key={ticket.id} className={styles.ticketItem} onClick={() => openTicket(ticket)}>
                                            <div className={styles.ticketInfo}>
                                                <span className={styles.ticketId}>{ticket.code}</span>
                                                <p className={styles.ticketSubject}>{ticket.subject}</p>
                                            </div>
                                            <div className={styles.ticketMeta}>
                                                <span className={`${styles.chatTag} ${
                                                    statusInfo.key === 'ended' ? styles.ended : 
                                                    statusInfo.key === 'answered' ? styles.answered : 
                                                    statusInfo.key === 'pending' ? styles.pending : styles.notAnswered
                                                }`}>
                                                    {statusInfo.label}
                                                </span>
                                                {statusInfo.key === 'ended' && (
                                                    <button
                                                        className={styles.ticketDeleteBtn}
                                                        title="حذف تیکت"
                                                        onClick={(e) => { e.stopPropagation(); requestDeleteTicket(ticket.id); }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            {tickets.length === 0 && !loading && (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                    هیچ تیکتی وجود ندارد. برای شروع، تیکت جدید ایجاد کنید.
                                </div>
                            )}
                        </ul>
                    )}
                    <ConfirmationDialog
                        open={confirmOpen}
                        onClose={() => { setConfirmOpen(false); setPendingDeleteId(null); }}
                        onConfirm={performDeleteTicket}
                        title="بستن تیکت"
                        message="آیا از بستن این تیکت مطمئن هستید؟"
                        confirmLabel="بستن"
                        confirmColor="error"
                    />
                </>
            )}

            {view === 'ticket' && selectedTicket && (
                <>
                    <div className={styles.drawerHeader}>
                        <button className={styles.closeModalBtn} onClick={backToList} title="بازگشت">
                            <ArrowRight />
                        </button>
                        <div className={styles.chatHeader}>
                            <div className={styles.chatAvatar}>پ</div>
                            <div className={styles.chatTitleWrap}>
                                <div className={styles.chatTitle}>پشتیبانی</div>
                                <div className={styles.chatStatus}>معمولاً ظرف چند دقیقه پاسخ می‌دهیم</div>
                            </div>
                        </div>
                        <span />
                    </div>
                    {(() => { const s = getChatStatus(); return (
                        <span className={`${styles.chatTag} ${
                            s.key === 'ended' ? styles.ended : s.key === 'answered' ? styles.answered : s.key === 'pending' ? styles.pending : styles.notAnswered
                        }`}>{s.label}</span>
                    ); })()}
                    <Divider sx={{ my: 2, borderColor: 'var(--border-color)' }} />

                    <div className={styles.conversationArea}>
                        {(selectedTicket.messages || []).map(m => (
                            <div key={m.id} className={`${styles.messageBubble} ${m.sender_role === 'user' ? styles.userMessage : styles.adminMessage}`}>
                                <p>{m.body}</p>
                                <span className={styles.msgTime}>{m.created_at_human || m.created_at}</span>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    <div className={`${styles.chatComposer} ${getChatStatus().key === 'ended' ? styles.disabled : ''}`}>
                        <textarea
                            className={styles.composerInput}
                            placeholder="نوشتن پیام..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => {
                                if (getChatStatus().key !== 'ended' && (e.key === 'Enter' && !e.shiftKey)) { e.preventDefault(); handleSendReply(); }
                            }}
                            disabled={getChatStatus().key === 'ended' || sendingMessage}
                        />
                        <button 
                            className={styles.sendBtn} 
                            title="ارسال" 
                            onClick={handleSendReply} 
                            disabled={getChatStatus().key === 'ended' || sendingMessage || !replyText.trim()}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </>
            )}

            {view === 'new' && (
                <>
                    <div className={styles.drawerHeader}>
                        <button className={styles.closeModalBtn} onClick={backToList} title="بازگشت">
                            <ArrowRight />
                        </button>
                        <div className={styles.chatHeader}>
                            <div className={styles.chatAvatar}>پ</div>
                            <div className={styles.chatTitleWrap}>
                                <div className={styles.chatTitle}>پشتیبانی</div>
                                <div className={styles.chatStatus}>موضوع را بنویسید و پیام را ارسال کنید</div>
                            </div>
                        </div>
                        <span />
                    </div>
                    <input
                        className={styles.subjectInput}
                        placeholder="موضوع"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        disabled={sendingMessage}
                    />
                    <div style={{ padding: '12px 16px', marginBottom: '8px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 500, color: '#666' }}>
                            اولویت
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {[
                                { value: 'low', label: 'کم', color: '#4caf50' },
                                { value: 'medium', label: 'متوسط', color: '#ff9800' },
                                { value: 'high', label: 'بالا', color: '#f44336' },
                            ].map(p => (
                                <button
                                    key={p.value}
                                    onClick={() => setNewPriority(p.value)}
                                    disabled={sendingMessage}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        fontSize: '13px',
                                        border: `2px solid ${newPriority === p.value ? p.color : '#ddd'}`,
                                        borderRadius: '8px',
                                        background: newPriority === p.value ? `${p.color}15` : 'white',
                                        color: newPriority === p.value ? p.color : '#666',
                                        cursor: sendingMessage ? 'not-allowed' : 'pointer',
                                        fontWeight: newPriority === p.value ? 600 : 400,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className={styles.conversationArea}>
                        {newMessage && (
                            <div className={`${styles.messageBubble} ${styles.userMessage}`}>
                                <p>{newMessage}</p>
                                <span className={styles.msgTime}>{new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                    <div className={styles.chatComposer}>
                        <textarea
                            className={styles.composerInput}
                            placeholder="نوشتن اولین پیام..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if ((e.key === 'Enter' && !e.shiftKey)) { e.preventDefault(); handleCreateTicket(); }
                            }}
                            disabled={sendingMessage}
                        />
                        <button 
                            className={styles.sendBtn} 
                            title="ارسال" 
                            onClick={handleCreateTicket}
                            disabled={sendingMessage || !newSubject.trim() || !newMessage.trim()}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </>
            )}
        </section>
    );
};

export default Support;
