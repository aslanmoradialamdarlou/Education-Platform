import React, { useState } from 'react';
import { Search, X, PlusCircle, Video, FileText, Filter, ChevronDown } from 'lucide-react';
import styles from './Admin.module.css';

// Mock data for content that can be added
const MOCK_AVAILABLE_CONTENT = [
    { id: 101, type: 'ویدیو', title: 'آموزش فصل ۵', price: 50000 },
    { id: 102, type: 'جزوه', title: 'جزوه فصل ۶', price: 20000 },
    { id: 103, type: 'ویدیو', title: 'آموزش تکمیلی فصل ۳', price: 0 }, // Free
];

const AddContentModal = ({ open, onClose }) => {
    const [filtersOpen, setFiltersOpen] = useState(false);
    if (!open) return null;
    return (
        <div className="modalRoot" role="dialog" aria-modal="true" aria-label="افزودن محتوا">
            <div className="modalOverlay" onClick={onClose} />
            <div className="modalPanel" style={{ width: 'min(92vw, 680px)' }}>
                <div className="modalHeader">
                    <div className={styles.modalHeader}>
                        افزودن محتوا به پروفایل کاربر
                        <button onClick={onClose} className={styles.closeModalBtn} aria-label="بستن"><X /></button>
                    </div>
                </div>
                <div className="modalBody">
                    <div className="adminCard adminCard--tight" style={{ marginBottom: '.75rem' }}>
                        <div className="filterToggleRow">
                            <button className="btn btn-outline" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(v => !v)}>
                                <Filter size={16} />
                                فیلترها
                                <ChevronDown size={16} style={{ transition: 'transform .2s ease', transform: filtersOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                            </button>
                        </div>
                        <div className={`collapsible ${filtersOpen ? 'open' : ''}`}>
                            <div className="detailFilterContainer">
                                <div className="filterGrid">
                                    <div className="filterGroup filterSearch">
                                        <label>جستجو</label>
                                        <div className="inputWrap">
                                            <span className="searchIcon"><Search size={16} /></span>
                                            <input type="text" placeholder="جستجوی نام محتوا..." />
                                        </div>
                                    </div>
                                    <div className="filterGroup">
                                        <label>نوع</label>
                                        <select defaultValue="all">
                                            <option value="all">همه انواع</option>
                                            <option value="video">ویدیو</option>
                                            <option value="handout">جزوه</option>
                                        </select>
                                    </div>
                                    <div className="filterGroup">
                                        <label>فصل</label>
                                        <select defaultValue="all">
                                            <option value="all">همه فصول</option>
                                            <option value="1">فصل ۱</option>
                                        </select>
                                    </div>
                                    <div className="filterGroup">
                                        <label>پایه</label>
                                        <select defaultValue="all">
                                            <option value="all">همه پایه‌ها</option>
                                            <option value="7">هفتم</option>
                                            <option value="8">هشتم</option>
                                            <option value="9">نهم</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <ul className={styles.addContentList}>
                        {MOCK_AVAILABLE_CONTENT.map(item => (
                            <li key={item.id} className={styles.addContentItem}>
                                <div className={styles.itemDetails}>
                                    {item.type === 'ویدیو' ? <Video /> : <FileText />}
                                    <div className={styles.itemText}>
                                        <span className={styles.itemTitle}>{item.title}</span>
                                        <span className={styles.itemPrice}>{item.price > 0 ? `${item.price.toLocaleString('fa-IR')} تومان` : 'رایگان'}</span>
                                    </div>
                                </div>
                                <button className="btn btn-primary"><PlusCircle size={16} /> افزودن</button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="modalActions">
                    <button onClick={onClose} className="btn">بستن</button>
                </div>
            </div>
        </div>
    );
};

export default AddContentModal;
