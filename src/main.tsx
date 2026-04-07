
import React from 'react';
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
