import React from 'react';
import styles from './Blog.module.css';

const CommentCard = ({ comment }) => {
    return (
        <div className={styles.commentCard}>
            <img src={comment.avatar} alt={comment.author} className={styles.commentAvatar} />
            <div className={styles.commentBody}>
                <div className={styles.commentHeader}>
                    <span className={styles.commentAuthor}>{comment.author}</span>
                    <span className={styles.commentDate}>{comment.date}</span>
                </div>
                <p className={styles.commentText}>{comment.text}</p>
            </div>
        </div>
    );
};

export default CommentCard;
