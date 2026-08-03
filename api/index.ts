// api/index.ts
// Runtime wrapper for Vercel serverless functions to use the built server bundle
// The live environment runs JS; importing the original TypeScript file at runtime
// fails (ERR_MODULE_NOT_FOUND -> '/var/task/server.ts'). We require the compiled
// CommonJS bundle produced during the build step (dist/server.cjs).

import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Use require to load the CommonJS bundle generated at build time.
// Try a few fallbacks so this works whether the bundle exports the app
// as `app`, `default`, or directly.
const server = require("../dist/server.cjs");
const app = server?.app ?? server?.default ?? server;

export default app;
