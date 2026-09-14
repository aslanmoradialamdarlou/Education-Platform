

import React, { useState, useMemo } from 'react';
import styles from './Profile.module.css';
import VideoCard from '../Videos/VideoCard';
import HandoutCard from '../Handouts/HandoutCard';
import PdfCard from '../SampleQuestions/PdfCard';

// Mock Data for course contents
const MOCK_CONTENTS = {
    1: {
        videos: Array.from({ length: 15 }, (_, i) => ({
            id: i + 1,
            title: `ویدیو ${i + 1}`,
            duration: '12:30',
            thumbnail: 'https://placehold.co/320x180/8A2BE2/fefefe?text=Video',
            isFree: i % 3 === 0,
            teacher: 'استاد رضایی',
            chapter: 'فصل ۵',
            subscriptionId: 1,
        })),
        handouts: Array.from({ length: 5 }, (_, i) => ({
            id: i + 1,
            title: `جزوه ${i + 1}`,
            pages: 12,
            isFree: i % 2 === 0,
            teacher: 'استاد رضایی',
            grade: 'هفتم',
            chapter: 'فصل ۵',
            subscriptionId: 1,
        })),
        samples: Array.from({ length: 8 }, (_, i) => ({
            id: i + 1,
            title: `نمونه سوال ${i + 1}`,
            pages: 10,
            isFree: i % 2 === 0,
            subject: 'علوم',
            grade: 'هفتم',
            viewCount: 100 + i * 10,
            downloadCount: 5 + i,
            averageRating: 4.2,
        })),
    },
    2: { videos: [], handouts: [], samples: [] },
    3: { videos: [], handouts: [], samples: [] },
};

// --- Component: Section wrapper with search ---
const ContentSegment = ({ title, placeholder, query, onQueryChange, children }) => (
    <section className={styles.segmentSection}>
        <div className={styles.segmentHeader}>
            <h3 className={styles.segmentTitle}>{title}</h3>
            <div className={styles.segmentSearchWrap}>
                <input
                    type="text"
                    className={styles.segmentSearchInput}
                    value={query}
                    onChange={(e)=>onQueryChange(e.target.value)}
                    placeholder={placeholder}
                    aria-label={`جستجو در ${title}`}
                />
            </div>
        </div>
        {children}
    </section>
);

const CourseDetail = ({ course, onBack }) => {
    // TODO: Replace with real user context
    const user = { hasSubscription: true, subscribedItems: [1] };
    const content = MOCK_CONTENTS[course.id] || { videos: [], handouts: [], samples: [] };
    const [videoQuery, setVideoQuery] = useState('');
    const [handoutQuery, setHandoutQuery] = useState('');
    const [sampleQuery, setSampleQuery] = useState('');

    const filteredVideos = useMemo(() => content.videos.filter(v => v.title.toLowerCase().includes(videoQuery.trim().toLowerCase())), [content.videos, videoQuery]);
    const filteredHandouts = useMemo(() => content.handouts.filter(h => h.title.toLowerCase().includes(handoutQuery.trim().toLowerCase())), [content.handouts, handoutQuery]);
    const filteredSamples = useMemo(() => content.samples.filter(s => s.title.toLowerCase().includes(sampleQuery.trim().toLowerCase())), [content.samples, sampleQuery]);

    const PREVIEW_COUNT = 8;
    const [videoLimit, setVideoLimit] = useState(PREVIEW_COUNT);
    const [handoutLimit, setHandoutLimit] = useState(PREVIEW_COUNT);
    const [sampleLimit, setSampleLimit] = useState(PREVIEW_COUNT);
    const visibleVideos = filteredVideos.slice(0, videoLimit);
    const visibleHandouts = filteredHandouts.slice(0, handoutLimit);
    const visibleSamples = filteredSamples.slice(0, sampleLimit);

    return (
        <div className={styles.courseDetailWrapper}>
            <button className={styles.backBtn} onClick={onBack}>&rarr; بازگشت</button>
            <h2 className={styles.courseDetailTitle}>{course.title}</h2>
                        <div className={styles.courseDetailSections}>
                                {!!content.videos.length && (
                                        <ContentSegment
                                            title="ویدیوها"
                                            placeholder="جستجوی ویدیو"
                                            query={videoQuery}
                                            onQueryChange={setVideoQuery}
                                        >
                                                                    {filteredVideos.length ? (
                                                                        <>
                                                                            <div className={styles.responsiveVideoGrid}>
                                                                                {visibleVideos.map(v => (
                                                                                    <VideoCard key={v.id} video={v} user={user} />
                                                                                ))}
                                                                            </div>
                                                                            {filteredVideos.length > PREVIEW_COUNT && (
                                                                                <button
                                                                                    className={styles.segmentMoreLink}
                                                                                    onClick={() => setVideoLimit(l => l >= filteredVideos.length ? PREVIEW_COUNT : Math.min(l + PREVIEW_COUNT, filteredVideos.length))}
                                                                                >
                                                                                    {videoLimit >= filteredVideos.length ? 'نمایش کمتر' : 'نمایش بیشتر'}
                                                                                    <span>{videoLimit >= filteredVideos.length ? '▲' : '▼'}</span>
                                                                                </button>
                                                                            )}
                                                                        </>
                                                                    ) : <p className={styles.segmentEmpty}>موردی یافت نشد.</p>}
                                        </ContentSegment>
                                )}
                                {!!content.handouts.length && (
                                        <ContentSegment
                                            title="جزوه‌ها"
                                            placeholder="جستجوی جزوه"
                                            query={handoutQuery}
                                            onQueryChange={setHandoutQuery}
                                        >
                                                                    {filteredHandouts.length ? (
                                                                        <>
                                                                            <div className={styles.responsiveHandoutGrid}>
                                                                                {visibleHandouts.map(h => (
                                                                                    <HandoutCard key={h.id} handout={h} user={user} />
                                                                                ))}
                                                                            </div>
                                                                            {filteredHandouts.length > PREVIEW_COUNT && (
                                                                                <button
                                                                                    className={styles.segmentMoreLink}
                                                                                    onClick={() => setHandoutLimit(l => l >= filteredHandouts.length ? PREVIEW_COUNT : Math.min(l + PREVIEW_COUNT, filteredHandouts.length))}
                                                                                >
                                                                                    {handoutLimit >= filteredHandouts.length ? 'نمایش کمتر' : 'نمایش بیشتر'}
                                                                                    <span>{handoutLimit >= filteredHandouts.length ? '▲' : '▼'}</span>
                                                                                </button>
                                                                            )}
                                                                        </>
                                                                    ) : <p className={styles.segmentEmpty}>موردی یافت نشد.</p>}
                                        </ContentSegment>
                                )}
                                {!!content.samples.length && (
                                        <ContentSegment
                                            title="نمونه سوالات"
                                            placeholder="جستجوی نمونه سوال"
                                            query={sampleQuery}
                                            onQueryChange={setSampleQuery}
                                        >
                                                                    {filteredSamples.length ? (
                                                                        <>
                                                                            <div className={styles.responsiveSampleGrid}>
                                                                                {visibleSamples.map(s => (
                                                                                    <PdfCard key={s.id} pdf={s} user={user} />
                                                                                ))}
                                                                            </div>
                                                                            {filteredSamples.length > PREVIEW_COUNT && (
                                                                                <button
                                                                                    className={styles.segmentMoreLink}
                                                                                    onClick={() => setSampleLimit(l => l >= filteredSamples.length ? PREVIEW_COUNT : Math.min(l + PREVIEW_COUNT, filteredSamples.length))}
                                                                                >
                                                                                    {sampleLimit >= filteredSamples.length ? 'نمایش کمتر' : 'نمایش بیشتر'}
                                                                                    <span>{sampleLimit >= filteredSamples.length ? '▲' : '▼'}</span>
                                                                                </button>
                                                                            )}
                                                                        </>
                                                                    ) : <p className={styles.segmentEmpty}>موردی یافت نشد.</p>}
                                        </ContentSegment>
                                )}
                        </div>
        </div>
    );
};

export default CourseDetail;
