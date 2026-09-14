import React from 'react';
import styles from './SampleQuestions.module.css';

// We avoid importing Link directly if Router isn't mounted to prevent context errors.
let LinkComponent = null;
try {
  // Dynamically require to avoid bundler evaluating when not present in runtime context.
  // eslint-disable-next-line global-require
  const rrd = require('react-router-dom');
  LinkComponent = rrd.Link;
} catch (_) {
  LinkComponent = null;
}

// Breadcrumb: خانه > نمونه سوالات > (درس) > (پایه)
// Only renders subject/grade segments when filters != 'همه'
export default function Breadcrumb({ subjectFilter, gradeFilter, gradesFilter }) {
  // Simple heuristic: if LinkComponent exists we assume Router is mounted.
  const hasRouter = !!LinkComponent;
  const parts = [
    { label: 'خانه', to: '/' },
    { label: 'نمونه سوالات', to: '/sample-questions' }
  ];
  if (subjectFilter && subjectFilter !== 'همه') parts.push({ label: subjectFilter });
  if (Array.isArray(gradesFilter) && gradesFilter.length) {
    parts.push({ label: `پایه ${gradesFilter.join('، ')}` });
  } else if (gradeFilter && gradeFilter !== 'همه') { // backward compatibility
    parts.push({ label: `پایه ${gradeFilter}` });
  }

  return (
    <nav aria-label="breadcrumb" className={styles.breadcrumbNav}>
      <ol className={styles.breadcrumbList}>
        {parts.map((p, i) => {
          const isLast = i === parts.length - 1;
          return (
            <li key={i} className={styles.breadcrumbItem} aria-current={isLast ? 'page' : undefined}>
              {p.to && !isLast
                ? (hasRouter && LinkComponent ? <LinkComponent to={p.to}>{p.label}</LinkComponent> : <a href={p.to}>{p.label}</a>)
                : <span>{p.label}</span>}
              {!isLast && <span className={styles.breadcrumbSep}>›</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
