import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, BookOpen, PenSquare, Video, ClipboardCheck } from 'lucide-react';
import styles from './MainBackdrop.module.css';

const QUICK_ACCESS_DATA = (counts) => ([
    { key: 'questions', icon: BookOpen, title: "بانک سوالات", count: counts?.questions },
    { key: 'handouts', icon: PenSquare, title: "جزوه", count: counts?.handouts },
    { key: 'videos', icon: Video, title: "فیلم آموزشی", count: counts?.videos },
    { key: 'samples', icon: ClipboardCheck, title: "نمونه سوال", count: counts?.samples },
]);

const MainBackdrop = ({ currentGrade, onPrev, onNext, counts }) => {
    const navigate = useNavigate();

    const goTo = (key) => {
        const params = new URLSearchParams();
        if (currentGrade?.grade) params.set('grade', String(currentGrade.grade));
        if (currentGrade?.subject) params.set('subject', String(currentGrade.subject));
        switch (key) {
            case 'questions':
                navigate(`/questions?${params.toString()}`);
                break;
            case 'handouts':
                // handouts supports grade filter
                navigate(`/handouts?${new URLSearchParams({ grade: String(currentGrade?.grade || '') }).toString()}`);
                break;
            case 'videos':
                navigate(`/videos?${params.toString()}`);
                break;
            case 'samples':
                // sample questions page may ignore params; include grade for future use
                navigate(`/sample-questions?${new URLSearchParams({ grade: String(currentGrade?.grade || '') }).toString()}`);
                break;
            default:
                break;
        }
    };

    return (
        <section 
            className={styles.mainCardBackdrop} 
            style={{ backgroundImage: `url(${currentGrade.bgImage})` }}
            aria-labelledby="subject-title-h1"
        >
            <div className={styles.subjectTitle}>
                <button className={styles.navArrow} onClick={onPrev}><ChevronRight /></button>
                <h1 id="subject-title-h1">{`${currentGrade.subject} ${currentGrade.name}`}</h1>
                <button className={styles.navArrow} onClick={onNext}><ChevronLeft /></button>
            </div>

            <div className={styles.quickAccessCards}>
                {QUICK_ACCESS_DATA(counts).map(({ key, icon: Icon, title, count }) => (
                    <div
                        className={styles.glassCard}
                        key={key}
                        role="button"
                        tabIndex={0}
                        onClick={() => goTo(key)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goTo(key); } }}
                        style={{ cursor: 'pointer' }}
                    >
                        <Icon className={styles.glassCardIcon} size={40} />
                        <span>{title}</span>
                        {typeof count === 'number' ? (
                            <p>{count.toLocaleString('fa-IR')}</p>
                        ) : (
                            <div className={styles.countSkeleton} aria-busy="true" aria-label="در حال بارگذاری" />
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
};

export default MainBackdrop;
