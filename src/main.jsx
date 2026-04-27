import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import './styles.css';

// Apply persisted theme before first paint to avoid a flash of the default palette
try {
  const savedTheme = localStorage.getItem('nb_theme');
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
} catch { /* private mode / SSR */ }

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
