// src/App.jsx
import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useUser } from './context/UserContext.jsx';
import { router } from './routes';

function AuthExpiryListener() {
  const { logout } = useUser();
  useEffect(() => {
    const handler = (e) => {
      // Prevent infinite loops: don't redirect if already on login page
      if (window.location.pathname === '/login') {
        try { logout(); } catch (err) { /* ignore */ }
        return;
      }
      // On auth expiration, clear user state then navigate using location
      try { logout(); } catch (err) { /* ignore */ }
      try { window.location.replace('/login'); } catch (err) { /* ignore */ }
    };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, [logout]);
  return null;
}



function App() {
  // Keep RouterProvider mounted; wrap with flex container for sticky footer layout
  return (
    <div style={{minHeight: '100%', display: 'flex', flexDirection: 'column'}}>
      <RouterProvider router={router} />
      {/* RouterProvider mounts routes; place listener under it so useNavigate works */}
      <AuthExpiryListener />
    </div>
  );
}

export default App;
