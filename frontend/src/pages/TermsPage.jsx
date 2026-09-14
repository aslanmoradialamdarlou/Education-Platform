import React from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';

export default function TermsPage() {
  return (
    <div className="page-shell" style={{background:'var(--bg-main)', color:'var(--text-primary)'}}>
      <Header />
  <main className="page-main" style={{maxWidth: 1200, width: '90%', margin: '2rem auto 0', padding: '2rem', background:'var(--bg-content)', border:'1px solid var(--border-color)', borderRadius:'12px'}}>
  <h1 className="pageTitle" style={{marginBottom:'1rem'}}>قوانین و مقررات</h1>
        <p style={{color:'var(--text-secondary)'}}>این صفحه شامل شرایط استفاده از خدمات است. استفاده شما از پلتفرم به منزله پذیرش این قوانین است.</p>
      </main>
      <Footer />
    </div>
  );
}
