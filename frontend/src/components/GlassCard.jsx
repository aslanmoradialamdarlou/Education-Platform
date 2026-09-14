import React, { useContext } from 'react';
import ThemeContext from '../context/ThemeContext';
import './GlassCard.css';

const GlassCard = ({ title }) => {
  const { currentTheme } = useContext(ThemeContext);

  return (
    <div className="glass-card" style={{ borderColor: 'var(--border-color)' }}>
      <h3 className="glass-card-title" style={{ color: 'var(--text-primary)' }}>{title}</h3>
    </div>
  );
};

export default GlassCard;
