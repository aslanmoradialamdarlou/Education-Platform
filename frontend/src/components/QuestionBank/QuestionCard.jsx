import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FolderPlus, Eye, AlertTriangle } from 'lucide-react';
import { Button, IconButton, Tooltip, Snackbar, Alert } from '@mui/material';
import AddToSetPopover from './AddToSetPopover';
import CreateSetModal from './CreateSetModal'; // Import the new modal
import styles from './QuestionBank.module.css';
import { sanitizeInline } from '../../utils/sanitize';
import { fetchQuestionSets, createQuestionSet, addQuestionToSet } from '../../api/questionSetService';

const QuestionCard = ({ question, onReportClick }) => {
    const [isAnswerVisible, setAnswerVisible] = useState(false);
    const [popoverAnchor, setPopoverAnchor] = useState(null);
    const [isCreateSetModalOpen, setCreateSetModalOpen] = useState(false); // State for the new modal
    const [questionSets, setQuestionSets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
    const wrapperRef = useRef(null);

    // Load user's question sets when popover opens
    useEffect(() => {
        if (popoverAnchor) {
            loadQuestionSets();
        }
    }, [popoverAnchor]);

    const loadQuestionSets = async () => {
        try {
            setLoading(true);
            const sets = await fetchQuestionSets();
            setQuestionSets(sets);
        } catch (error) {
            console.error('Error loading question sets:', error);
            setQuestionSets([]);
        } finally {
            setLoading(false);
        }
    };

    // Helper to normalize question type (handle both string and object {id, name, label})
    const normalizeType = (type) => {
        if (typeof type === 'object') {
            // Use the English name for logic, label for display
            return type?.name || type?.label || '';
        }
        return type || '';
    };

    const questionType = normalizeType(question.type);
    
    // Helper to check question type (handle various names)
    const isTypeMatch = (type, ...names) => {
        const lower = (type || '').toLowerCase();
        return names.some(name => lower.includes(name.toLowerCase()));
    };

    const handlePopoverOpen = (event) => {
        setPopoverAnchor(event.currentTarget);
    };

    const handlePopoverClose = () => {
        setPopoverAnchor(null);
    };

    const handleSelectSet = async (setId) => {
        try {
            await addQuestionToSet(setId, question.id);
            setToast({ open: true, message: 'سوال با موفقیت به مجموعه اضافه شد', severity: 'success' });
            handlePopoverClose();
        } catch (error) {
            setToast({ open: true, message: error.message || 'خطا در افزودن سوال به مجموعه', severity: 'error' });
        }
    };

    const handleCreateNewSet = async (setName) => {
        try {
            const newSet = await createQuestionSet({ name: setName });
            // Add the question to the newly created set
            await addQuestionToSet(newSet.id, question.id);
            setToast({ open: true, message: `مجموعه "${setName}" ایجاد شد و سوال به آن اضافه شد`, severity: 'success' });
            // Reload sets for next time
            loadQuestionSets();
        } catch (error) {
            setToast({ open: true, message: error.message || 'خطا در ایجاد مجموعه', severity: 'error' });
        }
    };

    const difficultyStyles = {
        'ساده': styles.difficultyEasy,
        'متوسط': styles.difficultyMedium,
        'سخت': styles.difficultyHard,
    };

    const difficultyLabel = useMemo(() => {
        const map = { easy: 'ساده', medium: 'متوسط', hard: 'سخت', 'ساده': 'ساده', 'متوسط': 'متوسط', 'سخت': 'سخت' };
        return map[question.difficulty] || 'متوسط';
    }, [question.difficulty]);

    const typeLabel = useMemo(() => {
        // If questionType is already Persian (from backend), use it
        const persianChars = /[\u0600-\u06FF]/;
        if (persianChars.test(questionType)) return questionType;

        // normalize: lowercase and remove non-alphanumeric so variants like
        // 'Multiple Choice', 'multiple_choice', 'multiple-choice', 'MCQ' all match
        const key = String(questionType || '').toLowerCase().replace(/[^a-z0-9]/g, '');

        const map = {
            // multiple choice / test
            test: 'چهارگزینه‌ای',
            mcq: 'چهارگزینه‌ای',
            multiplechoice: 'چهارگزینه‌ای',
            multiple: 'چهارگزینه‌ای',

            // true / false
            truefalse: 'درست/نادرست',
            tf: 'درست/نادرست',

            // fill in the blank
            fillblank: 'جاهای خالی',
            fillintheblank: 'جاهای خالی',

            // short / long / essay
            short: 'پاسخ کوتاه',
            shortanswer: 'پاسخ کوتاه',
            long: 'پاسخ بلند',
            longanswer: 'پاسخ بلند',
            essay: 'پاسخ بلند',

            // matching
            matching: 'وصل‌کردنی',
            match: 'وصل‌کردنی',
            // backend sometimes uses 'descriptive' for long answers
            descriptive: 'پاسخ بلند',
            descriptiveanswer: 'پاسخ بلند',
        };

        return map[key] || questionType || 'سوال';
    }, [questionType]);

    // Preprocess optional images in answer (support array field or <img> tags inside HTML)
    const answerImages = useMemo(() => {
        if (question.answerImages && Array.isArray(question.answerImages)) return question.answerImages;
        // fallback: extract img src from answer HTML if present
        if (typeof question.answer === 'string') {
            const div = document.createElement('div');
            div.innerHTML = sanitizeInline(question.answer);
            const imgs = Array.from(div.querySelectorAll('img')).map(img => img.getAttribute('src')).filter(Boolean);
            return imgs;
        }
        return [];
    }, [question.answer, question.answerImages]);

    // Smooth height animation on open/close
    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;
        // Clear any inline maxHeight first to measure natural height
        if (isAnswerVisible) {
            el.style.display = 'block';
            el.style.maxHeight = 'none';
            const target = el.scrollHeight;
            el.style.maxHeight = '0px';
            // force reflow
            // eslint-disable-next-line no-unused-expressions
            el.offsetHeight;
            el.style.maxHeight = target + 'px';
        } else {
            const current = el.scrollHeight;
            el.style.maxHeight = current + 'px';
            // force reflow
            // eslint-disable-next-line no-unused-expressions
            el.offsetHeight;
            el.style.maxHeight = '0px';
        }
    }, [isAnswerVisible]);

    // After transition ends on close, hide display to avoid tab focus into hidden content
    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;
        const handleEnd = (e) => {
            if (e.target !== el || e.propertyName !== 'max-height') return;
            if (!isAnswerVisible) {
                el.style.display = 'none';
            } else {
                el.style.maxHeight = 'none'; // allow internal resizing (e.g., lazy images) without reanimating
            }
        };
        el.addEventListener('transitionend', handleEnd);
        return () => el.removeEventListener('transitionend', handleEnd);
    }, [isAnswerVisible]);

    // Highlight search term from URL (q) if present
    const [highlightedText, setHighlightedText] = useState(null);
    useEffect(() => {
        try {
            const url = new URL(window.location.href);
            const q = url.searchParams.get('q') || '';
            if (!q) { setHighlightedText(null); return; }
            const pattern = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            const html = String(question.text || '').replace(pattern, (m) => `<mark>${m}</mark>`);
            setHighlightedText(sanitizeInline(html));
        } catch { setHighlightedText(null); }
    }, [question.text]);

    // Matching UI state: selection map leftIndex -> rightIndex
    const [matchSel, setMatchSel] = useState({});
    const leftList = Array.isArray(question.matchingLeft) ? question.matchingLeft : [];
    const rightList = Array.isArray(question.matchingRight) ? question.matchingRight : [];
    const usedRight = useMemo(() => new Set(Object.values(matchSel).filter(v => v !== null && v !== undefined)), [matchSel]);
    const correctMap = useMemo(() => {
        const m = new Map();
        if (Array.isArray(question.correctPairs)) {
            question.correctPairs.forEach(p => m.set(p.left, p.right));
        }
        return m;
    }, [question.correctPairs]);

    const handleSelectMatch = (li, ri) => {
        setMatchSel(prev => {
            // Remove previous use of ri by other lefts (enforce bijection)
            const next = { ...prev, [li]: ri };
            // Ensure uniqueness: if another left was using ri, clear it
            Object.keys(next).forEach(k => {
                const key = Number(k);
                if (key !== li && next[key] === ri) next[key] = undefined;
            });
            return next;
        });
    };

    return (
        <>
            <div className={`${styles.questionCard} ${isAnswerVisible ? styles.answerVisible : ''}`}>
                <div className={styles.cardHeader}>
                    <div className={styles.headerTags}>
                        <span className={styles.tag}>{typeLabel}</span>
                        <span className={`${styles.tag} ${difficultyStyles[difficultyLabel]}`}>{difficultyLabel}</span>
                    </div>
                    <div className={styles.headerSource}>{question.source}</div>
                </div>
                <div className={styles.cardBody}>
                    <p className={styles.questionText} dangerouslySetInnerHTML={{ __html: highlightedText ?? sanitizeInline(question.text) }} />
                    {isTypeMatch(questionType, 'test', 'mcq') && Array.isArray(question.options) && question.options.length > 0 && (
                        <ul className={styles.optionsList}>
                            {question.options.map((opt, idx) => {
                                const isCorrect = isAnswerVisible && (typeof question.correctIndex === 'number') && question.correctIndex === idx;
                                // Handle both object {id, text, ...} and plain string formats
                                const optionText = typeof opt === 'object' ? (opt?.text || opt?.label || '') : opt;
                                return (
                                    <li key={idx} className={`${styles.optionItem} ${isCorrect ? styles.optionCorrect : ''}`}>
                                        <span className={styles.optionIndex}>{String.fromCharCode(0x41 + idx)}</span>
                                        <span className={styles.optionText}>{optionText}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    {isTypeMatch(questionType, 'matching', 'match') && leftList.length > 0 && rightList.length > 0 && (
                        <div className={styles.matchingGroups}>
                            {leftList.map((txt, i) => {
                                const sel = matchSel[i];
                                const isReveal = isAnswerVisible;
                                const correctRight = correctMap.get(i);
                                const isCorrect = isReveal && sel !== undefined && sel === correctRight;
                                const isWrong = isReveal && sel !== undefined && sel !== correctRight;
                                return (
                                    <div key={i} className={`${styles.matchingGroup} ${isCorrect ? styles.matchCorrect : ''} ${isWrong ? styles.matchWrong : ''}`}>
                                        <div className={styles.matchingGroupRow}>
                                            <div className={styles.matchingItem}>
                                                <div className={styles.matchingRow}>
                                                    <span className={styles.matchingBadge}>{i + 1}</span>
                                                    <span style={{ flex: 1 }}>{txt}</span>
                                                </div>
                                            </div>
                                            <div className={styles.matchingControl}>
                                                <span className={styles.matchingBadge} aria-hidden>{sel != null && sel >= 0 ? String.fromCharCode(0x41 + sel) : '—'}</span>
                                                <select
                                                    className={styles.matchingSelect}
                                                    value={sel ?? ''}
                                                    disabled={isReveal}
                                                    onChange={(e) => {
                                                        const val = e.target.value === '' ? undefined : Number(e.target.value);
                                                        handleSelectMatch(i, val);
                                                    }}
                                                >
                                                    <option value="">انتخاب گزینه…</option>
                                                    {rightList.map((txtR, rIdx) => {
                                                        const disabled = !isReveal && usedRight.has(rIdx) && sel !== rIdx;
                                                        return (
                                                            <option key={rIdx} value={rIdx} disabled={disabled}>{String.fromCharCode(0x41 + rIdx)} — {txtR}</option>
                                                        );
                                                    })}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <div className={styles.refTagsRow}>
                        {(() => {
                            const tags = [];
                            // Normalize grade and chapter (might be objects from backend)
                            const gradeObj = question.grade || question.meta?.grade;
                            const chapterObj = question.chapter || question.meta?.chapter;
                            const bookObj = question.book || question.meta?.book;
                            
                            const grade = typeof gradeObj === 'object' ? gradeObj?.name : gradeObj;
                            const chapter = typeof chapterObj === 'object' ? chapterObj?.title : chapterObj;
                            const book = typeof bookObj === 'object' ? bookObj?.title : bookObj;
                            
                            const pageStr = question.pageRaw || question.answerRefPage || question.pageNumber || question.book_page;
                            
                            if (grade) tags.push({ key: 'grade', label: `پایه ${grade}` });
                            if (book) tags.push({ key: 'book', label: book });
                            if (chapter) tags.push({ key: 'chapter', label: chapter });
                            if (pageStr) {
                                const match = (''+pageStr).match(/\d+/);
                                if (match) tags.push({ key: 'page', label: `صفحه ${match[0]}` });
                            }
                            return tags.map(t => <span key={t.key} className={styles.refTag}>{t.label}</span>);
                        })()}
                    </div>
                </div>
                <div className={styles.cardFooter}>
                    <div className={styles.footerActions}>
                        <Tooltip title="اضافه به مجموعه سوال">
                            <IconButton onClick={handlePopoverOpen}><FolderPlus size={20} /></IconButton>
                        </Tooltip>
                        <Tooltip title="گزارش مشکل">
                            <IconButton onClick={onReportClick}><AlertTriangle size={20} /></IconButton>
                        </Tooltip>
                    </div>
                    <Button 
                        variant="contained"
                        size="small"
                        startIcon={<Eye size={14} />} 
                        onClick={() => setAnswerVisible(!isAnswerVisible)}
                        className={styles.btnPrimary}
                    >
                        {isAnswerVisible ? 'پنهان کردن' : 'نمایش پاسخ'}
                    </Button>
                </div>
                <div ref={wrapperRef} className={styles.answerWrapper} aria-hidden={!isAnswerVisible}>
                    <div className={styles.answerInner}>
                        {/* <hr /> */}
                        
                        {/* MCQ/Test type: Show the correct option */}
                        {isTypeMatch(questionType, 'test', 'mcq') && (
                            <>
                                {question.options && question.options.length > 0 ? (
                                    (() => {
                                        const correctOption = question.options.find(opt => opt?.is_correct);
                                        return correctOption ? (
                                            <p className={styles.answerLine}>
                                                <strong>پاسخ صحیح:</strong>&nbsp;
                                                <span style={{color: 'var(--success)', fontWeight: 'bold'}}>
                                                    گزینه {correctOption.label}
                                                </span>
                                                {' - '}
                                                <span dangerouslySetInnerHTML={{ __html: sanitizeInline(correctOption.text || '') }} />
                                            </p>
                                        ) : (
                                            <p className={styles.answerLine} style={{color: 'var(--text-secondary)', fontStyle: 'italic'}}>
                                                گزینه صحیح مشخص نشده است
                                            </p>
                                        );
                                    })()
                                ) : (
                                    <p className={styles.answerLine} style={{color: 'var(--text-secondary)', fontStyle: 'italic'}}>
                                        گزینه‌ها در دسترس نیستند
                                    </p>
                                )}
                            </>
                        )}
                        
                        {/* True/False type: Show correct option */}
                        {isTypeMatch(questionType, 'truefalse', 'true_false') && (
                            <>
                                {question.options && question.options.length > 0 ? (
                                    (() => {
                                        const correctOption = question.options.find(opt => opt?.is_correct);
                                        return correctOption ? (
                                            <p className={styles.answerLine}>
                                                <strong>پاسخ صحیح:</strong>&nbsp;
                                                <span style={{color: 'var(--success)', fontWeight: 'bold', fontSize: '1.1em'}}>
                                                    {correctOption.text || correctOption.label || 'نامشخص'}
                                                </span>
                                            </p>
                                        ) : (
                                            <p className={styles.answerLine} style={{color: 'var(--text-secondary)', fontStyle: 'italic'}}>
                                                پاسخ صحیح مشخص نشده است
                                            </p>
                                        );
                                    })()
                                ) : question.answer && typeof question.answer === 'string' && question.answer.trim() ? (
                                    <p className={styles.answerLine}>
                                        <strong>پاسخ صحیح:</strong>&nbsp;
                                        <span style={{color: 'var(--success)', fontWeight: 'bold', fontSize: '1.1em'}}>
                                            {question.answer}
                                        </span>
                                    </p>
                                ) : (
                                    <p className={styles.answerLine} style={{color: 'var(--text-secondary)', fontStyle: 'italic'}}>
                                        پاسخ در دسترس نیست
                                    </p>
                                )}
                            </>
                        )}
                        
                        {/* Matching type: Show correct pairs */}
                        {isTypeMatch(questionType, 'matching', 'match') && (
                            <>
                                {question.pairs && question.pairs.length > 0 ? (
                                    <div>
                                        <p className={styles.answerLine}><strong>جواب‌های صحیح (تطابق):</strong></p>
                                        <ul style={{marginTop: '8px', paddingRight: '20px'}}>
                                            {question.pairs.map((pair, idx) => (
                                                <li key={pair.id || idx} style={{marginBottom: '4px'}}>
                                                    <span dangerouslySetInnerHTML={{ __html: sanitizeInline(pair.left_text || '') }} />
                                                    {' ← '}
                                                    <span dangerouslySetInnerHTML={{ __html: sanitizeInline(pair.right_text || '') }} />
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <p className={styles.answerLine} style={{color: 'var(--text-secondary)', fontStyle: 'italic'}}>
                                        جفت‌های تطابق در دسترس نیستند
                                    </p>
                                )}
                            </>
                        )}
                        
                        {/* Fill Blank type: Show correct answers for blanks */}
                        {isTypeMatch(questionType, 'fillblank', 'fill_blank') && (
                            <>
                                {question.blanks && question.blanks.length > 0 ? (
                                    <div>
                                        <p className={styles.answerLine}><strong>پاسخ‌های صحیح (جاهای خالی):</strong></p>
                                        <ul style={{marginTop: '8px', paddingRight: '20px'}}>
                                            {question.blanks.map((blank, idx) => (
                                                <li key={blank.id || idx} style={{marginBottom: '4px'}}>
                                                    جای خالی {blank.blank_index || (idx + 1)}: 
                                                    <strong style={{color: 'var(--primary)', marginRight: '8px'}}>
                                                        {blank.correct_text || 'نامشخص'}
                                                    </strong>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : question.answer && typeof question.answer === 'string' && question.answer.trim() ? (
                                    <p className={styles.answerLine}>
                                        <strong>پاسخ صحیح:</strong>&nbsp;
                                        <span dangerouslySetInnerHTML={{ __html: sanitizeInline(question.answer) }} />
                                    </p>
                                ) : (
                                    <p className={styles.answerLine} style={{color: 'var(--text-secondary)', fontStyle: 'italic'}}>
                                        پاسخ‌های جاهای خالی در دسترس نیستند
                                    </p>
                                )}
                            </>
                        )}
                        
                        {/* Short Answer type: Show answer_text */}
                        {isTypeMatch(questionType, 'short', 'short_answer') && (
                            <p className={styles.answerLine}>
                                <strong>پاسخ صحیح:</strong>&nbsp;
                                {question.answer && typeof question.answer === 'string' && question.answer.trim() ? (
                                    <span style={{color: 'var(--primary)', fontWeight: '500'}}>
                                        <span dangerouslySetInnerHTML={{ __html: sanitizeInline(question.answer) }} />
                                    </span>
                                ) : (
                                    <span style={{color: 'var(--text-secondary)', fontStyle: 'italic'}}>پاسخ در دسترس نیست</span>
                                )}
                            </p>
                        )}
                        
                        {/* Long Answer / Essay type: Show answer_text with more space */}
                        {isTypeMatch(questionType, 'long', 'long_answer', 'essay') && (
                            <div>
                                <p className={styles.answerLine}><strong>پاسخ صحیح:</strong></p>
                                {question.answer && typeof question.answer === 'string' && question.answer.trim() ? (
                                    <div style={{
                                        marginTop: '8px', 
                                        padding: '12px', 
                                        backgroundColor: 'var(--bg-secondary)', 
                                        borderRadius: '8px',
                                        borderRight: '3px solid var(--primary)'
                                    }}>
                                        <span dangerouslySetInnerHTML={{ __html: sanitizeInline(question.answer) }} />
                                    </div>
                                ) : (
                                    <p style={{color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '8px'}}>
                                        پاسخ در دسترس نیست
                                    </p>
                                )}
                            </div>
                        )}
                        
                        {/* Other types or fallback: Show answer_text if available */}
                        {!isTypeMatch(questionType, 'test', 'mcq', 'truefalse', 'true_false', 'matching', 'match', 'fillblank', 'fill_blank', 'short', 'short_answer', 'long', 'long_answer', 'essay') && (
                            <p className={styles.answerLine}>
                                <strong>پاسخ صحیح:</strong>&nbsp;
                                {question.answer && typeof question.answer === 'string' && question.answer.trim() ? (
                                    <span dangerouslySetInnerHTML={{ __html: sanitizeInline(question.answer) }} />
                                ) : (
                                    <span style={{color: 'var(--text-secondary)', fontStyle: 'italic'}}>پاسخ در دسترس نیست</span>
                                )}
                            </p>
                        )}
                        
                        {answerImages.length > 0 && (
                            <div className={styles.answerImages}>
                                {answerImages.map((src, idx) => (
                                    <figure key={idx} className={styles.answerImageFigure}>
                                        <img src={src} alt={`پاسخ - تصویر ${idx+1}`} loading="lazy" />
                                    </figure>
                                ))}
                            </div>
                        )}
                        {question.reference && (
                            <p className={styles.answerRef}><strong>مرجع:</strong> {question.reference}</p>
                        )}
                    </div>
                </div>

                <AddToSetPopover
                    anchorEl={popoverAnchor}
                    open={Boolean(popoverAnchor)}
                    onClose={handlePopoverClose}
                    questionSets={questionSets}
                    onSelectSet={handleSelectSet}
                    onCreateNew={() => {
                        setCreateSetModalOpen(true);
                        handlePopoverClose();
                    }}
                    loading={loading}
                    className={styles.popoverMenu}
                />
            </div>
            <CreateSetModal
                open={isCreateSetModalOpen}
                onClose={() => setCreateSetModalOpen(false)}
                onCreate={handleCreateNewSet}
            />
            <Snackbar 
                open={toast.open} 
                autoHideDuration={3000} 
                onClose={() => setToast({ ...toast, open: false })} 
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
                    {toast.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default QuestionCard;
