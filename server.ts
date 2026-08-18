import { createServer as createViteServer } from "vite";
import { env } from "./server/services/env";
import app from "./server/app";

if (!env.IS_VERCEL) {
  const startServer = async () => {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: true
      },
      appType: "spa"
    });

    app.use(vite.middlewares);

    app.listen(env.PORT, "0.0.0.0", () => {
      console.log(
        `[City OS] Operational at http://0.0.0.0:${env.PORT}`
      );
    });
  };

  startServer().catch((error) => {
    console.error("[FindAba] Failed to start server:", error);
    process.exit(1);
  });
}
