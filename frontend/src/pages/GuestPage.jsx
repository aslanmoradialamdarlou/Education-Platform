import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from '../components/guest/GuestPage.module.css';
import { useUser } from '../context/UserContext';
import { track } from '../utils/analytics';
import Hero from '../components/guest/Hero';
import Features from '../components/guest/Features';
import HowItWorks from '../components/guest/HowItWorks';
import Testimonials from '../components/guest/Testimonials';
import FinalCTA from '../components/guest/FinalCTA';
import GuestFooter from '../components/Footer/GuestFooter';
import BackToTop from '../components/Shared/BackToTop';

export default function GuestPage() {
  useUser();
  const nav = useNavigate();
  const { search } = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const next = params.get('next') || '/';

  // Route guard disabled in mock environment to allow testing Guest page while a default user exists.
  // In production, consider redirecting authenticated users to dashboard/home.

  // SEO meta
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'المنو - شروع سریع برای مهمانان';
    const metaDesc = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    metaDesc.setAttribute('content', 'پیش‌نمایش محتوای آموزشی المنو، مشاهده محدود ویدیوها، جزوه‌ها و بانک سوالات، و ثبت‌نام سریع برای امکانات کامل.');
    document.head.appendChild(metaDesc);
    const ogTitle = document.querySelector('meta[property="og:title"]') || document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    ogTitle.setAttribute('content', 'المنو - شروع سریع برای مهمانان');
    document.head.appendChild(ogTitle);
    const ogDesc = document.querySelector('meta[property="og:description"]') || document.createElement('meta');
    ogDesc.setAttribute('property', 'og:description');
    ogDesc.setAttribute('content', 'به عنوان مهمان، بخش‌هایی از محتوای آموزشی المنو را پیش‌نمایش کنید و برای دسترسی کامل ثبت‌نام کنید.');
    document.head.appendChild(ogDesc);
    const linkCanonical = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    linkCanonical.setAttribute('rel', 'canonical');
    linkCanonical.setAttribute('href', window.location.origin + '/guest');
    document.head.appendChild(linkCanonical);
    return () => { document.title = prevTitle; };
  }, []);

  useEffect(() => { track('guest_page_viewed', { next }); }, [next]);

  const ctaSignupHref = `/signup?next=${encodeURIComponent(next)}`;
  // const ctaLoginHref = `/login?next=${encodeURIComponent(next)}`; // may be used later

  const handleSignup = () => {
    track('cta_clicked', { where: 'final', type: 'signup', next });
    nav(ctaSignupHref);
  };

  return (
    <main className={styles.page}>
    <a id="top" href="#top" className={styles.srOnly}>top</a>
      <Hero onSignup={handleSignup} />
      <Features />
      <HowItWorks />
      <Testimonials />
      <FinalCTA onSignup={handleSignup} />
  <GuestFooter />
      <BackToTop />
    </main>
  );
}

