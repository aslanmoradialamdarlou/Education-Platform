import React, { useState, useEffect } from 'react';

// Import Components
import Header from '../components/Header/Header';
import MainBackdrop from '../components/MainBackdrop/MainBackdrop';
import ArchiveSection from '../components/ArchiveSection/ArchiveSection';
import Footer from '../components/Footer/Footer';
import homeService from '../api/homeService';

const GRADES_DATA_FALLBACK = [
    { name: "هفتم", subject: "علوم تجربی", grade: 7, bgImage: "/images/7th-grade.png" },
    { name: "هشتم", subject: "علوم تجربی", grade: 8, bgImage: "/images/8th-grade.png" },
    { name: "نهم", subject: "علوم تجربی", grade: 9, bgImage: "/images/9th-grade.png" }
];

const HomePage = () => {
    const [gradeIndex, setGradeIndex] = useState(1); // Default to 8th grade
    // const [currentUser, setCurrentUser] = useState(null); // reserved for future personalization
    const [grades, setGrades] = useState(GRADES_DATA_FALLBACK);
    const [archive, setArchive] = useState({ filters: [], cards: [], allUrl: '/blogs' });
    const [archiveLoading, setArchiveLoading] = useState(true);
    const [counts, setCounts] = useState(null);
    const [countsLoading, setCountsLoading] = useState(true);
    // const [loading, setLoading] = useState(true);
    // const [error, setError] = useState(null);
    // Stable theming: no longer altering body dataset by grade

    const handleNextGrade = () => {
        setGradeIndex((prevIndex) => (prevIndex + 1) % (grades?.length || GRADES_DATA_FALLBACK.length));
    };

    const handlePrevGrade = () => {
        const len = grades?.length || GRADES_DATA_FALLBACK.length;
        setGradeIndex((prevIndex) => (prevIndex - 1 + len) % len);
    };

    useEffect(() => {
        let active = true;
        
        // Fetch home data (grades) immediately
        (async () => {
            try {
                const homeRes = await homeService.fetchHomeDataOnly();
                if (!active) return;
                setGrades(homeRes?.grades?.length ? homeRes.grades : GRADES_DATA_FALLBACK);
            } catch (err) {
                console.error('Failed to load home data:', err);
            }
        })();

        // Fetch counts independently
        (async () => {
            try {
                const countsData = await homeService.fetchCounts();
                if (!active) return;
                setCounts(countsData);
            } catch (err) {
                console.error('Failed to load counts:', err);
            } finally {
                if (active) setCountsLoading(false);
            }
        })();

        // Fetch blog posts progressively with callback
        (async () => {
            try {
                // Set initial filters immediately
                setArchive(prev => ({
                    ...prev,
                    filters: [
                        { key: 'latest', label: 'جدیدترین' },
                        { key: 'hot', label: 'داغ' },
                        { key: 'grade_7', label: 'هفتم' },
                        { key: 'grade_8', label: 'هشتم' },
                        { key: 'grade_9', label: 'نهم' },
                    ],
                }));
                
                const archiveData = await homeService.fetchArchiveCardsProgressively((card, index) => {
                    if (!active) return;
                    // Add each card as it loads
                    setArchive(prev => ({
                        ...prev,
                        cards: [...prev.cards, card],
                    }));
                });
                
                if (!active) return;
                // Final update with all cards and allUrl
                setArchive(archiveData);
            } catch (err) {
                console.error('Failed to load archive:', err);
            } finally {
                if (active) setArchiveLoading(false);
            }
        })();

        return () => { active = false; };
    }, []);

    return (
        <>
            <Header />
            <div className="dashboard-container">
                <main>
                    <MainBackdrop 
                        currentGrade={grades[gradeIndex]}
                        onPrev={handlePrevGrade}
                        onNext={handleNextGrade}
                        counts={counts}
                    />
                    <ArchiveSection filters={archive.filters} cards={archive.cards} allUrl={archive.allUrl} loading={archiveLoading} />
                </main>
            </div>
            <Footer />
        </>
    );
};

export default HomePage;
