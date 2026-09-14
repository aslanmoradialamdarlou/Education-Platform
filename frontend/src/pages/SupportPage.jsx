import React, { useEffect, useState } from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';

const STORAGE_KEY = 'support_tickets';

export default function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('account');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setTickets(JSON.parse(raw));
    } catch {}
  }, []);

  const saveTickets = (list) => {
    setTickets(list);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
  };

  const submit = (e) => {
    e.preventDefault();
    const ticket = {
      id: `t-${Date.now()}`,
      subject, category, email,
      thread: [
        { id: `m-${Date.now()}`, author: 'user', body: message, at: new Date().toISOString() }
      ],
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    const next = [ticket, ...tickets].slice(0, 10);
    saveTickets(next);
    setSubject(''); setCategory('account'); setEmail(''); setMessage(''); setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  return (
    <div className="page-shell" style={{background:'var(--bg-main)', color:'var(--text-primary)'}}>
      <Header />
  <main className="page-main supportGrid" style={{maxWidth: 1200, margin: '1rem auto 0', padding: '2rem'}}>
        <section style={{background:'var(--bg-content)', border:'1px solid var(--border-color)', borderRadius:12, padding:'1rem'}}>
          <h1 className="pageTitle" style={{marginBottom:'1rem'}}>پشتیبانی</h1>
          <p style={{color:'var(--text-secondary)'}}>پیش از ارسال تیکت، شاید پاسخ خود را در <a href="/faq" style={{color:'var(--accent-primary-solid)'}}>سوالات متداول</a> بیابید.</p>
          {sent && <div style={{margin:'8px 0', color:'var(--accent-primary-solid)'}}>تیکت شما ثبت شد.</div>}
          <form onSubmit={submit} style={{display:'grid', gap:10, marginTop:8}}>
            <label>موضوع
              <input value={subject} onChange={(e)=>setSubject(e.target.value)} required style={{width:'100%', padding:10, border:'1px solid var(--border-color)', borderRadius:8, background:'var(--bg-main)', color:'var(--text-primary)'}} />
            </label>
            <label>دسته‌بندی
              <select value={category} onChange={(e)=>setCategory(e.target.value)} style={{width:'100%', padding:10, border:'1px solid var(--border-color)', borderRadius:8, background:'var(--bg-main)', color:'var(--text-primary)'}}>
                <option value="account">حساب کاربری</option>
                <option value="subscription">اشتراک</option>
                <option value="payment">پرداخت</option>
                <option value="content">محتوا</option>
                <option value="bug">گزارش مشکل</option>
              </select>
            </label>
            <label>ایمیل (اختیاری)
              <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="example@mail.com" style={{width:'100%', padding:10, border:'1px solid var(--border-color)', borderRadius:8, background:'var(--bg-main)', color:'var(--text-primary)'}} />
            </label>
            <label>توضیحات
              <textarea value={message} onChange={(e)=>setMessage(e.target.value)} rows={6} required style={{width:'100%', padding:10, border:'1px solid var(--border-color)', borderRadius:8, background:'var(--bg-main)', color:'var(--text-primary)', resize:'none'}} />
            </label>
            <button type="submit" style={{justifySelf:'start', background:'var(--accent-primary-solid)', color:'#fff', border:'none', padding:'10px 16px', borderRadius:8, cursor:'pointer'}}>ارسال تیکت</button>
          </form>
        </section>

        <aside style={{background:'var(--bg-content)', border:'1px solid var(--border-color)', borderRadius:12, padding:'1rem'}}>
          <h2 style={{marginBottom:'1rem'}}>تیکت‌های اخیر</h2>
          {tickets.length === 0 ? (
            <div style={{color:'var(--text-secondary)'}}>هیچ تیکتی ثبت نشده است.</div>
          ) : (
            <TicketList tickets={tickets} onReply={(id, body) => {
              const next = tickets.map(t => t.id === id ? ({ ...t, thread: [...(t.thread||[]), { id: `m-${Date.now()}`, author: 'user', body, at: new Date().toISOString() }] }) : t);
              saveTickets(next);
            }} />
          )}
        </aside>
      </main>
      <Footer />
    </div>
  );
}

function TicketList({ tickets, onReply }) {
  return (
    <ul style={{listStyle:'none', padding:0, margin:0, display:'grid', gap:8}}>
      {tickets.map(t => (
        <li key={t.id} style={{border:'1px solid var(--border-color)', borderRadius:8, padding:10, background:'var(--bg-main)'}}>
          <div style={{display:'flex', justifyContent:'space-between', gap:8}}>
            <strong>{t.subject}</strong>
            <span style={{color:'var(--text-secondary)', fontSize:12}}>{new Date(t.createdAt).toLocaleString()}</span>
          </div>
          <div style={{color:'var(--text-secondary)', fontSize:12, marginTop:4}}>دسته: {t.category} • وضعیت: {t.status}</div>
          <div style={{marginTop:8, display:'grid', gap:6}}>
            {(t.thread||[]).map(msg => (
              <div key={msg.id} style={{border:'1px solid var(--border-color)', borderRadius:8, padding:'8px 10px', background: msg.author === 'admin' ? 'rgba(0, 150, 136, .08)' : 'transparent'}}>
                <div style={{display:'flex', justifyContent:'space-between', gap:8, fontSize:12, color:'var(--text-secondary)'}}>
                  <span>{msg.author === 'admin' ? 'پشتیبانی' : 'شما'}</span>
                  <span>{new Date(msg.at).toLocaleString()}</span>
                </div>
                <div style={{marginTop:4, color:'var(--text-primary)'}}>{msg.body}</div>
              </div>
            ))}
          </div>
          <ReplyBox onSend={(text) => onReply && onReply(t.id, text)} />
        </li>
      ))}
    </ul>
  );
}

function ReplyBox({ onSend }) {
  const [text, setText] = useState('');
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; onSend(text.trim()); setText(''); }} style={{marginTop:8, display:'flex', gap:8}}>
      <input value={text} onChange={(e)=>setText(e.target.value)} placeholder="پاسخ شما..." style={{flex:1, padding:8, border:'1px solid var(--border-color)', borderRadius:8, background:'var(--bg-main)', color:'var(--text-primary)'}} />
      <button type="submit" style={{background:'var(--accent-primary-solid)', color:'#fff', border:'none', padding:'8px 12px', borderRadius:8, cursor:'pointer'}}>ارسال</button>
    </form>
  );
}
