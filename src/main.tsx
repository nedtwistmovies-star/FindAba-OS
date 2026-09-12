
import React from 'react';

console.log("%cFindAba OS Build: v110.0-PROD", "color: #FFD700; font-weight: bold; font-size: 14px;");
console.log(`[BOOT] Environment: ${import.meta.env.MODE}`);
console.log(`[BOOT] Timestamp: ${new Date().toISOString()}`);
import { createRoot } from 'react-dom/client';
import App from './core/App';
import './index.css';
import { initializeRepositoryConfig } from './services/gitConfigService';

// Initialize authoritative git config on boot
initializeRepositoryConfig().catch(console.warn);

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
        // Prompt immediate update check to ensure latest shell is running
        reg.update().catch(() => {});
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      })
      .catch(err => console.warn('Registry Signal Blocked:', err));
  });
}
