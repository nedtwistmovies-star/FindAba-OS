// api/index.ts
// Runtime wrapper for Vercel serverless functions — import the compiled server bundle (dist/server.cjs)
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Load the compiled CommonJS server bundle generated at build time.
// Try a few fallbacks so this works whether the bundle exports the app as `app`, `default`, or directly.
const server = require("../dist/server.cjs");
const app = server?.app ?? server?.default ?? server;

export default app;
