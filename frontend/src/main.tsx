import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { PermissionsProvider } from './hooks/usePermissions';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <PermissionsProvider>
        <App />
      </PermissionsProvider>
    </ThemeProvider>
  </StrictMode>,
);
