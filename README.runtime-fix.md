chore(runtime): ensure api functions import compiled server bundle

Wrap api entry to import dist/server.cjs at runtime to avoid trying to import server.ts
which isn't present in the deployed lambda environment.
