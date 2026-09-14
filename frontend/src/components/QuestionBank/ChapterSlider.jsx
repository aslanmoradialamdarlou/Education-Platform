import React, { useState, useCallback, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './QuestionBank.module.css';

/* Lightweight dual-handle slider (range) without external libs */
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const ChapterSlider = ({ grade, chapter, pageStart, pageEnd, onDelete, className = '', onRangeChange }) => {
    const [range, setRange] = useState([pageStart, pageEnd]);
    const trackRef = useRef(null);

    // percent helpers
    const toPercent = useCallback((val) => ((val - pageStart) / (pageEnd - pageStart)) * 100, [pageStart, pageEnd]);
    const fromClientX = useCallback((clientX) => {
        const rect = trackRef.current.getBoundingClientRect();
        const pct = clamp((clientX - rect.left) / rect.width, 0, 1);
        const raw = pageStart + pct * (pageEnd - pageStart);
        return Math.round(raw);
    }, [pageStart, pageEnd]);

    const startDrag = (idx, e) => {
        e.preventDefault();
        const move = (ev) => {
            const val = fromClientX(ev.clientX);
            setRange(prev => {
                const next = [...prev];
                next[idx] = val;
                if (next[0] > next[1]) next.sort((a,b)=>a-b);
                if (onRangeChange) onRangeChange(next[0], next[1]);
                return next;
            });
        };
        const up = () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', up);
        };
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
    };

    // keyboard support
    const handleKey = (idx, e) => {
        let delta = 0;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') delta = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') delta = 1;
        if (delta !== 0) {
            e.preventDefault();
            setRange(prev => {
                const next = [...prev];
                next[idx] = clamp(next[idx] + delta, pageStart, pageEnd);
                if (next[0] > next[1]) next.sort((a,b)=>a-b);
                if (onRangeChange) onRangeChange(next[0], next[1]);
                return next;
            });
        }
    };

    // keep internal aligned if props change (unlikely in current usage)
    useEffect(() => { setRange([pageStart, pageEnd]); }, [pageStart, pageEnd]);

    const p0 = toPercent(range[0]);
    const p1 = toPercent(range[1]);

    return (
        <div className={`${styles.chapterSliderContainer} ${styles.chapterSliderRoot || ''} ${className}`.trim()}>
            <div className={styles.chapterSliderHeader}>
                <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '.85rem' }}>{grade}: {chapter}</span>
                <button type="button" onClick={onDelete} className={styles.closeSliderBtn} aria-label="حذف" style={{background:'none',border:0,cursor:'pointer',color:'var(--text-secondary)'}}>
                    <X size={16} />
                </button>
            </div>
            <div className={styles.rangeWrapper}>
                <div ref={trackRef} className={styles.rangeTrack}>
                    <div className={styles.rangeFill} style={{ left: p0 + '%', width: (p1 - p0) + '%' }} />
                    <button
                        type="button"
                        className={styles.rangeThumb}
                        style={{ left: p0 + '%' }}
                        onMouseDown={(e)=>startDrag(0,e)}
                        onKeyDown={(e)=>handleKey(0,e)}
                        role="slider"
                        aria-label="حداقل صفحه"
                        aria-valuemin={pageStart}
                        aria-valuemax={pageEnd}
                        aria-valuenow={range[0]}
                        aria-valuetext={`${range[0]}`}
                        tabIndex={0}
                    />
                    <button
                        type="button"
                        className={styles.rangeThumb}
                        style={{ left: p1 + '%' }}
                        onMouseDown={(e)=>startDrag(1,e)}
                        onKeyDown={(e)=>handleKey(1,e)}
                        role="slider"
                        aria-label="حداکثر صفحه"
                        aria-valuemin={pageStart}
                        aria-valuemax={pageEnd}
                        aria-valuenow={range[1]}
                        aria-valuetext={`${range[1]}`}
                        tabIndex={0}
                    />
                </div>
                <div className={styles.rangeValues}>
                    <span>{range[0]}</span>
                    <span>تا</span>
                    <span>{range[1]}</span>
                </div>
            </div>
        </div>
    );
};

export default ChapterSlider;
