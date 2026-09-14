import React, { useState } from 'react';
import { Star } from 'lucide-react';
import styles from './Blog.module.css';

const StarRating = ({ rating, onRate, readOnly = false }) => {
    const [hoverRating, setHoverRating] = useState(0);

    return (
        <div className={styles.starRating}>
            {[...Array(5)].map((_, index) => {
                const starValue = index + 1;
                return (
                    <button
                        key={starValue}
                        className={`${styles.star} ${readOnly ? styles.readOnly : ''}`}
                        onClick={() => !readOnly && onRate(starValue)}
                        onMouseEnter={() => !readOnly && setHoverRating(starValue)}
                        onMouseLeave={() => !readOnly && setHoverRating(0)}
                    >
                        <Star
                            size={20}
                            fill={starValue <= (hoverRating || rating) ? 'currentColor' : 'none'}
                        />
                    </button>
                );
            })}
        </div>
    );
};

export default StarRating;
