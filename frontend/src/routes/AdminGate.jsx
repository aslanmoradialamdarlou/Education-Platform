import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';

export default function AdminGate() {
  const { user, booting } = useUser();
  const location = useLocation();

  // Wait for auth bootstrap to finish before deciding
  if (booting) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        در حال بررسی دسترسی…
      </div>
    );
  }

  const rolesLower = Array.isArray(user?.rolesLower)
    ? user.rolesLower
    : (Array.isArray(user?.roles) ? user.roles.map(r => String(r).toLowerCase()) : []);
  const isAdmin = (user?.role === 'admin') || rolesLower.some(r => r.includes('admin'));

  if (!isAdmin) {
    const next = location.pathname + (location.search || '');
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  return <Outlet />;
}
