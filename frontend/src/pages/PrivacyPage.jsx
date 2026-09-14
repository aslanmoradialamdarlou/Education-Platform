import React from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';

export default function PrivacyPage() {
  return (
    <div className="page-shell" style={{background:'var(--bg-main)', color:'var(--text-primary)'}}>
      <Header />
  <main className="page-main" style={{maxWidth: 1200, margin: '1rem auto 0', padding: '2rem', background:'var(--bg-content)', border:'1px solid var(--border-color)', borderRadius:'12px'}}>
  <h1 className="pageTitle" style={{marginBottom:'1rem'}}>حریم خصوصی</h1>
        <p style={{color:'var(--text-secondary)'}}>ما به حفظ حریم خصوصی شما متعهدیم. اطلاعات شخصی شما تنها برای ارائه خدمات بهتر استفاده می‌شود.</p>
      </main>
      <Footer />
    </div>
  );
}
