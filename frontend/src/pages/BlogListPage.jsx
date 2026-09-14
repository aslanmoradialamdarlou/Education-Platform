import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import styles from '../components/Blog/Blog.module.css';
import blogApi from '../api/blogApi';

export default function BlogListPage() {
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 8;
  const qParam = searchParams.get('q') || '';
  const [q, setQ] = useState(qParam);
  const [debouncedQ, setDebouncedQ] = useState(qParam);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    blogApi.fetchPosts({ page, pageSize, q: debouncedQ, signal: controller.signal })
      .then(res => { setPosts(res.items); setTotal(res.total); setLoading(false); })
      .catch(err => { if (controller.signal.aborted) return; setError(err.message || 'خطا'); setLoading(false); });
    return () => controller.abort();
  }, [page, debouncedQ]);

  // sync q param
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (debouncedQ) next.set('q', debouncedQ); else next.delete('q');
    if (page > 1) next.set('page', String(page)); else next.delete('page');
    const changed = next.toString() !== searchParams.toString();
    if (changed) setSearchParams(next, { replace: true });
  }, [debouncedQ, page]);

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className={styles.blogPage}>
      <Header />
      <div className={styles.blogLayout}>
        <main className={styles.mainContent} style={{padding:24}}>
          <h1 style={{marginBottom:'1rem'}}>آخرین مطالب</h1>
          <div style={{display:'flex', gap:'.75rem', alignItems:'center', marginBottom:'1rem'}}>
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); if (page !== 1) setSearchParams(ps => { const n = new URLSearchParams(ps); n.set('q', e.target.value); n.delete('page'); return n; }); }}
              placeholder="جستجوی عنوان یا تاریخ"
              aria-label="جستجو"
              style={{flex:1, background:'var(--bg-main)', border:'1px solid var(--border-color)', borderRadius:8, padding:'.6rem .75rem', fontFamily:'inherit'}}
            />
            {q && <button onClick={() => setQ('')} style={{background:'var(--bg-main)', border:'1px solid var(--border-color)', borderRadius:8, padding:'.55rem .9rem', cursor:'pointer'}}>پاک</button>}
          </div>
          {loading && (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'1rem'}}>
              {Array.from({length:6}).map((_,i) => (
                <div key={i} style={{border:'1px solid var(--border-color)', borderRadius:'12px', overflow:'hidden', background:'var(--bg-content)'}}>
                  <div style={{width:'100%', height:160, background:'var(--bg-main)'}} />
                  <div style={{padding:'0.75rem 1rem'}}>
                    <div style={{height:18, width:'70%', background:'var(--bg-main)', borderRadius:6, marginBottom:8}} />
                    <div style={{height:14, width:'40%', background:'var(--bg-main)', borderRadius:6}} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {error && !loading && <div style={{color:'var(--danger-color)'}}>خطا: {error}</div>}
          {!loading && !error && (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'1rem'}}>
              {posts.map(p => (
                <Link key={p.id} to={`/blogs/${p.id}`} style={{textDecoration:'none', color:'inherit'}}>
                  <article style={{border:'1px solid var(--border-color)', borderRadius:'12px', overflow:'hidden', background:'var(--bg-content)'}}>
                    <div style={{width:'100%', height:160, background:'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))', borderBottom:'1px solid var(--border-color)', overflow:'hidden'}} aria-hidden="true">
                      <img src={p.featuredImage} alt={p.title} loading="lazy" onError={(e) => { try { e.currentTarget.style.display = 'none'; } catch {} }} style={{width:'100%', height:'100%', objectFit:'cover', display:'block'}} />
                    </div>
                    <div style={{padding:'0.75rem 1rem'}}>
                      <h3 style={{fontSize:'1rem', margin:'0 0 .4rem 0', color:'var(--text-primary)'}}>{p.title}</h3>
                      <div style={{fontSize:'.8rem', color:'var(--text-secondary)'}}>{p.date}</div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
          {!loading && !error && pages > 1 && (
            <div style={{display:'flex', gap:'.5rem', justifyContent:'center', marginTop:'1rem'}}>
              <button className={styles.chipBtn} onClick={() => setSearchParams({ page: String(Math.max(1, page-1)) })} disabled={page<=1}>قبلی</button>
              <span style={{fontSize:'.85rem', color:'var(--text-secondary)'}}>صفحه {page} از {pages}</span>
              <button className={styles.chipBtn} onClick={() => setSearchParams({ page: String(Math.min(pages, page+1)) })} disabled={page>=pages}>بعدی</button>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}
