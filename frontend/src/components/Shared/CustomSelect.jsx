import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './CustomSelect.module.css';

function normalizeOptions(options) {
  return (options || []).map(o =>
    typeof o === 'string' ? { value: o, label: o } : o
  );
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'انتخاب کنید…',
  disabled = false,
  maxHeight = 120,
  rtl = true,
  ariaLabel,
  className = '',
  id,
  usePortal = false,
}) {
  const opts = useMemo(() => normalizeOptions(options), [options]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() => {
    const idx = opts.findIndex(o => o.value === value);
    return idx >= 0 ? idx : 0;
  });

  const rootRef = useRef(null);
  const listRef = useRef(null);
  const menuWrapRef = useRef(null);
  const [menuRect, setMenuRect] = useState(null); // {top,left,width}

  const current = useMemo(() => opts.find(o => o.value === value) || null, [opts, value]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      const root = rootRef.current;
      const menuEl = menuWrapRef.current;
      const target = e.target;
      const insideRoot = !!(root && root.contains(target));
      const insideMenu = !!(menuEl && menuEl.contains(target));
      if (!insideRoot && !insideMenu) setOpen(false);
    };
    document.addEventListener('mousedown', onDown, true);
    return () => document.removeEventListener('mousedown', onDown, true);
  }, [open]);

  // Scroll active option into view when opening or moving
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${activeIndex}"]`);
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [open, activeIndex]);

  const toggle = useCallback(() => {
    if (disabled) return;
    setOpen(o => !o);
  }, [disabled]);

  const selectAt = useCallback((idx) => {
    const opt = opts[idx];
    if (!opt) return;
    onChange?.(opt.value);
    setOpen(false);
  }, [opts, onChange]);

  const onKeyDown = useCallback((e) => {
    if (disabled) return;
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!open) {
          setOpen(true);
        } else {
          selectAt(activeIndex);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!open) { setOpen(true); return; }
        setActiveIndex(i => Math.min(i + 1, opts.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) { setOpen(true); return; }
        setActiveIndex(i => Math.max(i - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(opts.length - 1);
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
      default:
        break;
    }
  }, [disabled, open, activeIndex, opts.length, selectAt]);

  // Position the menu when opening or on scroll/resize if using portal
  useEffect(() => {
    if (!open) { setMenuRect(null); return; }
    if (!usePortal) return;
    const update = () => {
      const el = rootRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setMenuRect({ top: Math.round(r.bottom + 6), left: Math.round(r.left), width: Math.round(r.width) });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, usePortal]);

  const controlId = id || `cs-${Math.random().toString(36).slice(2, 9)}`;
  const listId = `${controlId}-listbox`;

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${open ? styles.open : ''} ${disabled ? styles.disabled : ''} ${className}`}
      dir={rtl ? 'rtl' : 'ltr'}
    >
      <button
        type="button"
        id={controlId}
        className={styles.control}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={toggle}
        onKeyDown={onKeyDown}
        disabled={disabled}
      >
        <span className={styles.value}>
          {current ? current.label : <span className={styles.placeholder}>{placeholder}</span>}
        </span>
        <span className={styles.arrow} aria-hidden>▾</span>
      </button>

      {open && (
        usePortal && menuRect
          ? createPortal(
              <div ref={menuWrapRef} className={styles.menuWrap} style={{ position: 'fixed', top: menuRect.top, left: menuRect.left, width: menuRect.width, right: 'auto', zIndex: 1000002 }}>
                <ul
                  id={listId}
                  className={styles.menu}
                  role="listbox"
                  aria-labelledby={controlId}
                  ref={listRef}
                  style={{ maxHeight }}
                >
                  {opts.map((opt, idx) => {
                    const selected = value === opt.value;
                    const active = idx === activeIndex;
                    return (
                      <li
                        key={opt.value}
                        role="option"
                        aria-selected={selected}
                        tabIndex={-1}
                        className={`${styles.option} ${selected ? styles.optionSelected : ''} ${active ? styles.optionActive : ''}`}
                        data-index={idx}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onMouseDown={(e) => { e.preventDefault(); }}
                        onClick={() => selectAt(idx)}
                      >
                        {opt.label}
                      </li>
                    );
                  })}
                </ul>
              </div>,
              document.body
            )
          : (
              <div ref={menuWrapRef} className={styles.menuWrap}>
                <ul
                  id={listId}
                  className={styles.menu}
                  role="listbox"
                  aria-labelledby={controlId}
                  ref={listRef}
                  style={{ maxHeight }}
                >
                  {opts.map((opt, idx) => {
                    const selected = value === opt.value;
                    const active = idx === activeIndex;
                    return (
                      <li
                        key={opt.value}
                        role="option"
                        aria-selected={selected}
                        tabIndex={-1}
                        className={`${styles.option} ${selected ? styles.optionSelected : ''} ${active ? styles.optionActive : ''}`}
                        data-index={idx}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onMouseDown={(e) => { e.preventDefault(); }}
                        onClick={() => selectAt(idx)}
                      >
                        {opt.label}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )
      )}
    </div>
  );
}
