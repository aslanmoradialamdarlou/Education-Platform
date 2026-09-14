import { useEffect, useRef, useState } from 'react';

export default function useReveal(options = { threshold: 0.1, rootMargin: '0px' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          setVisible(true);
        }
      });
    }, options);
    obs.observe(el);
    return () => obs.disconnect();
  }, [options, visible]);

  return { ref, visible };
}
