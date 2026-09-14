import React, { useMemo, useRef, useState, useEffect } from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';

const faqs = [
  { q: 'چگونه اشتراک تهیه کنم؟', a: 'به صفحه اشتراک‌ها بروید، یک طرح انتخاب کنید و مراحل پرداخت را طی کنید.' },
  { q: 'آیا می‌توانم اشتراک را لغو کنم؟', a: 'بله، هر زمان می‌توانید از پروفایل خود مدیریت اشتراک را انجام دهید.' },
  { q: 'چطور با پشتیبانی ارتباط بگیرم؟', a: 'از طریق ایمیل support@example.com یا صفحه تماس با ما اقدام کنید.' },
];

export default function FaqPage() {
  const [open, setOpen] = useState(-1);
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const term = q.trim();
    if (!term) return faqs;
    return faqs.filter(item => (item.q + ' ' + item.a).toLowerCase().includes(term.toLowerCase()));
  }, [q]);
  return (
    <div className="page-shell" style={{background:'var(--bg-main)', color:'var(--text-primary)'}}>
      <Header />
      <main className="page-main" style={{maxWidth: 1200, width: '90%', margin: '1rem auto  0', padding: '2rem', background:'var(--bg-content)', border:'1px solid var(--border-color)', borderRadius:'12px'}}>
  <h1 className="pageTitle" style={{marginBottom:'1rem'}}>سوالات متداول</h1>
        <input placeholder="جستجو در سوالات..." value={q} onChange={(e) => setQ(e.target.value)} style={{width:'100%', padding:10, border:'1px solid var(--border-color)', borderRadius:8, background:'var(--bg-main)', color:'var(--text-primary)', marginBottom:12}} />
        <div>
          {filtered.map((item, idx) => (
            <AccordionItem key={idx} title={item.q} open={open === idx} onChange={(val) => setOpen(val ? idx : (open === idx ? -1 : open))}>
              {item.a}
            </AccordionItem>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function AccordionItem({ title, children, open, onChange }) {
  const contentRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (open) {
      // Set to exact height to animate open, then let it relax to auto
      const h = el.scrollHeight;
      setHeight(h);
    } else {
      // If closing from auto, snap to current height, then to 0
      const h = el.scrollHeight;
      setHeight(h);
      requestAnimationFrame(() => setHeight(0));
    }
  }, [open]);

  const onTransitionEnd = () => {
    // After opening, let height be auto to accommodate dynamic content
    if (open) setHeight('auto');
  };

  return (
    <div style={{border:'1px solid var(--border-color)', borderRadius:8, marginBottom:8, background:'var(--bg-main)'}}>
      <button onClick={() => onChange && onChange(!open)} style={{width:'100%', textAlign:'right', padding:'0.75rem 0.9rem', background:'transparent', border:'none', color:'var(--text-primary)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8}}>
        <span>{title}</span>
        <span style={{transform:`rotate(${open ? 180 : 0}deg)`, transition:'transform .2s ease'}} aria-hidden>▾</span>
      </button>
      <div style={{overflow:'hidden', transition:'height .25s ease', height: height}} onTransitionEnd={onTransitionEnd} aria-hidden={!open}>
        <div ref={contentRef} style={{padding:'0 0.9rem 0.75rem', color:'var(--text-secondary)'}}>{children}</div>
      </div>
    </div>
  );
}
