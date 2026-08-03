// api/index.ts
// Runtime wrapper that dynamically imports the ESM server bundle produced at build time.
// We use top-level await (package.json "type": "module") so Vercel will load the
// compiled ESM module (dist/server.mjs) which preserves `import.meta.url` usage.

const serverModule = await import("../dist/server.mjs");
const app = serverModule?.app ?? serverModule?.default ?? serverModule;

export default app;
