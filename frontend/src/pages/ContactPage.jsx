import React, { useState } from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    // placeholder: integrate backend later
    console.log('CONTACT_FORM', { name, email, message });
    setSent(true);
    setName(''); setEmail(''); setMessage('');
  };

  return (
    <div className="page-shell" style={{background:'var(--bg-main)', color:'var(--text-primary)'}}>
      <Header />
  <main className="page-main" style={{maxWidth: 1200, margin: '1rem auto 0', padding: '2rem', background:'var(--bg-content)', border:'1px solid var(--border-color)', borderRadius:'12px'}}>
  <h1 className="pageTitle" style={{marginBottom:'1rem'}}>تماس با ما</h1>
        {sent && <div style={{marginBottom:12, color:'var(--accent-primary-solid)'}}>پیام شما ارسال شد. متشکریم!</div>}
        <form onSubmit={submit} style={{display:'grid', gap:12}}>
          <label>
            نام و نام خانوادگی
            <input value={name} onChange={(e) => setName(e.target.value)} required style={{width:'100%', padding:10, border:'1px solid var(--border-color)', borderRadius:8, background:'var(--bg-main)', color:'var(--text-primary)'}} />
          </label>
          <label>
            ایمیل
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{width:'100%', padding:10, border:'1px solid var(--border-color)', borderRadius:8, background:'var(--bg-main)', color:'var(--text-primary)'}} />
          </label>
          <label>
            پیام
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} required style={{width:'100%', padding:10, border:'1px solid var(--border-color)', borderRadius:8, background:'var(--bg-main)', color:'var(--text-primary)'}} />
          </label>
          <button type="submit" style={{justifySelf:'start', background:'var(--accent-primary-solid)', color:'#fff', border:'none', padding:'10px 16px', borderRadius:8, cursor:'pointer'}}>ارسال</button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
