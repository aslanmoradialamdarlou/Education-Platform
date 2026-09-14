import React from 'react';
import { Facebook, Twitter, Linkedin } from 'lucide-react';
import styles from './Blog.module.css';

const ShareSidebar = () => {
    return (
        <aside className={styles.shareSidebar}>
            <span>Share</span>
            <a href="#" aria-label="Share on Facebook"><Facebook size={20} /></a>
            <a href="#" aria-label="Share on Twitter"><Twitter size={20} /></a>
            <a href="#" aria-label="Share on LinkedIn"><Linkedin size={20} /></a>
        </aside>
    );
};

export default ShareSidebar;
