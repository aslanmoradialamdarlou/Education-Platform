import React, { useState, useEffect } from 'react';
import styles from './Subscription.module.css';

// Mock data based on your memory update
const BOOK_DATA = {
    '7': { name: 'علوم تجربی هفتم', chapters: ['فصل ۱', 'فصل ۲', 'فصل ۳', 'فصل ۴', 'فصل ۵'] },
    '8': { name: 'علوم تجربی هشتم', chapters: ['فصل ۱', 'فصل ۲', 'فصل ۳', 'فصل ۴', 'فصل ۵'] },
    '9': { name: 'علوم تجربی نهم', chapters: ['فصل ۱', 'فصل ۲', 'فصل ۳', 'فصل ۴', 'فصل ۵'] },
};

export const GradeSelector = ({ selected = '8', onChange }) => {
    return (
        <div className={styles.selectorGroup}>
            <label htmlFor="grade-select">انتخاب پایه:</label>
            <select
                id="grade-select"
                className={styles.selectInput}
                value={selected}
                onChange={(e) => onChange && onChange(e.target.value)}
            >
                <option value="7">{BOOK_DATA['7'].name}</option>
                <option value="8">{BOOK_DATA['8'].name}</option>
                <option value="9">{BOOK_DATA['9'].name}</option>
            </select>
        </div>
    );
};

export const ChapterSelector = ({
    selectedGrade = '7',
    onGradeChange,
    selectedChapter,
    onChapterChange,
}) => {
    const [internalChapter, setInternalChapter] = useState(selectedChapter || BOOK_DATA[selectedGrade].chapters[0]);

    // Sync internal when grade changes
    useEffect(() => {
        if (!BOOK_DATA[selectedGrade].chapters.includes(internalChapter)) {
            const first = BOOK_DATA[selectedGrade].chapters[0];
            setInternalChapter(first);
            onChapterChange && onChapterChange(first);
        }
    }, [selectedGrade]);

    const handleChapter = (val) => {
        setInternalChapter(val);
        onChapterChange && onChapterChange(val);
    };

    return (
        <>
            <div className={styles.selectorGroup}>
                <label htmlFor="book-select">انتخاب کتاب:</label>
                <select
                    id="book-select"
                    className={styles.selectInput}
                    value={selectedGrade}
                    onChange={(e) => onGradeChange && onGradeChange(e.target.value)}
                >
                    <option value="7">{BOOK_DATA['7'].name}</option>
                    <option value="8">{BOOK_DATA['8'].name}</option>
                    <option value="9">{BOOK_DATA['9'].name}</option>
                </select>
            </div>
            <div className={styles.selectorGroup}>
                <label htmlFor="chapter-select">انتخاب فصل:</label>
                <select
                    id="chapter-select"
                    className={styles.selectInput}
                    value={internalChapter}
                    onChange={(e) => handleChapter(e.target.value)}
                >
                    {BOOK_DATA[selectedGrade].chapters.map((ch) => (
                        <option key={ch} value={ch}>{ch}</option>
                    ))}
                </select>
            </div>
        </>
    );
};
