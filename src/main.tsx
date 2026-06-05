
import React from 'react';

console.log("%cFindAba OS Build: v110.0-PROD", "color: #FFD700; font-weight: bold; font-size: 14px;");
console.log(`[BOOT] Environment: ${import.meta.env.MODE}`);
console.log(`[BOOT] Timestamp: ${new Date().toISOString()}`);
import { createRoot } from 'react-dom/client';
import App from './core/App';
import './index.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}

// REGISTER SERVICE WORKER FOR MOBILE INSTALLATION (PWA PROTOCOL)
// Disabled in preview environment to prevent ServiceWorker state errors
if ('serviceWorker' in navigator && !window.location.hostname.includes('run.app')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('Registry Signal Active:', reg.scope);
      })
      .catch(err => console.warn('Registry Signal Blocked:', err));
  });
}
