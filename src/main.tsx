import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n.ts';
import './index.css';
import { VisualizationProvider } from './contexts/index.ts';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div>Loading...</div>}>
      <VisualizationProvider>
        <App />
      </VisualizationProvider>
    </Suspense>
  </StrictMode>,
);
