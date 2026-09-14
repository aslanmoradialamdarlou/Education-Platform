import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import CommentsSection from '../components/Blog/CommentsSection';
import Footer from '../components/Footer/Footer';
import ShareChip from '../components/Shared/ShareChip';
import { Play } from 'lucide-react';
import styles from '../components/Blog/Blog.module.css';
import { sanitizeArticle } from '../utils/sanitize';
import PopularPosts from '../components/Blog/PopularPosts';
import PostRenderer from '../components/PostRenderer';
import { MOCK_USERS } from '../data/mockUsers'; // Import mock user data
import blogApi from '../api/blogApi';
import { useToast } from '../components/Toast/ToastProvider';

const popularPostsData = [
    {id: 'math-8th-equations-tips', title: "نکات کلیدی ریاضی هشتم - فصل معادلات", image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=400&auto=format&fit=crop"},
    {id: 'science-9th-test-guide', title: "راهنمای جامع آزمون‌های تستی علوم نهم", image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=400&auto=format&fit=crop"},
    {id: 'simple-science-experiments-at-home', title: "آزمایش‌های ساده علوم در خانه", image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=400&auto=format&fit=crop"},
];

const BlogPage = () => {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { postId } = useParams();
    const navigate = useNavigate();
    const { push: pushToast } = useToast();
    // Dark mode now fully managed by ThemeContext; remove local state
    const [copiedMessage, setCopiedMessage] = useState('');

    const currentUser = MOCK_USERS.student_free; // Use a mock user for the blog page
    const articleRef = useRef(null);
    const [progress, setProgress] = useState(0);
    const [showVideo, setShowVideo] = useState(false);

    // comments pagination state
    const [commentPage, setCommentPage] = useState(1);
    const [commentPageSize] = useState(5);
    const [commentSlice, setCommentSlice] = useState([]);
    const [commentsTotal, setCommentsTotal] = useState(0);
    const [commentsHasMore, setCommentsHasMore] = useState(false);

    // Redirect to blog list if no postId provided
    useEffect(() => {
        if (!postId) {
            navigate('/blogs', { replace: true });
        }
    }, [postId, navigate]);

    // Stable theming: no body dataset changes here

    // Load post from API (mocked). This makes it easy to swap in real API later.
    useEffect(() => {
        if (!postId) return; // Don't fetch if no postId
        const controller = new AbortController();
        setLoading(true);
        setError(null);
        setCommentPage(1);
        (async () => {
            try {
                const fetched = await blogApi.fetchPost(postId, { signal: controller.signal });
                if (controller.signal.aborted) return;
                setPost(fetched);
                const cPage = await blogApi.fetchComments(fetched.id, { page: 1, pageSize: commentPageSize, signal: controller.signal });
                if (controller.signal.aborted) return;
                setCommentSlice(cPage.items);
                setCommentsTotal(cPage.totalAll);
                setCommentsHasMore(cPage.hasMore);
                setLoading(false);
            } catch (err) {
                if (controller.signal.aborted) return;
                console.error('Failed to fetch post', err);
                setError(err.message || 'خطا در دریافت اطلاعات');
                setLoading(false);
            }
        })();
        return () => controller.abort();
    }, [postId, commentPageSize]);

    const handleLoadMoreComments = async () => {
        if (!post) return;
        const next = commentPage + 1;
        try {
            const res = await blogApi.fetchComments(post.id, { page: next, pageSize: commentPageSize });
            setCommentSlice(prev => [...prev, ...res.items]);
            setCommentPage(next);
            setCommentsHasMore(res.hasMore);
            setCommentsTotal(res.totalAll);
        } catch (e) { /* ignore */ }
    };

    const handleCommentSubmit = async (commentText) => {
        if (!post) return;
        try {
            const created = await blogApi.createComment(post.id, { text: commentText, author: currentUser?.name, avatar: currentUser?.avatar });
            
            // Add the new comment to the list immediately (optimistic update)
            const newComment = {
                id: created.id || Date.now(),
                text: commentText,
                author: currentUser?.name || 'کاربر',
                avatar: currentUser?.avatar || 'https://i.pravatar.cc/150?u=guest',
                time: 'لحظاتی پیش',
                replies: []
            };
            
            // Add to the end of current slice
            setCommentSlice(prev => [...prev, newComment]);
            setCommentsTotal(prev => prev + 1);
            
            // Show success toast
            pushToast({ type: 'success', message: 'نظر شما با موفقیت ثبت شد' });
        } catch (err) {
            console.error('Failed to create comment', err);
            pushToast({ type: 'error', message: 'خطا در ثبت نظر' });
        }
    };

    // Support replies: add reply to any comment in the tree (recursive)
    const handleCommentReply = async (commentText, parentId) => {
        if (!post) return;
        if (!parentId) return handleCommentSubmit(commentText);
        try {
            const created = await blogApi.createComment(post.id, { text: commentText, author: currentUser?.name, avatar: currentUser?.avatar, parentId });
            
            // Helper function to add reply to nested structure
            const addReplyToTree = (comments, parentId, newReply) => {
                return comments.map(comment => {
                    if (comment.id === parentId) {
                        return {
                            ...comment,
                            replies: [...(comment.replies || []), newReply]
                        };
                    }
                    if (comment.replies && comment.replies.length > 0) {
                        return {
                            ...comment,
                            replies: addReplyToTree(comment.replies, parentId, newReply)
                        };
                    }
                    return comment;
                });
            };
            
            const newReply = {
                id: created.id || Date.now(),
                text: commentText,
                author: currentUser?.name || 'کاربر',
                avatar: currentUser?.avatar || 'https://i.pravatar.cc/150?u=guest',
                time: 'لحظاتی پیش',
                replies: []
            };
            
            setCommentSlice(prev => addReplyToTree(prev, parentId, newReply));
            setCommentsTotal(prev => prev + 1);
            
            // Show success toast
            pushToast({ type: 'success', message: 'پاسخ شما با موفقیت ثبت شد' });
        } catch (err) {
            console.error('Failed to create reply', err);
            pushToast({ type: 'error', message: 'خطا در ثبت پاسخ' });
        }
    };

    const handleEditComment = async (commentId, text) => {
        if (!post) return;
        try {
            await blogApi.updateComment(post.id, commentId, { text });
            // update local slice immutably
            const updateTree = (items) => items.map(it => ({ ...it, text: it.id === commentId ? text : it.text, replies: it.replies ? updateTree(it.replies) : [] }));
            setCommentSlice(prev => updateTree(prev));
        } catch (e) {
            console.error('Failed to update comment', e);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!post) return;
        try {
            await blogApi.deleteComment(post.id, commentId);
            // remove from local slice
            const removeTree = (items) => items.filter(it => it.id !== commentId).map(it => ({ ...it, replies: it.replies ? removeTree(it.replies) : [] }));
            setCommentSlice(prev => removeTree(prev));
            // also refresh totals/hasMore conservatively
            const res = await blogApi.fetchComments(post.id, { page: 1, pageSize: commentPageSize });
            setCommentsTotal(res.totalAll);
        } catch (e) { console.error('Failed to delete comment', e); }
    };

    const handleRate = (newRating) => {
        alert(`شما امتیاز ${newRating} را ثبت کردید!`);
        // Logic to update rating would go here
    };

    const handleReport = async (commentId, { reason, details }) => {
        try {
            const result = await blogApi.createReport(commentId, { reason, details });
            console.log('Report created', result);
            pushToast({ 
                type: 'success', 
                message: `گزارش شما با موفقیت ثبت شد. کد پیگیری: ${result.ticket_code || 'نامشخص'}` 
            });
        } catch (err) {
            console.error('Failed to create report', err);
            pushToast({ type: 'error', message: 'خطا در ثبت گزارش' });
        }
    };

    useEffect(() => {
        const onScroll = () => {
            const el = articleRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const total = rect.height - window.innerHeight;
            const scrolled = Math.min(Math.max(-rect.top, 0), total > 0 ? total : 0);
            const pct = total > 0 ? Math.round((scrolled / total) * 100) : 0;
            setProgress(pct);
        };
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, [post]);

    if (loading) {
        return (
            <div className={styles.blogPage}>
                <Header />
                <div className={styles.blogLayout}>
                    <main className={styles.mainContent} style={{ padding: 24 }}>
                        {/* Progress bar skeleton */}
                        <div style={{ height: 6, background:'var(--bg-main)', borderRadius: 99, overflow:'hidden', marginBottom: 16 }}>
                            <div style={{ width: '40%', height:'100%', background:'var(--border-color)', animation:'pulse 1.2s infinite ease-in-out' }} />
                        </div>
                        
                        {/* Title skeleton */}
                        <div style={{ width: '85%', height: 36, background:'var(--bg-main)', borderRadius: 8, marginBottom: 12, animation:'pulse 1.2s infinite ease-in-out' }} />
                        <div style={{ width: '70%', height: 36, background:'var(--bg-main)', borderRadius: 8, marginBottom: 16, animation:'pulse 1.2s infinite ease-in-out' }} />
                        
                        {/* Author and date skeleton */}
                        <div style={{ display:'flex', gap: 12, alignItems:'center', marginBottom: 24 }}>
                            <div style={{ width: 48, height: 48, borderRadius: '50%', background:'var(--bg-main)', animation:'pulse 1.2s infinite ease-in-out' }} />
                            <div>
                                <div style={{ width: 120, height: 16, background:'var(--bg-main)', borderRadius: 6, marginBottom: 8, animation:'pulse 1.2s infinite ease-in-out' }} />
                                <div style={{ width: 80, height: 14, background:'var(--bg-main)', borderRadius: 6, animation:'pulse 1.2s infinite ease-in-out' }} />
                            </div>
                        </div>
                        
                        {/* Featured image skeleton */}
                        <div style={{ width: '100%', height: 380, background:'var(--bg-main)', borderRadius: 12, marginBottom: 32, animation:'pulse 1.2s infinite ease-in-out' }} />
                        
                        {/* Content paragraphs skeleton */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                            <div style={{ width: '100%', height: 18, background:'var(--bg-main)', borderRadius: 6, animation:'pulse 1.2s infinite ease-in-out' }} />
                            <div style={{ width: '95%', height: 18, background:'var(--bg-main)', borderRadius: 6, animation:'pulse 1.2s infinite ease-in-out' }} />
                            <div style={{ width: '98%', height: 18, background:'var(--bg-main)', borderRadius: 6, animation:'pulse 1.2s infinite ease-in-out' }} />
                            <div style={{ width: '90%', height: 18, background:'var(--bg-main)', borderRadius: 6, animation:'pulse 1.2s infinite ease-in-out' }} />
                            <div style={{ width: '75%', height: 18, background:'var(--bg-main)', borderRadius: 6, marginBottom: 16, animation:'pulse 1.2s infinite ease-in-out' }} />
                            
                            <div style={{ width: '100%', height: 18, background:'var(--bg-main)', borderRadius: 6, animation:'pulse 1.2s infinite ease-in-out' }} />
                            <div style={{ width: '92%', height: 18, background:'var(--bg-main)', borderRadius: 6, animation:'pulse 1.2s infinite ease-in-out' }} />
                            <div style={{ width: '96%', height: 18, background:'var(--bg-main)', borderRadius: 6, animation:'pulse 1.2s infinite ease-in-out' }} />
                            <div style={{ width: '88%', height: 18, background:'var(--bg-main)', borderRadius: 6, animation:'pulse 1.2s infinite ease-in-out' }} />
                        </div>
                        
                        {/* Comments section skeleton */}
                        <div style={{ marginTop: 48 }}>
                            <div style={{ width: 180, height: 28, background:'var(--bg-main)', borderRadius: 8, marginBottom: 24, animation:'pulse 1.2s infinite ease-in-out' }} />
                            {[1, 2, 3].map(i => (
                                <div key={i} style={{ display:'flex', gap: 12, marginBottom: 20, padding: 16, border: '1px solid var(--border-color)', borderRadius: 8 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background:'var(--bg-main)', flexShrink: 0, animation:'pulse 1.2s infinite ease-in-out' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ width: 140, height: 14, background:'var(--bg-main)', borderRadius: 6, marginBottom: 8, animation:'pulse 1.2s infinite ease-in-out' }} />
                                        <div style={{ width: '100%', height: 14, background:'var(--bg-main)', borderRadius: 6, marginBottom: 6, animation:'pulse 1.2s infinite ease-in-out' }} />
                                        <div style={{ width: '80%', height: 14, background:'var(--bg-main)', borderRadius: 6, animation:'pulse 1.2s infinite ease-in-out' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </main>
                </div>
                {/* ThemeSwitcher provided globally via Header */}
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.blogPage}>
                <Header />
                <div className={styles.blogLayout}>
                    <main className={styles.mainContent} style={{ padding: 24 }}>
                        <h2 style={{ color: 'var(--danger-color)', marginBottom: 8 }}>خطا</h2>
                        <div style={{ color: 'var(--text-secondary)' }}>{error}</div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.blogPage}>
            <Header />
            <div className={styles.blogLayout}>
                
                {/* left sidebar removed; using inline share section below article */}
                <main className={styles.mainContent}>
                    {/* breadcrumbs */}
                    <nav aria-label="breadcrumb" style={{fontSize:'.85rem', color:'var(--text-secondary)', marginBottom:8}}>
                        <Link to="/home" style={{color:'inherit'}}>خانه</Link>
                        <span style={{margin:'0 .5rem'}}>›</span>
                        <Link to="/blogs" style={{color:'inherit'}}>وبلاگ</Link>
                        <span style={{margin:'0 .5rem'}}>›</span>
                        <span style={{color:'var(--text-primary)'}}>{post.title}</span>
                    </nav>
                    {/* reading progress */}
                    <div style={{position:'sticky', top:64, zIndex:1, background:'transparent', height:4, borderRadius:99, overflow:'hidden', marginBottom:8}}>
                        <div style={{width:`${progress}%`, height:'100%', background:'var(--accent-primary-solid)', transition:'width .12s linear'}} />
                    </div>
                    <header className={styles.blogHeader}>
                        <div className={styles.authorInfo}>
                            <img src={post.authorAvatar} alt={post.author} />
                            <div>
                                <span>{post.author}</span>
                                <p className={styles.date}>{post.date}</p>
                            </div>
                        </div>
                        <h1 className={styles.blogTitle}>{post.title}</h1>
                    </header>
                    {/* <div className={styles.featuredImageContainer}>
                        <img src={post.featuredImage} alt={post.title} />
                        <div className={styles.playButton} onClick={() => setShowVideo(true)} role="button" aria-label="پخش ویدیو">
                            <Play size={36} fill="white" />
                        </div>
                    </div> */}
                    {/* simple table of contents from headings in content (client-side parse). Supports HTML or Markdown. */}
                    <ToC html={post?.content} markdown={post?.markdown || post?.content_markdown} />
                    {/* Render markdown with PostRenderer when available; otherwise fall back to sanitized HTML */}
                    {(() => {
                        const md = (post?.markdown || post?.content_markdown || '').trim();
                        const hasMarkdown = md.length > 0;
                        if (hasMarkdown) {
                            return (
                                <div ref={articleRef}>
                                    <PostRenderer markdown={md} className={styles.blogArticle} />
                                </div>
                            );
                        }
                        return (
                            <article
                                className={styles.blogArticle}
                                ref={articleRef}
                                dangerouslySetInnerHTML={{ __html: sanitizeArticle(post?.content || '') }}
                            />
                        );
                    })()}
                    
                    {/* Inline share section placed between article content and comments */}
                    <div className={styles.inlineShare} aria-label="اشتراک گذاری مطلب">
                        <span className={styles.inlineShareLabel}>اشتراک این مطلب:</span>
                            <div className={styles.inlineShareButtons}>
                                <ShareChip
                                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 8H9a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 12V7a2 2 0 0 1 2-2h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                    label={copiedMessage === 'link' ? 'کپی شد' : 'کپی لینک'}
                                    onClick={async () => {
                                        try {
                                            await navigator.clipboard.writeText(window.location.href);
                                            setCopiedMessage('link');
                                            setTimeout(() => setCopiedMessage(''), 1600);
                                        } catch (e) { /* ignore */ }
                                    }}
                                />

                                {/* <ShareChip
                                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 2L11 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 2l-7 20 1-7 7-7-13 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                    label={copiedMessage === 'telegram' ? 'کپی شد' : 'تلگرام'}
                                    onClick={async () => {
                                        const link = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}`;
                                        try {
                                            await navigator.clipboard.writeText(link);
                                            setCopiedMessage('telegram');
                                            setTimeout(() => setCopiedMessage(''), 1600);
                                        } catch (e) {}
                                    }}
                                />

                                <ShareChip
                                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 12.08a10 10 0 11-2.83-6.8L22 12.08z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                    label={copiedMessage === 'whatsapp' ? 'کپی شد' : 'واتس‌اپ'}
                                    onClick={async () => {
                                        const link = `https://api.whatsapp.com/send?text=${encodeURIComponent(window.location.href)}`;
                                        try {
                                            await navigator.clipboard.writeText(link);
                                            setCopiedMessage('whatsapp');
                                            setTimeout(() => setCopiedMessage(''), 1600);
                                        } catch (e) {}
                                    }}
                                /> */}
                            </div>
                    </div>

                    <CommentsSection 
                        comments={commentSlice}
                        totalCount={commentsTotal}
                        hasMore={commentsHasMore}
                        onLoadMore={handleLoadMoreComments}
                        averageRating={post.rating}
                        voteCount={post.voteCount}
                        onCommentSubmit={handleCommentSubmit}
                        onReply={handleCommentReply}
                        onReport={handleReport}
                        onEdit={handleEditComment}
                        onDelete={handleDeleteComment}
                        onRate={handleRate}
                    />
                </main>
                <PopularPosts posts={popularPostsData} />
            </div>
            {/* Page footer */}
            <Footer />
            {showVideo && (
                <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}} onClick={() => setShowVideo(false)}>
                    <div style={{width:'min(900px, 92vw)', aspectRatio:'16/9', background:'#000', borderRadius:12, overflow:'hidden'}} onClick={(e) => e.stopPropagation()}>
                        {/* Placeholder video embed */}
                        <iframe title="video" width="100%" height="100%" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    </div>
                </div>
            )}
            {/* Theme switcher moved into Header (global) */}
        </div>
    );
};

export default BlogPage;

// Lightweight Table of Contents component: extracts h2/h3 from HTML string
function ToC({ html, markdown }) {
    try {
        // Prefer markdown if provided; else parse headings from HTML
        let items = [];
        if (markdown && typeof markdown === 'string' && markdown.trim()) {
            // Extract lines starting with ## or ### as headings
            const lines = markdown.split(/\r?\n/);
            for (const line of lines) {
                const m2 = line.match(/^\s{0,3}##\s+(.+)/); // h2
                const m3 = line.match(/^\s{0,3}###\s+(.+)/); // h3
                if (m2) items.push({ level: 2, text: m2[1].trim() });
                else if (m3) items.push({ level: 3, text: m3[1].trim() });
            }
        } else if (html) {
            const div = document.createElement('div');
            div.innerHTML = html || '';
            const hs = Array.from(div.querySelectorAll('h2, h3'));
            items = hs.map(h => ({ level: h.tagName === 'H3' ? 3 : 2, text: h.textContent || '' }));
        }
        if (!items.length) return null;
        return (
            <aside style={{ background:'var(--bg-main)', border:'1px solid var(--border-color)', borderRadius:12, padding:'12px 14px', margin:'12px 0' }}>
                <div style={{fontWeight:600, marginBottom:6}}>فهرست</div>
                <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:6 }}>
                    {items.map((it, i) => (
                        <li key={i} style={{ fontSize:'.95rem', color:'var(--text-secondary)', paddingInlineStart: it.level === 3 ? 12 : 0 }}>
                            {it.text}
                        </li>
                    ))}
                </ul>
            </aside>
        );
    } catch {
        return null;
    }
}
