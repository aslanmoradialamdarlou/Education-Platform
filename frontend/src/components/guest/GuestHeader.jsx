import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@mui/material';
import styles from './GuestHeader.module.css';

export default function GuestHeader() {
  const { pathname, search } = useLocation();
  const next = encodeURIComponent(pathname + (search || ''));
  return (
    <header className={styles.header} role="banner">
      <div className={styles.inner}>
          <div className={styles.brand}>
          <Link to="/home" className={styles.logo} aria-label="Elmino">Elmino</Link>
        </div>
        <nav className={styles.actions} aria-label="Guest">
          <Button component={Link} to={`/login?next=${next}`} variant="outlined" size="small" className={styles.btn}>
            ورود
          </Button>
          <Button component={Link} to={`/signup?next=${next}`} variant="contained" size="small" className={styles.btnPrimary}>
            ثبت نام رایگان
          </Button>
        </nav>
      </div>
    </header>
  );
}
