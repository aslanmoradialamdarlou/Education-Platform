import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Eye, Edit, Trash2 } from 'lucide-react';
import { Snackbar, Alert } from '@mui/material';
import styles from './Profile.module.css';
import { fetchQuestionSets, deleteQuestionSet, createQuestionSet, updateQuestionSet } from '../../api/questionSetService';
import CreateSetModal from '../QuestionBank/CreateSetModal';

const QuestionSets = () => {
    const [questionSets, setQuestionSets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [editingSet, setEditingSet] = useState(null);
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
    const navigate = useNavigate();

    useEffect(() => {
        loadQuestionSets();
    }, []);

    const loadQuestionSets = async () => {
        try {
            setLoading(true);
            setError(null);
            const sets = await fetchQuestionSets();
            setQuestionSets(sets);
        } catch (err) {
            console.error('Error loading question sets:', err);
            setError('خطا در بارگذاری مجموعه‌ها');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSet = async (name) => {
        try {
            await createQuestionSet({ name });
            await loadQuestionSets();
            setCreateModalOpen(false);
            setToast({ open: true, message: 'مجموعه با موفقیت ایجاد شد', severity: 'success' });
        } catch (err) {
            setToast({ open: true, message: 'خطا در ایجاد مجموعه: ' + (err.message || ''), severity: 'error' });
        }
    };

    const handleDeleteSet = async (setId) => {
        if (!confirm('آیا از حذف این مجموعه مطمئن هستید؟')) {
            return;
        }

        try {
            await deleteQuestionSet(setId);
            await loadQuestionSets();
            setToast({ open: true, message: 'مجموعه با موفقیت حذف شد', severity: 'success' });
        } catch (err) {
            setToast({ open: true, message: 'خطا در حذف مجموعه: ' + (err.message || ''), severity: 'error' });
        }
    };

    const handleViewSet = (setId) => {
        // Navigate to question bank with filter or to a dedicated question set view
        navigate(`/questions?set=${setId}`);
    };

    if (loading) {
        return (
            <div className={styles.contentSection}>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    در حال بارگذاری...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.contentSection}>
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger-color)' }}>
                    {error}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={styles.contentSection}>
                <div className={styles.sectionHeader}>
                    <h2>مجموعه سوالات من</h2>
                    <button 
                        className={styles.primaryBtn}
                        onClick={() => setCreateModalOpen(true)}
                    >
                        <PlusCircle size={18} />
                        <span>مجموعه جدید</span>
                    </button>
                </div>

                {questionSets.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>هنوز مجموعه‌ای ایجاد نکرده‌اید</p>
                        <p className={styles.emptyStateHint}>
                            از صفحه بانک سوالات، سوالات مورد نظر خود را به مجموعه‌ها اضافه کنید
                        </p>
                    </div>
                ) : (
                    <div className={styles.questionSetList}>
                        {questionSets.map(set => (
                            <div key={set.id} className={styles.questionSetCard}>
                                <div className={styles.questionSetInfo}>
                                    <h4 className={styles.questionSetTitle}>{set.name}</h4>
                                    {set.description && (
                                        <p className={styles.questionSetDesc}>{set.description}</p>
                                    )}
                                    <p className={styles.questionSetCount}>
                                        {set.questions_count} سوال
                                    </p>
                                </div>
                                <div className={styles.questionSetActions}>
                                    <button 
                                        className={styles.actionBtn}
                                        onClick={() => handleViewSet(set.id)}
                                        title="مشاهده سوالات"
                                    >
                                        <Eye size={18} />
                                    </button>
                                    <button 
                                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                        onClick={() => handleDeleteSet(set.id)}
                                        title="حذف مجموعه"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <CreateSetModal
                open={isCreateModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onCreate={handleCreateSet}
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

export default QuestionSets;
