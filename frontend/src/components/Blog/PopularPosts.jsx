import React from 'react';
import { Link } from 'react-router-dom';
import styles from './PopularPosts.module.css';

const PopularPosts = ({ posts = [] }) => {
  return (
    <aside className={styles.popularPosts} aria-label="پست‌های محبوب">
      <h3 className={styles.title}>پست‌های محبوب</h3>
      <ul className={styles.list}>
        {posts.map((p) => (
          <li key={p.id} className={styles.item}>
            <Link className={styles.card} to={`/blogs/${p.id}`}>
              <div className={styles.bg} style={{ backgroundImage: `url(${p.image})` }} />
              <div className={styles.overlay} />
              <div className={styles.cardTitle}>{p.title}</div>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default PopularPosts;
