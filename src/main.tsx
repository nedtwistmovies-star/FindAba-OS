
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
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('Registry Signal Active:', reg.scope);
        // Force update check on refresh
        reg.update();
      })
      .catch(err => console.warn('Registry Signal Blocked:', err));
  });
}
