import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './QuestionBank.module.css';

/* Minimal collapsible section replacing MUI Accordion */
const CollapsibleSection = ({ title, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  const bodyRef = useRef(null);
  const innerRef = useRef(null);
  const animationTimeout = useRef(null);
  const [inlineHeight, setInlineHeight] = useState(defaultOpen ? 'auto' : '0px');

  // Function to recalc height when open
  const recalc = (opts = { animated: true }) => {
    const body = bodyRef.current;
    if (!body) return;
    if (!open) return; // only relevant when open
    // Temporarily set to 'auto' to measure natural height changes after previous 'auto'
    body.style.maxHeight = 'none';
    const target = body.scrollHeight;
    // If currently auto and we need to animate growth, we set explicit pixel then next frame set to new height
    if (opts.animated) {
      // Start from current pixel height (if auto, compute from previous target)
      const current = body.getBoundingClientRect().height;
      body.style.maxHeight = current + 'px';
      requestAnimationFrame(() => {
        body.style.maxHeight = target + 'px';
      });
      // After transition ends, set to auto again for flexible future growth
      clearTimeout(animationTimeout.current);
      animationTimeout.current = setTimeout(() => {
        if (open) {
          body.style.maxHeight = 'auto';
        }
      }, 320);
    } else {
      body.style.maxHeight = target + 'px';
      clearTimeout(animationTimeout.current);
      animationTimeout.current = setTimeout(() => {
        if (open) body.style.maxHeight = 'auto';
      }, 20);
    }
  };

  // Handle open/close transitions
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    clearTimeout(animationTimeout.current);
    if (open) {
      body.style.display = 'block';
      // Set from 0 -> target
      // Hide overflow only during the expand animation, then restore to visible
      body.style.overflow = 'hidden';
      const target = body.scrollHeight;
      body.style.maxHeight = '0px';
      requestAnimationFrame(() => {
        body.style.maxHeight = target + 'px';
      });
      animationTimeout.current = setTimeout(() => {
        if (open) {
          body.style.maxHeight = 'auto';
          // Critical: allow dropdowns/overlays inside to escape and be scrollable
          body.style.overflow = 'visible';
        }
      }, 320);
    } else {
      // Collapse from current height -> 0
      const current = body.scrollHeight;
      body.style.maxHeight = current + 'px';
      requestAnimationFrame(() => {
        body.style.maxHeight = '0px';
        // During collapse keep overflow hidden to avoid content popping out
        body.style.overflow = 'hidden';
      });
    }
    return () => clearTimeout(animationTimeout.current);
  }, [open]);

  // Observe size/content changes when open
  useEffect(() => {
    if (!open) return; // will re-run when open changes
    const inner = innerRef.current;
    if (!inner) return;

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        recalc({ animated: true });
      });
      ro.observe(inner);
    } else {
      // Fallback MutationObserver
      const mo = new MutationObserver(() => recalc({ animated: true }));
      mo.observe(inner, { childList: true, subtree: true, characterData: true });
      ro = { disconnect: () => mo.disconnect() };
    }
    return () => ro && ro.disconnect();
  }, [open]);

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(animationTimeout.current), []);

  return (
    <section className={`${styles.collapsible} ${open ? styles.collapsibleOpen : ''}`}>
      <button
        type="button"
        className={styles.collapsibleHeader}
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <span>{title}</span>
        <ChevronDown className={styles.collapsibleIcon} size={18} />
      </button>
      <div
        ref={bodyRef}
        className={styles.collapsibleBody}
        style={{ maxHeight: inlineHeight }}
        aria-hidden={!open}
      >
        <div ref={innerRef} className={styles.collapsibleInner}>{children}</div>
      </div>
    </section>
  );
};

export default CollapsibleSection;
