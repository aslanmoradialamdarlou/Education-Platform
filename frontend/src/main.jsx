// src/main.jsx (or index.js)
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider } from './context/UserContext.jsx';
import { ToastProvider, useToast } from './components/Toast/ToastProvider.jsx';
import { __setToastPush } from './api/httpClient.js';

function ToastBridge() {
  const { push } = useToast();
  useEffect(() => { __setToastPush(push); }, [push]);
  return null;
}

// Import global and theme styles. The order is important.
import './styles/global.css';
import './styles/theme.css';

// console.log('React version:', ReactDOM.getElementById('root'));

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <UserProvider>
        <ToastProvider>
          <ToastBridge />
          <App />
        </ToastProvider>
      </UserProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
