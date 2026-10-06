// Backward compatibility redirect to authoritative service-worker.js
try {
  importScripts('/service-worker.js');
} catch (e) {
  console.warn('[SW] Fallback import failed:', e);
}
