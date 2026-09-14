import React, { createContext, useContext, useCallback, useState, useRef, useEffect } from 'react';
import styles from './toast.module.css';

const ToastContext = createContext({ push: () => {}, remove: () => {} });

let idSeq = 0;

export const ToastProvider = ({ children, max = 5, duration = 4500 }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const remove = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id));
    const tm = timers.current.get(id);
    if (tm) { clearTimeout(tm); timers.current.delete(id); }
  }, []);

  const push = useCallback((toast) => {
    const id = ++idSeq;
    setToasts(prev => {
      const next = [...prev, { id, type: toast.type || 'info', message: toast.message || '', title: toast.title }];
      return next.slice(-max);
    });
    if (duration > 0) {
      const tm = setTimeout(() => remove(id), duration);
      timers.current.set(id, tm);
    }
    return id;
  }, [duration, max, remove]);

  useEffect(() => () => { timers.current.forEach(t => clearTimeout(t)); }, []);

  return (
    <ToastContext.Provider value={{ push, remove }}>
      {children}
      <div className={styles.toastViewport} role="region" aria-label="اعلان ها">
        {toasts.map(t => (
          <div key={t.id} className={`${styles.toast} ${styles[t.type]}`} role="status">
            <div className={styles.toastContent}>
              {t.title && <div className={styles.toastTitle}>{t.title}</div>}
              <div className={styles.toastMessage}>{t.message}</div>
            </div>
            <button className={styles.toastClose} aria-label="بستن" onClick={() => remove(t.id)}>×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
