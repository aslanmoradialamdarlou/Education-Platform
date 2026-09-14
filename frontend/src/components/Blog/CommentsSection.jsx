import React, { useState, useEffect, useReducer } from 'react';
import { CornerDownLeft, Heart, MoreHorizontal, User } from 'lucide-react';
import styles from './Comments.module.css';

// A modern, RTL comment section with nested replies
const CommentsSection = ({
    comments = [],
    onCommentSubmit,
    onReply,
    onReport,
    onEdit,
    onDelete,
    totalCount,
    onLoadMore,
    hasMore
}) => {
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    // Submitting state for loading indicator
    const [isSubmitting, setIsSubmitting] = useState(false);
    // menu state: which comment's menu is open
    const [menuOpenFor, setMenuOpenFor] = useState(null);
    // reporting state
    const [reportingFor, setReportingFor] = useState(null);
    const [reportReason, setReportReason] = useState('spam');
    const [reportDetails, setReportDetails] = useState('');

    // If comments is null/undefined, show a simple loading indicator
    if (!comments) {
        return (
            <section className={styles.commentsSection} aria-label="دیدگاه‌ها">
                <div className={styles.headerRow}>
                    <div>
                        <div className={styles.title}>دیدگاه‌ها</div>
                        <div className={styles.count}>(...)</div>
                    </div>
                </div>
                <div className={styles.empty}>در حال بارگذاری...</div>
            </section>
        );
    }

    const submitTopLevel = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            if (typeof onCommentSubmit === 'function') await onCommentSubmit(newComment);
            setNewComment('');
        } catch (err) {
            console.error('Submit comment failed:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitReply = async (parentId) => {
        if (!replyText.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            if (typeof onReply === 'function') await onReply(replyText, parentId);
            setReplyText('');
            setReplyingTo(null);
        } catch (err) {
            console.error('Submit reply failed:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopyLink = async (comment) => {
        const commentUrl = `${window.location.origin}${window.location.pathname}#comment-${comment.id}`;
        try {
            await navigator.clipboard.writeText(commentUrl);
            console.debug('copy link for', comment.id, commentUrl);
            setMenuOpenFor(null);
        } catch (e) {
            console.error('copy failed', e);
        }
    };

    const openReportDialog = (comment) => {
        console.debug('open report for', comment.id);
        setReportingFor(comment);
        setMenuOpenFor(null);
        setReportReason('spam');
        setReportDetails('');
    };

    const submitReport = async () => {
        if (!reportingFor) return;
        if (typeof onReport === 'function') {
            await onReport(reportingFor.id, { reason: reportReason, details: reportDetails });
        }
        setReportingFor(null);
    };

    // Close the menu when clicking outside (use data attributes so CSS module names are irrelevant)
    useEffect(() => {
        const handler = (e) => {
            if (e.target.closest('[data-comment-menu]') || e.target.closest('[data-comment-more]')) {
                return;
            }
            if (menuOpenFor !== null) setMenuOpenFor(null);
        };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, [menuOpenFor]);

    // Local like state (optimistic) managed by a reducer to ensure atomic updates
    const likesReducer = (state, action) => {
        switch (action.type) {
            case 'init': {
                // payload: { counts: Record<id, number> }
                return { ...state, likeCounts: { ...action.payload.counts }, likedMap: { ...state.likedMap } };
            }
            case 'toggle': {
                const id = action.id;
                const currently = !!state.likedMap[id];
                const nextLiked = !currently;
                const currentCount = Number(state.likeCounts[id] || 0);
                const nextCounts = { ...state.likeCounts, [id]: nextLiked ? currentCount + 1 : Math.max(0, currentCount - 1) };
                const nextLikedMap = { ...state.likedMap, [id]: nextLiked };
                return { likeCounts: nextCounts, likedMap: nextLikedMap };
            }
            default:
                return state;
        }
    };

    const [likesState, dispatchLikes] = useReducer(likesReducer, { likedMap: {}, likeCounts: {} });

    useEffect(() => {
        const counts = {};
        const traverse = (items) => {
            (items || []).forEach(it => {
                counts[it.id] = (it.likeCount != null) ? it.likeCount : 0;
                if (it.replies && it.replies.length) traverse(it.replies);
            });
        };
        traverse(comments || []);
        dispatchLikes({ type: 'init', payload: { counts } });
        // keep previous likedMap
    }, [comments]);

    const toggleLike = (commentId) => {
        dispatchLikes({ type: 'toggle', id: commentId });
    };

    return (
        <section className={styles.commentsSection} aria-label="دیدگاه‌ها">
            <div className={styles.headerRow}>
                <div>
                    <div className={styles.title}>دیدگاه‌ها</div>
                    <div className={styles.count}>({typeof totalCount === 'number' ? totalCount : comments.length})</div>
                </div>
            </div>

            <div className={styles.list}>
                {comments.length === 0 && <div className={styles.empty}>هنوز نظری ثبت نشده است.</div>}

                {comments.map(c => (
                    <CommentItem
                        key={c.id}
                        comment={c}
                        depth={0}
                        replyingTo={replyingTo}
                        setReplyingTo={setReplyingTo}
                        replyText={replyText}
                        setReplyText={setReplyText}
                        submitReply={submitReply}
                        isSubmitting={isSubmitting}
                        menuOpenFor={menuOpenFor}
                        setMenuOpenFor={setMenuOpenFor}
                        onCopyLink={handleCopyLink}
                        onOpenReport={openReportDialog}
                        likeCounts={likesState.likeCounts}
                        likedMap={likesState.likedMap}
                        toggleLike={toggleLike}
                    />
                ))}
            </div>

            {hasMore && (
                <div style={{ display:'flex', justifyContent:'center', marginTop: 8 }}>
                    <button className={styles.cancelBtn} onClick={onLoadMore}>نمایش نظرات بیشتر</button>
                </div>
            )}

            <form onSubmit={submitTopLevel} style={{ marginTop: 14 }}>
                <textarea
                    className={styles.textarea}
                    placeholder="نظر خود را بنویسید..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={4}
                    disabled={isSubmitting}
                />
                {isSubmitting && (
                    <div style={{ marginTop: 8, marginBottom: 8 }}>
                        <div style={{ 
                            width: '100%', 
                            height: 4, 
                            background: 'var(--bg-main)', 
                            borderRadius: 2, 
                            overflow: 'hidden' 
                        }}>
                            <div style={{ 
                                width: '100%', 
                                height: '100%', 
                                background: 'var(--accent-primary-solid)', 
                                animation: 'progress-bar 1.5s ease-in-out infinite',
                                transformOrigin: 'left'
                            }} />
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                            در حال ارسال...
                        </div>
                    </div>
                )}
                <div className={styles.buttons} style={{ marginTop: 8 }}>
                    <button className={styles.submitBtn} type="submit" disabled={isSubmitting || !newComment.trim()}>
                        {isSubmitting ? 'در حال ارسال...' : 'ارسال'}
                    </button>
                    <button className={styles.cancelBtn} type="button" onClick={() => setNewComment('')} disabled={isSubmitting}>لغو</button>
                </div>
            </form>
            {/* Render report dialog when needed */}
            <ReportDialog
                reportingFor={reportingFor}
                onClose={() => setReportingFor(null)}
                reason={reportReason}
                setReason={setReportReason}
                details={reportDetails}
                setDetails={setReportDetails}
                onSubmit={submitReport}
            />
        </section>
    );
};

const CommentItem = ({ comment, depth = 0, replyingTo, setReplyingTo, replyText, setReplyText, submitReply, isSubmitting, menuOpenFor, setMenuOpenFor, onCopyLink, onOpenReport, likeCounts = {}, likedMap = {}, toggleLike, onEdit, onDelete }) => {
    const isMenuOpen = menuOpenFor === comment.id;
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.text || '');
    return (
        <div className={styles.commentCard} style={{ marginRight: depth * 18 }} id={`comment-${comment.id}`}>
            {comment.avatar ? (
                <img src={comment.avatar} alt={comment.author} className={styles.avatar} />
            ) : (
                <div className={styles.avatar} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    background: 'var(--bg-main)', 
                    color: 'var(--text-secondary)' 
                }}>
                    <User size={20} />
                </div>
            )}
            <div className={styles.body}>
                <div className={styles.headerMeta}>
                    <div className={styles.authorRow}>
                        <div className={styles.author}>{comment.author}</div>
                        <div className={styles.time}>{comment.time || 'لحظاتی پیش'}</div>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <button data-comment-more className={styles.moreBtn} aria-label="بیشتر" onClick={() => setMenuOpenFor(isMenuOpen ? null : comment.id)}><MoreHorizontal size={16} /></button>
                        {isMenuOpen && (
                            <div data-comment-menu className={styles.moreMenu} role="menu">
                                <button className={styles.menuItem} onClick={() => onCopyLink && onCopyLink(comment)}>کپی لینک</button>
                                <button className={styles.menuItem} onClick={() => onOpenReport && onOpenReport(comment)}>گزارش</button>
                                {onEdit && <button className={styles.menuItem} onClick={() => { setIsEditing(true); setMenuOpenFor(null); }}>ویرایش</button>}
                                {onDelete && <button className={styles.menuItem} onClick={() => { setMenuOpenFor(null); onDelete(comment.id); }}>حذف</button>}
                            </div>
                        )}
                    </div>
                </div>
                {!isEditing ? (
                    <div className={styles.text}>{comment.text}</div>
                ) : (
                    <div className={styles.replyForm}>
                        <textarea className={styles.textarea} value={editText} onChange={(e) => setEditText(e.target.value)} />
                        <div className={styles.buttons}>
                            <button className={styles.submitBtn} onClick={() => { if (onEdit) onEdit(comment.id, editText); setIsEditing(false); }}>ذخیره</button>
                            <button className={styles.cancelBtn} onClick={() => { setIsEditing(false); setEditText(comment.text || ''); }}>لغو</button>
                        </div>
                    </div>
                )}

                <div className={styles.actions}>
                    <button className={styles.iconBtn} aria-label="پاسخ" onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}>
                        <CornerDownLeft size={16} />
                    </button>
                    <button
                        className={`${styles.iconBtn} ${likedMap[comment.id] ? styles.liked : ''}`}
                        aria-label="پسندیدن"
                        onClick={(e) => { e.stopPropagation(); toggleLike && toggleLike(comment.id); }}
                    >
                        <Heart size={16} />
                        <span style={{ marginInlineStart: 6, color: 'var(--text-secondary)', fontSize: 13 }}>{(likeCounts && likeCounts[comment.id]) || 0}</span>
                    </button>
                </div>

                {replyingTo === comment.id && (
                    <div className={styles.replyForm}>
                        <textarea 
                            className={styles.textarea} 
                            value={replyText} 
                            onChange={(e) => setReplyText(e.target.value)} 
                            placeholder="پاسخ خود را بنویسید..." 
                            disabled={isSubmitting}
                        />
                        <div className={styles.buttons}>
                            <button 
                                className={styles.submitBtn} 
                                onClick={() => submitReply(comment.id)} 
                                disabled={isSubmitting || !replyText.trim()}
                            >
                                {isSubmitting ? 'در حال ارسال...' : 'ارسال'}
                            </button>
                            <button 
                                className={styles.cancelBtn} 
                                onClick={() => { setReplyingTo(null); setReplyText(''); }} 
                                disabled={isSubmitting}
                            >
                                لغو
                            </button>
                        </div>
                    </div>
                )}

                {comment.replies && comment.replies.length > 0 && (
                    <div className={styles.repliesList}>
                        {comment.replies.map(r => (
                            <CommentItem
                                key={r.id}
                                comment={r}
                                depth={depth + 1}
                                replyingTo={replyingTo}
                                setReplyingTo={setReplyingTo}
                                replyText={replyText}
                                setReplyText={setReplyText}
                                submitReply={submitReply}
                                isSubmitting={isSubmitting}
                                menuOpenFor={menuOpenFor}
                                setMenuOpenFor={setMenuOpenFor}
                                onCopyLink={onCopyLink}
                                onOpenReport={onOpenReport}
                                likeCounts={likeCounts}
                                likedMap={likedMap}
                                toggleLike={toggleLike}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Report dialog overlay
const ReportDialog = ({ reportingFor, onClose, reason, setReason, details, setDetails, onSubmit }) => {
    if (!reportingFor) return null;
    return (
        <div className={styles.dialogOverlay} role="dialog" aria-modal="true">
            <div className={styles.dialog}>
                <h3>گزارش نظر از {reportingFor.author}</h3>
                <div className={styles.fieldGroup}>
                    <label>دلیل</label>
                    <select value={reason} onChange={(e) => setReason(e.target.value)}>
                        <option value="spam">هرزنامه / تبلیغ</option>
                        <option value="abuse">سوءاستفاده / توهین</option>
                        <option value="other">سایر</option>
                    </select>
                </div>
                <div className={styles.fieldGroup}>
                    <label>جزئیات (اختیاری)</label>
                    <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={4} />
                </div>
                <div className={styles.dialogActions}>
                    <button className={styles.submitBtn} onClick={onSubmit}>ارسال گزارش</button>
                    <button className={styles.cancelBtn} onClick={onClose}>لغو</button>
                </div>
            </div>
        </div>
    );
};

export default CommentsSection;

