import React, { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';
import styles from './BackToTop.module.css';

export default function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 300);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const goTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  if (!show) return null;
  return (
    <button className={styles.btn} onClick={goTop} aria-label="بازگشت به بالا">
      <ChevronUp size={18} />
    </button>
  );
}
